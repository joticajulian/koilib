/**
 * Application Binary Interface (ABI)
 *
 * Set of definitions to tell to the library how to serialize
 * and deserialize data in Koinos.
 *
 * @example **Example for Structs:**
 * Suppose that the c++ contract has a struct for transfers
 * defined as
 *
 * ```cpp
 * struct transfer_args
 * {
 *    protocol::account_type from;
 *    protocol::account_type to;
 *    uint64_t               value;
 * };
 * ```
 *
 * <br>
 *
 * Then, it's ABI can be defined as
 * ```ts
 * const abi = [{
 *   name: "from",
 *   type: "string",
 * },{
 *   name: "to",
 *   type: "string",
 * },{
 *   name: "from",
 *   type: "uint64",
 * }]
 * ```
 *
 * @example **Example using the definition of active data:**
 * The ABI can be defined at a great level of detail. This
 * example shows the ABI of the Active Data of a Transaction,
 * which is a complex structure as it contains vectors, variants,
 * nested structures, and opaque objects. See also [[abiActiveData]]
 *
 * The Active data is defined in c++ as:
 * ```cpp
 * struct upload_contract_operation
 * {
 *    contract_id_type               contract_id;
 *    variable_blob                  bytecode;
 *    unused_extensions_type         extensions;
 * };
 *
 * struct set_system_call_operation
 * {
 *    uint32                         call_id;
 *    chain::system_call_target      target;
 *    unused_extensions_type         extensions;
 * };
 *
 * struct call_contract_operation
 * {
 *    contract_id_type               contract_id;
 *    uint32                         entry_point;
 *    variable_blob                  args;
 *    unused_extensions_type         extensions;
 * };
 *
 * typedef std::variant<
 *    reserved_operation,
 *    nop_operation,
 *    upload_contract_operation,
 *    call_contract_operation,
 *    set_system_call_operation
 *    > operation;
 *
 * struct active_transaction_data
 * {
 *    uint128                  resource_limit;
 *    uint64                   nonce;
 *    std::vector< operation > operations;
 * };
 * ```
 *
 * <br>
 *
 * It's ABI can be defined as
 * ```ts
 * const abiActiveData: Abi = {
 *   name: "opaque_active_data",
 *   type: "opaque",
 *   subAbi: {
 *     name: "active_data",
 *     type: [
 *       {
 *         name: "resource_limit",
 *         type: "uint128",
 *       },
 *       {
 *         name: "nonce",
 *         type: "uint64",
 *       },
 *       {
 *         name: "operations",
 *         type: "vector",
 *         subAbi: {
 *           name: "operation",
 *           type: "variant",
 *           variants: [
 *             { type: "not implemented" }, // abi for reserved operation
 *             { type: "not implemented" }, // abi for nop operation
 *             { type: "not implemented" }, // abi for upload contract operation
 *             { type: "not implemented" }, // abi for call contract operation
 *             { type: "not implemented" }, // abi for set system call operation
 *           ],
 *         },
 *       },
 *     ],
 *   },
 * };
 * ```
 */
export interface Abi {
  /**
   * Type of the ABI
   *
   * For structs it should be an array of Abis. Otherwise it should
   * be one of the supported types: opaque, vector, variant, variableblob,
   * fixedblob, string, varint, uint8, uint16, uint32, uint64, uint128,
   * uint160, uint256, int8, int16, int32, int64, int128, int160, int256,
   * unused_extension.
   */
  type: string | Abi[];

  /**
   * Name of the ABI
   */
  name?: string;

  /**
   * Fixedblob size. Applicable only for type: "fixedblob"
   */
  size?: number;

  /**
   * Sub ABI. Applicable only for type "opaque" or "vector"
   */
  subAbi?: Abi;

  /**
   * ABI variants. Applicable only for type "variant"
   */
  variants?: Abi[];
}

/**
 * ABI of Reserved Operation. This abi is used in the
 * definition of the Active Data ABI. See [[abiActiveData]]
 */
export const abiReservedOperation: Abi = {
  name: "koinos::protocol::reserved_operation",
  type: [
    {
      name: "extensions",
      type: "unused_extension",
    },
  ],
};

/**
 * ABI of Nop Operation. This abi is used in the
 * definition of the Active Data ABI. See [[abiActiveData]]
 */
export const abiNopOperation: Abi = {
  name: "koinos::protocol::nop_operation",
  type: [
    {
      name: "extensions",
      type: "unused_extension",
    },
  ],
};

/**
 * ABI of Upload Contract Operation. This abi is used in the
 * definition of the Active Data ABI. See [[abiActiveData]]
 */
export const abiUploadContractOperation: Abi = {
  name: "koinos::protocol::upload_contract_operation",
  type: [
    {
      name: "contract_id",
      type: "fixedblob",
      size: 20,
    },
    {
      name: "bytecode",
      type: "variableblob",
    },
    {
      name: "extensions",
      type: "unused_extension",
    },
  ],
};

const abiSystemCallTargetReserved: Abi = {
  type: [],
};

const abiThunkId: Abi = {
  type: "uint32",
};

const abiContractCallBundle: Abi = {
  type: [
    {
      name: "contract_id",
      type: "fixedblob",
      size: 20,
    },
    {
      name: "entry_point",
      type: "uint32",
    },
  ],
};

/**
 * ABI of Set System Call Operation. This abi is used in the
 * definition of the Active Data ABI. See [[abiActiveData]]
 */
export const abiSetSystemCallOperation: Abi = {
  name: "koinos::protocol::set_system_call_operation",
  type: [
    {
      name: "call_id",
      type: "uint32",
    },
    {
      // chain::sytem_call_target
      name: "target",
      type: "variant",
      variants: [
        abiSystemCallTargetReserved,
        abiThunkId,
        abiContractCallBundle,
      ],
    },
    {
      name: "extensions",
      type: "unused_extension",
    },
  ],
};

/**
 * ABI of Call Contract Operation. This abi is used in the
 * definition of the Active Data ABI. See [[abiActiveData]]
 */
export const abiCallContractOperation: Abi = {
  name: "koinos::protocol::call_contract_operation",
  type: [
    {
      name: "contract_id",
      type: "fixedblob",
      size: 20,
    },
    {
      name: "entry_point",
      type: "uint32",
    },
    {
      name: "args",
      type: "variableblob",
    },
    {
      name: "extensions",
      type: "unused_extension",
    },
  ],
};

/**
 * ABI of Active Data of a Transaction. This abi is used in the
 * [[Signer]] class to sign transactions.
 */
export const abiActiveData: Abi = {
  name: "opaque_active_data",
  type: "opaque",
  subAbi: {
    name: "active_data",
    type: [
      {
        name: "resource_limit",
        type: "uint128",
      },
      {
        name: "nonce",
        type: "uint64",
      },
      {
        name: "operations",
        type: "vector",
        subAbi: {
          name: "operation",
          type: "variant",
          variants: [
            abiReservedOperation,
            abiNopOperation,
            abiUploadContractOperation,
            abiCallContractOperation,
            abiSetSystemCallOperation,
          ],
        },
      },
    ],
  },
};
