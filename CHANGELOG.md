# Changelog

All notable changes to this project will be documented in this file. 🤘

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
