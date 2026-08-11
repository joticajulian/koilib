import dotenv from "dotenv";
import { Provider, Multicall, Contract, utils } from "../src";

dotenv.config();

if (!process.env.RPC_NODES)
  throw new Error("env variable RPC_NODES not defined");

const rpcNodes = process.env.RPC_NODES.split(",");
const provider = new Provider(rpcNodes);

const tokens = [
  "19GYjDBVXU7keLbYvMLazsGQn3GTWHjHkK", // koin
  "12Y5vW6gk8GceH53YfRkRre2Rrcsgw7Naq", // vhp
  "12VoHz41a4HtfiyhTWbg9RXqGMRbYk6pXh", // vortex usdt
  "1Tf1QKv3gVYLjq34yURSHw5ErTYbFjqTG", // vortex eth
];

describe("Multicall", () => {
  it("should create a multicall instance", async () => {
    const contracts: Contract[] = [];
    for (const token of tokens) {
      contracts.push(
        new Contract({
          id: token,
          provider,
          abi: utils.tokenAbi,
        })
      );
    }
    const multicall = new Multicall({ provider, contracts });

    for (const contract of contracts) {
      // add operations to the multicall
      await multicall.add(contract.functions.balanceOf, {
        owner: "1MdqwaSBy6rbasPJ9vmg2pZFJSVZ29GFpZ",
      });
    }

    // call the multicall
    const results = await multicall.call();
    expect(results).toHaveLength(tokens.length);
    expect(results).toStrictEqual(
      expect.arrayContaining([
        {
          value: expect.any(String) as string,
        },
      ])
    );
  });
});
