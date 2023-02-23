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

  constructor(c: {
    signer?: Signer;
    provider?: Provider;
    options?: TransactionOptions;
  }) {
    this.signer = c.signer;
    this.provider = c.provider;
    this.options = {
      broadcast: true,
      sendAbis: true,
      ...c.options,
    };
    this.transaction = {
      header: {
        ...(c.options?.chainId && { chain_id: c.options.chainId }),
        ...(c.options?.rcLimit && { rc_limit: c.options.rcLimit }),
        ...(c.options?.nonce && { nonce: c.options.nonce }),
        ...(c.options?.payer && { payer: c.options.payer }),
        ...(c.options?.payee && { payee: c.options.payee }),
      },
      operations: [],
    };
  }

  /**
   * Function to push an operation to the transaction. It can be created
   * in several ways. Examples:
   * 
   * @example
   * ```ts
   * 
   * ```
   * 
   */
  async pushOperation(
    input:
      | OperationJson
      | { operation: OperationJson }
      | Contract
      | Contract["functions"],
    functionName?: string,
    args?: unknown
  ): Promise<void> {
    let operation: OperationJson;
    if (input instanceof Contract) {
      if (!functionName) throw new Error("function name not defined");
      const result = await input.functions[functionName](args, {
        onlyOperation: true,
      });
      operation = result.operation;
    } else if (typeof input === "function") {
      if (!functionName) throw new Error("function name not defined");
      const result = await (input as Contract["functions"])[functionName](
        args,
        { onlyOperation: true }
      );
      operation = result.operation;
    } else if ((input as { operation: OperationJson }).operation) {
      operation = (input as { operation: OperationJson }).operation;
    } else {
      operation = input as OperationJson;
    }

    if (!this.transaction.operations) this.transaction.operations = [];
    this.transaction.operations.push(operation);
  }

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
        header,
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

  async sign(abis?: Record<string, Abi>): Promise<TransactionJson> {
    if (!this.signer) throw new Error("no signer defined");
    return this.signer.signTransaction(
      this.transaction,
      this.options.sendAbis ? abis : undefined
    );
  }

  async send(options?: SendTransactionOptions): Promise<TransactionReceipt> {
    const opts = {
      ...this.options,
      options,
    };

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
      this.transaction = await this.sign(opts.sendAbis ? opts.abis : undefined);
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
