# Changelog

All notable changes to this project will be documented in this file. 🤘

## [v9.1.0](https://github.com/joticajulian/koilib/releases/tag/v9.1.0) (2025-01-29)

### 🚀 Features

- Export nicknames abi
- Minor updates in the documentation

### 🐛 Bug Fixes

- Fix issue in utils.formatUnits for 0 decimals
- Fix: Use byTransactionId by default in the wait function of Provider.sendTransaction

## [v9.0.0](https://github.com/joticajulian/koilib/releases/tag/v9.0.0) (2024-12-16)

### 🚀 Features

- **breaking change**: Provider.invokeSystemCall returns undefined instead of throwing an error if the response from the RPC node is empty.
- **breaking change**: The Provider.wait function now uses byTransactionId by default since it is more accurate. This function has also been improved by checking that the block is part of the main fork. If you are connecting to an RPC node that does not support the "transaction store microservice" consider changing the type to byBlock.
- **breaking change**: The ABI now uses events[name].type to define the protobuffer type of the event (in previous versions this was defined as events[name].argument). The library still supports events[name].argument, but this will be removed in future versions.
- Adding burn to token and NFT ABIs in utils.
- The documentation has been updated.

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

## [v5.2.3](https://github.com/joticajulian/koilib/releases/tag/v5.2.3) (2022-11-27)

### 🚀 Features

- New function in the `Provider` class called `getNextNonce`. It is used to query the actual nonce, and compute the next one. This is useful when creating a new transaction.

The motivation of this feature is related to the use of Koilib + Kondor. When you get a signer from Kondor, this signer comes with its own provider (to get transaction parameters, and to submit transactions). This is a problem when you are not using the same network as the one defined in Kondor, for instance when Kondor is connected to mainnet and you are targeting testnet. To solve this issue the developers normally use their owns providers to compute the correct `chain_id`, `account_rc`, and `nonce`. However, the `nonce` requires more steps when you are submitting transactions (increase nonce and encode it in base64url). The new `getNextNonce` function simplifies this computation.

## [v5.2.1](https://github.com/joticajulian/koilib/releases/tag/v5.2.1) (2022-10-24)

### 🚀 Features

- `onlyOperation` option in Contract class: Boolean to define if the intention is to get only the operation. No transaction or connection with the provider established.
- `previousOperations` and `nextOperations` as options in Contract class: List of extra operations to be included before/after the actual one in the transaction.

## [v5.2.0](https://github.com/joticajulian/koilib/releases/tag/v5.2.0) (2022-10-17)

### 🚀 Features

- New functions: isChecksum, isChecksumAddress, isChecksumWif
- isChecksumAddress is called by default during the serialization of addresses. This helps to prevent sending tokens to bad formatted addresses. This option can be disabled as well.

### 🐛 Bug Fixes

- add set_system_contract in btypesOperation #18

## [v5.1.0](https://github.com/joticajulian/koilib/releases/tag/v5.1.0) (2022-09-16)

This version include 2 important changes:

