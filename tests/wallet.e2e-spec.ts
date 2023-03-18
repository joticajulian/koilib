/* eslint-disable no-console */
import crypto from "crypto";
import * as dotenv from "dotenv";
import {
  Signer,
  Provider,
  Contract,
  utils,
  Serializer,
  Transaction,
} from "../src";
import { BlockJson, TransactionReceipt } from "../src/interface";
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
const signer = Signer.fromWif(privateKeyHex, true);
signer.provider = provider;
// random signer. No balance or history
const signer2 = new Signer({
  privateKey: crypto.randomBytes(32).toString("hex"),
  provider,
});
const koinContract = new Contract({
  id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
  abi: utils.tokenAbi,
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
    expect.assertions(2);
    const nonce = (await provider.getNonce(signer.getAddress())) as number;
    console.log(`Nonce of ${signer.getAddress()} is ${nonce}`);
    expect(nonce).toBeDefined();
    expect(Number.isNaN(nonce)).toBeFalsy();
  });

  it("should get head info", async () => {
    expect.assertions(1);
    const headInfo = await provider.getHeadInfo();
    expect(headInfo).toStrictEqual({
      head_block_time: expect.any(String) as string,
      head_topology: {
        id: expect.stringContaining("0x1220") as string,
        height: expect.any(String) as string,
        previous: expect.stringContaining("0x1220") as string,
      },
      last_irreversible_block: expect.any(String) as string,
      head_state_merkle_root: expect.any(String) as string,
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
          block: expect.objectContaining({
            id: expect.any(String) as string,
            header: {
              previous: expect.any(String) as string,
              height: expect.any(String) as string,
              timestamp: expect.any(String) as string,
              previous_state_merkle_root: expect.any(String) as string,
              transaction_merkle_root: expect.any(String) as string,
              signer: expect.any(String) as string,
            },
            signature: expect.any(String) as string,
          }) as unknown,
        }),
      ])
    );
  });

  it("should get a a block with federated consensus and get the signer address", async () => {
    expect.assertions(2);
    const block = await provider.getBlock(12);
    expect(block).toStrictEqual({
      block_id: expect.any(String) as string,
      block_height: "12",
      block: expect.objectContaining({
        id: expect.any(String) as string,
        header: {
          previous: expect.any(String) as string,
          height: "12",
          timestamp: expect.any(String) as string,
          previous_state_merkle_root: expect.any(String) as string,
          transaction_merkle_root: expect.any(String) as string,
          signer: expect.any(String) as string,
        },
        signature: expect.any(String) as string,
      }) as BlockJson,
    });
    const [signer1] = await signer.recoverAddresses(block.block);
    expect(signer1).toBe(block.block.header!.signer);
  });

  it.skip("should get a a block with pow consensus and get the signer address", async () => {
    expect.assertions(2);
    const block = await provider.getBlock(1000);
    expect(block).toStrictEqual({
      block_id: expect.any(String) as string,
      block_height: "1000",
      block: expect.objectContaining({
        id: expect.any(String) as string,
        header: {
          previous: expect.any(String) as string,
          height: "1000",
          timestamp: expect.any(String) as string,
          previous_state_merkle_root: expect.any(String) as string,
          transaction_merkle_root: expect.any(String) as string,
          signer: expect.any(String) as string,
        },
        signature: expect.any(String) as string,
      }) as BlockJson,
    });

    const serializer = new Serializer(powJson, {
      defaultTypeName: "pow_signature_data",
    });
    interface PowSigData {
      nonce: string;
      recoverable_signature: string;
    }
    const [signer1] = await signer.recoverAddresses(block.block, {
      transformSignature: async (signatureData) => {
        const powSigData: PowSigData = await serializer.deserialize(
          signatureData
        );
        return powSigData.recoverable_signature;
      },
    });

    expect(signer1).toBe(block.block.header!.signer);
  });

  it("should get account rc", async () => {
    expect.assertions(1);
    const rc = await provider.getAccountRc(signer.getAddress());
    expect(rc).toBeDefined();
  });
});

