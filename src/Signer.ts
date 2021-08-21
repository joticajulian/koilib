import { sha256 } from "js-sha256";
import * as secp from "noble-secp256k1";
import { abiActiveData } from "./abi";
import Multihash from "./Multihash";
import { serialize } from "./serializer";
import {
  bitcoinAddress,
  bitcoinDecode,
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
 * Signer class
 */
export class Signer {
  /**
   * public/private key compressed
   */
  compressed: boolean;

  /**
   * Private key
   */
  private privateKey: string | number | bigint | Uint8Array;

  /**
   * Public key
   */
  publicKey: string | Uint8Array;

  /**
   * Account address
   */
  address: string;

  /**
   *
   * @param privateKey - Private key as hexstring, bigint or Uint8Array
   * @param compressed
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
    const privateKey = bitcoinDecode(wif);
    return new Signer(toHexString(privateKey));
  }

  /**
   * Function to import a private key from the seed
   * @param seed Seed words
   * @example
   * ```ts
   * const signer = Signer.fromSeed("my seed");
   * console.log(signer.getAddress());
   * // 1BqtgWBcqm9cSZ97avLGZGJdgso7wx6pCA
   * ```
   * @returns Signer object
   */
  static fromSeed(seed: string) {
    const privateKey = sha256(seed);
    return new Signer(privateKey);
  }

  /**
   *
   * @returns Signer address
   */
  getAddress() {
    return this.address;
  }

  /**
   * Function to sign a transaction. The transaction parameter is
   * modified inside this function.
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
