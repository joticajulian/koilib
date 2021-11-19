import axios, { AxiosResponse } from "axios";
import {
  BlockJson,
  TransactionJson,
  CallContractOperationJson,
  SendTransactionResponse,
} from "./interface";

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Class to connect with the RPC node
 */
export class Provider {
  /**
   * Array of URLs of RPC nodes
   */
  public rpcNodes: string[];

  /**
   * Function triggered when a node is down. Returns a
   * boolean determining if the call should be aborted.
   *
   * @example
   * ```ts
   * const provider = new Provider([
   *   "http://45.56.104.152:8080",
   *   "http://159.203.119.0:8080"
   * ]);
   *
   * provider.onError = (error, node, newNode) => {
   *   console.log(`Error from node ${node}: ${error.message}`);
   *   console.log(`changing node to ${newNode}`);
   *   const abort = false;
   *   return abort;
   * }
   * ```
   */
  public onError: (
    error: Error,

    /** node that threw the error */
    currentNode: string,

    /** node used for the next iteration */
    newNode: string
  ) => boolean;

  /**
   * Index of current node in rpcNodes
   */
  public currentNodeId: number;

  /**
   *
   * @param rpcNodes - URL of the rpc node, or array of urls
   * to switch between them when someone is down
   * @example
   * ```ts
   * const provider = new Provider([
   *   "http://45.56.104.152:8080",
   *   "http://159.203.119.0:8080"
   * ]);
   * ```
   */
  constructor(rpcNodes: string | string[]) {
    if (Array.isArray(rpcNodes)) this.rpcNodes = rpcNodes;
    else this.rpcNodes = [rpcNodes];
    this.currentNodeId = 0;
    this.onError = () => false;
  }

  /**
   * Function to make jsonrpc requests to the RPC node
   * @param method - jsonrpc method
   * @param params - jsonrpc params
   * @returns Result of jsonrpc response
   */
  async call<T = unknown>(method: string, params: unknown): Promise<T> {
    let response: AxiosResponse<{
      result?: T;
      error?: { message: string };
    }> = {
      data: {},
      status: 0,
      statusText: "",
      headers: {},
      config: {},
    };

    let success = false;

    /* eslint-disable no-await-in-loop */
    while (!success) {
      try {
        const data = {
          id: Math.round(Math.random() * 1000),
          jsonrpc: "2.0",
          method,
          params,
        };

        const url = this.rpcNodes[this.currentNodeId];

        // TODO: search conditional to enable fetch for Browser
        /* const response = await fetch(url, {
          method: "POST",
          body: JSON.stringify(data),
        });
        const json = await response.json();
        if (json.error && json.error.message) throw new Error(json.error.message);
        return json.result; */

        response = await axios.post<{
          result?: T;
          error?: { message: string };
        }>(url, data, { validateStatus: (s) => s < 400 });
        success = true;
      } catch (e) {
        const currentNode = this.rpcNodes[this.currentNodeId];
        this.currentNodeId = (this.currentNodeId + 1) % this.rpcNodes.length;
        const newNode = this.rpcNodes[this.currentNodeId];
        const abort = this.onError(e as Error, currentNode, newNode);
        if (abort) throw e;
      }
    }
    if (response.data.error) throw new Error(response.data.error.message);
    return response.data.result as T;
  }

  /**
   * Function to call "chain.get_account_nonce" to return the number of
   * transactions for a particular account. This call is used
   * when creating new transactions.
   * @param account - account address
   * @returns Nonce
   */
  async getNonce(account: string): Promise<number> {
    const { nonce } = await this.call<{ nonce: string }>(
      "chain.get_account_nonce",
      { account }
    );
    if (!nonce) return 0;
    return Number(nonce);
  }

  async getAccountRc(account: string): Promise<string> {
    const { rc } = await this.call<{ rc: string }>("chain.get_account_rc", {
      account,
    });
    if (!rc) return "0";
    return rc;
  }

