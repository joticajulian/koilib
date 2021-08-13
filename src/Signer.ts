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

export interface Transaction {
  id?: string;
  active_data?: {
    resource_limit?: string | number | bigint;
    nonce?: string | number | bigint;
    operations?: {
      type: string;
      value: unknown;
    }[];
    [x: string]: unknown;
  };
  passive_data?: {
    [x: string]: unknown;
  };
  signature_data?: string;
  [x: string]: unknown;
}

export class Signer {
  compressed: boolean;
  private privateKey: string | number | bigint | Uint8Array;
  publicKey: string | Uint8Array;
  address: string;
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

  static fromWif(wif: string) {
    const privateKey = bitcoinDecode(wif);
    return new Signer(toHexString(privateKey));
  }

  static fromSeed(seed: string) {
    const privateKey = sha256(seed);
    return new Signer(privateKey);
  }

  getAddress() {
    return this.address;
  }

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