describe("Contract", () => {
  it("should pay a transaction to upload a contract, and override functions", async () => {
    const bytecode = new Uint8Array(crypto.randomBytes(2));
    const newSigner = new Signer({
      privateKey: crypto.randomBytes(32).toString("hex"),
      provider,
    });
    const contract = new Contract({ signer: newSigner, provider, bytecode });
    const { transaction } = await contract.deploy({
      abi: "test",
      authorizesCallContract: true,
      authorizesTransactionApplication: true,
      authorizesUploadContract: true,
      payer: signer.address,
      sendTransaction: false,
    });
    await signer.signTransaction(transaction!);
    expect(transaction!.signatures).toHaveLength(2);
    await signer.sendTransaction(transaction!);
    const waitResult = await transaction!.wait();
    expect(waitResult).toStrictEqual({
      blockNumber: expect.any(Number) as number,
      blockId: expect.any(String) as string,
    });
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
    expect.assertions(4);
    const { operation, transaction, result, receipt } = await koin.transfer({
      from: signer.getAddress(),
      to: addressReceiver,
      value: Number(1e6).toString(),
    });
    expect(operation).toBeDefined();
    expect(transaction).toBeDefined();
    expect(result).toBeUndefined();
    expect(receipt).toStrictEqual(
      expect.objectContaining({
        id: expect.any(String) as string,
        payer: signer.getAddress(),
      }) as TransactionReceipt
    );
    if (!transaction) throw new Error("Transaction response undefined");
    const { blockNumber, blockId } = await transaction.wait(); // byBlock by default
    console.log(`Tx mined in block ${blockNumber ?? "?"} (${blockId})`);
  });

  it("should transfer and get receipt - wait byTransactionId", async () => {
    expect.assertions(6);
    const { operation, transaction, result, receipt } = await koin.transfer({
      from: signer.getAddress(),
      to: addressReceiver,
      value: Number(1e8).toString(),
    });
    expect(operation).toBeDefined();
    expect(transaction).toBeDefined();
    expect(result).toBeUndefined();
    expect(receipt).toStrictEqual(
      expect.objectContaining({
        id: expect.any(String) as string,
        payer: signer.getAddress(),
      }) as TransactionReceipt
    );
    if (!transaction) throw new Error("Transaction response undefined");
    const { blockId } = await transaction.wait("byTransactionId", 15000);
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

  it("should submit an invalid transfer", async () => {
    expect.assertions(1);
    await expect(
      koin.transfer({
        from: signer.getAddress(),
        to: signer.getAddress(),
        value: "100",
      })
    ).rejects.toThrow(
      JSON.stringify({
        error: "cannot transfer to self",
        code: 1,
        logs: [],
      })
    );
  });

  it("should decode an event", async () => {
    const contract = new Contract({
      id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
      abi: utils.tokenAbi,
    });
    const event = {
      sequence: 1,
      source: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
      name: "koinos.contracts.token.mint_event",
      data: "ChkAxjdqxuwS-B50lPQ-lqhRBA3bf2b2ooAHENrw3Ek=",
      impacted: ["1K55BRw87nd64a7aiRarp6DLGRzYvoJo8J"],
    };
    const eventDecoded = await contract.decodeEvent(event);
    expect(eventDecoded).toStrictEqual({
      ...event,
      args: {
        to: "1K55BRw87nd64a7aiRarp6DLGRzYvoJo8J",
        value: "154613850",
      },
    });
  });

  it("should decode an event with method 2", async () => {
    const contract = new Contract({
      id: "1MbsVfNw6yzQqA8499d8KQj8qdLyRs8CzW",
      provider: new Provider(["http://api.koinos.io"]),
    });
    const abi = await contract.fetcthAbi();
    expect(abi).toBeDefined();
    contract.serializer = new Serializer(contract.abi!.koilib_types);
    const event = {
      sequence: 7,
      source: "1MbsVfNw6yzQqA8499d8KQj8qdLyRs8CzW",
      name: "fogata.unstake",
      data: "ChkAqocFjiIpkbTkq1rYuanW_MiuJ2k0p9NbEMDh2fgCILHmzvYC",
      impacted: ["1GYfd5qR9CNZxtN34pDo5bEkGkXy8PWJfL"],
    };
    const eventDecoded = await contract.decodeEvent(event);
    expect(eventDecoded).toStrictEqual({
      ...event,
      args: {
        account: "1GYfd5qR9CNZxtN34pDo5bEkGkXy8PWJfL",
        koin_amount: "789999808",
        vhp_amount: "0",
        stake: "785625905",
      },
    });
  });
});

describe("Transaction", () => {
  it("should make multiple transfers using Transaction class", async () => {
    expect.assertions(4);
    const tx = new Transaction({ signer });
    await tx.pushOperation(koin.transfer, {
      from: signer.getAddress(),
      to: addressReceiver,
      value: "1",
    });
    await tx.pushOperation(koin.transfer, {
      from: signer.getAddress(),
      to: addressReceiver,
      value: "2",
    });
    const receipt = await tx.send({ broadcast: false });
    expect(receipt).toStrictEqual({
      compute_bandwidth_used: expect.any(String) as string,
      disk_storage_used: expect.any(String) as string,
      events: [
        {
          data: expect.any(String) as string,
          impacted: [addressReceiver, signer.address],
          name: "koinos.contracts.token.transfer_event",
          source: koinContract.getId(),
        },
        {
          data: expect.any(String) as string,
          impacted: [addressReceiver, signer.address],
          name: "koinos.contracts.token.transfer_event",
          sequence: 1,
          source: koinContract.getId(),
        },
      ],
      id: expect.any(String) as string,
      max_payer_rc: expect.any(String) as string,
      network_bandwidth_used: expect.any(String) as string,
      payer: signer.address,
      rc_limit: expect.any(String) as string,
      rc_used: expect.any(String) as string,
    });
  });
});
