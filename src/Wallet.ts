import ripemd160 from "noble-ripemd160";
import { abiUploadContractOperation } from "./abi";
import { Contract, DecodedOperation, EncodedOperation } from "./Contract";
import { Transaction } from "./interface";
import { Provider } from "./Provider";
import { serialize } from "./serializer";
import { Signer } from "./Signer";
import { VariableBlob } from "./VariableBlob";

/**
 * The Wallet Class combines all the features of [[Signer]],
 * [[Contract]], and [[Provider]] classes.
 *
 * @example **How to send transactions**
 *
 * ```ts
 * (async () => {
 *   // define signer, provider, and contract
 *   const signer = Signer.fromSeed("my seed");
 *   const provider = new Provider("http://45.56.104.152:8080");
 *   const contract = new Contract({
 *     id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
 *     entries: {
 *       transfer: {
 *         id: 0x62efa292,
 *         inputs: {
 *           type: [
 *             {
 *               name: "from",
 *               type: "string",
 *             },
 *             {
 *               name: "to",
 *               type: "string",
 *             },
 *             {
 *               name: "value",
 *               type: "uint64",
 *             },
 *           ],
 *         },
 *       },
 *       balance_of: {
 *         id: 0x15619248,
 *         inputs: { type: "string" },
 *         outputs: { type: "uint64" },
 *       },
 *     },
 *   });
 *
 *   // create a wallet with signer, provider and contract
 *   const wallet = new Wallet({ signer, provider, contract });
 *
 *   // encode a contract operation to make a transfer
 *   const opTransfer = wallet.encodeOperation({
 *     name: "transfer",
 *     args: {
 *       from: wallet.getAddress(),
 *       to: "bob",
 *       value: BigInt(1000),
 *     },
 *   });
 *
 *   // create a transaction
 *   const tx = await wallet.newTransaction({
 *     operations: [opTransfer],
 *   });
 *
 *   // sign and send transaction
 *   await wallet.signTransaction(tx);
 *   await wallet.sendTransaction(tx);
 * })();
 * ```
 *
 * @example **How to read contracts**
 * ```ts
 * (async () => {
 *   // define provider and contract
 *   const provider = new Provider("http://45.56.104.152:8080");
 *   const contract = new Contract({
 *     id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
 *     entries: {
 *       transfer: {
 *         id: 0x62efa292,
 *         inputs: {
 *           type: [
 *             {
 *               name: "from",
 *               type: "string",
 *             },
 *             {
 *               name: "to",
 *               type: "string",
 *             },
 *             {
 *               name: "value",
 *               type: "uint64",
 *             },
 *           ],
 *         },
 *       },
 *       balance_of: {
 *         id: 0x15619248,
 *         inputs: { type: "string" },
 *         outputs: { type: "uint64" },
 *       },
 *     },
 *   });
 *
 *   // create a wallet with provider and contract (signer is optional)
 *   const wallet = new Wallet({ provider, contract });
 *
 *   // read the contract providing the name of the contract funtion
 *   // and its arguments
 *   const balance = await wallet.readContract({
 *     name: "balance_of",
 *     args: wallet.getAddress(),
 *   });
 *
 *   console.log(Number(balance) / 1e8);
 * })();
 * ```
 *
 * @example **How to upload contracts**
 * ```ts
 * (async () => {
 *   // define signer, provider and wallet
 *   const signer = Signer.fromSeed("my seed");
 *   const provider = new Provider("http://45.56.104.152:8080");
 *   const wallet = new Wallet({ signer, provider });
 *
 *   // encode operation to upload the contract
 *   const bytecode = new Uint8Array([1, 2, 3, 4]);
 *   const op = Wallet.encodeUploadContractOperation(bytecode);
 *
 *   // create a transaction
 *   const tx = await wallet.newTransaction({
 *     operations: [op],
 *   });
 *
 *   // sign and send transaction
 *   await wallet.signTransaction(tx);
 *   await wallet.sendTransaction(tx);
 * })();
 * ```
 */
export class Wallet {
  /**
   * Class containing the private key. It is used to sign
   */
  private signer?: Signer;

  /**
   * Class defining the contract to interact with
   */
  public contract?: Contract;

  /**
   * Class to connect with the RPC node
   */
  public provider?: Provider;

  constructor(
    opts: {
      signer?: Signer;
      contract?: Contract;
      provider?: Provider;
    } = {
      signer: undefined,
      contract: undefined,
      provider: undefined,
    }
  ) {
    this.signer = opts.signer;
    this.contract = opts.contract;
    this.provider = opts.provider;
  }

