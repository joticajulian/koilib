import axios, { AxiosResponse } from "axios";
import crypto from "crypto";
import { Type } from "protobufjs";
import { Signer } from "../src/Signer";
import { Contract } from "../src/Contract";
import { Provider } from "../src/Provider";
import {
  bitcoinDecode,
  encodeBase64,
  toHexString,
  Krc20Abi,
  formatUnits,
  parseUnits,
} from "../src/utils";
import {
  CallContractOperationNested,
  SetSystemCallOperationNested,
  UploadContractOperationNested,
  TransactionJson,
} from "../src/interface";

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
const rpcNodes = [
  "http://example.koinos.io:8080",
  "http://example2.koinos.io:8080",
];

const provider = new Provider(rpcNodes);
const signer = new Signer(privateKeyHex, true, provider);
const koinContract = new Contract({
  id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
  abi: Krc20Abi,
  provider,
  signer,
});
const koin = koinContract.functions;

describe("utils", () => {
  it.each([
    // positive numbers
    ["1", 8, "0.00000001"],
    ["123456", 8, "0.00123456"],
    ["12345678", 8, "0.12345678"],
    ["123456789", 8, "1.23456789"],
    ["0123456789", 8, "1.23456789"],
    ["20123456789", 8, "201.23456789"],
    ["0", 8, "0"],
    ["1200000000", 8, "12"],
    ["1230000000", 8, "12.3"],
    // negative numbers
    ["-1", 8, "-0.00000001"],
    ["-123456", 8, "-0.00123456"],
    ["-12345678", 8, "-0.12345678"],
    ["-123456789", 8, "-1.23456789"],
    ["-0123456789", 8, "-1.23456789"],
    ["-20123456789", 8, "-201.23456789"],
    ["-0", 8, "-0"],
    ["-1200000000", 8, "-12"],
    ["-1230000000", 8, "-12.3"],
  ])(
    "should format numbers from integer to decimal point",
    (v, d, expected) => {
      expect(formatUnits(v, d)).toBe(expected);
    }
  );

  it.each([
    // positive numbers
    ["0.00000001", 8, "1"],
    ["0.00123456", 8, "123456"],
    ["0.12345678", 8, "12345678"],
    ["1.23456789", 8, "123456789"],
    ["01.23456789", 8, "123456789"],
    ["201.23456789", 8, "20123456789"],
    ["0", 8, "0"],
    ["12", 8, "1200000000"],
    ["12.3", 8, "1230000000"],
    // negative numbers
    ["-0.00000001", 8, "-1"],
    ["-0.00123456", 8, "-123456"],
    ["-0.12345678", 8, "-12345678"],
    ["-1.23456789", 8, "-123456789"],
    ["-01.23456789", 8, "-123456789"],
    ["-201.23456789", 8, "-20123456789"],
    ["-0", 8, "-0"],
    ["-12", 8, "-1200000000"],
    ["-12.3", 8, "-1230000000"],
  ])(
    "should format numbers from decimal point to integer",
    (v, d, expected) => {
      expect(parseUnits(v, d)).toBe(expected);
    }
  );
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
        from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
        to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
        value: "1000",
      },
    };

    const opEncoded = koinContract.encodeOperation(opTransfer);
    const opDecoded = koinContract.decodeOperation(opEncoded);

    expect(opEncoded).toStrictEqual({
      callContract: {
        contractId: koinContract.id,
        entryPoint: koinContract.abi?.methods?.transfer?.entryPoint,
        args: expect.any(Uint8Array) as Uint8Array,
      },
    } as CallContractOperationNested);

    expect(opDecoded).toStrictEqual(opTransfer);
  });

  it("should encode and decode a transaction", async () => {
    expect.assertions(2);

    const activeData = {
      nonce: "8",
      rcLimit: "10",
      operations: [
        {
          callContract: {
            contractId: new Uint8Array(crypto.randomBytes(20)),
            entryPoint: 12,
            args: new Uint8Array(crypto.randomBytes(12)),
          },
        } as CallContractOperationNested,
        {
          setSystemCall: {
            callId: 23,
            target: {
              thunkId: 234,
            },
          },
        } as SetSystemCallOperationNested,
        {
          uploadContract: {
            contractId: new Uint8Array(crypto.randomBytes(20)),
            bytecode: new Uint8Array(crypto.randomBytes(23)),
          },
        } as UploadContractOperationNested,
      ],
    };

    const tx = await signer.encodeTransaction(activeData);
    const activeData2 = Signer.decodeTransaction(tx);
    expect(tx).toStrictEqual({
      active: expect.any(String) as string,
    } as TransactionJson);
    expect(activeData2).toStrictEqual(activeData);
  });

  it("should sign a transaction and recover the public key and address", async () => {
    expect.assertions(9);
    mockAxiosPost.mockImplementation(async () => axiosResponse({ nonce: "0" }));

    const { transaction, operation, transactionResponse } = await koin.transfer(
      {
        from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
        to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
        value: "1000",
      }
    );

    expect(operation).toStrictEqual({
      callContract: {
        contractId: koinContract.id,
        entryPoint: koinContract.abi?.methods?.transfer?.entryPoint,
        args: expect.any(Uint8Array) as Uint8Array,
      },
    } as CallContractOperationNested);

    expect(transaction).toStrictEqual({
      id: expect.any(String) as string,
      active: expect.any(String) as string,
      signatureData: expect.any(String) as string,
    } as TransactionJson);

    expect(transactionResponse).toBeDefined();

    // recover public key and address
    if (!transaction) throw new Error("transaction is not defined");

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

  it("should rewrite the default options when creating transactions", async () => {
    expect.assertions(3);
    mockAxiosPost.mockImplementation(async () => axiosResponse({ nonce: "0" }));

    const { transaction, operation, result } = await koin.transfer(
      {
        from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
        to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
        value: "1000",
      },
      { sendTransaction: false }
    );

    // As send is false only operation is defined
    expect(operation).toBeDefined();
    expect(transaction).not.toBeDefined();
    expect(result).not.toBeDefined();
  });

  it("should get the balance of an account", async () => {
    const type = koinContract.protobuffers?.lookupType(
      "balance_of_result"
    ) as Type;
    const message = type.create({ value: "123456" });
    const resultEncoded = encodeBase64(type.encode(message).finish());
    mockAxiosPost.mockImplementation(async () =>
      axiosResponse({ result: resultEncoded })
    );

    const { result } = await koin.balanceOf({ owner: address });
    expect(result).toStrictEqual({ value: "123456" });
  });

  it("should change node", async () => {
    expect.assertions(2);
    const myProvider = new Provider([
      "http://bad-server1",
      "http://bad-server2",
      "http://good-server",
    ]);
    let numErrors = 0;
    myProvider.onError = () => {
      numErrors += 1;
      return false;
    };

    mockAxiosPost.mockImplementation(async (url) => {
      if (!url.includes("good-server")) {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw axiosResponse(undefined, 500);
      }
      return axiosResponse({ nonce: "123" });
    });

    const nonce = await myProvider.getNonce(address);

    expect(numErrors).toBe(2);
    expect(nonce).toBe(123);
  });

  it("should upload a contract", async () => {
    expect.assertions(3);
    const bytecode = new Uint8Array(crypto.randomBytes(100));
    koinContract.bytecode = bytecode;

    mockAxiosPost.mockImplementation(async () => {
      return axiosResponse({ nonce: "0" });
    });

    const { operation, transaction, transactionResponse } =
      await koinContract.deploy();

    expect(operation).toStrictEqual({
      uploadContract: {
        contractId: expect.any(Uint8Array) as Uint8Array,
        bytecode: expect.any(Uint8Array) as Uint8Array,
      },
    } as UploadContractOperationNested);

    expect(transaction).toStrictEqual({
      id: expect.any(String) as string,
      active: expect.any(String) as string,
      signatureData: expect.any(String) as string,
    } as TransactionJson);

    expect(transactionResponse).toBeDefined();
  });
});
