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
  Abi,
} from "../src/interface";
import { Serializer } from "../src";

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

const privateKey =
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
const signer = new Signer({ privateKey, provider });
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
    expect(signer1.getPrivateKey("hex")).toBe(privateKey);

    const signer2 = Signer.fromWif(wifCompressed);
    expect(signer2.getPrivateKey("wif")).toBe(wifCompressed);
    expect(signer2.getPrivateKey("wif", false)).toBe(wif);
    expect(signer2.getPrivateKey("hex")).toBe(privateKey);

    const signer3 = new Signer({ privateKey });
    expect(signer3.getPrivateKey("wif", false)).toBe(wif);
    expect(signer3.getPrivateKey("wif")).toBe(wifCompressed);
    expect(signer3.getPrivateKey("hex")).toBe(privateKey);

    const signer4 = new Signer({ privateKey, compressed: false });
    expect(signer4.getPrivateKey("wif")).toBe(wif);
    expect(signer4.getPrivateKey("wif", true)).toBe(wifCompressed);
    expect(signer4.getPrivateKey("hex")).toBe(privateKey);

    const signer5 = Signer.fromSeed(seed);
    expect(signer5.getPrivateKey("wif", false)).toBe(wif);
    expect(signer5.getPrivateKey("wif")).toBe(wifCompressed);
    expect(signer5.getPrivateKey("hex")).toBe(privateKey);

    const signer6 = Signer.fromSeed(seed, false);
    expect(signer6.getPrivateKey("wif", true)).toBe(wifCompressed);
    expect(signer6.getPrivateKey("wif")).toBe(wif);
    expect(signer6.getPrivateKey("hex")).toBe(privateKey);
  });
});

