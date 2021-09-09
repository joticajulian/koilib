/* eslint-disable no-param-reassign */

import { sha256 } from "js-sha256";
import * as secp from "noble-secp256k1";
import { abiActiveData } from "./abi";
import { Transaction } from "./interface";
import { Multihash } from "./Multihash";
import { serialize } from "./serializer";
import {
  bitcoinAddress,
  bitcoinDecode,
  bitcoinEncode,
  toHexString,
  toUint8Array,
} from "./utils";
import { VariableBlob } from "./VariableBlob";

/**
 * The Signer Class contains the private key needed to sign transactions.
 * It can be created using the seed, wif, or private key
 *
 * @example
 * using private key as hex string
 * ```ts
 * var signer = new Signer("ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c");
 * ```
 * <br>
 *
 * using private key as Uint8Array
 * ```ts
 * var buffer = new Uint8Array([
 *   236, 134,   1, 162,  79, 129, 222, 205,
 *    87, 244, 182,  17, 181, 172, 110, 184,
 *     1, 203,  55, 128, 187,   2, 192, 249,
 *   205, 254, 157,   9, 218, 173, 223, 156
 * ]);
 * var signer = new Signer(buffer);
 * ```
 *
 * <br>
 *
 * using private key as bigint
 * ```ts
 * var signer = new Signer(106982601049961974618234078204952280507266494766432547312316920283818886029212n);
 * ```
 *
 * <br>
 *
 * using the seed
 * ```ts
 * var signer = Signer.fromSeed("my seed");
 * ```
 *
 * <br>
 *
 * using private key in WIF format
 * ```ts
 * var signer = Signer.fromWif("L59UtJcTdNBnrH2QSBA5beSUhRufRu3g6tScDTite6Msuj7U93tM");
 * ```
 */
export class Signer {
  /**
   * Boolean determining if the public/private key
   * is using the compressed format
   */
  compressed: boolean;

  private privateKey: string | number | bigint | Uint8Array;

  publicKey: string | Uint8Array;

  /**
   * Account address
   */
  address: string;

  /**
   * The constructor receives de private key as hexstring, bigint or Uint8Array.
   * See also the functions [[Signer.fromWif]] and [[Signer.fromSeed]]
   * to create the signer from the WIF or Seed respectively.
   *
   * @param privateKey - Private key as hexstring, bigint or Uint8Array
   * @param compressed - compressed format is true by default
   * @example
   * ```ts
   * cons signer = new Signer("ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c");
   * console.log(signer.getAddress());
   * // 1MbL6mG8ASAvSYdoMnGUfG3ZXkmQ2dpL5b
   * ```
   */
  constructor(
    privateKey: string | number | bigint | Uint8Array,
    compressed = true
  ) {
    this.compressed = compressed;
    this.privateKey = privateKey;
    if (typeof privateKey === "string") {
      this.publicKey = secp.getPublicKey(privateKey, this.compressed);
      this.address = bitcoinAddress(toUint8Array(this.publicKey));
    } else {
      this.publicKey = secp.getPublicKey(privateKey, this.compressed);
      this.address = bitcoinAddress(this.publicKey);
    }
  }

  /**
   * Function to import a private key from the WIF
   * @param wif  - Private key in WIF format
   * @example
   * ```ts
   * const signer = Signer.fromWif("L59UtJcTdNBnrH2QSBA5beSUhRufRu3g6tScDTite6Msuj7U93tM")
   * console.log(signer.getAddress());
   * // 1MbL6mG8ASAvSYdoMnGUfG3ZXkmQ2dpL5b
   * ```
   * @returns Signer object
   */
  static fromWif(wif: string): Signer {
    const compressed = wif[0] !== "5";
    const privateKey = bitcoinDecode(wif);
    return new Signer(toHexString(privateKey), compressed);
  }

  /**
   * Function to import a private key from the seed
   * @param seed - Seed words
   * @param compressed -
   * @example
   * ```ts
   * const signer = Signer.fromSeed("my seed");
   * console.log(signer.getAddress());
   * // 1BqtgWBcqm9cSZ97avLGZGJdgso7wx6pCA
   * ```
   * @returns Signer object
   */
  static fromSeed(seed: string, compressed?: boolean): Signer {
    const privateKey = sha256(seed);
    return new Signer(privateKey, compressed);
  }

