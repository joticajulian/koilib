import { INamespace } from "protobufjs/light";
import { Serializer } from "./Serializer";

/**
 * Application Binary Interface (ABI)
 *
 * ABIs are composed of 2 elements: methods and types.
 * - The methods define the names of the entries of the smart contract,
 * the corresponding endpoints and the name of the types used.
 * - The types all the description to serialize and deserialize
 * using proto buffers.
 *
 * To generate the types is necessary to use the dependency
 * protobufjs. The following example shows how to generate the
 * protobuf descriptor from a .proto file.
 *
 * ```js
 * const fs = require("fs");
 * const pbjs = require("protobufjs/cli/pbjs");
 *
 * pbjs.main(
 *   ["--target", "json", "./token.proto"],
 *   (err, output) => {
 *     if (err) throw err;
 *     fs.writeFileSync("./token-proto.json", output);
 *   }
 * );
 * ```
 *
 * Then this descriptor can be loaded to define the ABI:
 * ```js
 * const tokenJson = require("./token-proto.json");
 * const abiToken = {
 *   methods: {
 *     balanceOf: {
 *       entryPoint: 0x15619248,
 *       inputs: "balance_of_arguments",
 *       outputs: "balance_of_result",
 *       readOnly: true,
 *       defaultOutput: { value: "0" },
 *     },
 *     transfer: {
 *       entryPoint: 0x62efa292,
 *       inputs: "transfer_arguments",
 *       outputs: "transfer_result",
 *     },
 *     mint: {
 *       entryPoint: 0xc2f82bdc,
 *       inputs: "mint_argumnets",
 *       outputs: "mint_result",
 *     },
 *   },
 *   types: tokenJson,
 * };
 * ```
 *
 * Note that this example uses "defaultOutput" for the method
 * "balanceOf". This is used when the smart contract returns an
 * empty response (for instance when there are no balance records
 * for a specific address) and you require a default output in
 * such cases.
 */
export interface Abi {
  methods: {
    /** Name of the method */
    [x: string]: {
      /** Entry point ID */
      entryPoint: number;
      /** Protobuffer type for input */
      input?: string;
      /** Protobuffer type for output */
      output?: string;
      /** Boolean to differentiate write methods
       * (using transactions) from read methods
       * (query the contract)
       */
      readOnly?: boolean;
      /** Default value when the output is undefined */
      defaultOutput?: unknown;
      /** Optional function to preformat the input */
      preformatInput?: (input: unknown) => Record<string, unknown>;
      /** Optional function to preformat the output */
      preformatOutput?: (output: Record<string, unknown>) => unknown;
      /** Description of the method */
      description?: string;
    };
  };
  /**
   * Protobuffers descriptor in JSON format.
   * See https://www.npmjs.com/package/protobufjs#using-json-descriptors
   */
  types: INamespace;
}

/**
 * Human readable format operation
 *
 * @example
 * ```ts
 * const opDecoded = {
 *   name: "transfer",
 *   args: {
 *     from: "1Krs7v1rtpgRyfwEZncuKMQQnY5JhqXVSx",
 *     to: "1BqtgWBcqm9cSZ97avLGZGJdgso7wx6pCA",
 *     value: 1000,
 *   },
 * };
 * ```
 */
export interface DecodedOperationJson {
  /** Operation name */
  name: string;

  /** Arguments decoded. See [[Abi]] */
  args?: Record<string, unknown>;
}

export interface BaseTransactionOptions {
  /**
   * Chain ID
   *
   * If this option is not set it will be taken
   * by querying the blockchain
   */
  chainId?: string;

  /**
   * Resource Credits limit
   *
   * Max amount of mana to be spent. If this option
   * is not set it will be taken by querying the
   * actual mana of the payer
   */
  rcLimit?: string;

  /**
   * Transaction nonce
   *
   * It can be the nonce of the payee or the nonce of the
   * payer. Use the payee's nonce when the payer's nonce changes
   * continuosly without your control, for instance, when the
   * payer is a dApp.
   *
   * The nonce is not required to be consecutive,
   * only greater than the previous one.
   *
   * If this option is not set it will be taken
   * from the blockchain depending on the payer/payee
   * configuration.
   */
  nonce?: string;

