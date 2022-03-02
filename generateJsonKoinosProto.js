/* eslint @typescript-eslint/no-var-requires: "off" */
const fs = require("fs");
const pbjs = require("protobufjs/cli/pbjs");

pbjs.main(
  [
    "--keep-case",
    "--target",
    "json",
    "./koinos-proto/koinos/protocol/protocol.proto",
  ],
  (err, output) => {
    if (err) throw err;
    fs.writeFileSync("./src/jsonDescriptors/protocol-proto.json", output);
  }
);

pbjs.main(
  [
    "--keep-case",
    "--target",
    "json",
    "./koinos-proto/koinos/chain/value.proto",
  ],
  (err, output) => {
    if (err) throw err;
    fs.writeFileSync("./src/jsonDescriptors/value-proto.json", output);
  }
);

pbjs.main(
  [
    "--keep-case",
    "--target",
    "json",
    "./koinos-proto/koinos/contracts/token/token.proto",
  ],
  (err, output) => {
    if (err) throw err;
    fs.writeFileSync("./src/jsonDescriptors/krc20-proto.json", output);
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
