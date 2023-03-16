import { Contract } from "./Contract";
import { Provider } from "./Provider";
import { Signer } from "./Signer";
import {
  Abi,
  OperationJson,
  SendTransactionOptions,
  TransactionJson,
  TransactionOptions,
  TransactionReceipt,
  WaitFunction,
} from "./interface";

export class Transaction {
  /**
   * Signer interacting with the smart contracts
   */
  signer?: Signer;

  /**
   * Provider to connect with the blockchain
   */
  provider?: Provider;

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
    signer?: Signer;
    provider?: Provider;
    options?: TransactionOptions;
  }) {
    this.signer = c?.signer;
    this.provider = c?.provider;
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
    };
  }

  /**
   * Function to push an operation to the transaction. It can be created
   * in several ways. Example:
   *
   * @example
   * ```ts
   * const koin = new Contract({
   *   id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
   *   abi: utils.tokenAbi,
   * }).functions;
   * const signer = Signer.fromSeed("my seed");
   * const provider = new Provider(["https://api.koinos.io"]);
   * signer.provider = provider;
   * const tx = new Transaction({ signer });
   *
   * // method 1
   * await tx.pushOperation(koin.transfer, {
   *   from: "1NRYHBYr9qxYQAeVqfdSvyjJemRQ4qD3Mt",
   *   to: "13UdKjYuzfBYbB6bGLQkUN9DJRFPCmG1mU",
   *   value: "1000",
   * });
   *
   * // method 2
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
   * // method 3
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
   * // method 4
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

  /**
   * Functon to prepare the transaction (set headers, merkle
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

    if (this.signer) {
      this.transaction = await this.signer.prepareTransaction(this.transaction);
    } else {
      if (!this.transaction.header || !this.transaction.header.payer) {
        throw new Error("no payer defined");
      }
      const signer = Signer.fromSeed("0");
      signer.provider = this.provider;
      this.transaction = await signer.prepareTransaction(this.transaction);
    }
    return this.transaction;
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
      options,
    };
    if (!this.transaction.id) await this.prepare();

    if (this.signer && this.signer.provider) {
      const { transaction: tx, receipt } = await this.signer.sendTransaction(
        this.transaction,
        opts
      );
      this.transaction = tx;
      this.waitFunction = tx.wait;
      return receipt;
    }

    if (!this.provider) throw new Error("provider not defined");
    if (!this.transaction.signatures || !this.transaction.signatures.length) {
      throw new Error("transaction without signatures and no signer defined");
    }

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
