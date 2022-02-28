/* eslint-disable no-param-reassign */
import { sha256 } from "@noble/hashes/sha256";
import * as secp from "@noble/secp256k1";
import { Provider } from "./Provider";
import {
  TransactionJson,
  TransactionJsonWait,
  BlockJson,
  RecoverPublicKeyArguments,
} from "./interface";
import protocolJson from "./jsonDescriptors/protocol-proto.json";
import {
  bitcoinAddress,
  bitcoinDecode,
  bitcoinEncode,
  calculateMerkleRoot,
  decodeBase64,
  encodeBase64,
  toHexString,
  toUint8Array,
  UInt64ToNonceBytes,
} from "./utils";
import { Serializer } from "./Serializer";

export interface SignerInterface {
  provider?: Provider;
  serializer?: Serializer;
  getAddress: (compressed?: boolean) => string;
  getPrivateKey: (format: "wif" | "hex", compressed?: boolean) => string;
  signTransaction: (tx: TransactionJson) => Promise<TransactionJson>;
  sendTransaction: (tx: TransactionJson) => Promise<TransactionJsonWait>;
  prepareTransaction: (tx: TransactionJson) => Promise<TransactionJson>;
}

/**
 * The Signer Class contains the private key needed to sign transactions.
 * It can be created using the seed, wif, or private key
 *
 * @example
 * using private key as hex string
 * ```ts
 * var privateKey = "ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c";
 * var signer = new Signer({ privateKey });
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
 * var signer = new Signer({ privateKey: buffer });
 * ```
 *
 * <br>
 *
 * using private key as bigint
 * ```ts
 * var privateKey = 106982601049961974618234078204952280507266494766432547312316920283818886029212n;
 * var signer = new Signer({ privateKey });
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
 * var privateKey = "ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c";
 * var signer = new Signer({ privateKey, provider });
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
   * Provider to connect with the blockchain
   */
  provider?: Provider;

  /**
   * Serializer to serialize/deserialize data types
   */
  serializer?: Serializer;

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
   * const privateKey = "ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c";
   * cons signer = new Signer({ privateKey });
   * console.log(signer.getAddress());
   * // 1MbL6mG8ASAvSYdoMnGUfG3ZXkmQ2dpL5b
   * ```
   */
  constructor(c: {
    privateKey: string | number | bigint | Uint8Array;
    compressed?: boolean;
    provider?: Provider;
    /**
     * Set this option if you can not use _eval_ functions
     * in the current environment. In such cases, the
     * serializer must come from an environment where it
     * is able to use those functions.
     */
    serializer?: Serializer;
  }) {
    this.compressed = typeof c.compressed === "undefined" ? true : c.compressed;
    this.privateKey = c.privateKey;
    this.provider = c.provider;
    if (c.serializer) {
      this.serializer = c.serializer;
    } else {
      this.serializer = new Serializer(protocolJson, {
        bytesConversion: false,
      });
    }
    if (typeof c.privateKey === "string") {
      this.publicKey = secp.getPublicKey(c.privateKey, this.compressed);
      this.address = bitcoinAddress(this.publicKey);
    } else {
      this.publicKey = secp.getPublicKey(c.privateKey, this.compressed);
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
    return new Signer({
      privateKey: toHexString(privateKey),
      compressed,
    });
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
    return new Signer({ privateKey, compressed });
  }

  /**
   * @param compressed - determines if the address should be
   * derived from the compressed public key (default) or the public key
   * @returns Signer address
   */
  getAddress(compressed = true): string {
    if (typeof this.privateKey === "string") {
      const publicKey = secp.getPublicKey(this.privateKey, compressed);
      return bitcoinAddress(publicKey);
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
   * Function to sign a hash value. It returns the bytes sugnature.
   * The signature is in compact format with the recovery byte
   * @param hash Hash value. Also known as digest
   */
  async signHash(hash: Uint8Array): Promise<Uint8Array> {
    const [compSignature, recovery] = await secp.sign(hash, this.privateKey, {
      recovered: true,
      canonical: true,
      der: false, // compact signature
    });

    const compactSignature = new Uint8Array(65);
    compactSignature.set([recovery + 31], 0);
    compactSignature.set(compSignature, 1);
    return compactSignature;
  }

  /**
   * Function to sign a transaction. It's important to remark that
   * the transaction parameter is modified inside this function.
   * @param tx - Unsigned transaction
   */
  async signTransaction(tx: TransactionJson): Promise<TransactionJson> {
    if (!tx.id) throw new Error("Missing transaction id");

    // multihash 0x1220. 12: code sha2-256. 20: length (32 bytes)
    // tx id is a stringified multihash, need to extract the hash digest only
    const hash = toUint8Array(tx.id.slice(6));

    const signature = await this.signHash(hash);
    if (!tx.signatures) {
      tx.signatures = [];
    }

    tx.signatures.push(encodeBase64(signature));

    return tx;
  }

  /**
   * Function to sign a block for federated consensus. That is,
   * just the ecdsa signature. For other algorithms, like PoW,
   * you have to sign the block and then process the signature
   * to add the extra data (nonce in the case of PoW).
   * @param block - Unsigned block
   */
  async signBlock(block: BlockJson): Promise<BlockJson> {
    const activeBytes = decodeBase64(block.signature!);
    const headerBytes = await this.serializer!.serialize(
      block.header!,
      "block_header",
      { bytesConversion: true }
    );
    const headerActiveBytes = new Uint8Array(
      headerBytes.length + activeBytes.length
    );
    headerActiveBytes.set(headerBytes, 0);
    headerActiveBytes.set(activeBytes, headerBytes.length);
    const hash = sha256(headerActiveBytes);
    block.signature_data = (await this.signHash(hash)).toString();
    // multihash 0x1220. 12: code sha2-256. 20: length (32 bytes)
    block.id = `0x1220${toHexString(hash)}`;
    return block;
  }

  /**
   * Function to sign and send a transaction. It internally uses
   * [[Provider.sendTransaction]]
   * @param tx - Transaction to send. It will be signed inside this function
   * if it is not signed yet
   * @param _abis - Collection of Abis to parse the operations in the
   * transaction. This parameter is optional.
   * @returns
   */
  async sendTransaction(tx: TransactionJson): Promise<TransactionJsonWait> {
    if (!tx.signatures || !tx.signatures?.length)
      tx = await this.signTransaction(tx);
    if (!this.provider) throw new Error("provider is undefined");
    await this.provider.sendTransaction(tx);
    return {
      ...tx,
      wait: async (
        type: "byTransactionId" | "byBlock" = "byBlock",
        timeout = 30000
      ) => {
        if (!this.provider) throw new Error("provider is undefined");
        return this.provider.wait(tx.id as string, type, timeout);
      },
    };
  }

  /**
   * Function to recover the public key from a signed
   * transaction or block.
   * The output format can be compressed (default) or uncompressed.
   *
   * @example
   * ```ts
   * const publicKey = await Signer.recoverPublicKey(tx);
   * ```
   *
   * If the signature data contains more data, like in the
   * blocks for PoW consensus, use the "transformSignature"
   * function to extract the signature.
   *
   * @example
   * ```ts
   *  const powDescriptorJson = {
   *    nested: {
   *      mypackage: {
   *        nested: {
   *          pow_signature_data: {
   *            fields: {
   *              nonce: {
   *                type: "bytes",
   *                id: 1,
   *              },
   *              recoverable_signature: {
   *                type: "bytes",
   *                id: 2,
   *              },
   *            },
   *          },
   *        },
   *      },
   *    },
   *  };
   *
   *  const serializer = new Serializer(powDescriptorJson, {
   *   defaultTypeName: "pow_signature_data",
   *  });
   *
   *  const signer = await signer.recoverPublicKey(block, {
   *    transformSignature: async (signatureData) => {
   *      const powSignatureData = await serializer.deserialize(signatureData);
   *      return powSignatureData.recoverable_signature;
   *    },
   *  });
   * ```
   */
  async recoverPublicKey(args: RecoverPublicKeyArguments): Promise<string[]> {
    const { tx, block } = args;
    let compressed = true;

    if (typeof args.compressed !== "undefined") {
      compressed = args.compressed;
    }

    let signatures: string[] = [];
    let headerBytes: Uint8Array = new Uint8Array();

    if (tx) {
      if (!tx.header) throw new Error("Missing transaction header");
      if (!tx.signatures) throw new Error("Missing transaction signatures");

      signatures = tx.signatures;
      headerBytes = await this.serializer!.serialize(
        tx.header,
        "transaction_header",
        {
          bytesConversion: true,
        }
      );
    } else if (block) {
      if (!block.header) throw new Error("Missing block header");
      if (!block.signature) throw new Error("Missing block signature");
      signatures = [block.signature];
      headerBytes = await this.serializer!.serialize(
        block.header,
        "block_header",
        {
          bytesConversion: true,
        }
      );
    }

    const hash = sha256(headerBytes);

    const publicKeys: string[] = [];

    for (let i = 0; i < signatures.length; i++) {
      let signature = signatures[i];

      if (typeof args.transformSignature === "function") {
        signature = await args.transformSignature(signature);
      }

      const compactSignatureHex = toHexString(decodeBase64(signature));

      const recovery = Number(`0x${compactSignatureHex.slice(0, 2)}`) - 31;

      const rHex = compactSignatureHex.slice(2, 66);
      const sHex = compactSignatureHex.slice(66);
      const r = BigInt(`0x${rHex}`);
      const s = BigInt(`0x${sHex}`);
      const sig = new secp.Signature(r, s);
      const publicKey = secp.recoverPublicKey(
        toHexString(hash),
        sig.toHex(),
        recovery
      );

      if (!publicKey) throw new Error("Public key cannot be recovered");
      if (!compressed) {
        publicKeys.push(toHexString(publicKey));
      } else {
        publicKeys.push(secp.Point.fromHex(publicKey).toHex(true));
      }
    }

    return publicKeys;
  }

  /**
   * Function to recover the signer address from a signed
   * transaction or block.
   * The output format can be compressed (default) or uncompressed.
   * @example
   * ```ts
   * const publicKey = await signer.recoverAddress(tx);
   * ```
   *
   * If the signature data contains more data, like in the
   * blocks for PoW consensus, use the "transformSignature"
   * function to extract the signature.
   *
   * @example
   * ```ts
   *  const powDescriptorJson = {
   *    nested: {
   *      mypackage: {
   *        nested: {
   *          pow_signature_data: {
   *            fields: {
   *              nonce: {
   *                type: "bytes",
   *                id: 1,
   *              },
   *              recoverable_signature: {
   *                type: "bytes",
   *                id: 2,
   *              },
   *            },
   *          },
   *        },
   *      },
   *    },
   *  };
   *
   *  const serializer = new Serializer(powDescriptorJson, {
   *   defaultTypeName: "pow_signature_data",
   *  });
   *
   *  const signer = await signer.recoverAddress(block, {
   *    transformSignature: async (signatureData) => {
   *      const powSignatureData = await serializer.deserialize(signatureData);
   *      return powSignatureData.recoverable_signature;
   *    },
   *  });
   * ```
   */
  async recoverAddress(args: RecoverPublicKeyArguments): Promise<string[]> {
    const publicKeys = await this.recoverPublicKey(args);

    const addresses: string[] = [];

    publicKeys.forEach((publicKey) => {
      addresses.push(bitcoinAddress(toUint8Array(publicKey)));
    });

    return addresses;
  }

  /**
   * Function to prepare a transaction
   * @param tx - Do not set the nonce to get it from the blockchain
   * using the provider. The rc_limit is 1e8 by default.
   * @returns A prepared transaction. ()
   */
  async prepareTransaction(tx: TransactionJson): Promise<TransactionJson> {
    if (!tx.header) {
      tx.header = {};
    }

    const getNonce = !tx.header || !tx.header.nonce;
    let nonce;
    if (getNonce) {
      if (!this.provider)
        throw new Error(
          "Cannot get the nonce because provider is undefined. To skip this call set a nonce in the transaction header"
        );
      // TODO: Option to resolve names
      // this depends on the final architecture for names on Koinos
      const oldNonce = await this.provider.getNonce(this.getAddress());
      nonce = encodeBase64(await UInt64ToNonceBytes(`${oldNonce + 1}`));
    } else {
      nonce = tx.header.nonce;
    }

    const getRCLimit = !tx.header || !tx.header.rc_limit;
    let rcLimit;
    if (getRCLimit) {
      if (!this.provider)
        throw new Error(
          "Cannot get the rc_limit because provider is undefined. To skip this call set a rc_limit in the transaction header"
        );
      // TODO: Option to resolve names
      // this depends on the final architecture for names on Koinos
      rcLimit = await this.provider.getAccountRc(this.getAddress());
    } else {
      rcLimit = tx.header.rc_limit;
    }

    const getChainId = !tx.header || !tx.header.chain_id;
    let chainId;
    if (getChainId) {
      if (!this.provider)
        throw new Error(
          "Cannot get the chain_id because provider is undefined. To skip this call set a chain_id in the transaction header"
        );

      chainId = await this.provider.getChainId();
    } else {
      chainId = tx.header.chain_id;
    }

    const operationsHashes: Uint8Array[] = [];

    if (tx.operations) {
      for (let index = 0; index < tx.operations?.length; index++) {
        const encodedOp = await this.serializer!.serialize(
          tx.operations[index],
          "operation",
          { bytesConversion: true }
        );
        operationsHashes.push(sha256(encodedOp));
      }
    }

    tx.header = {
      chain_id: chainId,
      rc_limit: rcLimit,
      nonce,
      operation_merkle_root: encodeBase64(
        toUint8Array(
          `0x1220${toHexString(calculateMerkleRoot(operationsHashes))}`
        )
      ),
      payer: this.address,
    };

    const headerBytes = await this.serializer!.serialize(
      tx.header,
      "transaction_header",
      { bytesConversion: true }
    );

    const hash = sha256(headerBytes);

    // multihash 0x1220. 12: code sha2-256. 20: length (32 bytes)
    tx.id = `0x1220${toHexString(hash)}`;
    return tx;
  }
}

export default Signer;
