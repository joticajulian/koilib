/* eslint-disable no-await-in-loop */
import { INamespace } from "protobufjs/light";
import { Signer, SignerInterface } from "./Signer";
import { Provider, SendTransactionResponse } from "./Provider";
import { Serializer } from "./Serializer";
import {
  CallContractOperationNested,
  UploadContractOperationNested,
  TransactionJson,
} from "./interface";
import { decodeBase58, encodeBase58, encodeBase64 } from "./utils";

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
 *       defaultOutput: { value: "0" },
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
 *
 * Note that this example uses "defaultOutput" for the method
 * "balanceOf". This is used when the smart contract returns an
 * empty response (for instance when there are no balance records
 * for a specific address) and you require a default output in
 * such cases.
 */
export interface Abi {
  methods: {
    /** Name of the method */
    [x: string]: {
      /** Entry point ID */
      entryPoint: number;
      /** Protobuffer type for input */
      input?: string;
      /** Protobuffer type for output */
      output?: string;
      /** Boolean to differentiate write methods
       * (using transactions) from read methods
       * (query the contract)
       */
      readOnly?: boolean;
      /** Default value when the output is undefined */
      defaultOutput?: unknown;
      /** Optional function to preformat the input */
      preformatInput?: (input: unknown) => Record<string, unknown>;
      /** Optional function to preformat the output */
      preformatOutput?: (output: Record<string, unknown>) => unknown;
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
   * Set of functions to interact with the smart
   * contract. These functions are automatically generated
   * in the constructor of the class
   */
  functions: {
    [x: string]: <T = Record<string, unknown>>(
      args?: unknown,
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
   * Serializer to serialize/deserialize data types
   */
  serializer?: Serializer;

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
    serializer?: Serializer;
  }) {
    if (c.id) this.id = decodeBase58(c.id);
    this.signer = c.signer;
    this.provider = c.provider || c.signer?.provider;
    this.abi = c.abi;
    this.bytecode = c.bytecode;
    if (c.serializer) {
      this.serializer = c.serializer;
    } else if (c.abi && c.abi.types) {
      this.serializer = new Serializer(c.abi.types);
    }
    this.options = {
      rcLimit: 1e8,
      sendTransaction: true,
      sendAbis: true,
      ...c.options,
    };
    this.functions = {};

    if (
      this.signer &&
      this.provider &&
      this.abi &&
      this.abi.methods &&
      this.serializer
    ) {
      Object.keys(this.abi.methods).forEach((name) => {
        this.functions[name] = async <T = Record<string, unknown>>(
          argu: unknown = {},
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
          if (!this.abi.methods[name])
            throw new Error(`Method ${name} not defined in the ABI`);
          const opts = {
            ...this.options,
            ...options,
          };

          const {
            readOnly,
            output,
            defaultOutput,
            preformatInput,
            preformatOutput,
          } = this.abi.methods[name];
          let args: Record<string, unknown>;
          if (typeof preformatInput === "function") {
            args = preformatInput(argu);
          } else {
            args = argu as Record<string, unknown>;
          }

          const operation = await this.encodeOperation({ name, args });

          if (readOnly) {
            if (!output) throw new Error(`No output defined for ${name}`);
            // read contract
            const { result: resultEncoded } = await this.provider.readContract({
              contractId: encodeBase58(operation.callContract.contractId),
              entryPoint: operation.callContract.entryPoint,
              args: encodeBase64(operation.callContract.args),
            });
            let result = defaultOutput as T;
            if (resultEncoded) {
              result = await this.serializer!.deserialize<T>(
                resultEncoded,
                output
              );
            }
            if (typeof preformatOutput === "function") {
              result = preformatOutput(result as Record<string, unknown>) as T;
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
  async encodeOperation(
    op: DecodedOperationJson
  ): Promise<CallContractOperationNested> {
    if (!this.abi || !this.abi.methods || !this.abi.methods[op.name])
      throw new Error(`Operation ${op.name} unknown`);
    if (!this.serializer) throw new Error("Serializer is not defined");
    if (!this.id) throw new Error("Contract id is not defined");
    const method = this.abi.methods[op.name];

    let bufferInputs = new Uint8Array(0);
    if (method.input) {
      if (!op.args)
        throw new Error(`No arguments defined for type '${method.input}'`);
      bufferInputs = await this.serializer.serialize(op.args, method.input);
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
  async decodeOperation(
    op: CallContractOperationNested
  ): Promise<DecodedOperationJson> {
    if (!this.id) throw new Error("Contract id is not defined");
    if (!this.abi || !this.abi.methods)
      throw new Error("Methods are not defined");
    if (!this.serializer) throw new Error("Serializer is not defined");
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
        if (!method.input) return { name: opName };
        return {
          name: opName,
          args: await this.serializer.deserialize(
            op.callContract.args,
            method.input
          ),
        };
      }
    }
    throw new Error(`Unknown method id ${op.callContract.entryPoint}`);
  }
}

export default Contract;
