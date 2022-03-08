/*import { decodeGenesisData, encodeGenesisData } from "./src/utilsNode";
import genesisData from "./tests/genesis_data.json";

(async () => {
  const g2 = {
    entries: [
      genesisData.entries[0],
      genesisData.entries[1],
      genesisData.entries[2],
      //genesisData.entries[3],
      genesisData.entries[4],
      //genesisData.entries[5],
    ],
  };
  const decoded = await decodeGenesisData(g2);
  const encoded = await encodeGenesisData(decoded);
  console.log(encoded);
  console.log(g2);
  console.log("son iguales: ", JSON.stringify(encoded) === JSON.stringify(g2));
  console.log(JSON.stringify(decoded, null, 2));
})();*/
import { Serializer } from "./src/Serializer";
import { ChainTypes } from "./src/utilsNode";

(async () => {
  const s = new Serializer(ChainTypes, { defaultTypeName: "database_key" });
  /*const dbKey1 = await s.serialize({
    space: { system: true, id: 0 },
    key: Buffer.from("jota").toString("base64"),
  });
  console.log("dbkey1: ", dbKey1);*/

  /*const reco = await s.deserialize(dbKey1);
  console.log("recovered");
  console.log(reco);*/
  const dbKey2 = await s.serialize({
    space: { system: true },
    key: Buffer.from("jota").toString("base64"),
  });
  console.log("dbkey2: ", dbKey2);

  const reco = await s.deserialize(dbKey2);
  console.log("recovered");
  console.log(reco);
})();
