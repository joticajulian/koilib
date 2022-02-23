/* eslint-disable no-console */
import crypto from "crypto";
import * as dotenv from "dotenv";
import { Signer, Provider, Contract, utils, Serializer } from "../src";
import { BlockJson } from "../src/interface";
import powJson from "../src/jsonDescriptors/pow-proto.json";

dotenv.config();

jest.setTimeout(100000);

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
const signer2 = new Signer({
  privateKey: crypto.randomBytes(32).toString("hex"),
  provider,
});
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
    expect(blocks).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          block_id: expect.any(String) as string,
          block_height: expect.any(String) as string,
          block: {
            id: expect.any(String) as string,
            header: {
              previous: expect.any(String) as string,
              height: expect.any(String) as string,
              timestamp: expect.any(String) as string,
            },
            active: expect.any(String) as string,
            signature_data: expect.any(String) as string,
          },
        }),
      ])
    );
  });

  it("should get a a block with federated consensus and get the signer address", async () => {
    expect.assertions(2);
    const block = await provider.getBlock(1);
    const signer1 = await signer.recoverAddress(block.block);
    expect(signer1).toBeDefined();
    expect(signer1).toHaveLength(34);
  });

  it("should get a a block with pow consensus and get the signer address", async () => {
    expect.assertions(2);
    const block = await provider.getBlock(1000);
    const serializer = new Serializer(powJson, {
      defaultTypeName: "pow_signature_data",
    });
    interface PowSigData {
      nonce: string;
      recoverable_signature: string;
    }
    const signer1 = await signer.recoverAddress(block.block, {
      transformSignature: async (signatureData) => {
        const powSigData: PowSigData = await serializer.deserialize(
          signatureData
        );
        return powSigData.recoverable_signature;
      },
    });
    expect(signer1).toBeDefined();
    expect(signer1).toHaveLength(34);
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
    const { transaction } = await contract.deploy();
    expect(transaction).toBeDefined();
    if (!transaction) throw new Error("Transaction response undefined");
    const blockNumber = await transaction.wait("byBlock");
    expect(typeof blockNumber).toBe("number");
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
    expect(resultBalance2).toStrictEqual({ value: "0" });
  });

  it("should transfer and get receipt - wait byBlock", async () => {
    expect.assertions(5);
    const { operation, transaction, result } = await koin.transfer({
      from: signer.getAddress(),
      to: addressReceiver,
      value: Number(1e8).toString(),
    });
    expect(operation).toBeDefined();
    expect(transaction).toBeDefined();
    expect(result).toBeUndefined();
    if (!transaction) throw new Error("Transaction response undefined");
    const blockNumber = await transaction.wait(); // byBlock by default
    expect(typeof blockNumber).toBe("number");
    console.log(`Tx mined in block ${blockNumber}`);
  });

  it("should transfer and get receipt - wait byTransactionId", async () => {
    expect.assertions(6);
    const { operation, transaction, result } = await koin.transfer({
      from: signer.getAddress(),
      to: addressReceiver,
      value: Number(1e8).toString(),
    });
    expect(operation).toBeDefined();
    expect(transaction).toBeDefined();
    expect(result).toBeUndefined();
    if (!transaction) throw new Error("Transaction response undefined");
    const blockId = (await transaction.wait(
      "byTransactionId",
      30000
    )) as string;
    expect(typeof blockId).toBe("string");
    console.log(`Second tx mined in block id ${blockId}`);

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
