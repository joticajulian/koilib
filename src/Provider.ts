import multibase from "multibase";
import { EncodedOperation } from "./Contract";
import { Transaction } from "./Signer";

export class Provider {
  public url: string;

  constructor(url: string) {
    this.url = url;
  }

  async call(method: string, params: unknown) {
    const response = await fetch(this.url, {
      method: "POST",
      body: JSON.stringify({
        id: Math.round(Math.random() * 1000),
        jsonrpc: "2.0",
        method,
        params,
      }),
    });
    const json = await response.json();
    if (json.error && json.error.message) throw new Error(json.error.message);
    return json.result;
  }

  async getNonce(address: string) {
    const bufferAddress = new TextEncoder().encode(address);
    const encBase64 = new TextDecoder().decode(
      multibase.encode("M", bufferAddress)
    );
    const result = await this.call("chain.get_account_nonce", {
      account: encBase64,
    });
    return Number(result.nonce);
  }

  async sendTransaction(transaction: Transaction) {
    return this.call("chain.submit_transaction", { transaction });
  }

  async readContract(operation: EncodedOperation): Promise<{
    result: string;
    logs: string;
  }> {
    return this.call("chain.read_contract", operation);
  }
}
