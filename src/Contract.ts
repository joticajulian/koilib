import { Root, INamespace } from "protobufjs/light";
import { Signer, SignerInterface } from "./Signer";
import { Provider, SendTransactionResponse } from "./Provider";
import {
  CallContractOperationNested,
  UploadContractOperationNested,
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
 */
export interface Abi {
  methods: {
    /** Name of the method */
    [x: string]: {
      /** Entry point ID */
      entryPoint: number;
      /** Protobuffer type for input */
      inputs?: string;
      /** Protobuffer type for output */
      outputs?: string;
      /** Boolean to differentiate write methods
       * (using transactions) from read methods
       * (query the contract)
       */
      readOnly?: boolean;
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

export interface TransactionOptions {
  rcLimit?: number | bigint | string;
  nonce?: number;
  sendTransaction?: boolean;
  sendAbis?: boolean;
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
 * The contract class contains the contract ID and contract entries
 * definition needed to encode/decode operations during the
 * interaction with the user and the communication with the RPC node.
 *
 * @example
 *
 * ```ts
 * const { Contract, Provider, Signer, utils } = require("koilib");
 * const rpcNodes = ["http://api.koinos.io:8080"];
 * const privateKeyHex = "f186a5de49797bfd52dc42505c33d75a46822ed5b60046e09d7c336242e20200";
 * const provider = new Provider(rpcNodes);
 * const signer = new Signer(privateKeyHex, true, provider);
 * const koinContract = new Contract({
 *   id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
 *   abi: utils.Krc20Abi,
 *   provider,
 *   signer,
 * });
 * const koin = koinContract.functions;
 *
 * async funtion main() {
 *   // Get balance
 *   const { result } = await koin.balanceOf({
 *     owner: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD"
 *   });
 *   console.log(balance.result)
 *
 *   // Transfer
 *   const { transaction, transactionResponse } = await koin.transfer({
 *     from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
 *     to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
 *     value: "1000",
 *   });
 *   console.log(`Transaction id ${transaction.id} submitted`);
 *
 *   // wait to be mined
 *   const blockId = await transactionResponse.wait();
 *   console.log(`Transaction mined. Block id: ${blockId}`);
 * }
 *
 * main();
 * ```
 */
export class Contract {
  /**
   * Contract ID
   */
  id?: Uint8Array;

  /**
   * Protobuffer definitions
   */
  protobuffers?: Root;

  /**
   * Set of functions to interact with the smart
   * contract. These functions are automatically generated
   * in the constructor of the class
   */
  functions: {
    [x: string]: <T = Record<string, unknown>>(
      args?: Record<string, unknown>,
      opts?: TransactionOptions
    ) => Promise<{
      operation: CallContractOperationNested;
      transaction?: TransactionJson;
      transactionResponse?: SendTransactionResponse;
      result?: T;
    }>;
  };

  /**
   * Application Binary Interface
   */
  abi?: Abi;

  /**
   * Signer interacting with the smart contract
   */
  signer?: SignerInterface;

  /**
   * Provider to connect with the blockchain
   */
  provider?: Provider;

  /**
   * Bytecode. Needed to deploy the smart contract.
   */
  bytecode?: Uint8Array;

  /**
   * Options to apply when creating transactions.
   * By default it set rcLimit to 1e8, sendTransaction true,
   * sendAbis true, and nonce undefined (to get it from the blockchain)
   */
  options: TransactionOptions;

  constructor(c: {
    id?: string;
    abi?: Abi;
    bytecode?: Uint8Array;
    options?: TransactionOptions;
    signer?: Signer;
    provider?: Provider;
  }) {
    if (c.id) this.id = decodeBase58(c.id);
    this.signer = c.signer;
    this.provider = c.provider || c.signer?.provider;
    this.abi = c.abi;
    this.bytecode = c.bytecode;
    if (c.abi?.types) this.protobuffers = Root.fromJSON(c.abi.types);
    this.options = {
      rcLimit: 1e8,
      sendTransaction: true,
      sendAbis: true,
      ...c.options,
    };
    this.functions = {};

    if (this.signer && this.provider && this.abi && this.abi.methods) {
      Object.keys(this.abi.methods).forEach((name) => {
        this.functions[name] = async <T = Record<string, unknown>>(
          args: Record<string, unknown> = {},
          options?: TransactionOptions
        ): Promise<{
          operation: CallContractOperationNested;
          transaction?: TransactionJson;
          transactionResponse?: SendTransactionResponse;
          result?: T;
        }> => {
          if (!this.provider) throw new Error("provider not found");
          if (!this.abi || !this.abi.methods)
            throw new Error("Methods are not defined");
          const opts = {
            ...this.options,
            ...options,
          };

          const operation = this.encodeOperation({ name, args });

          if (this.abi.methods[name].readOnly) {
            if (!this.abi.methods[name].outputs)
              throw new Error(`No outputs defined for ${name}`);
            // read contract
            const { result: resultEncoded } = await this.provider.readContract({
              contractId: encodeBase58(operation.callContract.contractId),
              entryPoint: operation.callContract.entryPoint,
              args: encodeBase64(operation.callContract.args),
            });
            let result: T | undefined;
            if (resultEncoded) {
              result = this.decodeType<T>(
                resultEncoded,
                this.abi.methods[name].outputs as string
              );
            }
            return { operation, result };
          }

          // return operation if send is false
          if (!opts?.sendTransaction) return { operation };

          // write contract (sign and send)
          if (!this.signer) throw new Error("signer not found");
          const transaction = await this.signer.encodeTransaction({
            ...opts,
            operations: [operation],
          });

          const abis: Record<string, Abi> = {};
          if (opts?.sendAbis) {
            const contractId = encodeBase58(this.id as Uint8Array);
            abis[contractId] = this.abi;
          }
          const transactionResponse = await this.signer.sendTransaction(
            transaction,
            abis
          );
          return { operation, transaction, transactionResponse };
        };
      });
    }
  }

  /**
   * Compute contract Id
   */
  static computeContractId(address: string): Uint8Array {
    return decodeBase58(address);
  }

  /**
   * Get contract Id
   */
  getId(): string {
    if (!this.id) throw new Error("id is not defined");
    return encodeBase58(this.id);
  }

  /**
   * Function to deploy a new smart contract.
   * The Bytecode must be defined in the constructor of the class
   * @example
   * ```ts
   * const signer = new Signer("f186a5de49797bfd52dc42505c33d75a46822ed5b60046e09d7c336242e20200", true, provider);
   * const provider = new Provider(["http://api.koinos.io:8080"]);
   * const bytecode = new Uint8Array([1, 2, 3, 4]);
   * const contract = new Contract({ signer, provider, bytecode });
   * const { transactionResponse } = await contract.deploy();
   * // wait to be mined
   * const blockId = await transactionResponse.wait();
   * console.log(`Contract uploaded in block id ${blockId}`);
   * ```
   */
  async deploy(options?: TransactionOptions): Promise<{
    operation: UploadContractOperationNested;
    transaction?: TransactionJson;
    transactionResponse?: SendTransactionResponse;
  }> {
    if (!this.signer) throw new Error("signer not found");
    if (!this.bytecode) throw new Error("bytecode not found");
    const opts = {
      ...this.options,
      ...options,
    };
    const operation: UploadContractOperationNested = {
      uploadContract: {
        contractId: Contract.computeContractId(this.signer.getAddress()),
        bytecode: this.bytecode,
      },
    };

    // return operation if send is false
    if (!opts?.sendTransaction) return { operation };

    const transaction = await this.signer.encodeTransaction({
      ...opts,
      operations: [operation],
    });
    const transactionResponse = await this.signer.sendTransaction(transaction);
    return { operation, transaction, transactionResponse };
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
   *     from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
   *     to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
   *     value: "1000",
   *   }
   * });
   *
   * console.log(opEncoded);
   * // {
   * //   callContract: {
   * //     contractId: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
   * //     entryPoint: 0x62efa292,
   * //     args: "MBWFsaWNlA2JvYgAAAAAAAAPo",
   * //   }
   * // }
   * ```
   */
  encodeOperation(op: DecodedOperationJson): CallContractOperationNested {
    if (!this.abi || !this.abi.methods || !this.abi.methods[op.name])
      throw new Error(`Operation ${op.name} unknown`);
    if (!this.protobuffers) throw new Error("Protobuffers are not defined");
    if (!this.id) throw new Error("Contract id is not defined");
    const method = this.abi.methods[op.name];

    let bufferInputs = new Uint8Array(0);
    if (method.inputs) {
      if (!op.args)
        throw new Error(`No arguments defined for type '${method.inputs}'`);
      bufferInputs = this.encodeType(op.args, method.inputs);
    }

    return {
      callContract: {
        contractId: this.id,
        entryPoint: method.entryPoint,
        args: bufferInputs,
      },
    };
  }

  /**
   * Decodes a contract operation to be human readable
   * @example
   * ```ts
   * const opDecoded = contract.decodeOperation({
   *   callContract: {
   *     contractId: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
   *     entryPoint: 0x62efa292,
   *     args: "MBWFsaWNlA2JvYgAAAAAAAAPo",
   *   }
   * });
   * console.log(opDecoded);
   * // {
   * //   name: "transfer",
   * //   args: {
   * //     from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
   * //     to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
   * //     value: "1000",
   * //   },
   * // }
   * ```
   */
  decodeOperation(op: CallContractOperationNested): DecodedOperationJson {
    if (!this.id) throw new Error("Contract id is not defined");
    if (!this.abi || !this.abi.methods)
      throw new Error("Methods are not defined");
    if (!op.callContract)
      throw new Error("Operation is not CallContractOperation");
    if (op.callContract.contractId !== this.id)
      throw new Error(
        `Invalid contract id. Expected: ${encodeBase58(
          this.id
        )}. Received: ${encodeBase58(op.callContract.contractId)}`
      );
    for (let i = 0; i < Object.keys(this.abi.methods).length; i += 1) {
      const opName = Object.keys(this.abi.methods)[i];
      const method = this.abi.methods[opName];
      if (op.callContract.entryPoint === method.entryPoint) {
        if (!method.inputs) return { name: opName };
        return {
          name: opName,
          args: this.decodeType(op.callContract.args, method.inputs),
        };
      }
    }
    throw new Error(`Unknown method id ${op.callContract.entryPoint}`);
  }

  /**
   * Function to encode a type using the protobuffer definitions
   * It also prepares the bytes for special cases (base58, hex string)
   */
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

  /**
   * Function to decode bytes using the protobuffer definitions
   * It also encodes the bytes for special cases (base58, hex string)
   */
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
