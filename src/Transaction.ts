/* eslint-disable no-param-reassign, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { sha256 } from "@noble/hashes/sha256";
import { Contract } from "./Contract";
import { ProviderInterface } from "./Provider";
import { SignerInterface } from "./Signer";
import {
  Abi,
  OperationJson,
  SendTransactionOptions,
  TransactionHeaderJson,
  TransactionJson,
  TransactionOptions,
  TransactionReceipt,
  TypeField,
  WaitFunction,
} from "./interface";
import {
  btypeDecode,
  calculateMerkleRoot,
  encodeBase64url,
  toHexString,
} from "./utils";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { koinos } from "./protoModules/protocol-proto.js";

const btypeTransactionHeader: TypeField["subtypes"] = {
  chain_id: { type: "bytes" },
  rc_limit: { type: "uint64" },
  nonce: { type: "bytes" },
  operation_merkle_root: { type: "bytes" },
  payer: { type: "bytes", btype: "ADDRESS" },
  payee: { type: "bytes", btype: "ADDRESS" },
};

const btypesOperation: TypeField["subtypes"] = {
  upload_contract: {
    type: "object",
    subtypes: {
      contract_id: { type: "bytes", btype: "CONTRACT_ID" },
      bytecode: { type: "bytes" },
      abi: { type: "string" },
      authorizes_call_contract: { type: "bool" },
      authorizes_transaction_application: { type: "bool" },
      authorizes_upload_contract: { type: "bool" },
    },
  },
  call_contract: {
    type: "object",
    subtypes: {
      contract_id: { type: "bytes", btype: "CONTRACT_ID" },
      entry_point: { type: "uint32" },
      args: { type: "bytes" },
    },
  },
  set_system_call: {
    type: "object",
    subtypes: {
      call_id: { type: "uint32" },
      target: {
        type: "object",
        subtypes: {
          thunk_id: { type: "uint32" },
          system_call_bundle: {
            type: "object",
            subtypes: {
              contract_id: { type: "bytes", btype: "CONTRACT_ID" },
              entry_point: { type: "uint32" },
            },
          },
        },
      },
    },
  },
  set_system_contract: {
    type: "object",
    subtypes: {
      contract_id: { type: "bytes", btype: "CONTRACT_ID" },
      system_contract: { type: "bool" },
    },
  },
};

export class Transaction {
  /**
   * Signer interacting with the smart contracts
   */
  signer?: SignerInterface;

  /**
   * Provider to connect with the blockchain
   */
  provider?: ProviderInterface;

  /**
   * Transaction
   */
  transaction: TransactionJson;

  /**
   * Function to wait for the transaction to be mined
   */
  waitFunction?: WaitFunction;

  /**
   * Transaction options
   */
  options: TransactionOptions;

  constructor(c?: {
    signer?: SignerInterface;
    provider?: ProviderInterface;
    transaction?: TransactionJson;
    options?: TransactionOptions;
  }) {
    this.signer = c?.signer;
    this.provider = c?.provider || c?.signer?.provider;
    this.options = {
      broadcast: true,
      sendAbis: true,
      ...c?.options,
    };
    this.transaction = {
      header: {
        ...(c?.options?.chainId && { chain_id: c.options.chainId }),
        ...(c?.options?.rcLimit && { rc_limit: c.options.rcLimit }),
        ...(c?.options?.nonce && { nonce: c.options.nonce }),
        ...(c?.options?.payer && { payer: c.options.payer }),
        ...(c?.options?.payee && { payee: c.options.payee }),
      },
      operations: [],
      ...c?.transaction,
    };
  }

  /**
   * Function to push an operation to the transaction. It can be created
   * in several ways. Example:
   *
   * @example
   * ```ts
   * const koin = new Contract({
   *   id: "15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL",
   *   abi: utils.tokenAbi,
   * }).functions;
   * const signer = Signer.fromSeed("my seed");
   * const provider = new Provider(["https://api.koinos.io"]);
   * signer.provider = provider;
   * const tx = new Transaction({ signer });
   *
   * // Method 1 (using 2 arguments)
   * // note that with 2 arguments it is not necessary to
   * // set "onlyOperation: true". For the rest of the
   * // methods it's necessary to do that.
   * await tx.pushOperation(koin.transfer, {
   *   from: "1NRYHBYr9qxYQAeVqfdSvyjJemRQ4qD3Mt",
   *   to: "13UdKjYuzfBYbB6bGLQkUN9DJRFPCmG1mU",
   *   value: "1000",
   * });
   *
   * // Method 2
   * await tx.pushOperation(
   *   koin.transfer({
   *     from: "1NRYHBYr9qxYQAeVqfdSvyjJemRQ4qD3Mt",
   *     to: "13UdKjYuzfBYbB6bGLQkUN9DJRFPCmG1mU",
   *     value: "1000",
   *   },{
   *    onlyOperation: true,
   *   })
   * );
   *
   * // Method 3
   * await tx.pushOperation(
   *   await koin.transfer({
   *     from: "1NRYHBYr9qxYQAeVqfdSvyjJemRQ4qD3Mt",
   *     to: "13UdKjYuzfBYbB6bGLQkUN9DJRFPCmG1mU",
   *     value: "1000",
   *   },{
   *    onlyOperation: true,
   *   })
   * );
   *
   * // Method 4
   * const { operation } = await koin.transfer({
   *   from: "1NRYHBYr9qxYQAeVqfdSvyjJemRQ4qD3Mt",
   *   to: "13UdKjYuzfBYbB6bGLQkUN9DJRFPCmG1mU",
   *   value: "1000",
   * },{
   *  onlyOperation: true,
   * });
   * await tx.pushOperation(operation)
   * ```
   *
   */
  async pushOperation(
    input:
      | OperationJson
      | { operation: OperationJson }
      | Promise<{ operation: OperationJson }>
      | Contract["functions"]["x"],
    args?: unknown
  ): Promise<void> {
    let operation: OperationJson;
    if (typeof input === "function") {
      const result = await input(args, { onlyOperation: true });
      operation = result.operation;
    } else {
      let inp: OperationJson | { operation: OperationJson };
      if (input instanceof Promise) {
        inp = await input;
      } else {
        inp = input;
      }
      if ((inp as { operation: OperationJson }).operation) {
        operation = (inp as { operation: OperationJson }).operation;
      } else {
        operation = input as OperationJson;
      }
    }

    if (!this.transaction.operations) this.transaction.operations = [];
    this.transaction.operations.push(operation);
  }

  static computeTransactionId(txHeader: TransactionHeaderJson): string {
    const headerDecoded = btypeDecode(txHeader, btypeTransactionHeader!, false);
    const message = koinos.protocol.transaction_header.create(headerDecoded);
    const headerBytes = koinos.protocol.transaction_header
      .encode(message)
      .finish() as Uint8Array;

    const hash = sha256(headerBytes);

    // multihash 0x1220. 12: code sha2-256. 20: length (32 bytes)
    return `0x1220${toHexString(hash)}`;
  }

  /**
   * Function to prepare a transaction
   * @param tx - Do not set the nonce to get it from the blockchain
   * using the provider. The rc_limit is 1e8 by default.
   * @param provider - Provider
   * @param payer - payer to be used in case it is not defined in the transaction
   * @returns A prepared transaction.
   */
  static async prepareTransaction(
    tx: TransactionJson,
    provider?: ProviderInterface,
    payer?: string
  ): Promise<TransactionJson> {
    if (!tx.header) {
      tx.header = {};
    }

    const { payer: payerHeader, payee } = tx.header;
    if (!payerHeader) tx.header.payer = payer;
    payer = tx.header.payer;
    if (!payer) throw new Error("payer is undefined");

    let nonce: string;
    if (tx.header.nonce === undefined) {
      if (!provider)
        throw new Error(
          "Cannot get the nonce because provider is undefined. To skip this call set a nonce in the transaction header"
        );
      nonce = await provider.getNextNonce(payee || payer);
    } else {
      nonce = tx.header.nonce;
    }

    let rcLimit: string | number;
    if (tx.header.rc_limit === undefined) {
      if (!provider)
        throw new Error(
          "Cannot get the rc_limit because provider is undefined. To skip this call set a rc_limit in the transaction header"
        );
      rcLimit = await provider.getAccountRc(payer);
    } else {
      rcLimit = tx.header.rc_limit;
    }

    if (!tx.header.chain_id) {
      if (!provider)
        throw new Error(
          "Cannot get the chain_id because provider is undefined. To skip this call set a chain_id"
        );
      tx.header.chain_id = await provider.getChainId();
    }

    const operationsHashes: Uint8Array[] = [];

    if (tx.operations) {
      for (let index = 0; index < tx.operations?.length; index += 1) {
        const operationDecoded = btypeDecode(
          tx.operations[index],
          btypesOperation!,
          false
        );
        const message = koinos.protocol.operation.create(operationDecoded);
        const operationEncoded = koinos.protocol.operation
          .encode(message)
          .finish() as Uint8Array;
        operationsHashes.push(sha256(operationEncoded));
      }
    }
    const operationMerkleRoot = encodeBase64url(
      new Uint8Array([
        // multihash sha256: 18, 32
        18,
        32,
        ...calculateMerkleRoot(operationsHashes),
      ])
    );

    tx.header = {
      chain_id: tx.header.chain_id,
      rc_limit: rcLimit,
      nonce,
      operation_merkle_root: operationMerkleRoot,
      payer,
      ...(payee && { payee }),
      // TODO: Option to resolve names (payer, payee)
    };

    tx.id = Transaction.computeTransactionId(tx.header);
    return tx;
  }

  /**
   * Function to prepare the transaction (set headers, merkle
   * root, etc)
   */
  async prepare(options?: TransactionOptions): Promise<TransactionJson> {
    if (options) {
      const header = {
        ...(options?.chainId && { chain_id: options.chainId }),
        ...(options?.rcLimit && { rc_limit: options.rcLimit }),
        ...(options?.nonce && { nonce: options.nonce }),
        ...(options?.payer && { payer: options.payer }),
        ...(options?.payee && { payee: options.payee }),
      };
      this.transaction.header = {
        ...this.transaction.header,
        ...header,
      };
    }
    this.transaction = await Transaction.prepareTransaction(
      this.transaction,
      this.provider,
      this.signer?.getAddress()
    );
    return this.transaction;
  }

  /**
   * Update the rc limit with a new value and update the
   * transaction ID accordingly. The signatures will be removed
   * if the transaction ID changed
   */
  adjustRcLimit(newRcLimit: string | number): void {
    if (!this.transaction.header)
      throw new Error("transaction header not defined");
    this.transaction.header.rc_limit = newRcLimit;
    const newTxId = Transaction.computeTransactionId(this.transaction.header);
    if (this.transaction.id !== newTxId) {
      this.transaction.signatures = [];
    }
    this.transaction.id = newTxId;
  }

  /**
   * Function to sign the transaction
   */
  async sign(abis?: Record<string, Abi>): Promise<TransactionJson> {
    if (!this.signer) throw new Error("no signer defined");
    if (!this.transaction.id) await this.prepare();
    return this.signer.signTransaction(
      this.transaction,
      this.options.sendAbis ? abis : undefined
    );
  }

  /**
   * Function to broadcast the transaction
   */
  async send(options?: SendTransactionOptions): Promise<TransactionReceipt> {
    const opts = {
      ...this.options,
      ...options,
    };
    if (!this.transaction.id) await this.prepare();

    if (!this.transaction.signatures || !this.transaction.signatures.length) {
      if (!this.signer) {
        throw new Error("transaction without signatures and no signer defined");
      }
      const { transaction: tx, receipt } = await this.signer.sendTransaction(
        this.transaction,
        opts
      );
      this.transaction = tx;
      this.waitFunction = tx.wait;
      return receipt;
    }

    if (!this.provider) throw new Error("provider not defined");

    if (opts.beforeSend) {
      await opts.beforeSend(this.transaction, opts);
    }
    const { transaction: tx, receipt } = await this.provider.sendTransaction(
      this.transaction,
      opts.broadcast
    );
    this.transaction = tx;
    this.waitFunction = tx.wait;
    return receipt;
  }

  async wait(
    type?: "byBlock" | "byTransactionId",
    timeout?: number
  ): Promise<{
    blockId: string;
    blockNumber?: number;
  }> {
    if (!this.waitFunction) throw new Error("no wait function defined");
    return this.waitFunction(type, timeout);
  }
}
