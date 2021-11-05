/* eslint-disable no-console */
import crypto from "crypto";
import * as dotenv from "dotenv";
import { Signer, Provider, Contract, utils } from "../src";
import { BlockJson } from "../src/interface";

dotenv.config();

jest.setTimeout(60000);

if (!process.env.RPC_NODES)
  throw new Error("env variable RPC_NODES not defined");
if (!process.env.PRIVATE_KEY_WIF)
  throw new Error("env variable PRIVATE_KEY not defined");
if (!process.env.ADDRESS_RECEIVER)
  throw new Error("env variable ADDRESS_RECEIVER not defined");

const privateKeyHex = process.env.PRIVATE_KEY_WIF;
const rpcNodes = process.env.RPC_NODES.split(",");
const addressReceiver = process.env.ADDRESS_RECEIVER;
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

  it("should get blocks by height", async () => {
    expect.assertions(1);
    const blocks = await provider.getBlocks(1, 2);
    expect(blocks).toStrictEqual(expect.arrayContaining([]));
  });

  it("should get account rc", async () => {
    expect.assertions(1);
    const rc = await provider.getAccountRc(signer.getAddress());
    expect(rc).toBeDefined();
  });
});

describe("Contract", () => {
  it("upload a contract", async () => {
    expect.assertions(2);
    const bytecode = new Uint8Array(crypto.randomBytes(6));
    const contract = new Contract({ signer, provider, bytecode });
    const { transactionResponse } = await contract.deploy();
    expect(transactionResponse).toBeDefined();
    if (!transactionResponse) throw new Error("Transaction response undefined");
    const blockId = await transactionResponse.wait();
    expect(typeof blockId).toBe("string");
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
        resultBalance ? Number(resultBalance.value) / 1e8 : "undefined"
      } tKoin`
    );

    const { result: resultBalance2 } = await koin.balanceOf({
      owner: signer2.getAddress(),
    });
    expect(resultBalance2).toBeUndefined();
  });

  it("should transfer and get receipt", async () => {
    expect.assertions(6);
    const { operation, transaction, transactionResponse, result } =
      await koin.transfer({
        from: signer.getAddress(),
        to: addressReceiver,
        value: Number(1e8).toString(),
      });
    expect(operation).toBeDefined();
    expect(transaction).toBeDefined();
    expect(transactionResponse).toBeDefined();
    expect(result).toBeUndefined();
    if (!transactionResponse) throw new Error("Transaction response undefined");
    const blockId = await transactionResponse.wait();
    expect(typeof blockId).toBe("string");

    const blocksByIdResponse = await provider.getBlocksById([blockId]);
    expect(blocksByIdResponse).toStrictEqual({
      block_items: [
        {
          block_id: blockId,
          block_height: expect.any(String) as string,
          block: expect.objectContaining({}) as BlockJson,
        },
      ],
    });
  });
});
