import * as crossFetch from "cross-fetch";
import { Type } from "protobufjs";
import { sha256 } from "@noble/hashes/sha256";
import { Signer } from "../src/Signer";
import { Contract } from "../src/Contract";
import { Provider } from "../src/Provider";
import { Serializer } from "../src";
import {
  bitcoinDecode,
  encodeBase64url,
  toHexString,
  tokenAbi,
  formatUnits,
  parseUnits,
  calculateMerkleRoot,
  toUint8Array,
  encodeBase58,
  decodeBase64url,
  btypeDecode,
  btypeEncode,
} from "../src/utils";
import {
  TransactionJson,
  Abi,
  WaitFunction,
  BlockJson,
  OperationJson,
  TypeField,
  TransactionJsonWait,
} from "../src/interface";

jest.mock("cross-fetch");
const mockFetch = jest.spyOn(crossFetch, "fetch");

interface FetchParams {
  method: string;
  body: string;
}

const fetchResponse = (result: unknown, error?: unknown) => {
  return Promise.resolve({
    json: () => ({
      jsonrpc: "2.0",
      id: 1,
      ...(result !== undefined && { result }),
      ...(error !== undefined && { error }),
    }),
  } as unknown as Response);
};

const fetchError = (error: unknown) => fetchResponse(undefined, error);

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
  abi: tokenAbi,
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

  it("should encode decode objects with btype", () => {
    const obj = {
      from: encodeBase58(new Uint8Array([1, 2, 3, 4])),
      chainId: encodeBase64url(new Uint8Array([5, 6, 7, 8])),
      points: 34,
      name: "alice",
      offer: {
        name: "offer1",
        data: encodeBase58(new Uint8Array([9, 10, 11, 12])),
        data2: encodeBase64url(new Uint8Array([13, 14, 15, 16])),
      },
      offers: [
        {
          name: "offer1",
          data: encodeBase58(new Uint8Array([0])),
          data2: encodeBase64url(new Uint8Array([1])),
        },
        {
          name: "offer2",
          data: encodeBase58(new Uint8Array([12])),
          data2: encodeBase64url(new Uint8Array([13])),
        },
      ],
      addresses: [
        encodeBase58(new Uint8Array([10, 20, 30])),
        encodeBase58(new Uint8Array([40, 50, 60])),
      ],
    };

    const btypeObj: TypeField["subtypes"] = {
      from: { type: "bytes", btype: "ADDRESS" },
      chainId: { type: "bytes" },
      points: { type: "uint64" },
      name: { type: "string" },
      offer: {
        type: "object",
        subtypes: {
          name: { type: "string" },
          data: { type: "bytes", btype: "ADDRESS" },
          data2: { type: "bytes" },
        },
      },
      offers: {
        rule: "repeated",
        type: "object",
        subtypes: {
          name: { type: "string" },
          data: { type: "bytes", btype: "ADDRESS" },
          data2: { type: "bytes" },
        },
      },
      addresses: {
        rule: "repeated",
        type: "bytes",
        btype: "ADDRESS",
      },
    };

    const objDecoded = btypeDecode(obj, btypeObj);

    expect(objDecoded).toStrictEqual({
      from: new Uint8Array([1, 2, 3, 4]),
      chainId: new Uint8Array([5, 6, 7, 8]),
      points: 34,
      name: "alice",
      offer: {
        name: "offer1",
        data: new Uint8Array([9, 10, 11, 12]),
        data2: new Uint8Array([13, 14, 15, 16]),
      },
      offers: [
        {
          name: "offer1",
          data: new Uint8Array([0]),
          data2: new Uint8Array([1]),
        },
        {
          name: "offer2",
          data: new Uint8Array([12]),
          data2: new Uint8Array([13]),
        },
      ],
      addresses: [new Uint8Array([10, 20, 30]), new Uint8Array([40, 50, 60])],
    });

    const objEncoded = btypeEncode(objDecoded, btypeObj);
    expect(objEncoded).toStrictEqual(obj);
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
    expect(signer2.getPrivateKey("wif")).toBe(wif);
    expect(signer2.getPrivateKey("wif", true)).toBe(wifCompressed);
    expect(signer2.getPrivateKey("hex")).toBe(privateKey);

    const signer3 = new Signer({ privateKey });
    expect(signer3.getPrivateKey("wif")).toBe(wif);
    expect(signer3.getPrivateKey("wif", true)).toBe(wifCompressed);
    expect(signer3.getPrivateKey("hex")).toBe(privateKey);

    const signer4 = new Signer({ privateKey, compressed: false });
    expect(signer4.getPrivateKey("wif")).toBe(wif);
    expect(signer4.getPrivateKey("wif", true)).toBe(wifCompressed);
    expect(signer4.getPrivateKey("hex")).toBe(privateKey);

    const signer5 = Signer.fromSeed(seed);
    expect(signer5.getPrivateKey("wif")).toBe(wif);
    expect(signer5.getPrivateKey("wif", true)).toBe(wifCompressed);
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

  it("should sign a message", async () => {
    const message = "test message";
    const hash = sha256(message);
    const signature = await signer.signMessage(message);
    const recoveredAddress = Signer.recoverAddress(hash, signature);
    expect(recoveredAddress).toBe(addressCompressed);
  });
});

