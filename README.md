# Koilib

Koinos Library for Javascript and Typescript. It can be used in node and browsers.

## Table of Contents

1. [Install](#install)
2. [Usage](#usage)
3. [Documentation](#documentation)
4. [License](#license)

## Install

Install the package from NPM

```sh
npm install koilib
```

You can also load it directly to the browser by downloading the bunble file located at `dist/koinos.min.js`, or its non-minified version `dist/koinos.js` (useful for debugging).

## Usage

### Browser

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>My App</title>
    <script src="koinos.min.js"></script>
    <script>
      (async () => {
        const provider = new Provider(["http://api.koinos.io:8080"]);
        const signer = Signer.fromSeed("my seed");
        signer.provider = provider;
        const koinContract = new Contract({
          id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
          abi: utils.Krc20Abi,
          provider,
          signer,
        });
        const koin = koinContract.functions;

        // Get balance
        const { result } = await koin.balanceOf({
          owner: signer.getAddress(),
        });
        console.log(balance.result);
      })();
    </script>
  </head>
  <body></body>
</html>
```

### Node JS

With Typescript import the library

```typescript
import { Signer, Contract, Provider, Serializer, utils } from "koilib";
```

With Javascript import the library with require

```javascript
const { Signer, Contract, Provider, Serializer, utils } = require("koilib");
```

There are 4 principal classes:

- **Signer**: Class containing the private key. It is used to sign.
- **Provider**: Class to connect with the RPC node.
- **Contract**: Class defining the contract to interact with.
- **Serializer**: Class with the protocol buffers definitions to
  serialize/deserialize data types.

### Examples

#### Send tokens, get balance

The following code shows how to sign a transaction, broadcast
a transaction, and read contracts.

```typescript
(async () => {
  // define signer, provider, and contract
  const provider = new Provider(["http://api.koinos.io:8080"]);
  const signer = Signer.fromSeed("my seed");
  signer.provider = provider;
  const koinContract = new Contract({
    id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
    abi: utils.Krc20Abi,
    provider,
    signer,
  });
  const koin = koinContract.functions;

  // optional: preformat input/output
  koinContract.abi.methods.balanceOf.preformatInput = (owner) => ({ owner });
  koinContract.abi.methods.balanceOf.preformatOutput = (res) =>
    utils.formatUnits(res.value, 8);
  koinContract.abi.methods.transfer.preformatInput = (input) => ({
    from: signer.getAddress(),
    to: input.to,
    value: utils.parseUnits(input.value, 8),
  });

  // Transfer
  const { transaction } = await koin.transfer({
    to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
    value: "10.0001",
  });
  console.log(`Transaction id ${transaction.id} submitted`);

  // wait to be mined
  const blockNumber = await transaction.wait();
  console.log(`Transaction mined. Block number: ${blockNumber}`);

  // read the balance
  const { result } = await koin.balanceOf(signer.getAddress());
  console.log(result);
})();
```

#### Upload contract

It's also possible to upload contracts. First, follow the instructions in [koinos-sdk](https://github.com/koinos/koinos-sdk-cpp) (for C++ developers) or [koinos-as-sdk-examples](https://github.com/roaminroe/koinos-as-sdk-examples) (for TypeScript developers) to compile the contracts as wasm files. Then you can use koilib to deploy them.

```typescript
(async () => {
  // define signer, provider and bytecode
  const provider = new Provider(["http://api.koinos.io:8080"]);
  const signer = Signer.fromSeed("my seed");
  signer.provider = provider;
  const bytecode = fs.readFileSync("my_contract.wasm");

  // create contract and deploy
  const contract = new Contract({ signer, provider, bytecode });
  const { transaction } = await contract.deploy();
  // wait to be mined
  const blockNumber = await transaction.wait();
  console.log(`Contract uploaded in block number ${blockNumber}`);
})();
```

You can also upload a contract in a new address. It is not required that this new address has funds, you just have to set your principal wallet as payer.

```typescript
(async () => {
  // define signer, provider and bytecode
  const provider = new Provider(["http://api.koinos.io:8080"]);
  const accountWithFunds = Signer.fromSeed("this account has funds");
  const newAccount = Signer.fromSeed("new account without funds");
  accountWithFunds.provider = provider;
  newAccount.provider = provider;

  const bytecode = fs.readFileSync("my_contract.wasm");

  // create contract. Set newAccount as signer
  const contract = new Contract({
    signer: newAccount.address,
    provider,
    bytecode,
  });

  // call deploy but do not broadcast the transaction.
  // Also set the payer
  const { transaction } = await contract.deploy({
    payer: accountWithFunds.address,
    sendTransaction: false,
  });

  // sign the transaction with the payer
  await accountWithFunds.signTransaction(transaction);

  // at this point the transaction will have 2 signatures:
  // - signature of newAccount
  // - signature of accountWithFunds

  // now broadcast the transaction to deploy
  transaction = await newAccount.sendTransaction(transaction);
  const blockNumber = await transaction.wait();
  console.log(`Contract uploaded in block number ${blockNumber}`);
})();
```

### Create ABIs

ABIs are composed of 2 elements: methods and types.

- The methods define the names of the entries of the smart contract, the corresponding endpoints and the name of the types used.
- The types all the description to serialize and deserialize using proto buffers.

To generate the types is necessary to use the dependency protobufjs. The following example shows how to generate the protobuf descriptor from a .proto file.

```js
const fs = require("fs");
const pbjs = require("protobufjs/cli/pbjs");

pbjs.main(["--target", "json", "./token.proto"], (err, output) => {
  if (err) throw err;
  fs.writeFileSync("./token-proto.json", output);
});
```

Then this descriptor can be loaded to define the ABI:

```js
const tokenJson = require("./token-proto.json");
const abiToken = {
  methods: {
    balanceOf: {
      entryPoint: 0x5c721497,
      inputs: "balance_of_arguments",
      outputs: "balance_of_result",
      readOnly: true,
      defaultOutput: { value: "0" },
    },
    transfer: {
      entryPoint: 0x27f576ca,
      inputs: "transfer_arguments",
      outputs: "transfer_result",
    },
    mint: {
      entryPoint: 0xdc6f17bb,
      inputs: "mint_argumnets",
      outputs: "mint_result",
    },
  },
  types: tokenJson,
};
```

Note that this example uses "defaultOutput" for the method
"balanceOf". This is used when the smart contract returns an
empty response (for instance when there are no balance records
for a specific address) and you require a default output in
such cases.

## FAQ

1. Can this library be used to create smart contracts?

   No. You need to install [koinos-sdk](https://github.com/koinos/koinos-sdk-cpp)
   (for C++ developers) or [koinos-as-sdk-examples](https://github.com/roaminroe/koinos-as-sdk-examples)
   (for TypeScript developers) for this purpose.

2. Can this library be used to deploy smart contracts?

   Yes. If you already have the contract compiled as a .wasm file you can use
   the Contract class to load the bytecode and deploy it.

3. Can this library be used to create the ABI for any smart contract?

   For the ABI you need the .proto file and the library
   [protobufjs](https://www.npmjs.com/package/protobufjs). Then follow the format
   for the ABI as described in the previous section. It's important to note that
   this ABI is not the same ABI used in [koinos-cli](https://docs.koinos.io/architecture/contract-abi.html).
   In particular, descriptors use different format (koilib using json format, cli
   using binary format).

4. Can this library be used to interact with smart contracts?

   Yes. You can use it to call readOnly functions, or send transactions
   to the contract by calling write functions.

## Documentation

The complete documentation can be found at https://joticajulian.github.io/koilib/

## License

MIT License

Copyright (c) 2021 Julián González

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
