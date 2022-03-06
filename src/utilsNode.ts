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
} from "./utils";
import chainJson from "./jsonDescriptors/chain-proto.json";

export const defaultDictionaryGenesisData: DictionaryGenesisData = {
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

export async function decodeGenesisData(
  genesisData: GenesisDataEncoded,
  dictionary: DictionaryGenesisData = {}
) {
  const genesisDataDecoded: GenesisDataDecoded = {};
  if (!genesisData || !genesisData.entries) return genesisDataDecoded;

  const serializerChain = new Serializer(chainJson, {
    bytesConversion: true,
  });

  const defaultDictionary = JSON.parse(
    JSON.stringify(defaultDictionaryGenesisData)
  ) as DictionaryGenesisData;
  Object.keys(defaultDictionary).forEach((key) => {
    defaultDictionary[key].serializer = serializerChain;
  });

  const dic = {
    ...defaultDictionary,
    ...dictionary,
  };

  Object.keys(dic).forEach((key) => {
    if (dic[key].keyEncoded) return;
    dic[key].keyEncoded = encodeBase64(multihash(sha256(key)));
  });

  genesisDataDecoded.entries = await Promise.all(
    genesisData.entries.map(async (entry) => {
      const key = Object.keys(dic).find(
        (key) => dic[key].keyEncoded === entry.key
      );
      if (!key)
        return {
          error: `encoded key ${entry.key} not found in the dictionary`,
          ...entry,
        };

      const { isAddress, serializer, typeName } = dic[key];

      const valueBase64url = encodeBase64url(decodeBase64(entry.value));
      let value: unknown;
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
        space: entry.space,
        key,
        value,
        ...(error && { error }),
      };
    })
  );

  return genesisDataDecoded;
}

export const ChainTypes = chainJson;
