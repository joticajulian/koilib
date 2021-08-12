import { bitcoinEncode, bitcoinDecode, toHexString } from "../src/utils";
import { Transaction, Wallet } from "../src/Wallet";
import { Contract } from "../src/Contract";
import { abiCallContractOperation } from "../src/abi";

const privateKeyHex =
  "3941804bde6bf02302f55fd21849ace5e84cb094af67a003c027de0280ee2e24";
const wif = "5JFW75rMt2RETkykhCx4xoHuoy1orRGYjfxrfLdD76JmUBG8fB5";
const wifCompressed = "Ky91TrQsADFxR77VrTk4VHKe6JEZo87d5LyYCDcpRtRRGmHjh7yo";
const publicKey =
  "04B31BA07E957FDEF6B5CB14FACC9D94F6A144690EF91C137345121C9A0F387BB9695552AF579E0142BD177B579253F82BBD31B4034151706701BEADF954340BE5";
const publicKeyCompressed =
  "03B31BA07E957FDEF6B5CB14FACC9D94F6A144690EF91C137345121C9A0F387BB9";
const address = "126LgExvJrLDQBsxA1Ddur2VjXJkyAbG91";
const addressCompressed = "1M2UM4X78EKKLoNs3z24icqjPqAfbuhocA";

const contract = new Contract({
  id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
  entries: {
    transfer: {
      id: 1,
      args: {
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
  },
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
    const wallet1 = new Wallet(privateKeyHex);
    const wallet2 = new Wallet(privateKeyHex, false);
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
      contract_id: contract.id,
      entry_point: 1,
      args: expect.any(String) as string,
    });

    expect(opDecoded).toStrictEqual(opTransfer);
  });

  it("should sign a transaction", async () => {
    expect.assertions(1);
    const wallet = new Wallet(privateKeyHex);
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
        operations: [
          {
            type: abiCallContractOperation.name as string,
            value: operation,
          },
        ],
      },
    };
    await wallet.signTransaction(transaction);
    expect(transaction).toStrictEqual({
      id: expect.any(String) as string,
      active_data: expect.objectContaining({}) as unknown,
      signature_data: expect.any(String) as string,
    } as Transaction);
  });
});
