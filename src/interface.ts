type NumberLike = number | bigint | string;

export interface UploadContractOperation {
  contractId?: Uint8Array;

  bytecode?: Uint8Array;
}

export interface UploadContractOperationJson {
  contractId?: string; // base58

  bytecode?: string; // base64
}

export interface CallContractOperation {
  contractId: Uint8Array;

  entryPoint: number;

  args: Uint8Array;
}

export interface CallContractOperationJson {
  contractId: string; // base58

  entryPoint: number;

  args: string; // base64
}

export interface ContractCallBundle {
  contractId: Uint8Array;
  entryPoint: number;
}

export interface ContractCallBundleJson {
  contractId: string; // base58

  entryPoint: number;
}

export interface ThunkIdNested {
  thunkId: number;
}

export interface ContractCallBundleNested {
  systemCallBundle: ContractCallBundle;
}

export type SystemCallTarget = ThunkIdNested | ContractCallBundleNested;

export interface SetSystemCallOperation {
  callId: number;

  target: SystemCallTarget;
}

export interface SetSystemCallOperationJson {
  callId: number;

  target: number | ContractCallBundleJson;
}

export interface UploadContractOperationNested {
  uploadContract: UploadContractOperation;
}

export interface CallContractOperationNested {
  callContract: CallContractOperation;
}

export interface SetSystemCallOperationNested {
  setSystemCall: SetSystemCallOperation;
}

export type Operation =
  | UploadContractOperationNested
  | CallContractOperationNested
  | SetSystemCallOperationNested;

export type OperationJson = {
  uploadContract?: UploadContractOperationJson;
  callContract?: CallContractOperationJson;
  setSystemCall?: SetSystemCallOperationJson;
};

export interface ActiveTransactionData {
  /**
   * Resource credits limit
   */
  rcLimit?: string | number | bigint;

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
  rcLimit?: string | number | bigint;

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
  signatureData?: string;
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
  signatureData?: string;
  transactions?: TransactionJson[];
  [x: string]: unknown;
}
