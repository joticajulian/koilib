import { /* bitcoinEncode, */ bitcoinDecode, toHexString } from "../src/utils";
import { Transaction, Signer } from "../src/Signer";
import { Contract } from "../src/Contract";
import { Wallet } from "../src/Wallet";
import { Provider } from "../src/Provider";

const privateKeyHex =
  "bab7fd6e5bd624f4ea0c33f7e7219262a6fa93a945a8964d9f110148286b7b37";
const seed = "one two three four five six";
const wif = "5KEX4TMHG66fT7cM9HMZLmdp4hVq4LC4X2Fkg6zeypM5UteWmtd";
const wifCompressed = "L3UfgFJWmbVziGB1uZBjkG1UjKkF7hhpXWY7mbTUdmycmvXCVtiL";
/*const publicKey =
  "042921DD54FDD8FB5D2AB1A9928DB7E9E08B34F8711A3332E0F1B36E71076B9CF291E7C6DBCC8C0CF132DB40D32722301B5244B1274DC16A5A54C3220B7DEF3423";
const publicKeyCompressed =
  "032921DD54FDD8FB5D2AB1A9928DB7E9E08B34F8711A3332E0F1B36E71076B9CF2"; */
const address = "1AjfrkFYS28SgPWrvaUeY6pThbzF1fUrjQ";
const addressCompressed = "1GE2JqXw5LMQaU1sj82Dy8ZEe2BRXQS1cs";
const urlProvider = "http://45.56.104.152:8080";

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
  it.only("should get private key", () => {
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

  it("should sign a transaction", async () => {
    expect.assertions(1);
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
  });

  it("should create a wallet and sign a transaction", async () => {
    const wallet = new Wallet({
      signer: new Signer(privateKeyHex),
      contract,
      provider: new Provider(urlProvider),
    });

    const operation = wallet.encodeOperation({
      name: "transfer",
      args: {
        from: wallet.getAddress(),
        to: "bob",
        value: BigInt(1000),
      },
    });

    const tx = await wallet.newTransaction({
      operations: [operation],
    });

    await wallet.signTransaction(tx);
    await wallet.sendTransaction(tx);
  });

  it("should get the balance of an account", async () => {
    const wallet = new Wallet({
      contract,
      provider: new Provider(urlProvider),
    });

    const result = await wallet.readContract({
      name: "balance_of",
      args: "1Krs7v1rtpgRyfwEZncuKMQQnY5JhqXVSx",
    });

    expect(result).toBeDefined();
  });
});