  /**
   * Get transactions by id and their corresponding block ids
   */
  async getTransactionsById(transactionIds: string[]): Promise<{
    transactions: {
      transaction: TransactionJson[];
      containing_blocks: string[];
    }[];
  }> {
    return this.call<{
      transactions: {
        transaction: TransactionJson[];
        containing_blocks: string[];
      }[];
    }>("transaction_store.get_transactions_by_id", {
      transaction_ids: transactionIds,
    });
  }

  async getBlocksById(blockIds: string[]): Promise<{
    block_items: {
      block_id: string;
      block_height: string;
      block: BlockJson;
    }[];
  }> {
    return this.call("block_store.get_blocks_by_id", {
      block_id: blockIds,
      return_block: true,
      return_receipt: false,
    });
  }

  /**
   * Function to get info from the head block in the blockchain
   */
  async getHeadInfo(): Promise<{
    head_topology: {
      id: string;
      height: string;
      previous: string;
    };
    last_irreversible_height: string;
  }> {
    return this.call<{
      head_topology: {
        id: string;
        height: string;
        previous: string;
      };
      last_irreversible_height: string;
    }>("chain.get_head_info", {});
  }

  /**
   * Function to get consecutive blocks in descending order
   * @param height - Starting block height
   * @param numBlocks - Number of blocks to fetch
   * @param idRef - Block ID reference to speed up searching blocks.
   * This ID must be from a greater block height. By default it
   * gets the ID from the block head.
   */
  async getBlocks(
    height: number,
    numBlocks = 1,
    idRef?: string
  ): Promise<
    {
      block_id: string;
      block_height: number;
      block: BlockJson;
      block_receipt: {
        [x: string]: unknown;
      };
    }[]
  > {
    let blockIdRef = idRef;
    if (!blockIdRef) {
      const head = await this.getHeadInfo();
      blockIdRef = head.head_topology.id;
    }
    return (
      await this.call<{
        block_items: {
          block_id: string;
          block_height: number;
          block: BlockJson;
          block_receipt: {
            [x: string]: unknown;
          };
        }[];
      }>("block_store.get_blocks_by_height", {
        head_block_id: blockIdRef,
        ancestor_start_height: height,
        num_blocks: numBlocks,
        return_block: true,
        return_receipt: false,
      })
    ).block_items;
  }

  /**
   * Function to get a block by its height
   */
  async getBlock(height: number): Promise<{
    block_id: string;
    block_height: number;
    block: BlockJson;
    block_receipt: {
      [x: string]: unknown;
    };
  }> {
    return (await this.getBlocks(height, 1))[0];
  }

  /**
   * Function to call "chain.submit_transaction" to send a signed
   * transaction to the blockchain. It returns an object with the async
   * function "wait", which can be called to wait for the
   * transaction to be mined.
   * @param transaction - Signed transaction
   * @example
   * ```ts
   * const { transactionResponse } = await provider.sendTransaction({
   *   id: "1220...",
   *   active: "...",
   *   signatureData: "...",
   * });
   * console.log("Transaction submitted to the mempool");
   * // wait to be mined
   * const blockId = await transactionResponse.wait();
   * console.log("Transaction mined")
   * ```
   */
  async sendTransaction(
    transaction: TransactionJson
  ): Promise<SendTransactionResponse> {
    await this.call("chain.submit_transaction", { transaction });
    const startTime = Date.now() + 10000;
    return {
      wait: async () => {
        // sleep some seconds before it gets mined
        await sleep(startTime - Date.now() - 1000);
        for (let i = 0; i < 30; i += 1) {
          await sleep(1000);
          const { transactions } = await this.getTransactionsById([
            transaction.id as string,
          ]);
          if (
            transactions &&
            transactions[0] &&
            transactions[0].containing_blocks
          )
            return transactions[0].containing_blocks[0];
        }
        throw new Error(`Transaction not mined after 40 seconds`);
      },
    };
  }

  /**
   * Function to call "chain.read_contract" to read a contract.
   * This function is used by [[Contract]] class when read methods
   * are invoked.
   */
  async readContract(operation: CallContractOperationJson): Promise<{
    result: string;
    logs: string;
  }> {
    return this.call("chain.read_contract", operation);
  }
}

export default Provider;
