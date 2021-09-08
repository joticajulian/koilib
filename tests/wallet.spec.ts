import axios, { AxiosResponse } from "axios";
import crypto from "crypto";
import { /* bitcoinEncode, */ bitcoinDecode, toHexString } from "../src/utils";
import { Signer } from "../src/Signer";
import { Contract } from "../src/Contract";
import { Wallet } from "../src/Wallet";
import { Provider } from "../src/Provider";
import { Transaction } from "../src/interface";

const mockAxiosGet = jest.spyOn(axios, "get");
const mockAxiosPost = jest.spyOn(axios, "post");

mockAxiosGet.mockImplementation(
  async (): Promise<unknown> =>
    Promise.reject(new Error("Forgot to implement mock for axios get?"))
);

mockAxiosPost.mockImplementation(
  async (): Promise<unknown> =>
    Promise.reject(new Error("Forgot to implement mock for axios get?"))
);

const axiosResponse = <T = unknown>(
  result: T,
  status = 200
): Promise<
  AxiosResponse<{
    jsonrpc: string;
    id: number | string;
    result?: T;
    error?: {
      code: number;
      messagge: string;
    };
  }>
> => {
  return Promise.resolve({
    data: {
      jsonrpc: "2.0",
      id: 1,
      result,
    },
    status,
    statusText: "",
    config: {},
    headers: {},
  });
};

const privateKeyHex =
  "bab7fd6e5bd624f4ea0c33f7e7219262a6fa93a945a8964d9f110148286b7b37";
const seed = "one two three four five six";
const wif = "5KEX4TMHG66fT7cM9HMZLmdp4hVq4LC4X2Fkg6zeypM5UteWmtd";
const wifCompressed = "L3UfgFJWmbVziGB1uZBjkG1UjKkF7hhpXWY7mbTUdmycmvXCVtiL";
const publicKey =
  "042921dd54fdd8fb5d2ab1a9928db7e9e08b34f8711a3332e0f1b36e71076b9cf291e7c6dbcc8c0cf132db40d32722301b5244b1274dc16a5a54c3220b7def3423";
const publicKeyCompressed =
  "032921dd54fdd8fb5d2ab1a9928db7e9e08b34f8711a3332e0f1b36e71076b9cf2";
const address = "1AjfrkFYS28SgPWrvaUeY6pThbzF1fUrjQ";
const addressCompressed = "1GE2JqXw5LMQaU1sj82Dy8ZEe2BRXQS1cs";
const rpcNodes = ["http://45.56.104.152:8080", "http://159.203.119.0:8080"];

const contract = new Contract({
  id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
  entries: {
    transfer: {
      id: 0x62efa292,
      inputs: {
        type: [
          {
            name: "from",
            type: "string",
          },
          {
            name: "to",
            type: "string",
          },
          {
            name: "value",
            type: "uint64",
          },
        ],
      },
    },
    balance_of: {
      id: 0x15619248,
      inputs: { type: "string" },
      outputs: { type: "uint64" },
    },
  },
});

describe("Signer", () => {
  it("should get private key", () => {
    expect.assertions(18);
    const signer1 = Signer.fromWif(wif);
    expect(signer1.getPrivateKey("wif")).toBe(wif);
    expect(signer1.getPrivateKey("wif", true)).toBe(wifCompressed);
    expect(signer1.getPrivateKey("hex")).toBe(privateKeyHex);

    const signer2 = Signer.fromWif(wifCompressed);
    expect(signer2.getPrivateKey("wif")).toBe(wifCompressed);
    expect(signer2.getPrivateKey("wif", false)).toBe(wif);
    expect(signer2.getPrivateKey("hex")).toBe(privateKeyHex);

    const signer3 = new Signer(privateKeyHex);
    expect(signer3.getPrivateKey("wif", false)).toBe(wif);
    expect(signer3.getPrivateKey("wif")).toBe(wifCompressed);
    expect(signer3.getPrivateKey("hex")).toBe(privateKeyHex);

    const signer4 = new Signer(privateKeyHex, false);
    expect(signer4.getPrivateKey("wif")).toBe(wif);
    expect(signer4.getPrivateKey("wif", true)).toBe(wifCompressed);
    expect(signer4.getPrivateKey("hex")).toBe(privateKeyHex);

    const signer5 = Signer.fromSeed(seed);
    expect(signer5.getPrivateKey("wif", false)).toBe(wif);
    expect(signer5.getPrivateKey("wif")).toBe(wifCompressed);
    expect(signer5.getPrivateKey("hex")).toBe(privateKeyHex);

    const signer6 = Signer.fromSeed(seed, false);
    expect(signer6.getPrivateKey("wif", true)).toBe(wifCompressed);
    expect(signer6.getPrivateKey("wif")).toBe(wif);
    expect(signer6.getPrivateKey("hex")).toBe(privateKeyHex);
  });
});