  /**
   * Creates an unsigned transaction
   */
  async newTransaction(opts: {
    /**
     * Maximum resources to be used in the transaction.
     * By default it is 1000000
     */
    resource_limit?: number | bigint | string;

    /**
     * Array of operations.
     */
    operations?: {
      type: string;
      value: unknown;
    }[];

    /**
     * Boolean defining if the Provider should be used
     * to call the RPC node and get the nonce (see
     * [[Provider.getNonce]])
     */
    getNonce?: boolean;
  }): Promise<Transaction> {
    let nonce;
    if (opts.getNonce === false) nonce = 0;
    else {
      if (!this.provider)
        throw new Error(
          "Cannot get the nonce because provider is undefined. To ignore this call use getNonce:false in the parameters"
        );
      nonce = await this.getNonce(this.getAddress());
    }
    const resourceLimit =
      opts.resource_limit === undefined ? 1000000 : opts.resource_limit;
    const operations = opts.operations ? opts.operations : [];

    return {
      active_data: {
        resource_limit: resourceLimit,
        nonce,
        operations,
      },
    };
  }

  /**
   * The current implementation of Koinos expects a contract Id
   * derived from the account deploying the contract:
   * contractId = ripemd160(address serialized)
   * @returns contract id derived from address
   */
  static computeContractId(address: string) {
    const signerHash = ripemd160(serialize(address, { type: "string" }).buffer);
    return new VariableBlob(signerHash).toString();
  }

  /**
   * Function to encode an operation to upload or update a contract
   * @param bytecode - bytecode in multibase64 or Uint8Array
   */
  encodeUploadContractOperation(bytecode: string | Uint8Array): {
    type: string;
    value: {
      contract_id: string;
      bytecode: string;
      extensions: unknown;
    };
  } {
    if (!this.signer) throw new Error("Signer is undefined");

    const bytecodeBase64 =
      typeof bytecode === "string"
        ? bytecode
        : new VariableBlob(bytecode).toString();

    return {
      type: abiUploadContractOperation.name as string,
      value: {
        contract_id: Wallet.computeContractId(this.getAddress()),
        bytecode: bytecodeBase64,
        extensions: {},
      },
    };
  }

  // Signer

  /**
   * See [[Signer.getAddress]]
   */
  getAddress(compressed?: boolean): string {
    if (!this.signer) throw new Error("Signer is undefined");
    return this.signer.getAddress(compressed);
  }

  /**
   * See [[Signer.signTransaction]]
   */
  async signTransaction(tx: Transaction): Promise<Transaction> {
    if (!this.signer) throw new Error("Signer is undefined");
    return this.signer.signTransaction(tx);
  }

  // Contract

  /**
   * See [[Contract.encodeOperation]]
   */
  encodeOperation(op: DecodedOperation): EncodedOperation {
    if (!this.contract) throw new Error("Contract is undefined");
    return this.contract.encodeOperation(op);
  }

  /**
   * See [[Contract.decodeOperation]]
   */
  decodeOperation(op: EncodedOperation): DecodedOperation {
    if (!this.contract) throw new Error("Contract is undefined");
    return this.contract.decodeOperation(op);
  }

  /**
   * See [[Contract.decodeResult]]
   */
  decodeResult(result: string, opName: string): unknown {
    if (!this.contract) throw new Error("Contract is undefined");
    return this.contract.decodeResult(result, opName);
  }

  // Provider

  /**
   * See [[Provider.call]]
   */
  async call(method: string, params: unknown): Promise<unknown> {
    if (!this.provider) throw new Error("Provider is undefined");
    return this.provider.call(method, params);
  }

  /**
   * See [[Provider.getNonce]]
   */
  async getNonce(address: string): Promise<number> {
    if (!this.provider) throw new Error("Provider is undefined");
    return this.provider.getNonce(address);
  }

  /**
   * See [[Provider.sendTransaction]]
   */
  async sendTransaction(transaction: Transaction): Promise<unknown> {
    if (!this.provider) throw new Error("Provider is undefined");
    return this.provider.sendTransaction(transaction);
  }

  // Provider + Contract

  /**
   * Call the RPC node to read a contract. The operation to read
   * must be in the decoded format (see [[DecodedOperation]]). This
   * function will encode the operation using the contract definition,
   * call the RPC node, and decode the result.
   *
   * @example
   * ```
   * const balance = await wallet.readContract({
   *   name: "balance_of",
   *   args: "126LgExvJrLDQBsxA1Ddur2VjXJkyAbG91",
   * });
   * ```
   */
  async readContract(operation: DecodedOperation): Promise<unknown> {
    if (!this.provider) throw new Error("Provider is undefined");
    const op = this.encodeOperation(operation);
    const { result } = await this.provider.readContract(op);
    return this.decodeResult(result, operation.name);
  }
}

export default Wallet;