  /**
   * Payer
   *
   * Address that will pay the resource credits (aka mana)
   * consumed in the transaction.
   *
   * If this option is not set it will take the address
   * of the signer as payer.
   */
  payer?: string;

  /**
   * Payee
   *
   * Address that increases the nonce. When this option is
   * not set the blockchain will increase the payer's nonce.
   */
  payee?: string;

  /**
   * Sign transaction
   *
   * Boolean to define if the transaction should be signed.
   * By default it is true.
   */
  signTransaction?: boolean;

  /**
   * Send transaction
   *
   * Boolean to define if the transaction should be signed
   * ans broadcasted to the blockchain. By default it is
   * true.
   */
  sendTransaction?: boolean;
}

export interface TransactionOptions extends BaseTransactionOptions {
  /**
   * Send abis
   *
   * Boolean to define if the abis should be shared with
   * the signer so it will be able to decode the operations.
   * By default it is true.
   */
  sendAbis?: boolean;
}

export interface DeployOptions extends BaseTransactionOptions {
  /**
   * ABI
   *
   * ABI to be stored in the koinos-contract-meta-store.
   * This option is optional.
   */
  abi?: string;

  /**
   * Authorizes call contract
   *
   * Set it true if the contract implements the "authorize"
   * function and can authorize calling other contracts in
   * its name.
   */
  authorizesCallContract?: boolean;

  /**
   * Authorizes transaction application
   *
   * Set it true if the contract implements the "authorize"
   * function and can authorize paying the mana to apply
   * transactions, or can authorize the use of its nonce
   * to apply transactions.
   */
  authorizesTransactionApplication?: boolean;

  /**
   * Authorizes upload contract
   *
   * Set it true if the contract implements the "authorize"
   * function and can authorize upgrades of the actual contract
   */
  authorizesUploadContract?: boolean;
}

export interface RecoverPublicKeyOptions {
  /**
   * Boolean to define if the public key should
   * be compressed or not. It is true by default
   */
  compressed?: boolean;

  /**
   * Asynchronous function to transform the signature
   * before calculating the public key associated.
   * This transformation is useful in cases were the
   * signature contains additional data. For instance,
   * the signatures for blocks in the PoW consensus
   * algorithm contain the nonce.
   */
  transformSignature?: (signatureData: string) => Promise<string>;
}

/**
 * Function to wait for a transaction to be mined.
 * This function comes as a response after sending a transaction.
 * See [[Provider.sendTransaction]]
 *
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
 * @param timeout - Timeout in milliseconds. By default it is 30000
 */
export type WaitFunction = (
  type?: "byBlock" | "byTransactionId",
  timeout?: number
) => Promise<string | number>;

export interface GenesisDataEntryEncoded {
  space: {
    system?: boolean;
    zone?: string;
    id?: number;
  };
  key?: string;
  value: string;
  error?: string;
}

export interface GenesisDataEncoded {
  entries?: GenesisDataEntryEncoded[];
}

export interface GenesisDataEntryDecoded {
  space: {
    system?: boolean;
    zone?: string;
    id?: number;
  };
  key?: string;
  alias?: string;
  value: string | Record<string, unknown>;
  error?: string;
}

export interface GenesisDataDecoded {
  entries?: GenesisDataEntryDecoded[];
}

export interface DictionaryGenesisData {
  /** key name */
  [x: string]: {
    /** alternative name for the key name */
    alias?: string;

    /** boolean defining if it's an address */
    isAddress?: boolean;

    /** custom serializer */
    serializer?: Serializer;

    /** type name for serialization */
    typeName?: string;

    /** preformat bytes for base64url, base58 or hex string */
    bytesConversion?: boolean;
  };
}

export interface TypeField {
  type: string;
  btype?: string;
  subtypes?: Record<string, TypeField>;
}

