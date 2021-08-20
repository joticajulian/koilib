# Koilib

Koinos Library for Javascript and Typescript. It can be used in node and browsers.

## Table of Contents

1. [Install](#install)
2. [Usage](#usage)
3. [License](#license)

## Install

Install the package from NPM

```sh
npm install koilib
```

You can also load it directly to the browser by downloading the bunble file located at `dist/koinos.min.js`, or it's non-minified version `dist/koinos.js` (useful for debugging).

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
        const signer = Signer.fromSeed("my seed");
        const provider = new Provider("http://45.56.104.152:8080");
        const contract = new Contract({
          id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
          entries: {
            balance_of: {
              id: 0x15619248,
              args: { type: "string" },
            },
          },
        });
        const wallet = new Wallet({ signer, contract, provider });

        const operation = wallet.encodeOperation({
          name: "balance_of",
          args: wallet.getAddress(),
        });
        const result = await wallet.readContract(operation.value);
        const balance = serializer
          .deserialize(result.result, { type: "uint64" })
          .toString();
        console.log(Number(balance) / 1e8);
      })();
    </script>
  </head>
  <body></body>
</html>
```

### Node JS

With Typescript import the library

```typescript
import { Wallet, Signer, Contract, Provider } from "koilib";
```

With Javascript import the library with require

```javascript
const { Wallet, Signer, Contract, Provider } = require("koilib");
```

There are 4 principal classes:

- **Signer**: Class containing the private key. It is used to sign.
- **Provider**: Class to connect with the RPC node.
- **Contract**: Class defining the contract to interact with.
- **Wallet**: Class that packages signer, provider, and contract classes.

The following code shows how to create a wallet, sign a transaction, broadcast
a transaction, and read contracts.

```typescript
(async () => {
  // define signer, provider, and contract
  const signer = Signer.fromSeed("my seed");
  const provider = new Provider("http://45.56.104.152:8080");
  const contract = new Contract({
    id: "Mkw96mR+Hh71IWwJoT/2lJXBDl5Q=",
    entries: {
      transfer: {
        id: 0x62efa292,
        args: {
          type: [
            {
              name: "from",
              type: "string",
            },
            {
              name: "to",
              type: "string",
            },
            {
              name: "value",
              type: "uint64",
            },
          ],
        },
      },
      balance_of: {
        id: 0x15619248,
        args: { type: "string" },
      },
    },
  });

  // create a wallet with signer, provider and contract
  const wallet = new Wallet({ signer, provider, contract });

  // encode a contract operation to make a transfer
  const opTransfer = wallet.encodeOperation({
    name: "transfer",
    args: {
      from: wallet.getAddress(),
      to: "bob",
      value: BigInt(1000),
    },
  });

  // create a transaction
  const tx = await wallet.newTransaction({
    getNonce: true,
    operations: [opTransfer],
  });

  // sign and send transaction
  await wallet.signTransaction(tx);
  await wallet.sendTransaction(tx);

  // read the balance
  const opBalance = wallet.encodeOperation({
    name: "balance_of",
    args: wallet.getAddress(),
  });
  const result = await wallet.readContract(opBalance.value);
  const balance = serializer
    .deserialize(result.result, { type: "uint64" })
    .toString();
  console.log(Number(balance) / 1e8);
})();
```

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
