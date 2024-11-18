# Changelog

All notable changes to this project will be documented in this file. 🤘

## [v8.1.0](https://github.com/joticajulian/koilib/releases/tag/v8.1.0) (2024-11-18)

### 🚀 Features

- New Provider.invokeGetContractAddress to resolve the address to a system contract.
- We have defined a ProviderInterface and we use it in all classes. This interface is less
restrictive than the Provider Class which has more functions. Then, the ProviderInterface
is ideal to develop other implementations for the Provider Class.
- The documentation has been updated.

## [v8.0.0](https://github.com/joticajulian/koilib/releases/tag/v8.0.0) (2024-07-03)

We found that the previous version v7 had problems between mana estimation
and multisignature transactions, because the estimation was done after the
first signature.
Now this concept has been improved and moved to the Transaction class, which
has a more intuitive process and supports multisignatures.

### 🚀 Features

- `adjustRcLimit` is a new function in the Transaction class to adjust
  the rcLimit and at the same time recalculate the transaction ID. This function
  could be used by wallets during the estimation of the mana.
- Transaction class now supports the definition of transaction in the
  constructor.
- Documentation improved with examples for mana estimation.
- **breaking changes**:
  - The rcOptions have been removed from the Signer class and moved to
    Transaction class (see adjustRcLimit).
  - `recoverAddresses` and `recoverPublicKeys` from the Signer class
    are now static functions.

### 🐛 Bug Fixes

- Fix types for receipt and block_receipt

## [v7.1.1](https://github.com/joticajulian/koilib/releases/tag/v7.1.1) (2024-04-30)

### 🐛 Bug Fixes

- Handle "rpc failed, context deadline exceeded" error during the submission of a
  transaction. This error means that there was a timeout in the jsonrpc microservice.
  Although this is an error and there is no information about the receipt, the
  transaction is considered submitted because it goes to the mempool, then no error
  is thrown in this case. The response is an empty receipt with a new field called
  "rpc_error".

## [v7.0.0](https://github.com/joticajulian/koilib/releases/tag/v7.0.0) (2024-04-24)

### 🚀 Features

- **breaking change**: Now the signer estimates the mana required to
  submit the transaction and it adds an extra 10% to it. The `rc_limit`
  and transaction ID are updated automatically during the signing process.
  This is executed only in the first signature.
  If you want skip this breaking change (and continue using the 100% mana
  used in previous versions) configure the signer in this way:
  `signer.rcOptions = { estimateRc: false }`.
  You can also customize the adjustment:
  ```ts
  signer.rcOptions = {
    estimateRc: true,
    adjustRcLimit: (receipt) => 2 * Number(receipt.rc_used),
  };
  ```
- **breaking change**: `Provider.getBlock()` function now returns
  the receipt by default. There is also the possibility to configure
  this in the options argument.
- The documentation has been improved.
- The ABI for NFTs has been added to utils.

## [v6.0.0](https://github.com/joticajulian/koilib/releases/tag/v6.0.0) (2024-04-19)

### 🚀 Features

- Updates in Provider Class:
  - new invokeSystemCall function
  - new getForkHeads function
  - new getResourceLimits function
  - new invokeGetContractMetadata
- Updates in SignerInferface:
  - getPrivateKey function was removed
  - prepareTransaction function was removed
- Use SignerInterface instead of Signer in args
- Accept string or number in rclimit
- Update protos

### 🐛 Bug Fixes

- Contract class - do not require provider when using onlyOperation
- Fix docs for decode/encode operation
- Update docs provider
- getPrivateKey with compressed true by default
- Fix send function in transaction class: Use signer only when it is not signed
- Fix export of interfaces

## [v5.7.0](https://github.com/joticajulian/koilib/releases/tag/v5.7.0) (2024-04-06)

Release removed due a conflict with semver. Replaced with v6.0.0.

## [v5.6.1](https://github.com/joticajulian/koilib/releases/tag/v5.6.1) (2023-07-29)

### 🚀 Features

- Bump libraries

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
