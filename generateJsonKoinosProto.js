/* eslint @typescript-eslint/no-var-requires: "off" */
const fs = require("fs");
const pbjs = require("protobufjs-cli/pbjs");

pbjs.main(
  [
    "--keep-case",
    "--target",
    "json",
    "./koinos-proto/koinos/common.proto",
    "./koinos-proto/koinos/protocol/protocol.proto",
    "./koinos-proto/koinos/chain/chain.proto",
  ],
  (err, output) => {
    if (err) throw err;
    fs.writeFileSync("./src/jsonDescriptors/chain-proto.json", output);
  }
);

pbjs.main(
  [
    "--keep-case",
    "--target",
    "json",
    "./koinos-proto/koinos/contracts/pow/pow.proto",
  ],
  (err, output) => {
    if (err) throw err;
    fs.writeFileSync("./src/jsonDescriptors/pow-proto.json", output);
  }
);

// static modules

pbjs.main(
  [
    "--keep-case",
    "--target",
    "static-module",
    "./koinos-proto/koinos/protocol/protocol.proto",
    "./koinos-proto/koinos/chain/value.proto",
  ],
  (err, output) => {
    if (err) throw err;
    fs.writeFileSync("./src/protoModules/protocol-proto.js", output);
  }
);

pbjs.main(
  [
    "--keep-case",
    "--target",
    "static-module",
    "./koinos-proto/koinos/chain/value.proto",
  ],
  (err, output) => {
    if (err) throw err;
    fs.writeFileSync("./src/protoModules/value-proto.js", output);
  }
);
