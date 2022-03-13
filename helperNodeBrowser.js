// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");

const [type] = process.argv.slice(2);
const filename = "./src/Provider.ts";
let providerData = fs.readFileSync(filename, "utf-8");

const lines = providerData.split(/\n/);
if (type === "--browser") {
  if (lines[0].includes("import fetch"))
    providerData = lines.slice(1).join("\n");
} else if (type === "--node") {
  if (!lines[0].includes("import fetch"))
    providerData = `import fetch from "cross-fetch";\n${providerData}`;
} else {
  throw new Error(`Invalid type ${type}`);
}

fs.writeFileSync(filename, providerData, "utf-8");
