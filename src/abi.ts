export interface Abi {
  type: string | Abi[];
  name?: string;
  size?: number;
  subAbi?: Abi;
  variants?: Abi[];
}

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
            { type: "not implemented" /* reserved operation */ },
            { type: "not implemented" /* nop operation */ },
            { type: "not implemented" /* upload contract operation */ },
            abiCallContractOperation,
            { type: "not implemented" /* set system call operation*/ },
          ],
        },
      },
    ],
  },
};
