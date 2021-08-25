import Contract, { DecodedOperation, EncodedOperation } from "./Contract";
import { Provider } from "./Provider";
import Signer, { Transaction } from "./Signer";

export class Wallet {
  public signer?: Signer;
  public contract?: Contract;
  public provider?: Provider;

  constructor(
    opts: {
      signer?: Signer;
      contract?: Contract;
      provider?: Provider;
    } = {
      signer: undefined,
      contract: undefined,
      provider: undefined,
    }
  ) {
    this.signer = opts.signer;
    this.contract = opts.contract;
    this.provider = opts.provider;
  }

  async newTransaction(
    opts: {
      resource_limit?: number | bigint | string;
      operations?: EncodedOperation[];
      getNonce?: boolean;
    } = {
      resource_limit: 1000000,
      operations: [],
      getNonce: true,
    }
  ): Promise<Transaction> {
    const nonce = opts.getNonce ? await this.getNonce(this.getAddress()) : 0;
    const resource_limit = opts.resource_limit ? opts.resource_limit : 1000000;
    const operations = opts.operations ? opts.operations : [];

    return {
      active_data: {
        resource_limit,
        nonce,
        operations,
      },
    };
  }

  // Signer

  getAddress() {
    if (!this.signer) throw new Error("Signer is undefined");
    return this.signer.getAddress();
  }

  async signTransaction(tx: Transaction) {
    if (!this.signer) throw new Error("Signer is undefined");
    return this.signer.signTransaction(tx);
  }

  // Contract

  encodeOperation(op: DecodedOperation): EncodedOperation {
    if (!this.contract) throw new Error("Contract is undefined");
    return this.contract.encodeOperation(op);
  }

  decodeOperation(op: EncodedOperation): DecodedOperation {
    if (!this.contract) throw new Error("Contract is undefined");
    return this.contract.decodeOperation(op);
  }

  decodeResult(result: string, opName: string): unknown {
    if (!this.contract) throw new Error("Contract is undefined");
    return this.contract.decodeResult(result, opName);
  }

  // Provider

  async call(method: string, params: unknown) {
    if (!this.provider) throw new Error("Provider is undefined");
    return this.provider.call(method, params);
  }

  async getNonce(address: string) {
    if (!this.provider) throw new Error("Provider is undefined");
    return this.provider.getNonce(address);
  }

  async sendTransaction(transaction: Transaction) {
    if (!this.provider) throw new Error("Provider is undefined");
    return this.provider.sendTransaction(transaction);
  }

  /* async readContract(operation: EncodedOperation["value"]): Promise<{
    result: string;
    logs: string;
  }> {
    if (!this.provider) throw new Error("Provider is undefined");
    return this.provider.readContract(operation);
  } */

  // Provider + Contract

  async readContract(operation: DecodedOperation): Promise<unknown> {
    if (!this.provider) throw new Error("Provider is undefined");
    const op = this.encodeOperation(operation);
    const { result } = await this.provider.readContract(op);
    return this.decodeResult(result, operation.name);
  }
}

export default Wallet;
