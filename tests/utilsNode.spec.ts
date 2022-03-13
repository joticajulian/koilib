import { Serializer } from "../src/Serializer";
import { Signer } from "../src/Signer";
import {
  decodeBase58,
  encodeBase64,
  encodeBase64url,
  toUint8Array,
} from "../src/utils";
import { decodeGenesisData, encodeGenesisData } from "../src/utilsNode";
import powJson from "../src/jsonDescriptors/pow-proto.json";

describe("utils node", () => {
  const signer = Signer.fromSeed("seed");

  it("should encode and decode default genesis data", async () => {
    expect.assertions(2);
    const genesisDataDecoded = {
      entries: [
        {
          space: { system: true },
          alias: "object_key::genesis_key",
          value: signer.address,
        },
        {
          space: { system: true },
          alias: "object_key::resource_limit_data",
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
          alias: "object_key::max_account_resources",
          value: {
            value: "10000000",
          },
        },
      ],
    };

    const expectedGenesisData = {
      entries: [
        {
          space: { system: true },
          key: "EiC3nO+XbeKg4C8ugW7M7XdfmJKY4i3l91KoJWxosQPImA==",
          value: "AMpASH7CjUHBpl2QR8E5lGKVjVLAvJRg5g==",
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
    };

    const expectedGenesisDataDecoded = {
      entries: genesisDataDecoded.entries.map((entry, id) => ({
        ...entry,
        key: expectedGenesisData.entries[id].key,
      })),
    };

    const genesisData = await encodeGenesisData(genesisDataDecoded);
    expect(genesisData).toStrictEqual(expectedGenesisData);

    const genesisDataDecoded2 = await decodeGenesisData(genesisData);
    expect(genesisDataDecoded2).toStrictEqual(expectedGenesisDataDecoded);
  });

  it("should encode and decode custom genesis data", async () => {
    expect.assertions(2);
    const contractId = Signer.fromSeed("seed").address;
    const zone = encodeBase64(decodeBase58(contractId));
    const genesisDataDecoded = {
      entries: [
        {
          space: { system: true, zone, id: 1 },
          key: "difficulty_metadata_key",
          value: {
            target: encodeBase64url(toUint8Array("F".repeat(64))),
            last_block_time: "1641038400000",
            difficulty: encodeBase64url(toUint8Array("1".repeat(64))),
            target_block_interval: "10",
          },
        },
      ],
    };

    const expectedGenesisData = {
      entries: [
        {
          key: "difficulty_metadata_key",
          space: {
            id: 1,
            system: true,
            zone: "AMpASH7CjUHBpl2QR8E5lGKVjVLAvJRg5g==",
          },
          value:
            "CiD//////////////////////////////////////////xCAlIus4S8aIBERERERERERERERERERERERERERERERERERERERERERIAo=",
        },
      ],
    };

    const dic = {
      difficulty_metadata_key: {
        serializer: new Serializer(powJson),
        typeName: "difficulty_metadata",
      },
    };
    const genesisData = await encodeGenesisData(genesisDataDecoded, dic);
    expect(genesisData).toStrictEqual(expectedGenesisData);

    const genesisDataDecoded2 = await decodeGenesisData(genesisData, dic);
    expect(genesisDataDecoded2).toStrictEqual(genesisDataDecoded);
  });
});
