import { Root, INamespace, IConversionOptions } from "protobufjs/light";
import { CallContractOperation } from "./interface";
import { decodeBase64, encodeBase64 } from "./utils";

export interface Entries {
  /** Name of the entry */
  [x: string]: {
    /** Entry point ID */
    id: number;
    /** Protobuffer type for input */
    inputs?: string;
    /** Protobuffer type for output */
    outputs?: string;
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

  /** Arguments decoded. See [[Abi]] */
  args?: Record<string, unknown>;
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
   * Protobuffer definitions
   */
  proto: Root;

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
   *       inputs: "transfer_arguments",
   *       outputs: "transfer_result",
   *     },
   *     balance_of: {
   *       id: 0x62efa292,
   *       inputs: "balance_of_arguments",
   *       outputs: "balance_of_result",
   *     },
   *   },
   *   protoDef: { ... }, // protobuffer definitions in json
   * });
   * ```
   */
  constructor(c: { id: string; entries: Entries; protoDef: INamespace }) {
    this.id = c.id;
    this.entries = c.entries;
    this.proto = Root.fromJSON(c.protoDef);
  }

  /**
   * Encondes a contract operation using Koinos serialization
   * and taking the contract entries as reference to build it
   * @param op - Operation to encode
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
  encodeOperation(op: DecodedOperation): CallContractOperation {
    if (!this.entries || !this.entries[op.name])
      throw new Error(`Operation ${op.name} unknown`);
    const entry = this.entries[op.name];

    let bufferInputs = new Uint8Array(0);
    if (entry.inputs) {
      if (!op.args)
        throw new Error(`No arguments defined for type '${entry.inputs}'`);
      const type = this.proto.lookupType(entry.inputs);
      const message = type.create(op.args);
      bufferInputs = type.encode(message).finish();
    }

    return {
      contract_id: this.id,
      entry_point: entry.id,
      args: encodeBase64(bufferInputs),
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
  decodeOperation(
    op: CallContractOperation,
    opts: IConversionOptions = { longs: String }
  ): DecodedOperation {
    if (op.contract_id !== this.id)
      throw new Error(
        `Invalid contract id. Expected: ${this.id}. Received: ${op.contract_id}`
      );
    for (let i = 0; i < Object.keys(this.entries).length; i += 1) {
      const opName = Object.keys(this.entries)[i];
      const entry = this.entries[opName];
      if (op.entry_point === entry.id) {
        if (!entry.inputs) return { name: opName };
        const type = this.proto.lookupType(entry.inputs);
        const message = type.decode(decodeBase64(op.args));
        const obj = type.toObject(message, opts);
        return {
          name: opName,
          args: obj,
        };
      }
    }
    throw new Error(`Unknown entry id ${op.entry_point}`);
  }

  /**
   * Decodes a result. This function is used in conjunction with
   * [[Provider.readContract | readContract of Provider class]] to read a
   * contract and decode the result. "outputs" field must be defined in
   * the abi for the operation name.
   * @param result - Encoded result in base64
   * @param opName - Operation name
   * @returns Decoded result
   * @example
   * ```ts
   * const resultDecoded = contract.decodeResult("MAAsZnAzyD0E=", "balance_of");
   * console.log(resultDecoded)
   * // 3124382766600001n
   * ```
   */
  decodeResult(
    result: string,
    opName: string,
    opts: IConversionOptions = { longs: String }
  ): unknown {
    const entry = this.entries[opName];
    if (!entry.outputs)
      throw new Error(`There are no outputs defined for ${opName}`);
    const type = this.proto.lookupType(entry.outputs);
    const message = type.decode(decodeBase64(result)); // todo: from base64 to uint8array
    return type.toObject(message, opts);
  }
}

export default Contract;
