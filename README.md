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

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>My App</title>
    <script src="koinos.min.js"></script>
  </head>
  <body></body>
</html>
```

## Usage

```typescript
import { Wallet, Signer, Contract, Provider } from "koilib";

const wallet = new Wallet({
  signer: new Signer(privateKeyHex),
  contract: new Contract(),
  provider: new Provider(urlProvider),
});

const operation = wallet.encodeOperation({
  name: "transfer",
  args: {
    from: wallet.getAddress(),
    to: "bob",
    value: BigInt(1000),
  },
});

const tx = await wallet.newTransaction({
  getNonce: true,
  operations: [operation],
});

await wallet.signTransaction(tx);
await wallet.sendTransaction(tx);
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
