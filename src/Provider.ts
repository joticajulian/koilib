import multibase from "multibase";
import axios from "axios";
import { EncodedOperation } from "./Contract";
import { Transaction } from "./Signer";

/**
 * Provider class
 */
export class Provider {
  /**
   * URL of the RPC node
   */
  public url: string;

  /**
   *
   * @param url url of rpc node
   * @example
   * ```ts
   * const provider = new Provider("http://45.56.104.152:8080");
   * ```
   */
  constructor(url: string) {
    this.url = url;
  }

  /**
   * Function to call the RPC node
   * @param method - jsonrpc method
   * @param params - jsonrpc params
   * @returns Result of jsonrpc response
   */
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

  /**
   * Function to call "chain.get_account_nonce" to return the number of
   * transactions for a particular account. This call is used
   * when creating new transactions.
   * @param address - account address
   * @returns Nonce
   */
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

  /**
   * Function to call "chain.submit_transaction" to send a signed
   * transaction to the blockchain
   * @param transaction Signed transaction
   * @returns
   */
  async sendTransaction(transaction: Transaction) {
    return this.call("chain.submit_transaction", { transaction });
  }

  /**
   * Function to call "chain.read_contract" to read a contract
   * @param operation Encoded operation
   * @returns
   */
  async readContract(operation: EncodedOperation["value"]): Promise<{
    result: string;
    logs: string;
  }> {
    return this.call("chain.read_contract", operation);
  }
}
