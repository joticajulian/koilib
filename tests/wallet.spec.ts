import * as crossFetch from "cross-fetch";
import { Type } from "protobufjs";
import { Signer } from "../src/Signer";
import { Contract } from "../src/Contract";
import { Provider } from "../src/Provider";
import {
  bitcoinDecode,
  encodeBase64url,
  toHexString,
  Krc20Abi,
  formatUnits,
  parseUnits,
  calculateMerkleRoot,
  toUint8Array,
  encodeBase58,
  decodeBase64url,
} from "../src/utils";
import {
  CallContractOperationNested,
  UploadContractOperationNested,
  TransactionJson,
  Abi,
  WaitFunction,
  BlockJson,
  // BlockJson,
} from "../src/interface";
// import { Serializer } from "../src";
import { sha256 } from "@noble/hashes/sha256";
import { Serializer } from "../src";

jest.mock("cross-fetch");
const mockFetch = jest.spyOn(crossFetch, "fetch");

interface FetchParams {
  method: string;
  body: string;
}

const fetchResponse = <T = unknown>(result: T, status = 200) => {
  return Promise.resolve({
    json: () => ({
      jsonrpc: "2.0",
      id: 1,
      ...(status === 200 && { result }),
      ...(status !== 200 && { error: result }),
      result,
    }),
  } as unknown as Response);
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

const provider = new Provider({ rpcNodes });
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
    //["123", 0, "123"], //todo
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
    //["-123", 0, "-123"], //todo
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
    ["123", 0, "123"],
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
    ["-123", 0, "-123"],
  ])(
    "should format numbers from decimal point to integer",
    (v, d, expected) => {
      expect(parseUnits(v, d)).toBe(expected);
    }
  );

  it("should calculate a merkle root", () => {
    const words = [
      "the",
      "quick",
      "brown",
      "fox",
      "jumps",
      "over",
      "a",
      "lazy",
      "dog",
    ];

    const hashes: Uint8Array[] = [];

    words.forEach((word) => {
      hashes.push(sha256(word));
    });

    const n01leaves: Uint8Array[] = [hashes[0], hashes[1]];
    const n23leaves: Uint8Array[] = [hashes[2], hashes[3]];
    const n0123leaves: Uint8Array[] = [...n01leaves, ...n23leaves];
    const n45leaves: Uint8Array[] = [hashes[4], hashes[5]];
    const n67leaves: Uint8Array[] = [hashes[6], hashes[7]];
    const n4567leaves: Uint8Array[] = [...n45leaves, ...n67leaves];
    const n01234567leaves: Uint8Array[] = [...n0123leaves, ...n4567leaves];
    const n8leaves: Uint8Array[] = [hashes[8]];

    const n01 = toUint8Array(
      "0020397085ab4494829e691c49353a04d3201fda20c6a8a6866cf0f84bb8ce47"
    );
    const n23 = toUint8Array(
      "78d4e37706320c82b2dd092eeb04b1f271523f86f910bf680ff9afcb2f8a33e1"
    );
    const n0123 = toUint8Array(
      "e07aa684d91ffcbb89952f5e99b6181f7ee7bd88bd97be1345fc508f1062c050"
    );
    const n45 = toUint8Array(
      "4185f41c5d7980ae7d14ce248f50e2854826c383671cf1ee3825ea957315c627"
    );
    const n67 = toUint8Array(
      "b2a6704395c45ad8c99247103b580f7e7a37f06c3d38075ce4b02bc34c6a6754"
    );
    const n4567 = toUint8Array(
      "2f24a249901ee8392ba0bb3b90c8efd6e2fee6530f45769199ef82d0b091d8ba"
    );
    const n01234567 = toUint8Array(
      "913b7dce068efc8db6fab0173481f137ce91352b341855a1719aaff926169987"
    );
    const n8 = toUint8Array(
      "cd6357efdd966de8c0cb2f876cc89ec74ce35f0968e11743987084bd42fb8944"
    );
    const merkleRoot = toUint8Array(
      "e24e552e0b6cf8835af179a14a766fb58c23e4ee1f7c6317d57ce39cc578cfac"
    );

    expect(calculateMerkleRoot(n01leaves)).toEqual(n01);
    expect(calculateMerkleRoot(n23leaves)).toEqual(n23);
    expect(calculateMerkleRoot(n0123leaves)).toEqual(n0123);
    expect(calculateMerkleRoot(n45leaves)).toEqual(n45);
    expect(calculateMerkleRoot(n67leaves)).toEqual(n67);
    expect(calculateMerkleRoot(n4567leaves)).toEqual(n4567);
    expect(calculateMerkleRoot(n01234567leaves)).toEqual(n01234567);
    expect(calculateMerkleRoot(n8leaves)).toEqual(n8);
    expect(calculateMerkleRoot(hashes)).toEqual(merkleRoot);
  });
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

  it("should prepare, sign a block and recover its signature", async () => {
    expect.assertions(3);

    const block: BlockJson = {
      header: {
        previous:
          "0x12203c7c767900e472ada19b5acd4e46af8a33911b282eb29003048c83061673c5b4",
        height: "123",
        timestamp: "1646252907250",
        previous_state_merkle_root:
          "EiBBZoKzt9IK39bRSFl1AGroqsP0vxG67jQifTEpYbjrdQ==",
      },
    };

    const copyBlock = JSON.parse(JSON.stringify(block)) as BlockJson;
    const preparedBlock = await signer.prepareBlock(copyBlock);
    expect(preparedBlock).toStrictEqual({
      header: {
        ...block.header,
        transaction_merkle_root:
          "EiDjsMRCmPwcFJr79MiZb7kkJ65B5GSbk0yklZkbeFK4VQ==",
        signer: addressCompressed,
      },
      id: "0x1220b86711a6ecd9c4fff1488a9a1df1db6047425f5de80b396a40f1c29cfb6d0790",
    });

    const signedBlock = await signer.signBlock(preparedBlock);
    expect(signedBlock).toStrictEqual({
      ...preparedBlock,
      signature:
        "II4-lbqNFR7re6fv-9zN0F3Z9d1DZZ67TJZrnYGJwZN1fPwxuurBKPS7ndVG8GyKIWxKTXyC4jLBVgwZvSHc1_U=",
    });

    const blockSigner = await signer.recoverAddresses(signedBlock);
    expect(blockSigner).toStrictEqual([addressCompressed]);
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

  it("should prepare a transaction", async () => {
    expect.assertions(1);

    const transaction: TransactionJson = {
      header: {
        nonce: "OAg=", //encodeBase64url(await UInt64ToNonceBytes("8")),
        rc_limit: "10",
        chain_id: encodeBase64url(Buffer.from("chain_id")),
      },
      operations: [
        {
          call_contract: {
            contract_id: encodeBase58(Buffer.from("contract_id")),
            entry_point: 12,
            args: encodeBase64url(Buffer.from("args")),
          },
        },
        {
          set_system_call: {
            call_id: 23,
            target: 234,
          },
        },
        {
          upload_contract: {
            contract_id: encodeBase58(Buffer.from("contract_id")),
            bytecode: encodeBase64url(Buffer.from("bytecode")),
          },
        },
        {
          set_system_contract: {
            contract_id: encodeBase58(Buffer.from("contract_id")),
            system_contract: true,
          },
        },
      ],
    };

    const tx = await signer.prepareTransaction(transaction);

    expect(tx).toStrictEqual({
      header: {
        chain_id: "Y2hhaW5faWQ=",
        rc_limit: "10",
        nonce: "OAg=",
        operation_merkle_root:
          "EiA8yzzbLCjuJ4D8v5HJ-Un_umc5dntIZ01Qsxoq40CLmg==",
        payer: addressCompressed,
      },
      operations: [
        {
          call_contract: {
            contract_id: "Rf8gGKq42QBxS3M",
            entry_point: 12,
            args: "YXJncw==",
          },
        },
        { set_system_call: { call_id: 23, target: 234 } },
        {
          upload_contract: {
            contract_id: "Rf8gGKq42QBxS3M",
            bytecode: "Ynl0ZWNvZGU=",
          },
        },
        {
          set_system_contract: {
            contract_id: "Rf8gGKq42QBxS3M",
            system_contract: true,
          },
        },
      ],
      id: "0x122009b27ae146fb965aa86ab81c8649406e164c804dec595748247eb55c523c4955",
    });
  });

  it("should sign a transaction and recover the public key and address", async () => {
    expect.assertions(8);
    mockFetch.mockImplementation(async (_url, params) => {
      if (params && params.body) {
        const body = JSON.parse(params.body.toString()) as FetchParams;

        switch (body.method) {
          case "chain.get_account_nonce":
            return fetchResponse({ nonce: "OAE=" });
          case "chain.get_account_rc":
            return fetchResponse({ rc: "50000000" });
          case "chain.get_chain_id":
            return fetchResponse({
              chain_id: "EiB-hw5ABo-EXy6fGDd1Iq3gbAenxQ4Qe60pRbEVMVrR9A==",
            });
          default:
            return fetchResponse({});
        }
      }

      return fetchResponse({});
    });

    const { transaction, operation } = await koin.transfer({
      from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
      to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
      value: "1000",
    });

    expect(operation).toStrictEqual({
      call_contract: {
        contract_id: koinContract.id,
        entry_point: koinContract.abi?.methods?.transfer?.entryPoint,
        args: expect.any(Uint8Array) as Uint8Array,
      },
    } as CallContractOperationNested);

    expect(transaction).toStrictEqual({
      id: "0x1220da3476bafa228cd753bd0def659ae743cbec2135b46e6aff06f67b0c2f16fc93",
      header: {
        chain_id: "EiB-hw5ABo-EXy6fGDd1Iq3gbAenxQ4Qe60pRbEVMVrR9A==",
        rc_limit: "50000000",
        nonce: "OAI=",
        operation_merkle_root:
          "EiANCoU4oibgL8tpnbuXZ_0aT5M0yKNLu6Fw9FLeD9oOhA==",
        payer: addressCompressed,
      },
      operations: [
        {
          call_contract: {
            contract_id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
            entry_point: Krc20Abi.methods.transfer.entryPoint,
            args: "ChkAEjl6vrl55V2Oym_rzsnMxIqBoie9PHmMEhkAQgjT1UACatdFY3e5QRkyG7OAzwcCCIylGOgH",
          },
        },
      ],
      signatures: expect.arrayContaining([]) as string[],
      wait: expect.any(Function) as WaitFunction,
    } as TransactionJson);

    // recover public key and address
    if (!transaction) throw new Error("transaction is not defined");

    const recoveredPublicKeys = await signer.recoverPublicKeys(transaction, {
      compressed: false,
    });
    expect(recoveredPublicKeys).toStrictEqual([publicKey]);

    let recoveredPublicKeysComp = await signer.recoverPublicKeys(transaction, {
      compressed: true,
    });
    expect(recoveredPublicKeysComp).toStrictEqual([publicKeyCompressed]);

    const recoveredAddresses = await signer.recoverAddresses(transaction, {
      compressed: false,
    });
    expect(recoveredAddresses).toStrictEqual([address]);

    let recoveredAddressesComp = await signer.recoverAddresses(transaction, {
      compressed: true,
    });
    expect(recoveredAddressesComp).toStrictEqual([addressCompressed]);

    recoveredPublicKeysComp = await signer.recoverPublicKeys(transaction);
    expect(recoveredPublicKeysComp).toStrictEqual([publicKeyCompressed]);

    recoveredAddressesComp = await signer.recoverAddresses(transaction);
    expect(recoveredAddressesComp).toStrictEqual([addressCompressed]);
  });

  it("should rewrite the default options when creating transactions", async () => {
    expect.assertions(3);
    mockFetch.mockImplementation(async () => fetchResponse({ nonce: "0" }));

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
    expect(transaction).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it("should get the balance of an account", async () => {
    const type = koinContract.serializer?.root?.lookupType(
      "balance_of_result"
    ) as Type;
    const message = type.create({ value: "123456" });
    const resultEncoded = encodeBase64url(type.encode(message).finish());
    mockFetch.mockImplementation(async () =>
      fetchResponse({ result: resultEncoded })
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
    const resultEncoded = encodeBase64url(type.encode(message).finish());
    mockFetch.mockImplementation(async () =>
      fetchResponse({ result: resultEncoded })
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
    const myProvider = new Provider({
      rpcNodes: [
        "http://bad-server1",
        "http://bad-server2",
        "http://good-server",
      ],
    });
    let numErrors = 0;
    myProvider.onError = () => {
      numErrors += 1;
      return false;
    };

    mockFetch.mockImplementation(async (url) => {
      if (!(url as string).includes("good-server")) {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw fetchResponse({ message: "internal error" }, 500);
      }
      return fetchResponse({ nonce: "OHs=" });
    });

    const nonce = await myProvider.getNonce(address);

    expect(numErrors).toBe(2);
    expect(nonce).toBe(123);
  });

  it("should upload a contract", async () => {
    expect.assertions(2);
    const bytecode = decodeBase64url("my_contract_bytecode");
    koinContract.bytecode = bytecode;

    mockFetch.mockImplementation(async (_url, params) => {
      if (params && params.body) {
        const body = JSON.parse(params.body.toString()) as FetchParams;

        switch (body.method) {
          case "chain.get_account_nonce":
            return fetchResponse({ nonce: "OAA=" });
          case "chain.get_account_rc":
            return fetchResponse({ rc: "50000000" });
          case "chain.get_chain_id":
            return fetchResponse({
              chain_id: "EiB-hw5ABo-EXy6fGDd1Iq3gbAenxQ4Qe60pRbEVMVrR9A==",
            });
          default:
            return fetchResponse({});
        }
      }

      return fetchResponse({});
    });

    const { operation, transaction } = await koinContract.deploy();

    expect(operation).toStrictEqual({
      upload_contract: {
        contract_id: expect.any(Uint8Array) as Uint8Array,
        bytecode: expect.any(Uint8Array) as Uint8Array,
      },
    } as UploadContractOperationNested);

    expect(transaction).toStrictEqual({
      operations: [
        {
          upload_contract: {
            contract_id: addressCompressed,
            bytecode: "my_contract_bytecode",
          },
        },
      ],
      header: {
        chain_id: "EiB-hw5ABo-EXy6fGDd1Iq3gbAenxQ4Qe60pRbEVMVrR9A==",
        rc_limit: "50000000",
        nonce: "OAE=",
        operation_merkle_root:
          "EiC6RyWcgU-Wjx-koQicaeZlJoWStdV12e_0fv-QEx2DqA==",
        payer: addressCompressed,
      },
      id: "0x1220ae807b6d8ac19011adc2f6af13b2f2ec1e708a18864d222a460b161d857f2091",
      signatures: [
        "H4WFQd7TfRtJa9s7sebcLHni7yA-aVtyJ8VszcnbZ9D1cwT46-WfbF9fKY4hPAaNdFKPjb_CU1lE4KcmopG8odE=",
      ],
      wait: expect.any(Function) as WaitFunction,
    } as TransactionJson);
  });

  it("should get a a block with federated consensus and get the signer address", async () => {
    expect.assertions(1);
    mockFetch.mockImplementation(async () => {
      return fetchResponse({
        block_items: [
          {
            block_id:
              "0x1220ce5b2f87d759879b98f80fdf2cd68607e2587a9dd716219a6a205e44bdde60f8",
            block_height: "12",
            block: {
              id: "0x1220ce5b2f87d759879b98f80fdf2cd68607e2587a9dd716219a6a205e44bdde60f8",
              header: {
                previous:
                  "0x1220da1c1295672fb49737511c89be2c54d1b9fb837e5b6d3d50878790821f4c7340",
                height: "12",
                timestamp: "1646757858375",
                previous_state_merkle_root:
                  "EiDPbld98ROIgrxw5ceBoKhwoGjAJ_GX7lHACLKhGW_mYA==",
                transaction_merkle_root:
                  "EiBKinARNI21rZdlxhJR1533x-0GyCitFZTacmE0UURgJw==",
                signer: "1AeXf4DF1DNPmrdcKp8jVPCbSspb9FrCtT",
              },
              transactions: [
                {
                  id: "0x122080616cc3a2c070084d86866535d39942ceb77cc3db889fada9420aaaa664e89e",
                  header: {
                    chain_id:
                      "EiDyWt8BeDCTvG3_2QLJWbDJOnHqIcV4Ssqp69aZJsqPpg==",
                    rc_limit: "10000000",
                    nonce: "OAE=",
                    operation_merkle_root:
                      "EiCVjlPWCZjF-hpfHZZG6XFVPnOBGcenqkIWc3XgS4_nhA==",
                    payer: "1AeXf4DF1DNPmrdcKp8jVPCbSspb9FrCtT",
                  },
                  operations: [
                    {
                      set_system_contract: {
                        contract_id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
                        system_contract: true,
                      },
                    },
                    {
                      set_system_contract: {
                        contract_id: "15im92XgZiV39tcKMhMGtDYhJjXPMjUu8r",
                        system_contract: true,
                      },
                    },
                    {
                      set_system_call: {
                        call_id: 101,
                        target: {
                          system_call_bundle: {
                            contract_id: "15im92XgZiV39tcKMhMGtDYhJjXPMjUu8r",
                          },
                        },
                      },
                    },
                  ],
                  signatures: [
                    "H-vQnAwBMYOUVFiJ9d6Pz5mddBNoXgcsBVxGSCc9taJVXi5M0CJ_KNQFAT4XxnoI_lRQ6HpGInmtHz8OEJQl9pM=",
                  ],
                },
              ],
              signature:
                "IBTpgG8n1kyvuNDEgNmReTJF4hjYqztJRbW1-Eri84hEC32ohapHeO9QIaxIQnU68vSqHh0XuE6ZmbRCSwxss80=",
            },
          },
        ],
      });
    });
    const blocks = await provider.getBlocks(1, 1, "randomId");
    const [signer1] = await signer.recoverAddresses(blocks[0].block);
    expect(signer1).toBe("1AeXf4DF1DNPmrdcKp8jVPCbSspb9FrCtT");
  });

  it("should get a a block with pow consensus and get the signer address", async () => {
    expect.assertions(1);
    mockFetch.mockImplementation(async () => {
      return fetchResponse({
        block_items: [
          {
            block_id:
              "0x12209eff0e1f4c4457f60e8310d8ffbe27eec5a885640af4090ddc598e9aa01292c9",
            block_height: "1000",
            block: {
              id: "0x12209eff0e1f4c4457f60e8310d8ffbe27eec5a885640af4090ddc598e9aa01292c9",
              header: {
                previous:
                  "0x122081764a9247876bcfc1b7776607d66f88f6f14de87ae31e2adf14bbe63b52a952",
                height: "1000",
                timestamp: "1646770928062",
                previous_state_merkle_root:
                  "EiD0IaXv8BaZPvSscT4fVSNqdB7taCrrosApv_c92PQPSw==",
                transaction_merkle_root:
                  "EiDjsMRCmPwcFJr79MiZb7kkJ65B5GSbk0yklZkbeFK4VQ==",
                signer: "1AeXf4DF1DNPmrdcKp8jVPCbSspb9FrCtT",
              },
              signature:
                "CiCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99mBJBIIzH5EKN7uqjUb4u2h7HxNr9_w-oC8TdL-ojenyeUSkPZzJodOw6qwaJ3GpFSdH5mIsgC9mJTJjaZDh4m4mY4ZA=",
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
    const [signer1] = await signer.recoverAddresses(blocks[0].block, {
      transformSignature: async (signatureData) => {
        const powSignatureData: PowSigData = await serializer.deserialize(
          signatureData
        );
        return powSignatureData.recoverable_signature;
      },
    });
    expect(signer1).toBe("1AeXf4DF1DNPmrdcKp8jVPCbSspb9FrCtT");
  });
});
