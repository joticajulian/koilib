/* eslint-disable no-console */
import crypto from "crypto";
import * as dotenv from "dotenv";
import { Signer, Provider, Contract, utils } from "../src";

dotenv.config();

if (!process.env.RPC_NODES)
  throw new Error("env variable RPC_NODES not defined");
if (!process.env.PRIVATE_KEY_WIF)
  throw new Error("env variable PRIVATE_KEY not defined");

const privateKeyHex = process.env.PRIVATE_KEY_WIF;
const rpcNodes = process.env.RPC_NODES.split(",");
const provider = new Provider(rpcNodes);
// signer with history and balance
const signer = Signer.fromWif(privateKeyHex);
signer.compressed = true;
signer.provider = provider;
// random signer. No balance or history
const signer2 = new Signer(
  crypto.randomBytes(32).toString("hex"),
  true,
  provider
);
const koinContract = new Contract({
  id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
  abi: utils.Krc20Abi,
  provider,
  signer,
});
const koin = koinContract.functions;

describe("Provider", () => {
  it("should get nonce of random address", async () => {
    expect.assertions(1);
    const nonce = await provider.getNonce(signer2.getAddress());
    expect(nonce).toBe(0);
  });

  it("should get nonce", async () => {
    expect.assertions(1);
    const nonce = await provider.getNonce(signer.getAddress());
    console.log(`Nonce of ${signer.getAddress()} is ${nonce}`);
    expect(nonce).toBeDefined();
  });

  it("should get head info", async () => {
    expect.assertions(1);
    const headInfo = await provider.getHeadInfo();
    expect(headInfo).toStrictEqual({
      head_topology: {
        id: expect.stringContaining("0x1220") as string,
        height: expect.any(String) as string,
        previous: expect.stringContaining("0x1220") as string,
      },
      last_irreversible_block: expect.any(String) as string,
    });
  });
});

describe("Contract", () => {
  it.skip("upload a contract", async () => {
    expect.assertions(0);
    const bytecode = new Uint8Array(crypto.randomBytes(6));
    const contract = new Contract({ signer, provider, bytecode });
    await contract.deploy();
  });

  it("connect with koin smart contract", async () => {
    expect.assertions(3);

    const { result: resultName } = await koin.name();
    expect(resultName).toStrictEqual({ value: "Test Koinos" });

    const { result: resultBalance } = await koin.balanceOf<{ value: string }>({
      owner: signer.getAddress(),
    });
    expect(resultBalance).toStrictEqual({
      value: expect.any(String) as string,
    });
    console.log(
      `Balance of ${signer.getAddress()} is ${
        resultBalance ? resultBalance.value : "undefined"
      }`
    );

    const { result: resultBalance2 } = await koin.balanceOf({
      owner: signer2.getAddress(),
    });
    expect(resultBalance2).toBeUndefined();
  });
});
