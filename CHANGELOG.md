# Changelog

All notable changes to this project will be documented in this file. 🤘

## [v5.6.0](https://github.com/joticajulian/koilib/releases/tag/v5.6.0) (2023-07-20)

### 🚀 Features

- The prepareTransaction function of the Signer has been marked as deprecated. Now
this function has been moved to the Transaction Class. The motivation of this change
is to avoid multiple calls and permissions to the wallets that manage the Signers.
- The Contract Class and Transaction Class now use the new prepareTransaction
function instead of the one from the Signer Class.

## [v5.5.6](https://github.com/joticajulian/koilib/releases/tag/v5.5.6) (2023-05-08)

### 🐛 Bug Fixes

- Fix utils.parseUnits

## [v5.5.5](https://github.com/joticajulian/koilib/releases/tag/v5.5.5) (2023-04-23)

### 🐛 Bug Fixes

- Fix types for Contract functions to be able to extend them

## [v5.5.4](https://github.com/joticajulian/koilib/releases/tag/v5.5.4) (2023-04-17)

### 🐛 Bug Fixes

- Publish the source files

## [v5.5.3](https://github.com/joticajulian/koilib/releases/tag/v5.5.3) (2023-03-27)

### 🐛 Bug Fixes

- Update koinos-pb-to-proto to fix the parser in the Serializer

## [v5.5.2](https://github.com/joticajulian/koilib/releases/tag/v5.5.2) (2023-03-25)

### 🐛 Bug Fixes

- Fix options in Transaction Class

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
