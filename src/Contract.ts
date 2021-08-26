import { Abi, abiCallContractOperation } from "./abi";
import { deserialize, serialize } from "./serializer";
import VariableBlob from "./VariableBlob";

/**
 * These entries definitions are used to serialize and deserialize
 * contract operations. Each entry contains a name (defined in the
 * key field), id (entry point id), inputs (abi describing the
 * serialization of the inputs), and outputs (abi describing the
 * serialization of the outputs). See [[Abi]].
 *
 * @example
 * ```ts
 * const entries = {
 *   transfer: {
 *     id: 0x62efa292,
 *     inputs: {
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
 *     inputs: { type: "string" },
 *     outputs: { type: "uint64" },
 *   },
 * };
 * ```
 */
export interface Entries {
  /** Name of the entry */
  [x: string]: {
    /** Entry point ID */
    id: number;

    /** ABI definition for input serialization */
    inputs: Abi;

    /** ABI definition for output serialization */
    outputs?: Abi;
  };
}

/**
 * Operation using the format for the communication with the RPC node
 *
 * @example
 * ```ts
 * const opEncoded = {
 *   type: "koinos::protocol::call_contract_operation",
 *   value: {
 *     contract_id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
 *     entry_point: 0x62efa292,
 *     args: "MBWFsaWNlA2JvYgAAAAAAAAPo",
 *   }
 * }
 * ```
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
export interface DecodedOperation {
  /** Operation name */
  name: string;

  /** Arguments decoded. See [[Abi]]*/
  args: unknown;
}

/**
 * The contract class contains the contract ID and contrac entries
 * definition needed to encode/decode operations during the
 * interaction with the user and the communication with the RPC node.
 *
 * Operations are encoded to communicate with the RPC node. However,
 * this format is not human readable as the data is serialized and
 * encoded in Base64 format. When decoding operations, they can be
 * read by the user (see [[EncodedOperation]] and [[DecodedOperation]]).
 *
 * @example
 *
 * ```ts
 * const contract = new Contract({
 *   id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
 *   entries: {
 *     transfer: {
 *       id: 0x62efa292,
 *       inputs: {
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
 *       inputs: { type: "string" },
 *       outputs: { type: "uint64" },
 *     },
 *   },
 * });
 *
 * const opEncoded = contract.encodeOperation({
 *   name: "transfer",
 *   args: {
 *     from: "alice",
 *     to: "bob",
 *     value: BigInt(1000),
 *   },
 * });
 *
 * console.log(opEncoded);
 * // {
 * //   type: "koinos::protocol::call_contract_operation",
 * //   value: {
 * //     contract_id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
 * //     entry_point: 0x62efa292,
 * //     args: "MBWFsaWNlA2JvYgAAAAAAAAPo",
 * //   }
 * // }
 *
 * const opDecoded = contract.decodeOperation(opEncoded);
 * console.log(opDecoded);
 * // {
 * //   name: "transfer",
 * //   args: {
 * //     from: "alice",
 * //     to: "bob",
 * //     value: 1000n,
 * //   },
 * // }
 *
 * const resultDecoded = contract.decodeResult("MAAsZnAzyD0E=", "balance_of");
 * console.log(resultDecoded)
 * // 3124382766600001n
 * ```
 */
export class Contract {
  /**
   * Contract ID
   */
  id: string;

  /**
   * Contract entries. See [[Entries]]
   */
  entries: Entries;

  /**
   * The constructor receives the contract ID and
   * contract entries definition
   * @param c - Object with contract id and contract entries
   *
   * @example
   * ```ts
   * const contract = new Contract({
   *   id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
   *   entries: {
   *     transfer: {
   *       id: 0x62efa292,
   *       inputs: {
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
   *       inputs: { type: "string" },
   *       outputs: { type: "uint64" },
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
   *
   * console.log(opEncoded);
   * // {
   * //   type: "koinos::protocol::call_contract_operation",
   * //   value: {
   * //     contract_id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
   * //     entry_point: 0x62efa292,
   * //     args: "MBWFsaWNlA2JvYgAAAAAAAAPo",
   * //   }
   * // }
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
        ...(entry.inputs && {
          args: serialize(op.args, entry.inputs).toString(),
        }),
      },
    };
  }

  /**
   * Decodes a contract operation to be human readable
   * @example
   * ```ts
   * const opDecoded = contract.decodeOperation({
   *   type: "koinos::protocol::call_contract_operation",
   *   value: {
   *     contract_id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
   *     entry_point: 0x62efa292,
   *     args: "MBWFsaWNlA2JvYgAAAAAAAAPo",
   *   }
   * });
   * console.log(opDecoded);
   * // {
   * //   name: "transfer",
   * //   args: {
   * //     from: "alice",
   * //     to: "bob",
   * //     value: 1000n,
   * //   },
   * // }
   * ```
   */
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
          args: deserialize(vb, entry.inputs),
        };
      }
    }
    throw new Error(`Unknown entry id ${op.value.entry_point}`);
  }

  /**
   * Decodes a result. This function is used in conjunction with
   * [[Provider.readContract | readContract of Provider class]] to read a
   * contract and decode the result. "outputs" field must be defined in
   * the abi for the operation name.
   * @param result Encoded result in base64
   * @param opName Operation name
   * @returns Decoded result
   * @example
   * ```ts
   * const resultDecoded = contract.decodeResult("MAAsZnAzyD0E=", "balance_of");
   * console.log(resultDecoded)
   * // 3124382766600001n
   * ```
   */
  decodeResult(result: string, opName: string): unknown {
    const entry = this.entries[opName];
    if (!entry.outputs)
      throw new Error(`There are no outputs defined for ${opName}`);
    return deserialize(result, entry.outputs);
  }
}

export default Contract;