describe("Serializer", () => {
  it("should serialize and deserialize", async () => {
    const serializer = new Serializer(
      {
        nested: {
          main_object: {
            fields: {
              from: {
                type: "bytes",
                id: 1,
                options: {
                  "(btype)": "BASE58",
                },
              },
              chainId: {
                type: "bytes",
                id: 2,
                options: {
                  "(btype)": "BASE64",
                },
              },
              points: {
                type: "uint32",
                id: 3,
              },
              name: {
                type: "string",
                id: 4,
              },
              offer: {
                type: "offer_type",
                id: 5,
              },
              offers: {
                type: "offer_type",
                rule: "repeated",
                id: 6,
              },
              addresses: {
                type: "bytes",
                rule: "repeated",
                id: 7,
                options: {
                  "(koinos.btype)": "BASE58",
                },
              },
            },
          },
          offer_type: {
            fields: {
              name: {
                type: "string",
                id: 1,
              },
              data: {
                type: "bytes",
                id: 2,
                options: {
                  "(btype)": "BASE58",
                },
              },
              data2: {
                type: "bytes",
                id: 3,
                options: {
                  "(koinos.btype)": "BASE64",
                },
              },
            },
          },
        },
      },
      { defaultTypeName: "main_object" }
    );

    const mainObject = {
      from: encodeBase58(new Uint8Array([1, 2, 3, 4])),
      chainId: encodeBase64url(new Uint8Array([5, 6, 7, 8])),
      points: 34,
      name: "alice",
      offer: {
        name: "offer1",
        data: encodeBase58(new Uint8Array([9, 10, 11, 12])),
        data2: encodeBase64url(new Uint8Array([13, 14, 15, 16])),
      },
      offers: [
        {
          name: "offer1",
          data: encodeBase58(new Uint8Array([0])),
          data2: encodeBase64url(new Uint8Array([1])),
        },
        {
          name: "offer2",
          data: encodeBase58(new Uint8Array([12])),
          data2: encodeBase64url(new Uint8Array([13])),
        },
      ],
      addresses: [
        encodeBase58(new Uint8Array([10, 20, 30])),
        encodeBase58(new Uint8Array([40, 50, 60])),
      ],
    };

    const serialized = await serializer.serialize(mainObject);
    const deserizaled = await serializer.deserialize(serialized);
    expect(deserizaled).toStrictEqual(mainObject);
  });

  it("should accept options btype and koinos.btype", async () => {
    expect.assertions(2);
    const serializer1 = new Serializer(
      {
        nested: {
          my_data: {
            fields: {
              val1: {
                type: "bytes",
                id: 1,
              },
              val2: {
                type: "bytes",
                id: 2,
                options: {
                  "(btype)": "ADDRESS",
                },
              },
            },
          },
        },
      },
      { defaultTypeName: "my_data" }
    );
    const serializer2 = new Serializer(
      {
        nested: {
          my_data: {
            fields: {
              val1: {
                type: "bytes",
                id: 1,
              },
              val2: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
            },
          },
        },
      },
      { defaultTypeName: "my_data" }
    );

    const value = {
      val1: encodeBase64url(new Uint8Array([1, 2, 3, 4])),
      val2: encodeBase58(new Uint8Array([1, 2, 3, 4])),
    };

    const ser1 = await serializer1.serialize(value);
    const ser2 = await serializer2.serialize(value);
    const deser = await serializer1.deserialize(ser1);
    expect(deser).toStrictEqual(value);
    expect(encodeBase64url(ser1)).toBe(encodeBase64url(ser2));
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
        contract_id: koinContract.getId(),
        entry_point: koinContract.abi?.methods?.transfer?.entry_point,
        args: expect.any(String) as string,
      },
    } as OperationJson);

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
            target: {
              thunk_id: 234,
            },
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
          "EiDeXZzhjmhRCShrMjANTJ_ntno06KLstXBZrLsGqZBwwg==",
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
        { set_system_call: { call_id: 23, target: { thunk_id: 234 } } },
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
      id: "0x12209cef35988b17ff5594af827b9da55529a2663dcf3b6dbf15ec734744ada4d475",
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
        contract_id: encodeBase58(koinContract.id!),
        entry_point: koinContract.abi?.methods?.transfer?.entry_point,
        args: expect.any(String) as string,
      },
    } as OperationJson);

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
            entry_point: tokenAbi.methods.transfer.entry_point,
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
    expect.assertions(4);
    mockFetch.mockImplementation(async () => fetchResponse({ nonce: "OHs=" }));

    const { transaction, operation, result, receipt } = await koin.transfer(
      {
        from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
        to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
        value: "1000",
      },
      { sendTransaction: false }
    );

    // As send is false there is no result or receipt
    expect(operation).toBeDefined();
    expect(transaction).toBeDefined();
    expect(result).toBeUndefined();
    expect(receipt).toBeUndefined();
  });

  it("should submit a transaction", async () => {
    expect.assertions(4);

    const receipt = {
      id: "0x1220cf763bc42c18091fddf7a9d3c2963f95102b64a019d76c20215163ca9d900ff2",
      payer: "16MT1VQFgsVxEfJrSGinrA5buiqBsN5ViJ",
      max_payer_rc: "930000000",
      rc_limit: "930000000",
      rc_used: "470895",
      network_bandwidth_used: "311",
      compute_bandwidth_used: "369509",
      events: [
        {
          source: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
          name: "koin.transfer",
          data: "ChkAOraorkYwQTkrfp9ViHFI2CJvmCQh2mz7EhkArriH22GZ1VJLkeJ-x4JUGF4zPAEZrNUiGMCEPQ==",
          impacted: [
            "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
            "16MT1VQFgsVxEfJrSGinrA5buiqBsN5ViJ",
          ],
        },
      ],
    };

    jest.clearAllMocks();
    mockFetch.mockImplementation(async () => fetchResponse("mock error", 400));
    mockFetch.mockImplementationOnce(async () =>
      fetchResponse({ nonce: "OBE=" })
    ); // nonce
    mockFetch.mockImplementationOnce(async () => fetchResponse("OBE=")); // rc limit
    mockFetch.mockImplementationOnce(async () => fetchResponse({ receipt }));

    const {
      transaction,
      operation,
      result,
      receipt: receiptReceived,
    } = await koin.transfer(
      {
        from: "16MT1VQFgsVxEfJrSGinrA5buiqBsN5ViJ",
        to: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
        value: "1000000",
      },
      {
        chainId: "EiDyWt8BeDCTvG3_2QLJWbDJOnHqIcV4Ssqp69aZJsqPpg==",
      }
    );

    expect(operation).toBeDefined();
    expect(transaction).toBeDefined();
    expect(result).toBeUndefined();
    expect(receiptReceived).toStrictEqual(receipt);
  });

  it("should submit a transaction using the provider directly", async () => {
    expect.assertions(8);

    const receipt = {
      id: "0x1220cf763bc42c18091fddf7a9d3c2963f95102b64a019d76c20215163ca9d900ff2",
      payer: "16MT1VQFgsVxEfJrSGinrA5buiqBsN5ViJ",
      max_payer_rc: "930000000",
      rc_limit: "930000000",
      rc_used: "470895",
      network_bandwidth_used: "311",
      compute_bandwidth_used: "369509",
      events: [
        {
          source: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
          name: "koin.transfer",
          data: "ChkAOraorkYwQTkrfp9ViHFI2CJvmCQh2mz7EhkArriH22GZ1VJLkeJ-x4JUGF4zPAEZrNUiGMCEPQ==",
          impacted: [
            "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
            "16MT1VQFgsVxEfJrSGinrA5buiqBsN5ViJ",
          ],
        },
      ],
    };

    jest.clearAllMocks();
    mockFetch.mockImplementation(async () => fetchResponse("mock error", 400));
    mockFetch.mockImplementationOnce(async () =>
      fetchResponse({ nonce: "OBE=" })
    ); // nonce
    mockFetch.mockImplementationOnce(async () => fetchResponse("OBE=")); // rc limit
    mockFetch.mockImplementationOnce(async () => fetchResponse({ receipt }));

    const {
      transaction,
      operation,
      result,
      receipt: noReceipt,
    } = await koin.transfer(
      {
        from: "16MT1VQFgsVxEfJrSGinrA5buiqBsN5ViJ",
        to: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
        value: "1000000",
      },
      {
        chainId: "EiDyWt8BeDCTvG3_2QLJWbDJOnHqIcV4Ssqp69aZJsqPpg==",
        sendTransaction: false,
      }
    );

    const expectedTransaction: TransactionJson = {
      operations: [
        {
          call_contract: {
            contract_id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
            entry_point: 670398154,
            args: "ChkAOraorkYwQTkrfp9ViHFI2CJvmCQh2mz7EhkArriH22GZ1VJLkeJ-x4JUGF4zPAEZrNUiGMCEPQ==",
          },
        },
      ],
      header: {
        chain_id: "EiDyWt8BeDCTvG3_2QLJWbDJOnHqIcV4Ssqp69aZJsqPpg==",
        rc_limit: "0",
        nonce: "OBI=",
        operation_merkle_root:
          "EiCmVXWAuzW5xo1Pefx4256N_B_78cXvKwUxWFtKiY-PqQ==",
        payer: addressCompressed,
      },
      id: "0x1220c347788d427d457cfd78009375642f85f5859ac116fb58472ff201866efcdd6d",
      signatures: [
        "HwnYjHzMWN1eVTod2T8w5R9MPSive9UOdsj1WayWa73Sdj9hqWBWZF5Z-mBlOa6Btfk8baCghpQ-dTfslF0VSRY=",
      ],
    };

    expect(operation).toBeDefined();
    expect(transaction).toMatchObject({
      ...expectedTransaction,
      wait: expect.any(Function) as Function,
    } as TransactionJsonWait);
    expect(result).toBeUndefined();
    expect(noReceipt).toBeUndefined();
    expect(transaction!.wait.toString()).toStrictEqual(
      expect.stringContaining(
        'throw new Error("This transaction was not broadcasted");'
      )
    );

    const { transaction: transactionSend, receipt: receiptReceived } =
      await provider.sendTransaction(transaction!);
    expect(receiptReceived).toStrictEqual(receipt);
    expect(transactionSend).toStrictEqual({
      ...expectedTransaction,
      wait: expect.any(Function) as Function,
    } as TransactionJsonWait);
    expect(transaction!.wait.toString()).toStrictEqual(
      expect.stringContaining(
        "return this.wait(transaction.id, type, timeout);"
      )
    );
  });

  it("should get the error response from a failed transaction", async () => {
    expect.assertions(3);
    jest.clearAllMocks();

    mockFetch.mockImplementationOnce(async () =>
      fetchResponse({ nonce: "OBE=" })
    ); // nonce
    mockFetch.mockImplementationOnce(async () => fetchResponse("OBE=")); // rc limit
    mockFetch.mockImplementationOnce(async () =>
      fetchError({
        code: -32603,
        message: "",
        data: '{"logs":["error from contract"]}',
      })
    );

    await expect(
      koin.transfer(
        {
          from: "16MT1VQFgsVxEfJrSGinrA5buiqBsN5ViJ",
          to: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
          value: "1000000",
        },
        {
          chainId: "EiDyWt8BeDCTvG3_2QLJWbDJOnHqIcV4Ssqp69aZJsqPpg==",
        }
      )
    ).rejects.toThrow('{"logs":["error from contract"]}');

    jest.clearAllMocks();

    mockFetch.mockImplementationOnce(async () =>
      fetchResponse({ nonce: "OBE=" })
    ); // nonce
    mockFetch.mockImplementationOnce(async () => fetchResponse("OBE=")); // rc limit
    mockFetch.mockImplementationOnce(async () =>
      fetchError({
        code: -32603,
        message: "error message",
        data: '{"logs":["error from contract"]}',
      })
    );

    await expect(
      koin.transfer(
        {
          from: "16MT1VQFgsVxEfJrSGinrA5buiqBsN5ViJ",
          to: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
          value: "1000000",
        },
        {
          chainId: "EiDyWt8BeDCTvG3_2QLJWbDJOnHqIcV4Ssqp69aZJsqPpg==",
        }
      )
    ).rejects.toThrow(
      '{"error":"error message","logs":["error from contract"]}'
    );

    jest.clearAllMocks();

    mockFetch.mockImplementationOnce(async () =>
      fetchResponse({ nonce: "OBE=" })
    ); // nonce
    mockFetch.mockImplementationOnce(async () => fetchResponse("OBE=")); // rc limit
    mockFetch.mockImplementationOnce(async () =>
      fetchError({
        code: -32603,
        message: "error message",
      })
    );

    await expect(
      koin.transfer(
        {
          from: "16MT1VQFgsVxEfJrSGinrA5buiqBsN5ViJ",
          to: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
          value: "1000000",
        },
        {
          chainId: "EiDyWt8BeDCTvG3_2QLJWbDJOnHqIcV4Ssqp69aZJsqPpg==",
        }
      )
    ).rejects.toThrow("error message");
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

  it("should get the balance of an account using the preformat_argument and preformat_return", async () => {
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
      abi: JSON.parse(JSON.stringify(tokenAbi)) as Abi,
    });
    contractInstance.abi!.methods.balanceOf.preformat_argument = (owner) => ({
      owner,
    });
    contractInstance.abi!.methods.balanceOf.preformat_return = (res) =>
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
        contract_id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
        bytecode: "my_contract_bytecode",
      },
    } as OperationJson);

    expect(transaction).toStrictEqual({
      operations: [
        {
          upload_contract: {
            contract_id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
            bytecode: "my_contract_bytecode",
          },
        },
      ],
      header: {
        chain_id: "EiB-hw5ABo-EXy6fGDd1Iq3gbAenxQ4Qe60pRbEVMVrR9A==",
        rc_limit: "50000000",
        nonce: "OAE=",
        operation_merkle_root:
          "EiA0Va7dkQWSgpAGLURZeJtOc33JtsWFrqdk_1_oWtKMSA==",
        payer: addressCompressed,
      },
      id: "0x1220d6bcf054d67de8de619c5c9212b0ec1bfea0a32adc6edbb68719cc914675b243",
      signatures: [
        "HydetCgjGkgHok-ClGgtdo5XuW0fIB5dhE-tZomWs6sfCLhjTL50Y6YtPmn6w2Ms-rJNdH5cC7Gf6o1BAvlpTCw=",
      ],
      wait: expect.any(Function) as WaitFunction,
    } as TransactionJson);
  });

  it("should get a block with federated consensus and get the signer address", async () => {
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
