import fetch from "cross-fetch";
import {
  BlockJson,
  TransactionJson,
  CallContractOperationJson,
  TransactionReceipt,
  TransactionJsonWait,
  BlockTopology,
  GetBlockOptions,
} from "./interface";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { koinos } from "./protoModules/protocol-proto.js";
import { decodeBase64url, encodeBase64url } from "./utils";
import { Serializer } from "./Serializer";

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
   * const provider = new Provider(["https://api.koinos.io"]);
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
   *   "https://api.koinos.io",
   *   "https://api.koinosblocks.com"
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
   *
   * To know the full list of possible calls check the services
   * listed in the [rpc folder of koinos-proto](https://github.com/koinos/koinos-proto/tree/master/koinos/rpc)
   * and the corresponding proto files.
   *
   * @example
   * Let's take "account_history" as an example. Go to [account_history_rpc.proto](https://github.com/koinos/koinos-proto/blob/master/koinos/rpc/account_history/account_history_rpc.proto).
   * The `account_history_request` message has 1 single method: `get_account_history`.
   *
   * Now search the message `get_account_history_request`. This message is telling us
   * the expected fields in the body of the call:
   *
   * ```ts
   * message get_account_history_request {
   *    bytes address = 1 [(btype) = ADDRESS];
   *    optional uint64 seq_num = 2 [jstype = JS_STRING];
   *    uint64 limit = 3 [jstype = JS_STRING];
   *    bool ascending = 4;
   *    bool irreversible = 5;
   * }
   * ```
   *
   * And search the message `get_account_history_response` to see the format of the response:
   * ```ts
   * message get_account_history_response {
   *    repeated account_history_entry values = 1;
   * }
   * ```
   *
   * With this information we can now call the RPC node. It should be done in this way:
   * ```ts
   * const provider = new Provider(["https://api.koinos.io"]);
   * const result = await provider.call(
   *   "account_history.get_account_history",
   *   {
   *     address: "1z629tURV9KAK6Q5yqFDozwSHeWshxXQe",
   *     limit: 2,
   *     ascending: true,
   *     irreversible: true,
   *   }
   * );
   * console.log(result);
   *
   * // {
   * //   "values": [
   * //     {
   * //       "trx": {
   * //         "transaction": {
   * //           "id": "0x12205b566701d6afcf1f5e45b5e9f5443def75728c219f7c1e897ed0ce1ef491223c",
   * //           "header": {
   * //             "chain_id": "EiBZK_GGVP0H_fXVAM3j6EAuz3-B-l3ejxRSewi7qIBfSA==",
   * //             "rc_limit": "961224079493",
   * //             "nonce": "KAE=",
   * //             "operation_merkle_root": "EiA32K_GrZ2VsvWSrM4QZhyEmvm8ID1P6aE4vP00RnY9hg==",
   * //             "payer": "1HyzBsd7nmyUp8dyCJqJZoQRUnzifVzP18"
   * //           },
   * //           "operations": [
   * //             {
   * //               "call_contract": {
   * //                 "contract_id": "15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL",
   * //                 "entry_point": 670398154,
   * //                 "args": "ChkAukkLSXtxbRNRTBtDrdAwDI7I6Ot9GxFHEhkACsvmdCIUj89udQ1R5iLPLXzqJoHdliWrGIDC1y8="
   * //               }
   * //             }
   * //           ],
   * //           "signatures": [
   * //             "ICBdTcH6jzhDpl9ZB0ZqNcvSy8wiOokHFtkQ66Lc04K1LhXd77tqaQdMhJOAfYotg5npVmfSgyO9CwgLJmtMIjg="
   * //           ]
   * //         },
   * //         "receipt": {
   * //           "id": "0x12205b566701d6afcf1f5e45b5e9f5443def75728c219f7c1e897ed0ce1ef491223c",
   * //           "payer": "1HyzBsd7nmyUp8dyCJqJZoQRUnzifVzP18",
   * //           "max_payer_rc": "961224079493",
   * //           "rc_limit": "961224079493",
   * //           "rc_used": "3009833",
   * //           "disk_storage_used": "112",
   * //           "network_bandwidth_used": "313",
   * //           "compute_bandwidth_used": "561439",
   * //           "events": [
   * //             {
   * //               "sequence": 2,
   * //               "source": "15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL",
   * //               "name": "koinos.contracts.token.transfer_event",
   * //               "data": "ChkAukkLSXtxbRNRTBtDrdAwDI7I6Ot9GxFHEhkACsvmdCIUj89udQ1R5iLPLXzqJoHdliWrGIDC1y8=",
   * //               "impacted": [
   * //                 "1z629tURV9KAK6Q5yqFDozwSHeWshxXQe",
   * //                 "1HyzBsd7nmyUp8dyCJqJZoQRUnzifVzP18"
   * //               ]
   * //             }
   * //           ]
   * //         }
   * //       }
   * //     },
   * //     {
   * //       "seq_num": "1",
   * //       "trx": {
   * //         "transaction": {
   * //           "id": "0x1220a08183a5237e57a08e1ae539017c4253ddfbc23f9b7b6f5e263669aacd3fed47",
   * //           "header": {
   * //             "chain_id": "EiBZK_GGVP0H_fXVAM3j6EAuz3-B-l3ejxRSewi7qIBfSA==",
   * //             "rc_limit": "100000000",
   * //             "nonce": "KAE=",
   * //             "operation_merkle_root": "EiBAmutXQlPyAGctNBNhKEUUEUtwj2KQeNrdFBqpN9RWDg==",
   * //             "payer": "1z629tURV9KAK6Q5yqFDozwSHeWshxXQe"
   * //           },
   * //           "operations": [
   * //             {
   * //               "call_contract": {
   * //                 "contract_id": "15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL",
   * //                 "entry_point": 670398154,
   * //                 "args": "ChkACsvmdCIUj89udQ1R5iLPLXzqJoHdliWrEhkAukkLSXtxbRNRTBtDrdAwDI7I6Ot9GxFHGJBO"
   * //               }
   * //             }
   * //           ],
   * //           "signatures": [
   * //             "IF5FBloKjEfnqlGJRL_aPy4L36On-Q8XXzpAQagK_X-xZ6DgioBhZOhKEnhKyhaoROAgGwRuy6BsdRqya8fCHU8="
   * //           ]
   * //         },
   * //         "receipt": {
   * //           "id": "0x1220a08183a5237e57a08e1ae539017c4253ddfbc23f9b7b6f5e263669aacd3fed47",
   * //           "payer": "1z629tURV9KAK6Q5yqFDozwSHeWshxXQe",
   * //           "max_payer_rc": "100000000",
   * //           "rc_limit": "100000000",
   * //           "rc_used": "2657385",
   * //           "disk_storage_used": "35",
   * //           "network_bandwidth_used": "309",
   * //           "compute_bandwidth_used": "566375",
   * //           "events": [
   * //             {
   * //               "sequence": 2,
   * //               "source": "15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL",
   * //               "name": "koinos.contracts.token.transfer_event",
   * //               "data": "ChkACsvmdCIUj89udQ1R5iLPLXzqJoHdliWrEhkAukkLSXtxbRNRTBtDrdAwDI7I6Ot9GxFHGJBO",
   * //               "impacted": [
   * //                 "1HyzBsd7nmyUp8dyCJqJZoQRUnzifVzP18",
   * //                 "1z629tURV9KAK6Q5yqFDozwSHeWshxXQe"
   * //               ]
   * //             }
   * //           ]
   * //         }
   * //       }
   * //     }
   * //   ]
   * // }
   * ```
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

  async getBlocksById(
    blockIds: string[],
    opts?: GetBlockOptions
  ): Promise<{
    block_items: {
      block_id: string;
      block_height: string;
      block: BlockJson;
    }[];
  }> {
    return this.call("block_store.get_blocks_by_id", {
      block_ids: blockIds,
      return_block:
        opts && opts.returnBlock !== undefined ? opts.returnBlock : true,
      return_receipt:
        opts && opts.returnReceipt !== undefined ? opts.returnReceipt : true,
    });
  }

  /**
   * Function to get info from the head block in the blockchain
   *
   * @example
   * ```ts
   * const provider = new Provider("https://api.koinos.io");
   * const headInfo = await provider.getHeadInfo();
   * console.log(headInfo);
   *
   * // {
   * //   head_topology: {
   * //     id: '0x12209f7c9b4d695eefd6f87465d490654e495fe25a3d7d2e1eb80658acdc49bad962',
   * //     height: '14957951',
   * //     previous: '0x1220bc3b94e3a2adc3ca09d61a4418df1f4acfa78a69686f592877c194ea50642cd2'
   * //   },
   * //   last_irreversible_block: '14957891',
   * //   head_state_merkle_root: 'EiCriqXooNUXBG23EUKLz2qq3h9ZAC8w1W7w185YQ9MzIA==',
   * //   head_block_time: '1713874497290'
   * // }
   * ```
   */
  async getHeadInfo(): Promise<{
    head_block_time: string;
    head_topology: BlockTopology;
    head_state_merkle_root: string;
    last_irreversible_block: string;
  }> {
    return this.call<{
      head_block_time: string;
      head_topology: BlockTopology;
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
    idRef?: string,
    opts?: GetBlockOptions
  ): Promise<
    {
      block_id: string;
      block_height: string;
      block: BlockJson;
      receipt: {
        transaction_receipts: unknown[];
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
          receipt: {
            transaction_receipts: unknown[];
            [x: string]: unknown;
          };
        }[];
      }>("block_store.get_blocks_by_height", {
        head_block_id: blockIdRef,
        ancestor_start_height: height,
        num_blocks: numBlocks,
        return_block:
          opts && opts.returnBlock !== undefined ? opts.returnBlock : true,
        return_receipt:
          opts && opts.returnReceipt !== undefined ? opts.returnReceipt : true,
      })
    ).block_items;
  }

  /**
   * Function to get a block by its height
   *
   * @example
   * ```ts
   * const provider = new Provider("https://api.koinos.io");
   * const block = await provider.getBlock(14951433);
   * console.log(block);
   *
   * // {
   * //   block_id: '0x1220d5e848eb0f69c590c24cbea4391f89a1055f540bc265c60f6b13c4cc0055ec36',
   * //   block_height: '14951433',
   * //   block: {
   * //     id: '0x1220d5e848eb0f69c590c24cbea4391f89a1055f540bc265c60f6b13c4cc0055ec36',
   * //     header: {
   * //       previous: '0x1220a3c4cbc57ccee4d02b4a1849a9e504122ee93b904deff711d926def2ea2cc878',
   * //       height: '14951433',
   * //       timestamp: '1713854518430',
   * //       previous_state_merkle_root: 'EiCPcnYosMvEBYeCcJrdIJJG0mp4TJ796UGxa0NY6EvzbQ==',
   * //       transaction_merkle_root: 'EiBGPKwttckB7c_BafwnHHmHTBa9S1vKBKauj_yLVNb0tg==',
   * //       signer: '1EPZaqve43k9Jq5mNeT2ydCjUiytTTU4U',
   * //       approved_proposals: [Array]
   * //     },
   * //     transactions: [ [Object] ],
   * //     signature: 'ClEDnHKX1F-pQVbFhmz2qnrwGfP-RbEfTdRFUrvmhmqMeoejtmm2Q0yIPbD5kN5xpIEb
   * //                 8vVwsIJ3lTrgFz2E8w0Paxkgv1E_gMaYNq5UUqtHnl0SIhIgAAbuPHmfMKh9R0Yi5y1D
   * //                 TpjjdN0DYKaIUseXzLiLg_QaQR9jRinZf0g_qo2_4wOx9gDBunIij0r5CycHrNMsuT_V
   * //                 _UvrJOYuwj7aUCA-qnF2tCBQoNQZ3ww7WvKHrMdChxxy'
   * //   },
   * //   receipt: {
   * //     id: '0x1220d5e848eb0f69c590c24cbea4391f89a1055f540bc265c60f6b13c4cc0055ec36',
   * //     height: '14951433',
   * //     disk_storage_used: '35',
   * //     network_bandwidth_used: '760',
   * //     compute_bandwidth_used: '5253506',
   * //     events: [ [Object], [Object] ],
   * //     transaction_receipts: [ [Object] ],
   * //     disk_storage_charged: '35',
   * //     network_bandwidth_charged: '760',
   * //     compute_bandwidth_charged: '5180427',
   * //     state_delta_entries: [
   * //       [Object], [Object],
   * //       [Object], [Object],
   * //       [Object], [Object],
   * //       [Object], [Object],
   * //       [Object], [Object]
   * //     ]
   * //   }
   * // }
   * ```
   *
   * Use the options to get less information. This helps to reduce
   * the bandwidth of the call.
   *
   * @example
   * ```ts
   * const provider = new Provider("https://api.koinos.io");
   * const block = await provider.getBlock(14951433, {
   *   returnReceipt: false,
   *   returnBlock: false
   * });
   * console.log(block);
   *
   * // {
   * //   block_id: '0x1220d5e848eb0f69c590c24cbea4391f89a1055f540bc265c60f6b13c4cc0055ec36',
   * //   block_height: '14951433'
   * // }
   * ```
   */
  async getBlock(
    height: number,
    opts?: GetBlockOptions
  ): Promise<{
    block_id: string;
    block_height: string;
    block: BlockJson;
    receipt: {
      transaction_receipts: unknown[];
      [x: string]: unknown;
    };
  }> {
    return (await this.getBlocks(height, 1, undefined, opts))[0];
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
    let response: { receipt: TransactionReceipt };
    try {
      response = await this.call<{ receipt: TransactionReceipt }>(
        "chain.submit_transaction",
        { transaction, broadcast }
      );
    } catch (error) {
      if (
        !(error as Error).message.includes(
          "rpc failed, context deadline exceeded"
        )
      ) {
        throw error;
      }
      response = {
        receipt: {
          id: transaction.id!,
          payer: transaction.header!.payer!,
          max_payer_rc: "",
          rc_limit: transaction.header!.rc_limit!.toString(),
          rc_used: "",
          disk_storage_used: "",
          network_bandwidth_used: "",
          compute_bandwidth_used: "",
          reverted: false,
          events: [],
          state_delta_entries: [],
          logs: [],
          rpc_error: JSON.parse((error as Error).message),
        },
      };
    }
    if (broadcast) {
      (transaction as TransactionJsonWait).wait = async (
        type: "byTransactionId" | "byBlock" = "byBlock",
        timeout = 15000
      ) => {
        return this.wait(transaction.id as string, type, timeout);
      };
    }
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

  /**
   * Function to call "chain.get_fork_heads" to get fork heads
   */
  async getForkHeads(): Promise<{
    last_irreversible_block: BlockTopology;
    fork_heads: BlockTopology[];
  }> {
    return this.call("chain.get_fork_heads", {});
  }

  /**
   * Funciont to call "chain.get_resource_limits" to get
   * resource limits
   */
  async getResourceLimits(): Promise<{
    resource_limit_data: {
      disk_storage_limit: string;
      disk_storage_cost: string;
      network_bandwidth_limit: string;
      network_bandwidth_cost: string;
      compute_bandwidth_limit: string;
      compute_bandwidth_cost: string;
    };
  }> {
    return this.call("chain.get_resource_limits", {});
  }

  /**
   * Function to call "chain.invoke_system_call" to invoke a system
   * call.
   */
  async invokeSystemCall<T = Record<string, unknown>>(
    serializer: Serializer,
    nameOrId: string | number,
    args: Record<string, unknown>,
    callerData?: { caller: string; caller_privilege: number }
  ): Promise<T> {
    if (!serializer.argumentsTypeName)
      throw new Error("argumentsTypeName not defined");
    if (!serializer.returnTypeName)
      throw new Error("returnTypeName not defined");
    const argsEncoded = await serializer.serialize(
      args,
      serializer.argumentsTypeName
    );
    const response = await this.call<{ value: string }>(
      "chain.invoke_system_call",
      {
        ...(typeof nameOrId === "number" && { id: nameOrId }),
        ...(typeof nameOrId === "string" && { name: nameOrId }),
        args: encodeBase64url(argsEncoded),
        caller_data: callerData,
      }
    );
    if (!response || !response.value)
      throw new Error("no value in the response");
    const result = await serializer.deserialize(
      response.value,
      serializer.returnTypeName
    );
    return result as T;
  }

  /**
   * Function to get the contract metadata of a specific contract.
   * @param contractId contract ID
   *
   * @example
   * ```ts
   * const provider = new Provider("https://api.koinos.io");
   * const result = await provider.invokeGetContractMetadata("15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL");
   * console.log(result);
   *
   * // {
   * //   value: {
   * //     hash: '0x1220c57e3573189868970a3a1662a667c366b15015d9b7900ffed415c5e944036e88',
   * //     system: true,
   * //     authorizes_call_contract: true,
   * //     authorizes_transaction_application: true,
   * //     authorizes_upload_contract: true
   * //   }
   * // }
   *
   * ```
   */
  async invokeGetContractMetadata(contractId: string) {
    const serializer = new Serializer(
      {
        nested: {
          get_contract_metadata_arguments: {
            fields: {
              contract_id: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "CONTRACT_ID",
                },
              },
            },
          },
          get_contract_metadata_result: {
            fields: {
              value: {
                type: "contract_metadata_object",
                id: 1,
              },
            },
          },
          contract_metadata_object: {
            fields: {
              hash: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
              system: {
                type: "bool",
                id: 2,
              },
              authorizes_call_contract: {
                type: "bool",
                id: 3,
              },
              authorizes_transaction_application: {
                type: "bool",
                id: 4,
              },
              authorizes_upload_contract: {
                type: "bool",
                id: 5,
              },
            },
          },
        },
      },
      {
        argumentsTypeName: "get_contract_metadata_arguments",
        returnTypeName: "get_contract_metadata_result",
      }
    );
    return this.invokeSystemCall(serializer, "get_contract_metadata", {
      contract_id: contractId,
    });
  }
}

export default Provider;
