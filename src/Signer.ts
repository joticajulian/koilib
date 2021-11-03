/* eslint-disable no-param-reassign */
import { sha256 } from "js-sha256";
import * as secp from "noble-secp256k1";
import { Root } from "protobufjs/light";
import { Provider } from "./Provider";
import { TransactionJson, ActiveTransactionData } from "./interface";
import protocolJson from "./protocol-proto.json";
import {
  bitcoinAddress,
  bitcoinDecode,
  bitcoinEncode,
  decodeBase64,
  encodeBase64,
  toHexString,
  toUint8Array,
} from "./utils";
import { Abi } from "./Contract";

const root = Root.fromJSON(protocolJson);
const ActiveTxDataMsg = root.lookupType("active_transaction_data");

export interface SignerInterface {
  provider?: Provider;
  getAddress(compressed?: boolean): string;
  getPrivateKey(format: "wif" | "hex", compressed?: boolean): string;
  signTransaction(tx: TransactionJson): Promise<TransactionJson>;
  sendTransaction(
    tx: TransactionJson,
    abis?: Record<string, Abi>
  ): Promise<unknown>;
  encodeTransaction(
    activeData: ActiveTransactionData
  ): Promise<TransactionJson>;
  // decodeTransaction(tx: TransactionJson): ActiveTransactionData;
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
 *
 * <br>
 *
 * defining a provider
 * ```ts
 * var provider = new Provider(["https://example.com/jsonrpc"]);
 * var signer = new Signer("ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c", true, provider);
 * ```
 */
export class Signer implements SignerInterface {
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
   * Provider used to connect with the blockchain
   */
  provider: Provider | undefined;

  /**
   * The constructor receives de private key as hexstring, bigint or Uint8Array.
   * See also the functions [[Signer.fromWif]] and [[Signer.fromSeed]]
   * to create the signer from the WIF or Seed respectively.
   *
   * @param privateKey - Private key as hexstring, bigint or Uint8Array
   * @param compressed - compressed format is true by default
   * @param provider - provider to connect with the blockchain
   * @example
   * ```ts
   * cons signer = new Signer("ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c");
   * console.log(signer.getAddress());
   * // 1MbL6mG8ASAvSYdoMnGUfG3ZXkmQ2dpL5b
   * ```
   */
  constructor(
    privateKey: string | number | bigint | Uint8Array,
    compressed = true,
    provider?: Provider
  ) {
    this.compressed = compressed;
    this.privateKey = privateKey;
    this.provider = provider;
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
  async signTransaction(tx: TransactionJson): Promise<TransactionJson> {
    if (!tx.active) throw new Error("Active data is not defined");
    const hash = sha256(decodeBase64(tx.active));
    const [hex, recovery] = await secp.sign(hash, this.privateKey, {
      recovered: true,
      canonical: true,
    });

    // compact signature
    const { r, s } = secp.Signature.fromHex(hex);
    const rHex = r.toString(16).padStart(64, "0");
    const sHex = s.toString(16).padStart(64, "0");
    const recId = (recovery + 31).toString(16).padStart(2, "0");
    tx.signatureData = encodeBase64(toUint8Array(recId + rHex + sHex));
    const multihash = `0x1220${hash}`; // 12: code sha2-256. 20: length (32 bytes)
    tx.id = multihash;
    return tx;
  }

  /**
   * Function to sign and send a transaction
   * @param tx - Transaction to send. It will be signed inside this function
   * if it is not signed yet
   * @param _abis - Collection of Abis to parse the operations in the
   * transaction. This parameter is optional.
   * @returns
   */
  async sendTransaction(
    tx: TransactionJson,
    _abis?: Record<string, Abi>
  ): Promise<unknown> {
    if (!tx.signatureData || !tx.id) await this.signTransaction(tx);
    if (!this.provider) throw new Error("provider is undefined");
    return this.provider.sendTransaction(tx);
  }

  /**
   * Function to recover the public key from a signed transaction.
   * The output format can be compressed or uncompressed.
   * @param tx - signed transaction
   * @param compressed - output format (compressed by default)
   */
  static recoverPublicKey(tx: TransactionJson, compressed = true): string {
    if (!tx.active) throw new Error("activeData is not defined");
    if (!tx.signatureData) throw new Error("signatureData is not defined");
    const hash = sha256(decodeBase64(tx.active));
    const compactSignatureHex = toHexString(decodeBase64(tx.signatureData));
    const recovery = Number(`0x${compactSignatureHex.slice(0, 2)}`) - 31;
    const rHex = compactSignatureHex.slice(2, 66);
    const sHex = compactSignatureHex.slice(66);
    const r = BigInt(`0x${rHex}`);
    const s = BigInt(`0x${sHex}`);
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
  static recoverAddress(tx: TransactionJson, compressed = true): string {
    const publicKey = Signer.recoverPublicKey(tx, compressed);
    return bitcoinAddress(toUint8Array(publicKey));
  }

  /**
   * Function to encode a transaction
   * @param activeData - Active data consists of nonce, rcLimit, and
   * operations. Do not set the nonce to get it from the blockchain
   * using the provider. The rcLimit is 1000000 by default.
   * @returns A transaction encoded. The active field is encoded in
   * base64url
   */
  async encodeTransaction(
    activeData: ActiveTransactionData
  ): Promise<TransactionJson> {
    let { nonce } = activeData;
    if (activeData.nonce === undefined) {
      if (!this.provider)
        throw new Error(
          "Cannot get the nonce because provider is undefined. To skip this call set a nonce in the parameters"
        );
      // TODO: Option to resolve names
      // this depends on the final architecture for names on Koinos
      nonce = await this.provider.getNonce(this.getAddress());
    }
    const rcLimit =
      activeData.rcLimit === undefined ? 1000000 : activeData.rcLimit;
    const operations = activeData.operations ? activeData.operations : [];

    const activeData2: ActiveTransactionData = {
      rcLimit,
      nonce,
      operations,
    };

    const message = ActiveTxDataMsg.create(activeData2);
    const buffer = ActiveTxDataMsg.encode(message).finish();

    return {
      active: encodeBase64(buffer),
    } as TransactionJson;
  }

  /**
   * Function to decode a transaction
   */
  static decodeTransaction(tx: TransactionJson): ActiveTransactionData {
    if (!tx.active) throw new Error("Active data is not defined");
    const buffer = decodeBase64(tx.active);
    const message = ActiveTxDataMsg.decode(buffer);
    return ActiveTxDataMsg.toObject(message, { longs: String });
  }
}

export default Signer;
