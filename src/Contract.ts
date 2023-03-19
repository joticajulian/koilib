/* eslint-disable no-await-in-loop */
import { Signer, SignerInterface } from "./Signer";
import { Provider } from "./Provider";
import { Serializer } from "./Serializer";
import {
  TransactionJsonWait,
  Abi,
  CallContractOptions,
  DecodedOperationJson,
  OperationJson,
  DeployOptions,
  TransactionReceipt,
  EventData,
  DecodedEventData,
} from "./interface";
import { decodeBase58, encodeBase58, encodeBase64url } from "./utils";

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
 *   abi: utils.tokenAbi,
 *   provider,
 *   signer,
 * });
 * const koin = koinContract.functions;
 *
 * // optional: preformat argument/return
 * koinContract.abi.methods.balanceOf.preformat_argument = (owner) =>
 *   ({ owner });
 * koinContract.abi.methods.balanceOf.preformat_return = (res) =>
 *   utils.formatUnits(res.value, 8);
 * koinContract.abi.methods.transfer.preformat_argument = (arg) => ({
 *   from: signer.getAddress(),
 *   to: arg.to,
 *   value: utils.parseUnits(arg.value, 8),
 * });
 *
 * async funtion main() {
 *   // Get balance
 *   const { result } = await koin.balanceOf("12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD");
 *   console.log(result)
 *
 *   // Transfer
 *   const { transaction, receipt } = await koin.transfer({
 *     to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
 *     value: "10.0001",
 *   });
 *   console.log(`Transaction id ${transaction.id} submitted. Receipt:`);
 *   console.log(receipt);
 *
 *   if (receipt.logs) {
 *     console.log(`Transfer failed. Logs: ${receipt.logs.join(",")}`);
 *   }
 *
 *   // wait to be mined
 *   const blockNumber = await transaction.wait();
 *   console.log(`Transaction mined. Block number: ${blockNumber}`);
 * }
 *
 * main();
 * ```
 */
export class Contract {
  /**
   * Contract ID
   */
  id: Uint8Array;

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
   *
   * @example using options
   * ```ts
   * await koinContract.functions.transfer({
   *   from: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
   *   to: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
   *   value: "1",
   * },{
   *   chainId: "EiB-hw5ABo-EXy6fGDd1Iq3gbAenxQ4Qe60pRbEVMVrR9A==",
   *   rcLimit: "100000000",
   *   nonce: "OAI=",
   *   payer: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
   *   payee: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
   *   signTransaction: true,
   *   sendTransaction: true,
   *   broadcast: true,
   *   sendAbis: true,
   * });
   * ```
   */
  functions: {
    [x: string]: <T = Record<string, unknown>>(
      args?: unknown,
      opts?: CallContractOptions
    ) => Promise<{
      operation: OperationJson;
      transaction?: TransactionJsonWait;
      result?: T;
      receipt?: TransactionReceipt;
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
   * By default it set rc_limit to 1e8, sendTransaction true,
   * sendAbis true, and nonce undefined (to get it from the blockchain)
   */
  options: CallContractOptions;

  constructor(c: {
    id?: string;
    abi?: Abi;
    bytecode?: Uint8Array;
    options?: CallContractOptions;
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
    this.signer = c.signer;
    if (c.id) this.id = decodeBase58(c.id);
    else {
      if (!this.signer)
        throw new Error("at least signer or contract id must be defined");
      this.id = decodeBase58(this.signer.getAddress());
    }
    this.provider = c.provider || c.signer?.provider;
    this.abi = c.abi;
    this.bytecode = c.bytecode;
    if (c.serializer) {
      this.serializer = c.serializer;
    } else if (c.abi && c.abi.koilib_types) {
      this.serializer = new Serializer(c.abi.koilib_types);
    } else if (c.abi && c.abi.types) {
      this.serializer = new Serializer(c.abi.types);
    }
    this.options = {
      signTransaction: true,
      sendTransaction: true,
      broadcast: true,
      sendAbis: true,
      ...c.options,
    };
    this.functions = {};
    this.updateFunctionsFromAbi();
  }

  /**
   * Get contract Id
   */
  getId(): string {
    return encodeBase58(this.id);
  }

  /**
   * Fetch the ABI from the contract meta store. The provider must
   * have contract_meta_store microservice enabled.
   */
  async fetcthAbi(
    opts: {
      updateFunctions: boolean;
      updateSerializer: boolean;
    } = {
      updateFunctions: true,
      updateSerializer: true,
    }
  ): Promise<Abi | undefined> {
    if (!this.provider) throw new Error("provider not found");
    const response = await this.provider.call<{ meta: { abi: string } }>(
      "contract_meta_store.get_contract_meta",
      {
        contract_id: this.getId(),
      }
    );
    if (!response.meta || !response.meta.abi) return undefined;
    this.abi = JSON.parse(response.meta.abi) as Abi;
    if (opts.updateFunctions) this.updateFunctionsFromAbi();
    if (opts.updateSerializer) {
      if (this.abi.koilib_types)
        this.serializer = new Serializer(this.abi.koilib_types);
      else if (this.abi.types) this.serializer = new Serializer(this.abi.types);
    }

    return this.abi;
  }

  /**
   * Create the contract functions based on the ABI
   */
  updateFunctionsFromAbi(): boolean {
    if (!this.abi || !this.abi.methods) return false;
    Object.keys(this.abi.methods).forEach((name) => {
      this.functions[name] = async <T = Record<string, unknown>>(
        argu: unknown = {},
        options?: CallContractOptions
      ): Promise<{
        operation: OperationJson;
        transaction?: TransactionJsonWait;
        result?: T;
        receipt?: TransactionReceipt;
      }> => {
        if (!this.provider) throw new Error("provider not found");
        if (!this.abi || !this.abi.methods)
          throw new Error("Methods are not defined");
        if (!this.abi.methods[name])
          throw new Error(`Method ${name} not defined in the ABI`);
        const opts: CallContractOptions = {
          ...this.options,
          ...options,
        };

        const {
          read_only: readOnly,
          return: output,
          default_output: defaultOutput,
          preformat_argument: preformatArgument,
          preformat_return: preformatReturn,
        } = this.abi.methods[name];
        let args: Record<string, unknown>;
        if (typeof preformatArgument === "function") {
          args = preformatArgument(argu);
        } else {
          args = argu as Record<string, unknown>;
        }

        const operation = await this.encodeOperation({ name, args });

        if (opts.onlyOperation) {
          return { operation };
        }

        if (readOnly) {
          if (!output) throw new Error(`No output defined for ${name}`);
          // read contract
          const { result: resultEncoded } = await this.provider.readContract(
            operation.call_contract!
          );
          let result = defaultOutput as T;
          if (resultEncoded) {
            result = await this.serializer!.deserialize<T>(
              resultEncoded,
              output
            );
          }
          if (typeof preformatReturn === "function") {
            result = preformatReturn(result as Record<string, unknown>) as T;
          }
          return { operation, result };
        }

        // write contract (sign and send)
        if (!this.signer) throw new Error("signer not found");
        let tx = await this.signer.prepareTransaction({
          header: {
            ...(opts.chainId && { chain_id: opts.chainId }),
            ...(opts.rcLimit && { rc_limit: opts.rcLimit }),
            ...(opts.nonce && { nonce: opts.nonce }),
            ...(opts.payer && { payer: opts.payer }),
            ...(opts.payee && { payee: opts.payee }),
          },
          operations: [
            ...(opts.previousOperations ? opts.previousOperations : []),
            operation,
            ...(opts.nextOperations ? opts.nextOperations : []),
          ],
        });

        if (opts.sendAbis) {
          if (!opts.abis) opts.abis = {};
          const contractId = this.getId();
          if (!opts.abis[contractId]) opts.abis[contractId] = this.abi;
        }

        // return result if the transaction will not be broadcasted
        if (!opts.sendTransaction) {
          const noWait = () => {
            throw new Error("This transaction was not broadcasted");
          };
          if (opts.signTransaction)
            tx = await this.signer.signTransaction(
              tx,
              opts.sendAbis ? opts.abis : undefined
            );
          return { operation, transaction: { ...tx, wait: noWait } };
        }

        const { transaction, receipt } = await this.signer.sendTransaction(
          tx,
          opts
        );
        return { operation, transaction, receipt };
      };
    });
    return true;
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
   * const { transaction, receipt } = await contract.deploy();
   * console.log(receipt);
   * // wait to be mined
   * const blockNumber = await transaction.wait();
   * console.log(`Contract uploaded in block number ${blockNumber}`);
   * ```
   *
   * @example using options
   * ```ts
   * const { transaction, receipt } = await contract.deploy({
   *   // contract options
   *   abi: "CssCChRrb2lub3Mvb3B0aW9ucy5wc...",
   *   authorizesCallContract: true,
   *   authorizesTransactionApplication: true,
   *   authorizesUploadContract: true,
   *
   *   // transaction options
   *   chainId: "EiB-hw5ABo-EXy6fGDd1Iq3gbAenxQ4Qe60pRbEVMVrR9A==",
   *   rcLimit: "100000000",
   *   nonce: "OAI=",
   *   payer: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
   *   payee: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
   *
   *   // sign and broadcast
   *   signTransaction: true,
   *   sendTransaction: true,
   *   broadcast: true,
   * });
   * console.log(receipt);
   * // wait to be mined
   * const blockNumber = await transaction.wait();
   * console.log(`Contract uploaded in block number ${blockNumber}`);
   * ```
   */
  async deploy(options?: DeployOptions): Promise<{
    operation: OperationJson;
    transaction?: TransactionJsonWait;
    receipt?: TransactionReceipt;
  }> {
    if (!this.signer) throw new Error("signer not found");
    if (!this.bytecode) throw new Error("bytecode not found");
    const opts: DeployOptions = {
      ...this.options,
      ...options,
    };

    const contractId = this.getId();

    const operation = {
      upload_contract: {
        contract_id: contractId,
        bytecode: encodeBase64url(this.bytecode),
        ...(opts.abi && { abi: opts.abi }),
        ...(opts.authorizesCallContract && {
          authorizes_call_contract: opts.authorizesCallContract,
        }),
        ...(opts.authorizesTransactionApplication && {
          authorizes_transaction_application:
            opts.authorizesTransactionApplication,
        }),
        ...(opts.authorizesUploadContract && {
          authorizes_upload_contract: opts.authorizesUploadContract,
        }),
      },
    } as OperationJson;

    if (opts.onlyOperation) {
      return { operation };
    }

    let tx = await this.signer.prepareTransaction({
      header: {
        ...(opts.chainId && { chain_id: opts.chainId }),
        ...(opts.rcLimit && { rc_limit: opts.rcLimit }),
        ...(opts.nonce && { nonce: opts.nonce }),
        ...(opts.payer && { payer: opts.payer }),
        ...(opts.payee && { payee: opts.payee }),
      },
      operations: [
        ...(opts.previousOperations ? opts.previousOperations : []),
        operation,
        ...(opts.nextOperations ? opts.nextOperations : []),
      ],
    });

    // return result if the transaction will not be broadcasted
    if (!opts.sendTransaction) {
      const noWait = () => {
        throw new Error("This transaction was not broadcasted");
      };
      if (opts.signTransaction)
        tx = await this.signer.signTransaction(
          tx,
          opts.sendAbis ? opts.abis : undefined
        );
      return { operation, transaction: { ...tx, wait: noWait } };
    }

    const { transaction, receipt } = await this.signer.sendTransaction(
      tx,
      opts
    );
    return { operation, transaction, receipt };
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
   * //   call_contract: {
   * //     contract_id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
   * //     entry_point: 670398154,
   * //     args: "ChkAEjl6vrl55V2Oym_rzsnMxIqBoie9PHmMEhkAQgjT1UACatdFY3e5QRkyG7OAzwcCCIylGOgH",
   * //   }
   * // }
   * ```
   */
  async encodeOperation(op: DecodedOperationJson): Promise<OperationJson> {
    if (!this.abi || !this.abi.methods || !this.abi.methods[op.name])
      throw new Error(`Operation ${op.name} unknown`);
    if (!this.serializer) throw new Error("Serializer is not defined");
    const method = this.abi.methods[op.name];

    let bufferArguments = new Uint8Array(0);
    if (method.argument) {
      if (!op.args)
        throw new Error(`No arguments defined for type '${method.argument}'`);
      bufferArguments = await this.serializer.serialize(
        op.args,
        method.argument
      );
    }

    return {
      call_contract: {
        contract_id: this.getId(),
        entry_point: method.entry_point,
        args: encodeBase64url(bufferArguments),
      },
    };
  }

  /**
   * Decodes a contract operation to be human readable
   * @example
   * ```ts
   * const opDecoded = contract.decodeOperation({
   *   call_contract: {
   *     contract_id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
   *     entry_point: 0x27f576ca,
   *     args: "ChkAEjl6vrl55V2Oym_rzsnMxIqBoie9PHmMEhkAQgjT1UACatdFY3e5QRkyG7OAzwcCCIylGOgH",
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
  async decodeOperation(op: OperationJson): Promise<DecodedOperationJson> {
    if (!this.abi || !this.abi.methods)
      throw new Error("Methods are not defined");
    if (!this.serializer) throw new Error("Serializer is not defined");
    if (!op.call_contract)
      throw new Error("Operation is not CallContractOperation");
    if (op.call_contract.contract_id !== this.getId())
      throw new Error(
        `Invalid contract id. Expected: ${this.getId()}. Received: ${
          op.call_contract.contract_id
        }`
      );
    for (let i = 0; i < Object.keys(this.abi.methods).length; i += 1) {
      const opName = Object.keys(this.abi.methods)[i];
      const method = this.abi.methods[opName];
      if (op.call_contract.entry_point === method.entry_point) {
        if (!method.argument) return { name: opName };
        return {
          name: opName,
          args: await this.serializer.deserialize(
            op.call_contract.args,
            method.argument
          ),
        };
      }
    }
    throw new Error(`Unknown method id ${op.call_contract.entry_point}`);
  }

  async decodeEvent(event: EventData): Promise<DecodedEventData> {
    if (!this.serializer) throw new Error("Serializer is not defined");
    let typeName = event.name;
    if (this.abi && this.abi.events && this.abi.events[event.name]) {
      typeName = this.abi.events[event.name].argument as string;
    }
    const args = typeName
      ? await this.serializer.deserialize(event.data, typeName)
      : {};
    return { ...event, args };
  }
}

export default Contract;
