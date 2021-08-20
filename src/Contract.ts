import { Abi, abiCallContractOperation } from "./abi";
import { deserialize, serialize } from "./serializer";
import VariableBlob from "./VariableBlob";

/**
 * Contract entries
 *
 * These entries definitions are used to serialize and deserialize
 * contract operations. Each entry contains a name (defined in the
 * key field), id (entry point id), and args (abi describing the
 * serialization of the entry)
 *
 * @example
 * ```ts
 * const entries = {
 *   transfer: {
 *     id: 0x62efa292,
 *     args: {
 *       type: [
 *         {
 *           name: "from",
 *           type: "string",
 *         },
 *         {
 *           name: "to",
 *           type: "string",
 *         },
 *         {
 *           name: "value",
 *           type: "uint64",
 *         },
 *       ],
 *     },
 *   },
 *   balance_of: {
 *     id: 0x15619248,
 *     args: { type: "string" },
 *   },
 * };
 * ```
 */
export interface Entries {
  /** Name of the entry */
  [x: string]: {
    /** Entry point ID */
    id: number;

    /** ABI definition for serialization */
    args: Abi;
  };
}

/**
 * Operation encoded
 */
export interface EncodedOperation {
  /** It should be "koinos::protocol::call_contract_operation" */
  type: string;

  /** Value of call contract operation */
  value: {
    /** Contract ID */
    contract_id: string;

    /** Entry point ID */
    entry_point: number;

    /** Arguments serialized and encoded in base64 */
    args?: string;
  };
}

/**
 * Operation decoded
 */
export interface DecodedOperation {
  /** Operation name */
  name: string;

  /** Arguments decoded */
  args: unknown;
}

/**
 * Contract class
 */
export class Contract {
  /**
   * Contract ID
   */
  id: string;

  /**
   * Contract entries
   */
  entries: Entries;

  /**
   *
   * @param c - Object with contract id and contract entries
   *
   * @example
   * ```ts
   * const contract = new Contract({
   *   id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
   *   entries: {
   *     transfer: {
   *       id: 0x62efa292,
   *       args: {
   *         type: [
   *           {
   *             name: "from",
   *             type: "string",
   *           },
   *           {
   *             name: "to",
   *             type: "string",
   *           },
   *           {
   *             name: "value",
   *             type: "uint64",
   *           },
   *         ],
   *       },
   *     },
   *     balance_of: {
   *       id: 0x15619248,
   *       args: { type: "string" },
   *     },
   *   },
   * });
   * ```
   */
  constructor(c: { id: string; entries: Entries }) {
    this.id = c.id;
    this.entries = c.entries;
  }

  /**
   * Encondes a contract operation using Koinos serialization
   * and taking the contract entries as reference to build it
   * @param op Operation to encode
   * @returns Operation encoded
   * @example
   * ```ts
   * const opEncoded = contract.encodeOperation({
   *   name: "transfer",
   *   args: {
   *     from: "alice",
   *     to: "bob",
   *     value: 1000,
   *   }
   * });
   * ```
   */
  encodeOperation(op: DecodedOperation): EncodedOperation {
    if (!this.entries || !this.entries[op.name])
      throw new Error(`Operation ${op.name} unknown`);
    const entry = this.entries[op.name];
    return {
      type: abiCallContractOperation.name as string,
      value: {
        contract_id: this.id,
        entry_point: entry.id,
        ...(entry.args && {
          args: serialize(op.args, entry.args).toString(),
        }),
      },
    };
  }

  decodeOperation(op: EncodedOperation): DecodedOperation {
    if (op.value.contract_id !== this.id)
      throw new Error(
        `Invalid contract id. Expected: ${this.id}. Received: ${op.value.contract_id}`
      );
    for (let opName in this.entries) {
      const entry = this.entries[opName];
      if (op.value.entry_point === entry.id) {
        const vb = new VariableBlob(op.value.args);
        return {
          name: opName,
          args: deserialize(vb, entry.args),
        };
      }
    }
    throw new Error(`Unknown entry id ${op.value.entry_point}`);
  }
}

export default Contract;