- The multignature process has been simplified with a new function called **beforeSend** which can be defined in the options of the Contract or Signer in order to be triggered just after sending a transaction. Then you can sign the transaction there with other Signers (more info in https://www.npmjs.com/package/koilib/v/5.1.0)
- The **wait function** now returns an object containing the block Id and block number.

## [v5.0.0](https://github.com/joticajulian/koilib/releases/tag/v5.0.0) (2022-08-26)

This version is **compatible with the Testnet v4**. It introduces the different changes in the protocol.

There is a new argument in Producer.sendTransaction and Signer.sendTransaction called "broadcast" which tells to the RPC node if the transaction should be broadcasted to the whole network or if it should be executed only in that node just for testing purposes (see https://joticajulian.github.io/koilib/classes/Provider.html#sendTransaction).

## [v4.1.0](https://github.com/joticajulian/koilib/releases/tag/v4.1.0) (2022-06-21)

This version introduces changes in the `deploy` function of the Contract class. In previous versions this function defined the `contract_id` as the address of the signer, which may be ok in most of the cases. However, when using multisignature wallets this may not be the case. Then, from version 4.1.0 the `contract_id` is taken from the `id` defined in the constructor of the class, and if it's not defined then it will take the address of the signer as before.

On the other hand the returned `operation` in this function is now an `OperationJson` (instead of `UploadContractOperationNested`) to be aligned with the output of the functions that uses `call_contract` operations.

## [v4.0.0](https://github.com/joticajulian/koilib/releases/tag/v4.0.0) (2022-06-01)

This version introduces a **major change in the definition of the ABI**. The objective is to use an ABI as close as possible as [the official one used in Koinos CLI](https://docs.koinos.io/architecture/contract-abi.html). The principal difference is that koilib uses a descriptor defined in json format while the official ABI uses a descriptor in binary format.

### How to migrate from koilib v3 to koilib v4?

Update the fields of the ABI as follows:
**koilib v3** | **koilib v4**
--- | ---
entryPoint | entry_point
input | argument
output | return
readOnly | read_only
defaultOutput | default_output
preformatInput | preformat_argument
preformatOutput | preformat_return
description | description (no change)
types | koilib_types

## [v3.1.0](https://github.com/joticajulian/koilib/releases/tag/v3.1.0) (2022-04-03)

This version fixes some bugs and at the same time adds new features. Summary of changes:

- **btype improvements in the serializer (array support)**. "btype" is a protobuffer option used in koinos to encode bytes in different formats (hex, base64ur, base58). In the previous versions it was not compatible with arrays (aka repeated) or with nested objects. Now it has full support to both of them for serialization and deserialization. At the same time now it supports the label "(koinos.btype)". This change helps to contract developers that have complex variables (with nested object or arrays using btype) to be able to use koilib to submit transactions.
- The **transactions now return receipts**. Receipts it contains useful information like mana used, logs, and events. Example: `const { transaction, receipt } = await koin.transfer({ ... })`.
- **bug fixed in provider.call**. The previous version was not handling the errors from rpc node correctly. This version fixes this error.
- [BREAKING CHANGE] **"krc20Abi" has been renamed to "tokenAbi"**. It was discussed within the community that krc20 (that takes its name from the erc20 from ethereum) was not a good choice because koinos is not using the same erc20 standard, only part of it.
- [BREAKING CHANGE] **encode/decode operation handle bytes as strings**. If you use encodeOperation or decodeOperation now you don't have to make the conversion from uint8array to string, they do that internally. This change helps to simplify other functions.
- **default timeout of 60s**. The previous version had a timeout of 30s when waiting for a transaction to be mined. However, this time was not enough for the current consensus algorithm on testnet (PoW) and sometimes it required more time. Then it was increased to 60.
- **provider.onError stops after the first error**. In previous versions when there was an error from the rpcnode, the provider entered in an indefinite loop where it was switching and trying from different rpc nodes from the list, and you had to configure provider.onError to handle errors. Since this feature is not commonly used the default behavior was changed to throw after a single error. You still have the option to configure it by setting the onError function.
- The **documentation** was updated with the latest changes. Check it here https://joticajulian.github.io/koilib/

## [v3.0.0](https://github.com/joticajulian/koilib/releases/tag/v3.0.0) (2022-03-15)

Koilib v3.0.0 is now compatible with Koinos Testnet V3 🚀

Here is a summary of the new features that comes with V3:

- Option to set payer, payee, and chainId in the header of the transaction.
- Option to configure overrides of "authorize" function when uploading a contract.
- New native operations: set_system_call_operation, and set_system_contract_operation.
- Encode/decode genesis data: A new tool was added in the _utils_ section to manage the genesis data of the blockchain. This tool can be used to introduce the snapshot of koin balances for the mainnet, as well as for developers that want to create and test new blockchains based on koinos.
- The serializer of Signer class has been removed and replaced with a static module. This change will facilitate the development of Kondor Wallet because now it no longer depends on reflection functions but uses static code. This static module was also added to the Provider class since now it requires to encode/decode the nonce.
- Under the hood there are a lot of changes since both transactions and blocks have a complete different structure compared with Koinos V2. However, the way of using koilib v3 is almost the same as koilib v2.
- The documentation has been revised and expanded following the new features of koinos v3. Please check it out at https://joticajulian.github.io/koilib/ 😃

Special thanks to @roaminroe for his valuable contribution to this release 👍

## [v2.8.0](https://github.com/joticajulian/koilib/releases/tag/v2.8.0) (2022-02-24)

Thanks to a bug report from @ederaleng we found that `recoverPublicKey` was not making the correct computation of the block hash (for blocks in koinos v0.2) because it was not taking into account the header info. This bug is fixed in this new version.

### 🚀 Features

- [BREAKING CHANGE] The functions `recoverPublicKey` and `recoverAddress` from Signer class are no longer static functions but normal functions. The reason is because now we use the serializer of the class to serialize the header object in order to calculate the hash.
- New Features: Now you can use `signHash` and `signBlock`. The option to sign blocks now enables developers to create their own block producer microservices in Javascript or Typescript 🤩🎉

## [v2.7.0](https://github.com/joticajulian/koilib/releases/tag/v5.3.0) (2022-02-09)

### 🚀 Features

- [BREAKING CHANGE] The response for sending transactions has been changed. Now the `wait` function is included inside the `transaction` and `transactionResponse` has been removed. This gives a better understanding of the code.
- The Provider now has the "wait" function separated from sendTransaction.

### 🐛 Bug Fixes

- Minor fixes in default values for rc_limit.

**How to migrate to v2.7.0?**

Change this code of v2.6.0:

```
const { transaction, transactionResponse } = await contract.deploy();
const blockNumber = await transactionResponse.wait();
```

to this code:

```
const { transaction } = await contract.deploy();
const blockNumber = await transaction.wait();
```

## [v2.6.0](https://github.com/joticajulian/koilib/releases/tag/v2.6.0) (2022-01-18)

### 🚀 Features

- using @noble/secp256k1 v1.5.0
- using @noble/hashes v1.0.0

### 🐛 Bug Fixes

- axios has been removed and replaced for cross-fetch (issue #7)
