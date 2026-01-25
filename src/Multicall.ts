import { Contract } from "./Contract";
import { OperationJson } from "./interface";
import { ProviderInterface } from "./Provider";
import { Transaction } from "./Transaction";
import { multicallAbi } from "./abis/multicallAbi";

export class Multicall {
  /**
   * Multicall contract address
   */
  id: string;

  transaction: Transaction;

  contracts: Contract[];

  /**
   * @example
   * ```ts
   * const tokens = [
   *   "19GYjDBVXU7keLbYvMLazsGQn3GTWHjHkK", // koin
   *   "12Y5vW6gk8GceH53YfRkRre2Rrcsgw7Naq", // vhp
   *   "12VoHz41a4HtfiyhTWbg9RXqGMRbYk6pXh", // vortex usdt
   *   "1Tf1QKv3gVYLjq34yURSHw5ErTYbFjqTG", // vortex eth
   * ];
   * 
   * const provider = new Provider("https://api.koinos.io");
   * 
   * // create an array of the different contracts
   * // used in the multicall
   * const contracts = [];
   * for (const token of tokens) {
   *   contracts.push(
   *     new Contract({
   *       id: token,
   *       provider,
   *       abi: utils.tokenAbi,
   *     })
   *   );
   * }
   * 
   * // create the multicall instance
   * const multicall = new Multicall({
   *   provider,
   *   contracts
   * });
   * 
   * // add operations to the multicall
   * for (const contract of contracts) {
   *   await multicall.add(contract.functions.balanceOf, {
   *     owner: "1MdqwaSBy6rbasPJ9vmg2pZFJSVZ29GFpZ",
   *   });
   * }
   * 
   * // call the multicall
   * const results = await multicall.call();
   * console.log(results);
   * ```
   *
   * For testnet set the id to the multicall contract address for testnet
   * ```ts
   * const multicall = new Multicall({
   *   id: "1MM9ydA8SdgXvCTH3LdQ5FS8JvHijCmGSg",
   *   provider: new Provider("https://testnet-api.koinos.io"),
   *   contracts: [ koinContract, fogataPoolContract ],
   * });
   * ```
   */
  constructor(c: {
    /**
     * Multicall contract address. Leave it undefined 
     * to use the mainnet multicall contract address.
     */
    id?: string;
    provider?: ProviderInterface;
    contracts?: Contract[];
  }) {
    if (c.id) this.id = c.id;
    else this.id = "18dVCqPG3gwgL7DWQAciKYNuXfzEg5LW7"; // multicontract address mainnet
    this.transaction = new Transaction({ provider: c.provider });
    this.contracts = c.contracts || [];
  }

  async add(
    input:
      | OperationJson
      | { operation: OperationJson }
      | Promise<{ operation: OperationJson }>
      | Contract["functions"]["x"],
    args?: unknown
  ): Promise<void> {
    await this.transaction.pushOperation(input, args);
  }

  async call<T = Record<string, unknown>>(): Promise<(T | Error)[]> {
    const multicallContract = new Contract({
      id: this.id,
      provider: this.transaction.provider,
      abi: multicallAbi,
    });

    const calls = this.transaction.transaction.operations!.map(
      (op) => op.call_contract!
    );
    const { result: multicallResult } = await multicallContract.functions.get({
      calls,
    });

    const results: (T | Error)[] = [];

    for (let i = 0; i < calls.length; i += 1) {
      const contract = this.contracts.find(
        (c) => c.getId() === calls[i].contract_id
      );
      if (contract && contract.abi) {
        const method = Object.values(contract.abi.methods).find((method) => {
          return method.entry_point === calls[i].entry_point;
        });
        if (method) {
          const decoded = (await contract!.serializer!.deserialize(
            multicallResult!.results[i]!.res.object,
            method.return
          )) as T;
          results.push(decoded as T);
        } else {
          results.push(
            new Error(
              `Method ${calls[i].entry_point} not found in contract ${calls[i].contract_id}`
            )
          );
        }
      } else {
        results.push(new Error(`Contract ${calls[i].contract_id} not found`));
      }
    }

    return results;
  }
}
