import { /* bitcoinEncode, */ bitcoinDecode, toHexString } from "../src/utils";
import { Transaction, Signer } from "../src/Signer";
import { Contract } from "../src/Contract";
import { Wallet } from "../src/Wallet";
import { Provider } from "../src/Provider";

const privateKeyHex =
  "3941804bde6bf02302f55fd21849ace5e84cb094af67a003c027de0280ee2e24";
const wif = "5JFW75rMt2RETkykhCx4xoHuoy1orRGYjfxrfLdD76JmUBG8fB5";
const wifCompressed = "Ky91TrQsADFxR77VrTk4VHKe6JEZo87d5LyYCDcpRtRRGmHjh7yo";
/*const publicKey =
  "04B31BA07E957FDEF6B5CB14FACC9D94F6A144690EF91C137345121C9A0F387BB9695552AF579E0142BD177B579253F82BBD31B4034151706701BEADF954340BE5";
const publicKeyCompressed =
  "03B31BA07E957FDEF6B5CB14FACC9D94F6A144690EF91C137345121C9A0F387BB9"; */
const address = "126LgExvJrLDQBsxA1Ddur2VjXJkyAbG91";
const addressCompressed = "1M2UM4X78EKKLoNs3z24icqjPqAfbuhocA";
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
