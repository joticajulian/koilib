# Changelog

All notable changes to this project will be documented in this file. 🤘

## [v5.5.1](https://github.com/joticajulian/koilib/releases/tag/v5.5.1) (2023-03-20)

### 🐛 Bug Fixes

- Fix name in Contract class: fetcthAbi -> fetchAbi
- Skip the Buffer dependency of koinosPbToProto to be able to use it in the browser

## [v5.5.0](https://github.com/joticajulian/koilib/releases/tag/v5.5.0) (2023-03-19)

### 🚀 Features

- New function in Contract class to fetch the ABI from the contract meta store.
- Function to decode events.
- The ABI now accepts types (binary descriptor) or koilib_types (json descriptor) in Contract class and Serializer class 🥳

### 🐛 Bug Fixes

- fix prepare function Transaction class

## [v5.4.0](https://github.com/joticajulian/koilib/releases/tag/v5.4.0) (2023-02-24)

### 🚀 Features

- New Transaction Class. Very useful when submitting multiple operations.
- Documentation updated for multiple operations

### 🐛 Bug Fixes

- compute contract id in the constructor of Contract class

## [v5.3.1](https://github.com/joticajulian/koilib/releases/tag/v5.3.1) (2022-12-15)

### 🐛 Bug Fixes

- fix BaseTransactionOptions interface: Use new beforeSend

## [v5.3.0](https://github.com/joticajulian/koilib/releases/tag/v5.3.0) (2022-12-15)

### 🚀 Features

- beforeSend now has `options` in the parameters. Then it is possible to do something like this to pass the abis to the signer:

```
const beforeSend = async (tx, opts) => {
  await signer.signTransaction(tx, opts?.abis);
};
```

### 🐛 Bug Fixes

- send abis was missing in Signer.ts