export interface ContractCallBundle {
  contract_id: Uint8Array;
  entry_point: number;
}

export interface ContractCallBundleJson {
  contract_id: string; // base58

  entry_point: number;
}

export interface ThunkIdNested {
  thunk_id: number;
}

export interface ContractCallBundleNested {
  system_call_bundle: ContractCallBundle;
}

export type SystemCallTarget = ThunkIdNested | ContractCallBundleNested;

export interface SystemCallTargetJson {
  thunk_id?: number;
  system_call_bundle?: ContractCallBundleJson;
}

export interface UploadContractOperation {
  contract_id?: Uint8Array;

  bytecode?: Uint8Array;

  abi?: string;

  authorizes_call_contract?: boolean;

  authorizes_transaction_application?: boolean;

  authorizes_upload_contract?: boolean;
}

export interface UploadContractOperationJson {
  contract_id?: string; // base58

  bytecode?: string; // base64

  abi?: string;

  authorizes_call_contract?: boolean;

  authorizes_transaction_application?: boolean;

  authorizes_upload_contract?: boolean;
}

export interface CallContractOperation {
  contract_id: Uint8Array;

  entry_point: number;

  args: Uint8Array;
}

export interface CallContractOperationJson {
  contract_id: string; // base58

  entry_point: number;

  args: string; // base64
}

export interface SetSystemCallOperation {
  call_id: number;

  target: SystemCallTarget;
}

export interface SetSystemCallOperationJson {
  call_id: number;

  target: SystemCallTargetJson;
}

export interface SetSystemContractOperation {
  contract_id: Uint8Array;

  system_contract: boolean;
}

export interface SetSystemContractOperationJson {
  contract_id: string; // base58

  system_contract: boolean;
}

export interface UploadContractOperationNested {
  upload_contract: UploadContractOperation;
}

export interface CallContractOperationNested {
  call_contract: CallContractOperation;
}

export interface SetSystemCallOperationNested {
  set_system_call: SetSystemCallOperation;
}

export interface SetSystemContractOperationNested {
  set_system_contract: SetSystemContractOperation;
}

export type Operation =
  | UploadContractOperationNested
  | CallContractOperationNested
  | SetSystemCallOperationNested
  | SetSystemContractOperationNested;

export type OperationJson = {
  upload_contract?: UploadContractOperationJson;
  call_contract?: CallContractOperationJson;
  set_system_call?: SetSystemCallOperationJson;
  set_system_contract?: SetSystemContractOperationJson;
};

export interface TransactionHeaderJson {
  /**
   * ID of the chain
   */
  chain_id?: string;

  /**
   * Resource credits limit
   */
  rc_limit?: string;

  /**
   * Account nonce
   */
  nonce?: string;

  /**
   * Merkle root of the serialized operations's SHA2-256 hashes
   */
  operation_merkle_root?: string;

  /**
   * Transaction's payer
   */
  payer?: string;

  /**
   * Transaction's payee
   */
  payee?: string;

  [x: string]: unknown;
}

/**
 * Koinos Transaction
 */
export interface TransactionJson {
  /**
   * Transaction ID. It must be the sha2-256 of the
   * serialized header of the transaction
   */
  id?: string;

  /**
   * Header of the transaction
   */
  header?: TransactionHeaderJson;

  /**
   * Array of operations
   */
  operations?: OperationJson[];

  /**
   * Signatures in compact format
   */
  signatures?: string[];
}

export interface TransactionJsonWait extends TransactionJson {
  wait: WaitFunction;
}

export interface BlockHeaderJson {
  previous?: string;
  height?: string;
  timestamp?: string;
  previous_state_merkle_root?: string;
  transaction_merkle_root?: string;
  signer?: string;
  [x: string]: unknown;
}

export interface BlockJson {
  id?: string;
  header?: BlockHeaderJson;
  transactions?: TransactionJson[];
  signature?: string;
  [x: string]: unknown;
}

export interface ValueType {
  uint64_value?: string;
  [x: string]: unknown;
}