  /**
   * @param compressed - determines if the address should be
   * derived from the compressed public key (default) or the public key
   * @returns Signer address
   */
  getAddress(compressed = true): string {
    if (typeof this.privateKey === "string") {
      const publicKey = secp.getPublicKey(this.privateKey, compressed);
      return bitcoinAddress(toUint8Array(publicKey));
    }
    const publicKey = secp.getPublicKey(this.privateKey, compressed);
    return bitcoinAddress(publicKey);
  }

  /**
   * Function to get the private key in hex format or wif format
   * @param format - The format must be "hex" (default) or "wif"
   * @param compressed - Optional arg when using WIF format. By default it
   * uses the compressed value defined in the signer
   * @example
   * ```ts
   * const signer = Signer.fromSeed("one two three four five six");
   * console.log(signer.getPrivateKey());
   * // bab7fd6e5bd624f4ea0c33f7e7219262a6fa93a945a8964d9f110148286b7b37
   *
   * console.log(signer.getPrivateKey("wif"));
   * // L3UfgFJWmbVziGB1uZBjkG1UjKkF7hhpXWY7mbTUdmycmvXCVtiL
   *
   * console.log(signer.getPrivateKey("wif", false));
   * // 5KEX4TMHG66fT7cM9HMZLmdp4hVq4LC4X2Fkg6zeypM5UteWmtd
   * ```
   */
  getPrivateKey(format: "wif" | "hex" = "hex", compressed?: boolean): string {
    let stringPrivateKey: string;
    if (this.privateKey instanceof Uint8Array) {
      stringPrivateKey = toHexString(this.privateKey);
    } else if (typeof this.privateKey === "string") {
      stringPrivateKey = this.privateKey;
    } else {
      stringPrivateKey = BigInt(this.privateKey).toString(16).padStart(64, "0");
    }

    const comp = compressed === undefined ? this.compressed : compressed;

    switch (format) {
      case "hex":
        return stringPrivateKey;
      case "wif":
        return bitcoinEncode(toUint8Array(stringPrivateKey), "private", comp);
      default:
        /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
        throw new Error(`Invalid format ${format}`);
    }
  }

  /**
   * Function to sign a transaction. It's important to remark that
   * the transaction parameter is modified inside this function.
   * @param tx - Unsigned transaction
   * @returns
   */
  async signTransaction(tx: Transaction): Promise<Transaction> {
    const blobActiveData = serialize(tx.active_data, abiActiveData);
    const hash = sha256(blobActiveData.buffer);
    const [hex, recovery] = await secp.sign(hash, this.privateKey, {
      recovered: true,
      canonical: true,
    });

    // compact signature
    const { r, s } = secp.Signature.fromHex(hex);
    const rHex = r.toString(16).padStart(64, "0");
    const sHex = s.toString(16).padStart(64, "0");
    const recId = (recovery + 31).toString(16).padStart(2, "0");
    tx.signature_data = new VariableBlob(
      toUint8Array(recId + rHex + sHex)
    ).toString();
    tx.id = new Multihash(toUint8Array(hash)).toString();
    return tx;
  }

  /**
   * Function to recover the public key from a signed transaction.
   * The output format can be compressed or uncompressed.
   * @param tx - signed transaction
   * @param compressed - output format (compressed by default)
   */
  static recoverPublicKey(tx: Transaction, compressed = true): string {
    if (!tx.active_data) throw new Error("active_data is not defined");
    if (!tx.signature_data) throw new Error("signature_data is not defined");
    const blobActiveData = serialize(tx.active_data, abiActiveData);
    const hash = sha256(blobActiveData.buffer);
    const bufferCompactSignature = new VariableBlob(tx.signature_data).buffer;
    const compactSignatureHex = toHexString(bufferCompactSignature);
    const recovery = Number("0x" + compactSignatureHex.slice(0, 2)) - 31;
    const rHex = compactSignatureHex.slice(2, 66);
    const sHex = compactSignatureHex.slice(66);
    const r = BigInt("0x" + rHex);
    const s = BigInt("0x" + sHex);
    const sig = new secp.Signature(r, s);
    const publicKey = secp.recoverPublicKey(hash, sig.toHex(), recovery);
    if (!publicKey) throw new Error("Public key cannot be recovered");
    if (!compressed) return publicKey;
    return secp.Point.fromHex(publicKey).toHex(true);
  }

  /**
   * Function to recover the signer address from a signed transaction.
   * The output format can be compressed or uncompressed.
   * @param tx - signed transaction
   * @param compressed - output format (compressed by default)
   */
  static recoverAddress(tx: Transaction, compressed = true): string {
    const publicKey = Signer.recoverPublicKey(tx, compressed);
    return bitcoinAddress(toUint8Array(publicKey));
  }
}

export default Signer;
