/* eslint-disable no-param-reassign, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { sha256 } from "@noble/hashes/sha256";
import * as secp from "@noble/secp256k1";
import { Provider } from "./Provider";
import { Transaction } from "./Transaction";
import {
  TransactionJson,
  TransactionJsonWait,
  BlockJson,
  RecoverPublicKeyOptions,
  Abi,
  TypeField,
  TransactionReceipt,
  SendTransactionOptions,
  ResourceCreditsOptions,
} from "./interface";
import {
  bitcoinAddress,
  bitcoinDecode,
  bitcoinEncode,
  btypeDecode,
  calculateMerkleRoot,
  decodeBase64url,
  encodeBase64url,
  toHexString,
  toUint8Array,
} from "./utils";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { koinos } from "./protoModules/protocol-proto.js";

export interface SignerInterface {
  provider?: Provider;
  getAddress: (compressed?: boolean) => string;
  signHash: (hash: Uint8Array) => Promise<Uint8Array>;
  signMessage: (message: string | Uint8Array) => Promise<Uint8Array>;

  // Transaction
  signTransaction: (
    transaction: TransactionJson | TransactionJsonWait,
    abis?: Record<string, Abi>
  ) => Promise<TransactionJson>;
  sendTransaction: (
    transaction: TransactionJson | TransactionJsonWait,
    options?: SendTransactionOptions
  ) => Promise<{
    receipt: TransactionReceipt;
    transaction: TransactionJsonWait;
  }>;

  // Block
  prepareBlock: (block: BlockJson) => Promise<BlockJson>;
  signBlock: (block: BlockJson) => Promise<BlockJson>;
}

const btypeBlockHeader: TypeField["subtypes"] = {
  previous: { type: "bytes", btype: "BLOCK_ID" },
  height: { type: "uint64" },
  timestamp: { type: "uint64" },
  previous_state_merkle_root: { type: "bytes" },
  transaction_merkle_root: { type: "bytes" },
  signer: { type: "bytes", btype: "ADDRESS" },
};

const btypeTransactionHeader: TypeField["subtypes"] = {
  chain_id: { type: "bytes" },
  rc_limit: { type: "uint64" },
  nonce: { type: "bytes" },
  operation_merkle_root: { type: "bytes" },
  payer: { type: "bytes", btype: "ADDRESS" },
  payee: { type: "bytes", btype: "ADDRESS" },
};

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
   * Options to apply when sending a transaction.
   * By default broadcast is true and the other fields
   * are undefined
   */
  sendOptions?: SendTransactionOptions;

  /**
   * Options related to the estimation of the rcLimit.
   * By default the estimation is enabled and increased
   * by 10%.
   *
   * @example
   * This code estimates the mana by multiplying the rc_used
   * by 2.
   * ```ts
   * const signer = new Signer({
   *   privateKey,
   *   provider,
   *   rcOptions: {
   *     estimateRc: true,
   *     adjustRcLimit: (receipt) => 2 * Number(receipt.rc_used),
   *   },
   * });
   *
   * // you can also update rcOptions
   * signer.rcOptions = {
   *   estimateRc: true,
   *   adjustRcLimit: (receipt) => 2 * Number(receipt.rc_used),
   * }
   * ```
   */
  rcOptions: ResourceCreditsOptions;

  /**
   * The constructor receives de private key as hexstring, bigint or Uint8Array.
   * See also the functions [[Signer.fromWif]] and [[Signer.fromSeed]]
   * to create the signer from the WIF or Seed respectively.
   *
   * @param privateKey - Private key as hexstring, bigint or Uint8Array
   * @param compressed - compressed format is true by default
   * @param provider - provider to connect with the blockchain
   * @param sendOptions - Send options
   * @param rcOptions - options for mana estimation
   * @example
   * ```ts
   * const privateKey = "ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c";
   * cons signer = new Signer({ privateKey });
   * console.log(signer.getAddress());
   * // 1MbL6mG8ASAvSYdoMnGUfG3ZXkmQ2dpL5b
   * ```
   *
   * By default the mana is estimated as 110% the mana used. This
   * estimation is computed using the "broadcast:false" option.
   * For instance, if the transaction consumes 1 mana, the rc_limit
   * will be set to 1.1 mana.
   *
   * You can also adjust the rc limit.
   * @example
   * ```ts
   * const privateKey = "ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c";
   * cons signer = new Signer({
   *   privateKey,
   *   provider,
   *   rcOptions: {
   *     estimateRc: true,
   *     // use 2 times rc_used as rc_limit
   *     adjustRcLimit: (r) => 2 * Number(r.rc_used),
   *   },
   * });
   * ```
   *
   * The rpc node must be highly trusted because the transaction
   * is signed during the estimation of the mana. You can also
   * disable the mana estimation:
   * @example
   * ```ts
   * const privateKey = "ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c";
   * cons signer = new Signer({
   *   privateKey,
   *   provider,
   *   rcOptions: { estimateRc: false },
   * });
   * ```
   */
  constructor(c: {
    privateKey: string | number | bigint | Uint8Array;
    compressed?: boolean;
    provider?: Provider;
    sendOptions?: SendTransactionOptions;
    rcOptions?: ResourceCreditsOptions;
  }) {
    this.compressed = typeof c.compressed === "undefined" ? true : c.compressed;
    this.privateKey = c.privateKey;
    this.provider = c.provider;
    if (typeof c.privateKey === "string") {
      this.publicKey = secp.getPublicKey(c.privateKey, this.compressed);
      this.address = bitcoinAddress(this.publicKey);
    } else {
      this.publicKey = secp.getPublicKey(c.privateKey, this.compressed);
      this.address = bitcoinAddress(this.publicKey);
    }
    this.sendOptions = {
      broadcast: true,
      ...c.sendOptions,
    };
    this.rcOptions = c.rcOptions ?? {
      estimateRc: true,
      adjustRcLimit: (receipt) =>
        Promise.resolve(
          Math.min(
            Number(receipt.max_payer_rc),
            Math.floor(1.1 * Number(receipt.rc_used))
          )
        ),
    };
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
  static fromWif(wif: string, compressed = true): Signer {
    const comp = compressed === undefined ? wif[0] !== "5" : compressed;
    const privateKey = bitcoinDecode(wif);
    return new Signer({
      privateKey: toHexString(privateKey),
      compressed: comp,
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
  static fromSeed(seed: string, compressed = true): Signer {
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
  getPrivateKey(format: "wif" | "hex" = "hex", compressed = true): string {
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
   * Function to sign a hash value. It returns the bytes signature.
   * The signature is in compact format with the recovery byte
   * @param hash - Hash value. Also known as digest
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
   * Function to sign a message, which could be a string or a Uint8Array
   */
  async signMessage(message: string | Uint8Array): Promise<Uint8Array> {
    return this.signHash(sha256(message));
  }

  /**
   * Function to sign a transaction. It's important to remark that
   * the transaction parameter is modified inside this function.
   * @param tx - Unsigned transaction
   */
  async signTransaction(
    tx: TransactionJson | TransactionJsonWait,
    _abis?: Record<string, Abi>
  ): Promise<TransactionJson> {
    if (!tx.id) throw new Error("Missing transaction id");

    // estimation of rcLimit
    if (this.rcOptions.estimateRc) {
      const receipt = await this.estimateReceipt(tx);
      tx.header!.rc_limit = this.rcOptions.adjustRcLimit
        ? await this.rcOptions.adjustRcLimit(receipt)
        : receipt.rc_used;
      tx.id = Transaction.computeTransactionId(tx.header!);
    }

    // multihash 0x1220. 12: code sha2-256. 20: length (32 bytes)
    // tx id is a stringified multihash, need to extract the hash digest only
    const hash = toUint8Array(tx.id.slice(6));

    const signature = await this.signHash(hash);
    if (!tx.signatures) tx.signatures = [];
    tx.signatures.push(encodeBase64url(signature));

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
    if (!block.id) throw new Error("Missing block id");

    // multihash 0x1220. 12: code sha2-256. 20: length (32 bytes)
    // block id is a stringified multihash, need to extract the hash digest only
    const hash = toUint8Array(block.id.slice(6));

    const signature = await this.signHash(hash);

    block.signature = encodeBase64url(signature);

    return block;
  }

  /**
   * Function to sign and send a transaction. It internally uses
   * [[Provider.sendTransaction]]
   * @param transaction - Transaction to send. It will be signed inside this
   * function if it is not signed yet
   * @param options - Options for sending the transaction
   */
  async sendTransaction(
    transaction: TransactionJson | TransactionJsonWait,
    options?: SendTransactionOptions
  ): Promise<{
    receipt: TransactionReceipt;
    transaction: TransactionJsonWait;
  }> {
    if (!transaction.signatures || !transaction.signatures?.length)
      transaction = await this.signTransaction(
        transaction,
        options?.sendAbis ? options.abis : undefined
      );
    if (!this.provider) throw new Error("provider is undefined");
    const opts: SendTransactionOptions = {
      ...this.sendOptions,
      ...options,
    };
    if (opts.beforeSend) {
      await opts.beforeSend(transaction, options);
    }
    return this.provider.sendTransaction(transaction, opts.broadcast);
  }

  /**
   * Estimate the receipt associated to the transaction if
   * it sent to the blockchain. It is useful to estimate the
   * consumption of mana.
   * The transaction is signed during this process and sent
   * to the rpc node with the "broadcast:false" option to
   * just compute the transaction without broadcasting it to
   * the network.
   * After that, the initial signatures are restored (if any)
   * and the ones used for the estimation will be removed.
   */
  async estimateReceipt(
    tx: TransactionJson | TransactionJsonWait
  ): Promise<TransactionReceipt> {
    if (!tx.id) throw new Error("Missing transaction id");
    if (!tx.signatures) tx.signatures = [];
    const signaturesCopy = [...tx.signatures];

    // sign if there are no signatures
    if (tx.signatures.length === 0) {
      const hash = toUint8Array(tx.id.slice(6));
      const signature = await this.signHash(hash);
      tx.signatures.push(encodeBase64url(signature));
    }

    try {
      const { receipt } = await this.sendTransaction(tx, {
        broadcast: false,
      });
      // restore signatures
      tx.signatures = signaturesCopy;
      return receipt;
    } catch (error) {
      // restore signatures
      tx.signatures = signaturesCopy;
      throw error;
    }
  }

  /**
   * Function to recover the public key from hash and signature
   * @param hash - hash sha256
   * @param signature - compact signature
   * @param compressed - default true
   */
  static recoverPublicKey(
    hash: Uint8Array,
    signature: Uint8Array,
    compressed = true
  ): string {
    const compactSignatureHex = toHexString(signature);
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
      return toHexString(publicKey);
    } else {
      return secp.Point.fromHex(publicKey).toHex(true);
    }
  }

  static recoverAddress(
    hash: Uint8Array,
    signature: Uint8Array,
    compressed = true
  ): string {
    return bitcoinAddress(
      toUint8Array(Signer.recoverPublicKey(hash, signature, compressed))
    );
  }

  /**
   * Function to recover the publics keys from a signed
   * transaction or block.
   * The output format can be compressed (default) or uncompressed.
   *
   * @example
   * ```ts
   * const publicKeys = await Signer.recoverPublicKeys(tx);
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
   *  const publicKeys = await signer.recoverPublicKeys(block, {
   *    transformSignature: async (signatureData) => {
   *      const powSignatureData = await serializer.deserialize(signatureData);
   *      return powSignatureData.recoverable_signature;
   *    },
   *  });
   * ```
   */
  async recoverPublicKeys(
    txOrBlock: TransactionJson | BlockJson,
    opts?: RecoverPublicKeyOptions
  ): Promise<string[]> {
    let compressed = true;

    if (opts && opts.compressed !== undefined) {
      compressed = opts.compressed;
    }

    let signatures: string[] = [];
    let headerBytes: Uint8Array;

    const block = txOrBlock as BlockJson;
    if (block.signature) {
      if (!block.header) throw new Error("Missing block header");
      if (!block.signature) throw new Error("Missing block signature");
      signatures = [block.signature];
      const headerDecoded = btypeDecode(block.header, btypeBlockHeader!, false);
      const message = koinos.protocol.block_header.create(headerDecoded);
      headerBytes = koinos.protocol.block_header.encode(message).finish();
    } else {
      const transaction = txOrBlock as TransactionJson;
      if (!transaction.header) throw new Error("Missing transaction header");
      if (!transaction.signatures)
        throw new Error("Missing transaction signatures");
      signatures = transaction.signatures;
      const headerDecoded = btypeDecode(
        transaction.header,
        btypeTransactionHeader!,
        false
      );
      const message = koinos.protocol.transaction_header.create(headerDecoded);
      headerBytes = koinos.protocol.transaction_header.encode(message).finish();
    }

    const hash = sha256(headerBytes);

    return Promise.all(
      signatures.map(async (signature) => {
        if (opts && typeof opts.transformSignature === "function") {
          signature = await opts.transformSignature(signature);
        }
        return Signer.recoverPublicKey(
          hash,
          decodeBase64url(signature),
          compressed
        );
      })
    );
  }

  /**
   * Function to recover the signer addresses from a signed
   * transaction or block.
   * The output format can be compressed (default) or uncompressed.
   * @example
   * ```ts
   * const addresses = await signer.recoverAddress(tx);
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
   *  const addresses = await signer.recoverAddress(block, {
   *    transformSignature: async (signatureData) => {
   *      const powSignatureData = await serializer.deserialize(signatureData);
   *      return powSignatureData.recoverable_signature;
   *    },
   *  });
   * ```
   */
  async recoverAddresses(
    txOrBlock: TransactionJson | BlockJson,
    opts?: RecoverPublicKeyOptions
  ): Promise<string[]> {
    const publicKeys = await this.recoverPublicKeys(txOrBlock, opts);
    return publicKeys.map((publicKey) =>
      bitcoinAddress(toUint8Array(publicKey))
    );
  }

  /**
   * Function to prepare a block
   * @param block -
   * @returns A prepared block. ()
   */
  async prepareBlock(block: BlockJson): Promise<BlockJson> {
    if (!block.header) {
      block.header = {};
    }

    const hashes: Uint8Array[] = [];

    if (block.transactions) {
      for (let index = 0; index < block.transactions.length; index++) {
        const tx = block.transactions[index];
        const headerDecoded = btypeDecode(
          tx.header!,
          btypeTransactionHeader!,
          false
        );
        const message =
          koinos.protocol.transaction_header.create(headerDecoded);
        const headerBytes = koinos.protocol.transaction_header
          .encode(message)
          .finish() as Uint8Array;

        hashes.push(sha256(headerBytes));

        let signaturesBytes = new Uint8Array();
        tx.signatures?.forEach((sig) => {
          signaturesBytes = new Uint8Array([
            ...signaturesBytes,
            ...decodeBase64url(sig),
          ]);
        });

        hashes.push(sha256(signaturesBytes));
      }
    }

    // retrieve head info if not provided
    // eslint-disable-next-line @typescript-eslint/naming-convention
    let { height, previous, previous_state_merkle_root } = block.header;

    if (!height || !previous || !previous_state_merkle_root) {
      if (!this.provider) {
        throw new Error(
          "Cannot get the head info because provider is undefined."
        );
      }

      const headInfo = await this.provider.getHeadInfo();

      height = height || `${Number(headInfo.head_topology.height) + 1}`;
      previous = previous || headInfo.head_topology.id;
      previous_state_merkle_root =
        previous_state_merkle_root || headInfo.head_state_merkle_root;
    }

    block.header = {
      height,
      previous,
      previous_state_merkle_root,
      timestamp: block.header.timestamp || `${Date.now()}`,
      transaction_merkle_root: encodeBase64url(
        new Uint8Array([
          // multihash sha256: 18, 32
          18,
          32,
          ...calculateMerkleRoot(hashes),
        ])
      ),
      signer: this.address,
    };

    const headerDecoded = btypeDecode(block.header, btypeBlockHeader!, false);
    const message = koinos.protocol.block_header.create(headerDecoded);
    const headerBytes = koinos.protocol.block_header
      .encode(message)
      .finish() as Uint8Array;

    const hash = sha256(headerBytes);

    // multihash 0x1220. 12: code sha2-256. 20: length (32 bytes)
    block.id = `0x1220${toHexString(hash)}`;
    return block;
  }
}

export default Signer;