describe("Wallet and Contract", () => {
  it("should encode and decode bitcoin format", () => {
    expect.assertions(2);
    const decodedPrivateKey = toHexString(bitcoinDecode(wif)).toLowerCase();
    const decodedPrivateKey2 = toHexString(
      bitcoinDecode(wifCompressed)
    ).toLowerCase();
    expect(decodedPrivateKey).toBe(privateKey);
    expect(decodedPrivateKey2).toBe(privateKey);
  });

  it("should compute address", () => {
    expect.assertions(2);
    const wallet1 = new Signer({ privateKey });
    const wallet2 = new Signer({ privateKey, compressed: false });
    expect(wallet1.address).toBe(addressCompressed);
    expect(wallet2.address).toBe(address);
  });

  it("should encode and decode an operation", async () => {
    expect.assertions(2);
    const opTransfer = {
      name: "transfer",
      args: {
        from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
        to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
        value: "1000",
      },
    };

    const opEncoded = await koinContract.encodeOperation(opTransfer);
    const opDecoded = await koinContract.decodeOperation(opEncoded);

    expect(opEncoded).toStrictEqual({
      call_contract: {
        contract_id: koinContract.id,
        entry_point: koinContract.abi?.methods?.transfer?.entryPoint,
        args: expect.any(Uint8Array) as Uint8Array,
      },
    } as CallContractOperationNested);

    expect(opDecoded).toStrictEqual(opTransfer);
  });

  it("should encode and decode a transaction", async () => {
    expect.assertions(2);

    const activeData = {
      nonce: "8",
      rc_limit: "10",
      operations: [
        {
          call_contract: {
            contract_id: new Uint8Array(crypto.randomBytes(20)),
            entry_point: 12,
            args: new Uint8Array(crypto.randomBytes(12)),
          },
        } as CallContractOperationNested,
        {
          set_system_call: {
            call_id: 23,
            target: {
              thunk_id: 234,
            },
          },
        } as SetSystemCallOperationNested,
        {
          upload_contract: {
            contract_id: new Uint8Array(crypto.randomBytes(20)),
            bytecode: new Uint8Array(crypto.randomBytes(23)),
          },
        } as UploadContractOperationNested,
      ],
    };

    const tx = await signer.encodeTransaction(activeData);
    const activeData2 = await signer.decodeTransaction(tx);
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
      call_contract: {
        contract_id: koinContract.id,
        entry_point: koinContract.abi?.methods?.transfer?.entryPoint,
        args: expect.any(Uint8Array) as Uint8Array,
      },
    } as CallContractOperationNested);

    expect(transaction).toStrictEqual({
      id: expect.any(String) as string,
      active: expect.any(String) as string,
      signature_data: expect.any(String) as string,
    } as TransactionJson);

    expect(transactionResponse).toBeDefined();

    // recover public key and address
    if (!transaction) throw new Error("transaction is not defined");

    const recoveredPublicKey = await Signer.recoverPublicKey(transaction, {
      compressed: false,
    });
    expect(recoveredPublicKey).toBe(publicKey);

    const recoveredPublicKeyComp = await Signer.recoverPublicKey(transaction, {
      compressed: true,
    });
    expect(recoveredPublicKeyComp).toBe(publicKeyCompressed);

    const recoveredAddress = await Signer.recoverAddress(transaction, {
      compressed: false,
    });
    expect(recoveredAddress).toBe(address);

    const recoveredAddressComp = await Signer.recoverAddress(transaction, {
      compressed: true,
    });
    expect(recoveredAddressComp).toBe(addressCompressed);

    expect(await Signer.recoverPublicKey(transaction)).toBe(
      publicKeyCompressed
    );
    expect(await Signer.recoverAddress(transaction)).toBe(addressCompressed);
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
    const type = koinContract.serializer?.root?.lookupType(
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

  it("should get the balance of an account using the preformatInput and preformatOutput", async () => {
    expect.assertions(2);
    const type = koinContract.serializer?.root?.lookupType(
      "balance_of_result"
    ) as Type;
    const message = type.create({ value: "123456" });
    const resultEncoded = encodeBase64(type.encode(message).finish());
    mockAxiosPost.mockImplementation(async () =>
      axiosResponse({ result: resultEncoded })
    );

    const contractInstance = new Contract({
      id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
      signer,
      abi: JSON.parse(JSON.stringify(Krc20Abi)) as Abi,
    });
    contractInstance.abi!.methods.balanceOf.preformatInput = (owner) => ({
      owner,
    });
    contractInstance.abi!.methods.balanceOf.preformatOutput = (res) =>
      formatUnits((res as { value: string }).value, 8);
    const contract = contractInstance.functions;

    const { operation, result } = await contract.balanceOf(address);
    const { operation: opKoin } = await koin.balanceOf({ owner: address });
    expect(result).toBe("0.00123456");
    expect(operation).toStrictEqual(opKoin);
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
      upload_contract: {
        contract_id: expect.any(Uint8Array) as Uint8Array,
        bytecode: expect.any(Uint8Array) as Uint8Array,
      },
    } as UploadContractOperationNested);

    expect(transaction).toStrictEqual({
      id: expect.any(String) as string,
      active: expect.any(String) as string,
      signature_data: expect.any(String) as string,
    } as TransactionJson);

    expect(transactionResponse).toBeDefined();
  });

  it("should get a a block with federated consensus and get the signer address", async () => {
    expect.assertions(2);
    mockAxiosPost.mockImplementation(async () => {
      return axiosResponse({
        block_items: [
          {
            block: {
              active:
                "CiISIOOwxEKY_BwUmvv0yJlvuSQnrkHkZJuTTKSVmRt4UrhVEiISIC26XbwznnMWrqJoP6-DnBt7HuIxPbeSESWIEY3wZqo1GhkAadIc8ziAPySyhmNk00yjM3dIdxatR7-8",
              signature_data:
                "HxhGjxdnrpNMhiKgi03AT9B2r7hWGOMnM47SbhtWWgDjTrZGQSOVt1ZG2N5L9JmbIXegzbtggHaBi3o0DTpYhB4=",
            },
          },
        ],
      });
    });
    const blocks = await provider.getBlocks(1, 1, "randomId");
    const signer = await Signer.recoverAddress(blocks[0].block);
    expect(signer).toBeDefined();
    expect(signer.length).toBe(34);
  });

  it("should get a a block with pow consensus and get the signer address", async () => {
    expect.assertions(2);
    mockAxiosPost.mockImplementation(async () => {
      return axiosResponse({
        block_items: [
          {
            block: {
              active:
                "CiISIOOwxEKY_BwUmvv0yJlvuSQnrkHkZJuTTKSVmRt4UrhVEiISIC26XbwznnMWrqJoP6-DnBt7HuIxPbeSESWIEY3wZqo1GhkAadIc8ziAPySyhmNk00yjM3dIdxatR7-8",
              signature_data:
                "CiDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB2bvRJBH8FKri7J2bR6sWa-mRgRFrqolnnxMl48HtSsl_8y-YaIcm7RzsevuEZP8b5g1TiPfGZK1QBkH7mrPD4UlEl2iN4=",
            },
          },
        ],
      });
    });
    const blocks = await provider.getBlocks(1, 1, "randomId");
    const serializer = new Serializer(
      {
        nested: {
          mypackage: {
            nested: {
              pow_signature_data: {
                fields: {
                  nonce: {
                    type: "bytes",
                    id: 1,
                  },
                  recoverable_signature: {
                    type: "bytes",
                    id: 2,
                  },
                },
              },
            },
          },
        },
      },
      {
        defaultTypeName: "pow_signature_data",
      }
    );
    interface PowSigData {
      nonce: string;
      recoverable_signature: string;
    }
    const signer = await Signer.recoverAddress(blocks[0].block, {
      transformSignature: async (signatureData) => {
        const powSignatureData: PowSigData = await serializer.deserialize(
          signatureData
        );
        return powSignatureData.recoverable_signature;
      },
    });
    expect(signer).toBeDefined();
    expect(signer.length).toBe(34);
  });
});
