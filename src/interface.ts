type NumberLike = number | bigint | string;

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
  active_data?: {
    resource_limit?: string | number | bigint;

    /**
     * Account nonce
     */
    nonce?: string | number | bigint;

    /**
     * Array of operations
     */
    operations?: {
      type: string;
      value: unknown;
    }[];
    [x: string]: unknown;
  };

  /**
   * Non-consensus data
   */
  passive_data?: {
    [x: string]: unknown;
  };

  /**
   * Signature in compact format enconded in multi base64
   */
  signature_data?: string;
  [x: string]: unknown;
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
