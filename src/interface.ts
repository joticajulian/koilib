type NumberLike = number | bigint | string;

export interface UploadContractOperation {
  contract_id?: string;

  bytecode?: string;
}

export interface CallContractOperation {
  contract_id: string;

  entry_point: number;

  args: string;
}

export interface ContractCallBundle {
  contract_id: string;
  entry_point: number;
}

export interface SetSystemCallOperation {
  call_id: number;

  target: number | ContractCallBundle;
}

export type Operation =
  | UploadContractOperation
  | CallContractOperation
  | SetSystemCallOperation;

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

/**
 * Koinos Transaction
 */
export interface Transaction {
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

export interface BlockHeader {
  previous?: string;
  height?: NumberLike;
  timestamp?: NumberLike;
  [x: string]: unknown;
}

export interface ActiveBlockData {
  transaction_merkle_root?: string;
  passive_data_merkle_root?: string;
  signer?: string;
  [x: string]: unknown;
}

export interface PassiveBlockData {
  [x: string]: unknown;
}

export interface Block {
  id?: string;
  header?: BlockHeader;
  active_data?: ActiveBlockData;
  passive_data?: PassiveBlockData;
  signature_data?: string;
  transactions?: Transaction[];
  [x: string]: unknown;
}
