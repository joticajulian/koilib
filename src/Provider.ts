import multibase from "multibase";
import axios from "axios";
import { EncodedOperation } from "./Contract";
import { Transaction } from "./Signer";

export class Provider {
  public url: string;

  constructor(url: string) {
    this.url = url;
  }

  async call<T = unknown>(method: string, params: unknown) {
    const data = {
      id: Math.round(Math.random() * 1000),
      jsonrpc: "2.0",
      method,
      params,
    };

    // TODO: search conditional to enable fetch for Browser
    /* const response = await fetch(this.url, {
      method: "POST",
      body: JSON.stringify(data),
    });
    const json = await response.json();
    if (json.error && json.error.message) throw new Error(json.error.message);
    return json.result; */

    const response = await axios.post<{
      result?: T;
      error?: { message: string };
    }>(this.url, data, { validateStatus: () => true });
    if (response.data.error) throw new Error(response.data.error.message);
    return response.data.result as T;
  }

  async getNonce(address: string) {
    const bufferAddress = new TextEncoder().encode(address);
    const encBase64 = new TextDecoder().decode(
      multibase.encode("M", bufferAddress)
    );
    const result = await this.call<{ nonce: string }>(
      "chain.get_account_nonce",
      {
        account: encBase64,
      }
    );
    return Number(result.nonce);
  }

  async sendTransaction(transaction: Transaction) {
    return this.call("chain.submit_transaction", { transaction });
  }

  async readContract(operation: EncodedOperation["value"]): Promise<{
    result: string;
    logs: string;
  }> {
    return this.call("chain.read_contract", operation);
  }
}
