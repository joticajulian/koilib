import crypto from "crypto";
import { Signer } from "../src/Signer";
import { Wallet } from "../src/Wallet";
import { Provider } from "../src/Provider";

const rpcNodes = ["http://45.56.104.152:8080", "http://159.203.119.0:8080"];

describe("Contract", () => {
  it("upload a contract", async () => {
    const signer = Signer.fromSeed(crypto.randomBytes(12).toString("hex"));
    const provider = new Provider(rpcNodes);
    const wallet = new Wallet({ signer, provider });
    const bytecode = new Uint8Array(crypto.randomBytes(6));
    const operation = wallet.encodeUploadContractOperation(bytecode);
    const tx = await wallet.newTransaction({
      operations: [operation],
    });
    await wallet.signTransaction(tx);
    await wallet.sendTransaction(tx);
  });
});