describe("Wallet and Contract", () => {
  it("should encode and decode bitcoin format", () => {
    expect.assertions(2);
    const decodedPrivateKey = toHexString(bitcoinDecode(wif)).toLowerCase();
    const decodedPrivateKey2 = toHexString(
      bitcoinDecode(wifCompressed)
    ).toLowerCase();
    expect(decodedPrivateKey).toBe(privateKeyHex);
    expect(decodedPrivateKey2).toBe(privateKeyHex);
  });

  it("should compute address", () => {
    expect.assertions(2);
    const wallet1 = new Signer(privateKeyHex);
    const wallet2 = new Signer(privateKeyHex, false);
    expect(wallet1.address).toBe(addressCompressed);
    expect(wallet2.address).toBe(address);
  });

  it("should encode and decode an operation", () => {
    expect.assertions(2);
    const opTransfer = {
      name: "transfer",
      args: {
        from: "alice",
        to: "bob",
        value: BigInt(1000),
      },
    };

    const opEncoded = contract.encodeOperation(opTransfer);
    const opDecoded = contract.decodeOperation(opEncoded);

    expect(opEncoded).toStrictEqual({
      type: "koinos::protocol::call_contract_operation",
      value: {
        contract_id: contract.id,
        entry_point: 0x62efa292,
        args: expect.any(String) as string,
      },
    });

    expect(opDecoded).toStrictEqual(opTransfer);
  });

  it("should sign a transaction and recover the public key and address", async () => {
    expect.assertions(7);
    const signer = new Signer(privateKeyHex);
    const operation = contract.encodeOperation({
      name: "transfer",
      args: {
        from: "alice",
        to: "bob",
        value: BigInt(1000),
      },
    });
    const transaction: Transaction = {
      active_data: {
        resource_limit: 1000000,
        nonce: 0,
        operations: [operation],
      },
    };
    await signer.signTransaction(transaction);
    expect(transaction).toStrictEqual({
      id: expect.any(String) as string,
      active_data: expect.objectContaining({}) as unknown,
      signature_data: expect.any(String) as string,
    } as Transaction);

    // recover public key and address

    const recoveredPublicKey = Signer.recoverPublicKey(transaction, false);
    expect(recoveredPublicKey).toBe(publicKey);

    const recoveredPublicKeyComp = Signer.recoverPublicKey(transaction, true);
    expect(recoveredPublicKeyComp).toBe(publicKeyCompressed);

    const recoveredAddress = Signer.recoverAddress(transaction, false);
    expect(recoveredAddress).toBe(address);

    const recoveredAddressComp = Signer.recoverAddress(transaction, true);
    expect(recoveredAddressComp).toBe(addressCompressed);

    expect(Signer.recoverPublicKey(transaction)).toBe(publicKeyCompressed);
    expect(Signer.recoverAddress(transaction)).toBe(addressCompressed);
  });

  it("should create a wallet and sign a transaction", async () => {
    expect.assertions(0);
    const wallet = new Wallet({
      signer: new Signer(privateKeyHex),
      contract,
      provider: new Provider(rpcNodes),
    });

    const operation = wallet.encodeOperation({
      name: "transfer",
      args: {
        from: wallet.getAddress(),
        to: "bob",
        value: BigInt(1000),
      },
    });

    mockAxiosPost.mockImplementation(async () => axiosResponse({ nonce: "0" }));

    const tx = await wallet.newTransaction({
      operations: [operation],
    });

    await wallet.signTransaction(tx);
    await wallet.sendTransaction(tx);
  });

  it("should get the balance of an account", async () => {
    const wallet = new Wallet({
      contract,
      provider: new Provider(rpcNodes),
    });

    mockAxiosPost.mockImplementation(async () =>
      axiosResponse({ result: "MAAAAAAECAwQ=" })
    );

    const result = await wallet.readContract({
      name: "balance_of",
      args: "1Krs7v1rtpgRyfwEZncuKMQQnY5JhqXVSx",
    });

    expect(result).toBeDefined();
  });

  it("should change node", async () => {
    expect.assertions(2);
    const provider = new Provider([
      "http://bad-server1",
      "http://bad-server2",
      "http://good-server",
    ]);
    let numErrors = 0;
    provider.onError = () => {
      numErrors += 1;
      return false;
    };

    mockAxiosPost.mockImplementation(async (url) => {
      if (!url.includes("good-server")) {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw axiosResponse(undefined, 500);
      }
      return axiosResponse({ nonce: "0" });
    });

    const nonce = await provider.getNonce(address);

    expect(numErrors).toBe(2);
    expect(nonce).toBe(0);
  });

  it("should upload a contract", async () => {
    expect.assertions(0);
    const provider = new Provider("http://node");
    const signer = Signer.fromSeed(seed);
    const wallet = new Wallet({ provider, signer });
    const bytecode = new Uint8Array(crypto.randomBytes(100));
    const op = wallet.encodeUploadContractOperation(bytecode);

    mockAxiosPost.mockImplementation(async () => {
      return axiosResponse({ nonce: "0" });
    });

    const tx = await wallet.newTransaction({
      operations: [op],
    });
    // sign and send transaction
    await wallet.signTransaction(tx);
    await wallet.sendTransaction(tx);
  });
});
