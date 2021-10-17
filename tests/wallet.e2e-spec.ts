import crypto from "crypto";
import { Signer } from "../src/Signer";
import { Provider } from "../src/Provider";
import { Contract } from "../src";

const rpcNodes = ["http://45.56.104.152:8080", "http://159.203.119.0:8080"];

describe("Contract", () => {
  it("upload a contract", async () => {
    expect.assertions(0);
    const signer = Signer.fromSeed(crypto.randomBytes(12).toString("hex"));
    const provider = new Provider(rpcNodes);
    const bytecode = new Uint8Array(crypto.randomBytes(6));
    const contract = new Contract({ signer, provider, bytecode });
    await contract.deploy();
  });
});
