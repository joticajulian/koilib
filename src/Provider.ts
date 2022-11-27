import fetch from "cross-fetch";
import {
  BlockJson,
  TransactionJson,
  CallContractOperationJson,
  TransactionReceipt,
  TransactionJsonWait,
} from "./interface";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { koinos } from "./protoModules/protocol-proto.js";
import { decodeBase64url, encodeBase64url } from "./utils";

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

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
    this.onError = () => true;
  }

  /**
   * Function to make jsonrpc requests to the RPC node
   * @param method - jsonrpc method
   * @param params - jsonrpc params
   * @returns Result of jsonrpc response
   */
  async call<T = unknown>(method: string, params: unknown): Promise<T> {
    /* eslint-disable no-await-in-loop */
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const body = {
          id: Math.round(Math.random() * 1000),
          jsonrpc: "2.0",
          method,
          params,
        };

        const url = this.rpcNodes[this.currentNodeId];

        const response = await fetch(url, {
          method: "POST",
          body: JSON.stringify(body),
        });
        const json = (await response.json()) as {
          result: T;
          error?: {
            message?: string;
            data?: string;
          };
        };

        if (json.result !== undefined) return json.result;

        if (!json.error) throw new Error("undefined error");
        const { message, data } = json.error;
        if (!data) throw new Error(message);
        let dataJson: Record<string, unknown>;
        try {
          dataJson = JSON.parse(data);
        } catch (e) {
          dataJson = { data };
        }
        throw new Error(
          JSON.stringify({
            ...(message && { error: message }),
            ...dataJson,
          })
        );
      } catch (e) {
        const currentNode = this.rpcNodes[this.currentNodeId];
        this.currentNodeId = (this.currentNodeId + 1) % this.rpcNodes.length;
        const newNode = this.rpcNodes[this.currentNodeId];
        const abort = this.onError(e as Error, currentNode, newNode);
        if (abort) throw e;
      }
    }
  }

  /**
   * Function to call "chain.get_account_nonce" to return the number of
   * transactions for a particular account. If you are creating a new
   * transaction consider using [[Provider.getNextNonce]].
   * @param account - account address
   * @param deserialize - If set true it will deserialize the nonce
   * and return it as number (default). If set false it will return
   * the nonce encoded as received from the RPC.
   * @returns Nonce
   */
  async getNonce(
    account: string,
    deserialize = true
  ): Promise<number | string> {
    const { nonce: nonceBase64url } = await this.call<{ nonce: string }>(
      "chain.get_account_nonce",
      { account }
    );

    if (!deserialize) {
      return nonceBase64url;
    }

    const valueBuffer = decodeBase64url(nonceBase64url);
    const message = koinos.chain.value_type.decode(valueBuffer);
    const object = koinos.chain.value_type.toObject(message, {
      longs: String,
      defaults: true,
    }) as { uint64_value: string };
    // todo: consider the case where nonce is greater than max safe integer
    return Number(object.uint64_value);
  }

  /**
   * Function to call "chain.get_account_nonce" (number of
   * transactions for a particular account) and return the next nonce.
   * This call is used when creating new transactions. The result is
   * encoded in base64url
   * @param account - account address
   * @returns Nonce
   */
  async getNextNonce(account: string): Promise<string> {
    const oldNonce = (await this.getNonce(account)) as number;
    const message = koinos.chain.value_type.create({
      // todo: consider using bigint for big nonces
      uint64_value: String(oldNonce + 1),
    });
    const nonceEncoded = koinos.chain.value_type
      .encode(message)
      .finish() as Uint8Array;

    return encodeBase64url(nonceEncoded);
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
      transaction: TransactionJson;
      containing_blocks: string[];
    }[];
  }> {
    return this.call<{
      transactions: {
        transaction: TransactionJson;
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
      block_ids: blockIds,
      return_block: true,
      return_receipt: false,
    });
  }

  /**
   * Function to get info from the head block in the blockchain
   */
  async getHeadInfo(): Promise<{
    head_block_time: string;
    head_topology: {
      id: string;
      height: string;
      previous: string;
    };
    head_state_merkle_root: string;
    last_irreversible_block: string;
  }> {
    return this.call<{
      head_block_time: string;
      head_topology: {
        id: string;
        height: string;
        previous: string;
      };
      head_state_merkle_root: string;
      last_irreversible_block: string;
    }>("chain.get_head_info", {});
  }

  /**
   * Function to get the chain
   */
  async getChainId(): Promise<string> {
    const { chain_id: chainId } = await this.call<{ chain_id: string }>(
      "chain.get_chain_id",
      {}
    );
    return chainId;
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
      block_height: string;
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
          block_height: string;
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
    block_height: string;
    block: BlockJson;
    block_receipt: {
      [x: string]: unknown;
    };
  }> {
    return (await this.getBlocks(height, 1))[0];
  }

  /**
   * Function to wait for a transaction to be mined.
   * @param txId - transaction id
   * @param type - Type must be "byBlock" (default) or "byTransactionId".
   * _byBlock_ will query the blockchain to get blocks and search for the
   * transaction there. _byTransactionId_ will query the "transaction store"
   * microservice to search the transaction by its id. If non of them is
   * specified the function will use "byBlock" (as "byTransactionId"
   * requires the transaction store, which is an optional microservice).
   *
   * When _byBlock_ is used it returns the block number.
   *
   * When _byTransactionId_ is used it returns the block id.
   *
   * @param timeout - Timeout in milliseconds. By default it is 15000
   * @example
   * ```ts
   * const blockNumber = await provider.wait(txId);
   * // const blockNumber = await provider.wait(txId, "byBlock", 15000);
   * // const blockId = await provider.wait(txId, "byTransactionId", 15000);
   * console.log("Transaction mined")
   * ```
   */
  async wait(
    txId: string,
    type: "byTransactionId" | "byBlock" = "byBlock",
    timeout = 15000
  ): Promise<{
    blockId: string;
    blockNumber?: number;
  }> {
    const iniTime = Date.now();
    if (type === "byTransactionId") {
      while (Date.now() < iniTime + timeout) {
        await sleep(1000);
        const { transactions } = await this.getTransactionsById([txId]);
        if (
          transactions &&
          transactions[0] &&
          transactions[0].containing_blocks
        )
          return {
            blockId: transactions[0].containing_blocks[0],
          };
      }
      throw new Error(`Transaction not mined after ${timeout} ms`);
    }

    // byBlock
    const findTxInBlocks = async (
      ini: number,
      numBlocks: number,
      idRef: string
    ): Promise<[number, string, string]> => {
      const blocks = await this.getBlocks(ini, numBlocks, idRef);
      let bNum = 0;
      let bId = "";
      blocks.forEach((block) => {
        if (
          !block ||
          !block.block ||
          !block.block_id ||
          !block.block.transactions
        )
          return;
        const tx = block.block.transactions.find((t) => t.id === txId);
        if (tx) {
          bNum = Number(block.block_height);
          bId = block.block_id;
        }
      });
      const lastId = blocks[blocks.length - 1].block_id;
      return [bNum, bId, lastId];
    };

    let blockNumber = 0;
    let iniBlock = 0;
    let previousId = "";

    while (Date.now() < iniTime + timeout) {
      await sleep(1000);
      const { head_topology: headTopology } = await this.getHeadInfo();
      if (blockNumber === 0) {
        blockNumber = Number(headTopology.height);
        iniBlock = blockNumber;
      }
      if (
        Number(headTopology.height) === blockNumber - 1 &&
        previousId &&
        previousId !== headTopology.id
      ) {
        const [bNum, bId, lastId] = await findTxInBlocks(
          iniBlock,
          Number(headTopology.height) - iniBlock + 1,
          headTopology.id
        );
        if (bNum)
          return {
            blockId: bId,
            blockNumber: bNum,
          };
        previousId = lastId;
        blockNumber = Number(headTopology.height) + 1;
      }
      // eslint-disable-next-line no-continue
      if (blockNumber > Number(headTopology.height)) continue;
      const [bNum, bId, lastId] = await findTxInBlocks(
        blockNumber,
        1,
        headTopology.id
      );
      if (bNum)
        return {
          blockId: bId,
          blockNumber: bNum,
        };
      if (!previousId) previousId = lastId;
      blockNumber += 1;
    }
    throw new Error(
      `Transaction not mined after ${timeout} ms. Blocks checked from ${iniBlock} to ${blockNumber}`
    );
  }

  /**
   * Function to call "chain.submit_transaction" to send a signed
   * transaction to the blockchain.
   *
   * It also has the option to not broadcast the transaction (to not
   * include the transaction the mempool), which is useful if you
   * want to test the interaction with a contract and check the
   * possible events triggered.
   * @param transaction - Transaction
   * @param broadcast - Option to broadcast the transaction to the
   * whole network. By default it is true.
   * @returns It returns the receipt received from the RPC node
   * and the transaction with the arrow function "wait" (see [[wait]])
   */
  async sendTransaction(
    transaction: TransactionJson | TransactionJsonWait,
    broadcast = true
  ): Promise<{
    receipt: TransactionReceipt;
    transaction: TransactionJsonWait;
  }> {
    const response = await this.call<{ receipt: TransactionReceipt }>(
      "chain.submit_transaction",
      { transaction, broadcast }
    );
    (transaction as TransactionJsonWait).wait = async (
      type: "byTransactionId" | "byBlock" = "byBlock",
      timeout = 15000
    ) => {
      return this.wait(transaction.id as string, type, timeout);
    };
    return { ...response, transaction: transaction as TransactionJsonWait };
  }

  /**
   * Function to call "chain.submit_block" to send a signed
   * block to the blockchain.
   */
  async submitBlock(block: BlockJson): Promise<Record<string, never>> {
    return this.call("chain.submit_block", { block });
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
