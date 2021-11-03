import crypto from "crypto";
import { Signer, Provider, Contract, utils } from "../src";

const privateKeyHex = crypto.randomBytes(32).toString("hex");
const rpcNodes = ["http://api.koinos.io:8080"];
const provider = new Provider(rpcNodes);
const signer = new Signer(privateKeyHex, true, provider);
const koinContract = new Contract({
  id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
  abi: utils.Krc20Abi,
  provider,
  signer,
});
const koin = koinContract.functions;

describe("Contract", () => {
  it.skip("upload a contract", async () => {
    expect.assertions(0);
    const bytecode = new Uint8Array(crypto.randomBytes(6));
    const contract = new Contract({ signer, provider, bytecode });
    await contract.deploy();
  });

  it("connect with koin smart contract", async () => {
    expect.assertions(2);

    const { result: resultName } = await koin.name();
    expect(resultName).toStrictEqual({ value: "Test Koinos" });

    const { result: resultBalance } = await koin.balanceOf({
      owner: signer.getAddress(),
    });
    expect(resultBalance).toBeUndefined();
  });
});
