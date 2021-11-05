/* eslint @typescript-eslint/no-var-requires: "off" */
const fs = require("fs");
const pbjs = require("protobufjs/cli/pbjs");

pbjs.main(
  ["--target", "json", "./koinos-proto/koinos/protocol/protocol.proto"],
  (err, output) => {
    if (err) throw err;
    fs.writeFileSync("./src/protocol-proto.json", output);
  }
);

pbjs.main(
  ["--target", "json", "./koinos-proto/koinos/contracts/token/token.proto"],
  (err, output) => {
    if (err) throw err;
    fs.writeFileSync("./src/krc20-proto.json", output);
  }
);
