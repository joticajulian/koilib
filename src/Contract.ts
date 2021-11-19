/* eslint-disable no-await-in-loop */
import { Signer, SignerInterface } from "./Signer";
import { Provider } from "./Provider";
import { Serializer } from "./Serializer";
import {
  CallContractOperationNested,
  UploadContractOperationNested,
  TransactionJson,
  Abi,
  TransactionOptions,
  DecodedOperationJson,
  SendTransactionResponse,
} from "./interface";
import { decodeBase58, encodeBase58, encodeBase64 } from "./utils";

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
 * const privateKey = "f186a5de49797bfd52dc42505c33d75a46822ed5b60046e09d7c336242e20200";
 * const provider = new Provider(rpcNodes);
 * const signer = new Signer({ privateKey, provider });
 * const koinContract = new Contract({
 *   id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
 *   abi: utils.Krc20Abi,
 *   provider,
 *   signer,
 * });
 * const koin = koinContract.functions;
 *
 * // optional: preformat input/output
 * koinContract.abi.methods.balanceOf.preformatInput = (owner) =>
 *   ({ owner });
 * koinContract.abi.methods.balanceOf.preformatOutput = (res) =>
 *   utils.formatUnits(res.value, 8);
 * koinContract.abi.methods.transfer.preformatInput = (input) => ({
 *   from: signer.getAddress(),
 *   to: input.to,
 *   value: utils.parseUnits(input.value, 8),
 * });
 *
 * async funtion main() {
 *   // Get balance
 *   const { result } = await koin.balanceOf("12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD");
 *   console.log(result)
 *
 *   // Transfer
 *   const { transaction, transactionResponse } = await koin.transfer({
 *     to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
 *     value: "10.0001",
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
   *
   * @example
   * ```ts
   * const owner = "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb";
   * await koinContract.functions.balanceOf({ owner });
   * ```
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
    /**
     * Set this option if you can not use _eval_ functions
     * in the current environment. In such cases, the
     * serializer must come from an environment where it
     * is able to use those functions.
     */
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
   * const privateKey = "f186a5de49797bfd52dc42505c33d75a46822ed5b60046e09d7c336242e20200";
   * const provider = new Provider(["http://api.koinos.io:8080"]);
   * const signer = new Signer({ privateKey, provider });
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
