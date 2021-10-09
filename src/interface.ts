type NumberLike = number | bigint | string;

export interface UploadContractOperation {
  contract_id?: Uint8Array | Buffer;

  bytecode?: Uint8Array | Buffer;
}

export interface CallContractOperation {
  contract_id?: Uint8Array | Buffer;

  entry_point: number;

  args: Uint8Array | Buffer;
}

export interface ContractCallBundle {
  contract_id: Uint8Array | Buffer;
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
  id?: Uint8Array | Buffer;

  /**
   * Consensus data
   */
  active?: Uint8Array | Buffer;

  /**
   * Non-consensus data
   */
  passive?: Uint8Array | Buffer;

  /**
   * Signature in compact format enconded in multi base64
   */
  signature_data?: Uint8Array | Buffer;
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
