type NumberLike = number | bigint | string;

export interface UploadContractOperation {
  contract_id?: Uint8Array;

  bytecode?: Uint8Array;
}

export interface UploadContractOperationJson {
  contract_id?: string; // base58

  bytecode?: string; // base64
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

export interface ContractCallBundle {
  contract_id: Uint8Array;
  entry_point: number;
}

export interface ContractCallBundleJson {
  contract_id: string; // base58

  entry_point: number;
}

export interface SetSystemCallOperation {
  call_id: number;

  target: number | ContractCallBundle;
}

export interface SetSystemCallOperationJson {
  call_id: number;

  target: number | ContractCallBundleJson;
}

export type Operation =
  | UploadContractOperation
  | CallContractOperation
  | SetSystemCallOperation;

export type OperationJson =
  | UploadContractOperationJson
  | CallContractOperationJson
  | SetSystemCallOperationJson;

export interface ActiveTransactionData {
  /**
   * Resource credits limit
   */
  rc_limit?: string | number | bigint;

  /**
   * Account nonce
   */
  nonce?: string | number | bigint;

  /**
   * Array of operations
   */
  operations?: Operation[];

  [x: string]: unknown;
}

export interface ActiveTransactionDataJson {
  /**
   * Resource credits limit
   */
  rc_limit?: string | number | bigint;

  /**
   * Account nonce
   */
  nonce?: string | number | bigint;

  /**
   * Array of operations
   */
  operations?: OperationJson[];

  [x: string]: unknown;
}

/**
 * Koinos Transaction
 */
export interface TransactionJson {
  /**
   * Transaction ID. It must be the sha2-256 of the
   * serialized data of active data, and encoded in multi base58
   */
  id?: string;

  /**
   * Consensus data
   */
  active?: string;

  /**
   * Non-consensus data
   */
  passive?: string;

  /**
   * Signature in compact format enconded in multi base64
   */
  signature_data?: string;
}

export interface BlockHeaderJson {
  previous?: string;
  height?: NumberLike;
  timestamp?: NumberLike;
  [x: string]: unknown;
}

export interface BlockJson {
  id?: string;
  header?: BlockHeaderJson;
  active?: string;
  passive?: string;
  signature_data?: string;
  transactions?: TransactionJson[];
  [x: string]: unknown;
}
