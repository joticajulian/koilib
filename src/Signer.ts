import { sha256 } from "js-sha256";
import * as secp from "noble-secp256k1";
import { abiActiveData } from "./abi";
import Multihash from "./Multihash";
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
 * Koinos Transaction
 */
export interface Transaction {
  /**
   * Transaction ID. It must be the sha2-256 of the
   * serialized data of active data, and encoded in multi base58
   */
  id?: string;

  /**
   * Consensus data
   */
  active_data?: {
    resource_limit?: string | number | bigint;

    /**
     * Account nonce
     */
    nonce?: string | number | bigint;

    /**
     * Array of operations
     */
    operations?: {
      type: string;
      value: unknown;
    }[];
    [x: string]: unknown;
  };

  /**
   * Non-consensus data
   */
  passive_data?: {
    [x: string]: unknown;
  };

  /**
   * Signature in compact format enconded in multi base64
   */
  signature_data?: string;
  [x: string]: unknown;
}

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
      this.address = bitcoinAddress(
        toUint8Array(this.publicKey),
        this.compressed
      );
    } else {
      this.publicKey = secp.getPublicKey(privateKey, this.compressed);
      this.address = bitcoinAddress(this.publicKey, this.compressed);
    }
  }

  /**
   * Function to import a private key from the WIF
   * @param wif Private key in WIF format
   * @example
   * ```ts
   * const signer = Signer.fromWif("L59UtJcTdNBnrH2QSBA5beSUhRufRu3g6tScDTite6Msuj7U93tM")
   * console.log(signer.getAddress());
   * // 1MbL6mG8ASAvSYdoMnGUfG3ZXkmQ2dpL5b
   * ```
   * @returns Signer object
   */
  static fromWif(wif: string) {
    const compressed = wif[0] !== "5";
    const privateKey = bitcoinDecode(wif);
    return new Signer(toHexString(privateKey), compressed);
  }

  /**
   * Function to import a private key from the seed
   * @param seed Seed words
   * @param compressed
   * @example
   * ```ts
   * const signer = Signer.fromSeed("my seed");
   * console.log(signer.getAddress());
   * // 1BqtgWBcqm9cSZ97avLGZGJdgso7wx6pCA
   * ```
   * @returns Signer object
   */
  static fromSeed(seed: string, compressed?: boolean) {
    const privateKey = sha256(seed);
    return new Signer(privateKey, compressed);
  }

  /**
   *
   * @returns Signer address
   */
  getAddress() {
    return this.address;
  }

  getPrivateKey(format: "wif" | "hex", compressed?: boolean) {
    let stringPrivateKey: string;
    if (this.privateKey instanceof Uint8Array) {
      stringPrivateKey = toHexString(this.privateKey);
    } else if (typeof this.privateKey === "string") {
      stringPrivateKey = this.privateKey;
    } else {
      stringPrivateKey = BigInt(this.privateKey).toString(16).padStart(64, "0");
    }

    const comp = compressed === undefined ? this.compressed : compressed;
    
    switch(format) {
      case "hex":
        return stringPrivateKey;
      case "wif":
        return bitcoinEncode(toUint8Array(stringPrivateKey), "private", comp);
      default:
        throw new Error(`Invalid format ${format}`);
    }
  }

  /**
   * Function to sign a transaction. It's important to remark that
   * the transaction parameter is modified inside this function.
   * @param tx Unsigned transaction
   * @returns
   */
  async signTransaction(tx: Transaction) {
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
}

export default Signer;
