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
