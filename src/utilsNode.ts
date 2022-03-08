import { sha256 } from "@noble/hashes/sha256";
import {
  DictionaryGenesisData,
  GenesisDataDecoded,
  GenesisDataEncoded,
} from "./interface";
import { Serializer } from "./Serializer";
import {
  multihash,
  encodeBase64,
  decodeBase64,
  encodeBase64url,
  decodeBase64url,
  encodeBase58,
  decodeBase58,
} from "./utils";
import chainJson from "./jsonDescriptors/chain-proto.json";

const defaultAlias: DictionaryGenesisData = {
  "object_key::head_block": { typeName: "block" },
  "object_key::chain_id": {},
  "object_key::genesis_key": { isAddress: true },
  "object_key::resource_limit_data": { typeName: "resource_limit_data" },
  "object_key::max_account_resources": { typeName: "max_account_resources" },
  "object_key::protocol_descriptor": {},
  "object_key::compute_bandwidth_registry": {
    typeName: "compute_bandwidth_registry",
  },
  "object_key::block_hash_code": {},
};

function prepareDictionary(
  dictionary: DictionaryGenesisData
): DictionaryGenesisData {
  const serializerChain = new Serializer(chainJson, { bytesConversion: true });

  const defaultDictionary: DictionaryGenesisData = {};
  Object.keys(defaultAlias).forEach((alias) => {
    const key = encodeBase64(multihash(sha256(alias)));
    defaultDictionary[key] = {
      serializer: serializerChain,
      alias,
      ...defaultAlias[alias],
    };
  });

  const dic = {
    ...defaultDictionary,
    ...dictionary,
  };

  return dic;
}

export async function encodeGenesisData(
  genesisDataDecoded: GenesisDataDecoded,
  dictionary: DictionaryGenesisData = {}
): Promise<GenesisDataEncoded> {
  const genesisData: GenesisDataEncoded = {};
  if (!genesisDataDecoded || !genesisDataDecoded.entries) return genesisData;
  const dic = prepareDictionary(dictionary);

  genesisData.entries = await Promise.all(
    genesisDataDecoded.entries.map(async (entry) => {
      const key = Object.keys(dic).find(
        (k) =>
          k === entry.key || (entry.alias && dic[k].alias === entry.alias)
      );
      if (!key)
        return {
          error: `key ${entry.key!} not found in the dictionary`,
          space: entry.space,
          key: entry.key,
          value: encodeBase64(new Uint8Array()),
        };

      const { isAddress, serializer, typeName } = dic[key];
      let valueBytes: Uint8Array;
      let error = "";
      if (isAddress) {
        valueBytes = decodeBase58(entry.value as string);
      } else if (serializer && typeName) {
        valueBytes = await serializer.serialize(
          entry.value as Record<string, unknown>,
          typeName
        );
      } else {
        valueBytes = new Uint8Array();
        error = "no serializer or typeName defined in the dictionary";
      }

      return {
        ...(error && { error }),
        space: entry.space,
        key,
        value: encodeBase64(valueBytes),
      };
    })
  );

  return genesisData;
}

export async function decodeGenesisData(
  genesisData: GenesisDataEncoded,
  dictionary: DictionaryGenesisData = {}
): Promise<GenesisDataDecoded> {
  const genesisDataDecoded: GenesisDataDecoded = {};
  if (!genesisData || !genesisData.entries) return genesisDataDecoded;
  const dic = prepareDictionary(dictionary);

  genesisDataDecoded.entries = await Promise.all(
    genesisData.entries.map(async (entry) => {
      const key = Object.keys(dic).find((k) => k === entry.key);
      if (!key)
        return {
          error: `key ${entry.key!} not found in the dictionary`,
          ...entry,
        };

      const { isAddress, serializer, typeName, alias } = dic[key];

      const valueBase64url = encodeBase64url(decodeBase64(entry.value));
      let value: string | Record<string, unknown>;
      let error = "";
      if (isAddress) {
        value = encodeBase58(decodeBase64url(valueBase64url));
      } else if (serializer && typeName) {
        value = await serializer.deserialize(valueBase64url, typeName);
      } else {
        value = valueBase64url;
        error = "no serializer or typeName defined in the dictionary";
      }

      return {
        ...(error && { error }),
        space: entry.space,
        key,
        value,
        ...(alias && { alias }),
      };
    })
  );

  return genesisDataDecoded;
}

export const ChainTypes = chainJson;
