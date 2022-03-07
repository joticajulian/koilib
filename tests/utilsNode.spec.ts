import crypto from "crypto";
import Signer from "../src/Signer";
import { decodeGenesisData, encodeGenesisData } from "../src/utilsNode";

describe("utils node", () => {
  const signer = new Signer({
    privateKey: crypto.randomBytes(32).toString("hex"),
  });

  it("should encode and decode default genesis data", async () => {
    expect.assertions(2);
    const genesisDataDecoded = {
      entries: [
        {
          space: { system: true },
          key: "object_key::genesis_key",
          value: signer.address,
        },
        {
          space: { system: true },
          key: "object_key::resource_limit_data",
          value: {
            disk_storage_limit: "1048576",
            disk_storage_cost: "10",
            network_bandwidth_limit: "1048576",
            network_bandwidth_cost: "5",
            compute_bandwidth_limit: "100000000",
            compute_bandwidth_cost: "1",
          },
        },
        {
          space: { system: true },
          key: "object_key::max_account_resources",
          value: {
            value: "10000000",
          },
        },
      ],
    };

    const genesisData = await encodeGenesisData(genesisDataDecoded);
    expect(genesisData).toStrictEqual({
      entries: [
        {
          space: { system: true },
          key: "EiC3nO+XbeKg4C8ugW7M7XdfmJKY4i3l91KoJWxosQPImA==",
          value: "ALftrI9Y1NVGpLVj4Sz+d+CCykTatJE4rw==",
        },
        {
          space: { system: true },
          key: "EiAcNQJ8B7BQ+R1Wxk07JBFi/6X6oMQR8avARhKkydjkMg==",
          value: "CICAQBAKGICAQCAFKIDC1y8wAQ==",
        },
        {
          space: { system: true },
          key: "EiB7eqyh1n1vpsS7Ggp7ZnqGSKNr+dHFvusyM/gV6rZhXg==",
          value: "CICt4gQ=",
        },
      ],
    });

    const genesisDataDecoded2 = await decodeGenesisData(genesisData);
    expect(genesisDataDecoded2).toStrictEqual(genesisDataDecoded);
  });
});
