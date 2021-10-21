import { Root, INamespace } from "protobufjs/light";
import ripemd160 from "noble-ripemd160";
import { Signer } from "./Signer";
import { Provider } from "./Provider";
import {
  CallContractOperation,
  UploadContractOperation,
  TransactionJson,
} from "./interface";
import {
  decodeBase58,
  decodeBase64,
  encodeBase58,
  encodeBase64,
  toHexString,
  toUint8Array,
} from "./utils";

const OP_BYTES = "(koinos_bytes_type)";

export interface Abi {
  entries: {
    /** Name of the entry */
    [x: string]: {
      /** Entry point ID */
      id: number;
      /** Protobuffer type for input */
      inputs?: string;
      /** Protobuffer type for output */
      outputs?: string;

      readOnly?: boolean;
    };
  };
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

export interface TransactionOptions {
  resource_limit?: number | bigint | string;
  nonce?: number;
  send?: boolean;
}

/**
 * Makes a copy of a value. The returned value can be modified
 * without altering the original one. Although this is not needed
 * for strings or numbers and only needed for objects and arrays,
 * all these options are covered in a single function
 *
 * It is assumed that the argument is number, string, or contructions
 * of these types inside objects or arrays.
 */
function copyValue(value: unknown): unknown {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as unknown;
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
  id?: string;

  /**
   * Protobuffer definitions
   */
  protobuffers?: Root;

  /**
   *
   */
  functions: {
    [x: string]: (
      args?: Record<string, unknown>,
      opts?: TransactionOptions
    ) => Promise<{
      operation: CallContractOperation;
      transaction?: TransactionJson;
      result?: unknown;
    }>;
  };

  abi?: Abi;

  signer?: Signer;

  provider?: Provider;

  bytecode?: Uint8Array;

  options: TransactionOptions;

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
   *       readOnly: true,
   *     },
   *   },
   *   protoDef: { ... }, // protobuffer definitions in json
   * });
   * ```
   */
  constructor(c: {
    id?: string;
    abi?: Abi;
    bytecode?: Uint8Array;
    options?: TransactionOptions;
    signer?: Signer;
    provider?: Provider;
  }) {
    this.id = c.id;
    this.signer = c.signer;
    this.provider = c.provider;
    this.abi = c.abi;
    this.bytecode = c.bytecode;
    if (c.abi?.types) this.protobuffers = Root.fromJSON(c.abi.types);
    this.options = {
      resource_limit: 1e8,
      send: true,
      ...c.options,
    };
    this.functions = {};

    if (this.signer && this.provider && this.abi && this.abi.entries) {
      Object.keys(this.abi.entries).forEach((name) => {
        this.functions[name] = async <T = Record<string, unknown>>(
          args?: Record<string, unknown>,
          options?: TransactionOptions
        ): Promise<{
          operation: CallContractOperation;
          transaction?: TransactionJson;
          result?: T | unknown;
        }> => {
          if (!this.provider) throw new Error("provider not found");
          if (!this.abi || !this.abi.entries)
            throw new Error("Entries are not defined");
          const opts = {
            ...this.options,
            ...options,
          };

          const operation = this.encodeOperation({ name, args });

          if (this.abi.entries[name].readOnly) {
            if (!this.abi.entries[name].outputs)
              throw new Error(`No outputs defined for ${name}`);
            // read contract
            const { result: resultEncoded } = await this.provider.readContract(
              operation
            );
            const result = this.decodeType<T>(
              resultEncoded,
              this.abi.entries[name].outputs as string
            );
            return { operation, result };
          }

          // return operation if send is false
          if (!opts?.send) return { operation };

          // write contract (sign and send)
          if (!this.signer) throw new Error("signer not found");
          const transaction = await this.signer.populateTransaction({
            ...opts,
            operations: [operation],
          });

          const result = await this.signer.sendTransaction(transaction);
          return { operation, transaction, result };
        };
      });
    }
  }

  static computeContractId(address: string): Uint8Array {
    const signerHash = ripemd160(address);
    return toUint8Array(signerHash);
  }

  async deploy(options?: TransactionOptions): Promise<{
    operation: UploadContractOperation;
    transaction?: TransactionJson;
    result?: unknown;
  }> {
    if (!this.signer) throw new Error("signer not found");
    if (!this.bytecode) throw new Error("bytecode not found");
    const opts = {
      ...this.options,
      ...options,
    };
    const operation: UploadContractOperation = {
      contract_id: Contract.computeContractId(this.signer.getAddress()),
      bytecode: this.bytecode,
    };

    // return operation if send is false
    if (!opts?.send) return { operation };

    const transaction = await this.signer.populateTransaction({
      ...opts,
      operations: [operation],
    });
    const result = await this.signer.sendTransaction(transaction);
    return { operation, transaction, result };
  }

  // TODO: buildEstimate - function to estimate consumption of resources

  // the contract uses
  //   readonly signer: Signer;
  //   readonly provider: Provider;
  //   constructor(contractId or name, interface, signerOrProvider)
  //     uses defineReadOnly(this, "signer", signerOrProvider) to set this readOnly var for first time

  // connect() to set a different signer or provider

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
  encodeOperation(op: DecodedOperationJson): CallContractOperation {
    if (!this.abi || !this.abi.entries || !this.abi.entries[op.name])
      throw new Error(`Operation ${op.name} unknown`);
    if (!this.protobuffers) throw new Error("Protobuffers are not defined");
    if (!this.id) throw new Error("Contract id is not defined");
    const entry = this.abi.entries[op.name];

    let bufferInputs = new Uint8Array(0);
    if (entry.inputs) {
      if (!op.args)
        throw new Error(`No arguments defined for type '${entry.inputs}'`);
      bufferInputs = this.encodeType(op.args, entry.inputs);
    }

    return {
      contract_id: decodeBase58(this.id),
      entry_point: entry.id,
      args: bufferInputs,
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
  decodeOperation(op: CallContractOperation): DecodedOperationJson {
    if (!this.id) throw new Error("Contract id is not defined");
    if (!this.abi || !this.abi.entries)
      throw new Error("Entries are not defined");
    const contractId = encodeBase58(op.contract_id);
    if (contractId !== this.id)
      throw new Error(
        `Invalid contract id. Expected: ${this.id}. Received: ${contractId}`
      );
    for (let i = 0; i < Object.keys(this.abi.entries).length; i += 1) {
      const opName = Object.keys(this.abi.entries)[i];
      const entry = this.abi.entries[opName];
      if (op.entry_point === entry.id) {
        if (!entry.inputs) return { name: opName };
        return {
          name: opName,
          args: this.decodeType(op.args, entry.inputs),
        };
      }
    }
    throw new Error(`Unknown entry id ${op.entry_point}`);
  }

  encodeType(
    valueDecoded: Record<string, unknown>,
    typeName: string
  ): Uint8Array {
    if (!this.protobuffers) throw new Error("Protobuffers are not defined");
    const protobufType = this.protobuffers.lookupType(typeName);
    const object: Record<string, unknown> = {};
    // TODO: format from Buffer to base58/base64 for nested fields
    Object.keys(protobufType.fields).forEach((fieldName) => {
      const { options, name, type } = protobufType.fields[fieldName];

      // No byte conversion
      if (type !== "bytes") {
        object[name] = copyValue(valueDecoded[name]);
        return;
      }

      // Default byte conversion
      if (!options || !options[OP_BYTES]) {
        object[name] = decodeBase64(valueDecoded[name] as string);
        return;
      }

      // Specific byte conversion
      switch (options[OP_BYTES]) {
        case "BASE58":
        case "CONTRACT_ID":
        case "ADDRESS":
          object[name] = decodeBase58(valueDecoded[name] as string);
          break;
        case "BASE64":
          object[name] = decodeBase64(valueDecoded[name] as string);
          break;
        case "HEX":
        case "BLOCK_ID":
        case "TRANSACTION_ID":
          object[name] = toUint8Array(
            (valueDecoded[name] as string).replace("0x", "")
          );
          break;
        default:
          throw new Error(
            `unknown koinos_byte_type ${options[OP_BYTES] as string}`
          );
      }
    });
    const message = protobufType.create(object);
    const buffer = protobufType.encode(message).finish();
    return buffer;
  }

  decodeType<T = Record<string, unknown>>(
    valueEncoded: string | Uint8Array,
    typeName: string
  ): T {
    if (!this.protobuffers) throw new Error("Protobuffers are not defined");
    const valueBuffer =
      typeof valueEncoded === "string"
        ? decodeBase64(valueEncoded)
        : valueEncoded;
    const protobufType = this.protobuffers.lookupType(typeName);
    const message = protobufType.decode(valueBuffer);
    const object = protobufType.toObject(message, { longs: String });
    // TODO: format from Buffer to base58/base64 for nested fields
    Object.keys(protobufType.fields).forEach((fieldName) => {
      const { options, name, type } = protobufType.fields[fieldName];

      // No byte conversion
      if (type !== "bytes") return;

      // Default byte conversion
      if (!options || !options[OP_BYTES]) {
        object[name] = encodeBase64(object[name]);
        return;
      }

      // Specific byte conversion
      switch (options[OP_BYTES]) {
        case "BASE58":
        case "CONTRACT_ID":
        case "ADDRESS":
          object[name] = encodeBase58(object[name]);
          break;
        case "BASE64":
          object[name] = encodeBase64(object[name]);
          break;
        case "HEX":
        case "BLOCK_ID":
        case "TRANSACTION_ID":
          object[name] = `0x${toHexString(object[name])}`;
          break;
        default:
          throw new Error(
            `unknown koinos_byte_type ${options[OP_BYTES] as string}`
          );
      }
    });
    return object as T;
  }
}

export default Contract;
