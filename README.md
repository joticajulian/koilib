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
          abi: utils.tokenAbi,
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
    abi: utils.tokenAbi,
    provider,
    signer,
  });
  const koin = koinContract.functions;

  // optional: preformat input/output
  koinContract.abi.methods.balanceOf.preformat_argument = (owner) => ({
    owner,
  });
  koinContract.abi.methods.balanceOf.preformat_return = (res) =>
    utils.formatUnits(res.value, 8);
  koinContract.abi.methods.transfer.preformat_argument = (input) => ({
    from: signer.getAddress(),
    to: input.to,
    value: utils.parseUnits(input.value, 8),
  });

  // Transfer
  const { transaction, receipt } = await koin.transfer({
    to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
    value: "10.0001",
  });
  console.log(`Transaction id ${transaction.id} submitted. Receipt:`);
  console.log(receipt);

  if (receipt.logs) {
    console.log(`Transfer failed. Logs: ${receipt.logs.join(",")}`);
  }

  // wait to be mined
  const { blockNumber } = await transaction.wait();
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
  const { transaction, receipt } = await contract.deploy();
  console.log("Transaction submitted. Receipt:");
  console.log(receipt);
  // wait to be mined
  const { blockNumber } = await transaction.wait();
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
    signer: newAccount,
    provider,
    bytecode,
    options: {
      // transaction options
      // set payer
      payer: accountWithFunds.address,

      // use "beforeSend" function to sign
      // the transaction with the payer
      beforeSend: async (tx) => {
        accountWithFunds.signTransaction(tx);
      },
    },
  });

  // call deploy()
  // By default it is signed by "newAccount". But, as
  // in beforeSend it is signed by the payer then it
  // will have 2 signatures
  const { receipt } = await contract.deploy();
  console.log("Transaction submitted. Receipt: ");
  console.log(receipt);
  const { blockNumber } = await transaction.wait();
  console.log(`Contract uploaded in block number ${blockNumber}`);
})();
```

In fact, there are several ways to set a different payer and use it to upload a contract. This is another example:

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
    signer: newAccount,
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
  const { receipt } = await newAccount.sendTransaction(transaction);
  console.log("Transaction submitted. Receipt: ");
  console.log(receipt);
  const { blockNumber } = await transaction.wait();
  console.log(`Contract uploaded in block number ${blockNumber}`);
})();
```

### Multisignatures

It can be configured to sign a single transaction with multiple accounts. Here is an example:

```ts
const signer2 = Signer.fromSeed("signer2");
const signer3 = Signer.fromSeed("signer3");

const addMoreSignatures = async (tx) => {
  await signer2.signTransaction(tx);
  await signer3.signTransaction(tx);
};

const { transaction } = await koin.transfer(
  {
    from: "16MT1VQFgsVxEfJrSGinrA5buiqBsN5ViJ",
    to: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
    value: "1000000",
  },
  {
    payer: signer2.getAddress(),
    beforeSend: addMoreSignatures,
  }
);
```

### Create ABIs

ABIs are composed of 2 elements: methods and types.

- The methods define the names of the entries of the smart contract, the corresponding endpoints and the name of the types used.
- The types all the description to serialize and deserialize using proto buffers.

To generate the types is necessary to use the dependency protobufjs. The following example shows how to generate the protobuf descriptor from a .proto file.

```js
const fs = require("fs");
const pbjs = require("protobufjs-cli/pbjs");

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
      entry_point: 0x5c721497,
      argument: "balance_of_arguments",
      return: "balance_of_result",
      read_only: true,
      default_output: { value: "0" },
    },
    transfer: {
      entry_point: 0x27f576ca,
      argument: "transfer_arguments",
      return: "transfer_result",
    },
    mint: {
      entry_point: 0xdc6f17bb,
      argument: "mint_argumnets",
      return: "mint_result",
    },
  },
  koilib_types: tokenJson,
};
```

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
   this ABI has a difference with respect to the ABI used in [koinos-cli](https://docs.koinos.io/architecture/contract-abi.html).
   In particular, koilib takes the descriptor from `koilib_types`, which is a
   descriptor in json format, while the ABI in koinos-cli takes the descriptor from
   `types`, which is a descriptor in binary format.

4. Can this library be used to interact with smart contracts?

   Yes. You can use it to call read_only functions, or send transactions
   to the contract by calling write functions.

## Documentation

The complete documentation can be found at https://joticajulian.github.io/koilib/

## Acknowledgments

Many thanks to the sponsors of this library: @levineam, @Amikob, @motoeng, @isaacdozier, @imjwalker, and the private sponsors.

If you would like to contribute to the development of this library consider becoming a sponsor in https://github.com/sponsors/joticajulian.

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
