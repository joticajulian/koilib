import { AnyNestedObject } from "protobufjs";
import { Abi } from "../interface";

/**
 * ABI for Nicknames
 * 
 * @example
 * ```ts
 * import { Contract, Provider, utils } from "koilib";
 *
 * const provider = new Provider("https://api.koinos.io");
 * const nicknamesContract = new Contract({
 *   id: "1KD9Es7LBBjA1FY3ViCgQJ7e6WH1ipKbhz",
 *   provider,
 *   abi: utils.nicknamesAbi,
 * });
 * const nicknames = nicknamesContract.functions;
 *
 * ...
 *
 * // get the address linked to the nickname "pob"
 * const pobId = `0x${utils.toHexString(new TextEncoder().encode("pob"))}`;
 * const { result } = await nicknames.owner_of({ token_id: pobId });
 * console.log(result);
 *
 * // { value: '159myq5YUhhoVWu3wsHKHiJYKPKGUrGiyv' }
 })();
 * ```
 */
export const nicknamesAbi: Abi = {
  methods: {
    verify_valid_name: {
      argument: "common.str",
      return: "common.str",
      description: "Verify if a new name is valid",
      entry_point: 0x5ad33d9a,
      read_only: true,
    },
    get_tabi: {
      argument: "nft.token",
      return: "nicknames.get_tabi_result",
      description: "Get TABI",
      entry_point: 0x653c5618,
      read_only: true,
    },
    get_main_token: {
      argument: "common.address",
      return: "nft.token",
      description: "Get main token of an account",
      entry_point: 0x3ecda7bf,
      read_only: true,
    },
    get_extended_metadata: {
      argument: "nft.token",
      return: "nicknames.extended_metadata",
      description: "Get extended metadata",
      entry_point: 0x0327b375,
      read_only: true,
    },
    get_address_by_token_id: {
      argument: "nft.token",
      return: "nicknames.address_data",
      description:
        "Resolve the address of a nickname by providing the token id",
      entry_point: 0x1d5eac7d,
      read_only: true,
    },
    get_address: {
      argument: "common.str",
      return: "nicknames.address_data",
      description: "Resolve the address of a nickname",
      entry_point: 0xa61ae5e8,
      read_only: true,
    },
    get_tokens_by_address: {
      argument: "nicknames.get_tokens_by_address_args",
      return: "nft.token_ids",
      description: "Get tokens owned by an address",
      entry_point: 0x606f788b,
      read_only: true,
    },
    mint: {
      argument: "nft.mint_args",
      return: "",
      description: "Create new name",
      entry_point: 0xdc6f17bb,
      read_only: false,
    },
    burn: {
      argument: "nft.burn_args",
      return: "",
      description: "Delete a name",
      entry_point: 0x859facc5,
      read_only: false,
    },
    transfer: {
      argument: "nft.transfer_args",
      return: "",
      description: "Transfer Name",
      entry_point: 0x27f576ca,
      read_only: false,
    },
    set_tabi: {
      argument: "nicknames.set_tabi_args",
      return: "",
      description: "Set Text ABI for a token",
      entry_point: 0xb2b70965,
      read_only: false,
    },
    set_metadata: {
      argument: "nft.metadata_args",
      return: "",
      description: "Set metadata",
      entry_point: 0x3d59af19,
      read_only: false,
    },
    set_main_token: {
      argument: "nft.token",
      return: "",
      description: "Set main token",
      entry_point: 0x0b6adde6,
      read_only: false,
    },
    set_address: {
      argument: "nicknames.set_address_args",
      return: "",
      description: "Set address",
      entry_point: 0x5cffdf33,
      read_only: false,
    },
    set_extended_metadata: {
      argument: "nicknames.set_extended_metadata_args",
      return: "",
      description:
        "Set extended metadata (including the address to which the name resolves)",
      entry_point: 0xef128ca3,
      read_only: false,
    },
    name: {
      argument: "",
      return: "common.str",
      description: "Get name of the NFT",
      entry_point: 0x82a3537f,
      read_only: true,
    },
    symbol: {
      argument: "",
      return: "common.str",
      description: "Get the symbol of the NFT",
      entry_point: 0xb76a7ca1,
      read_only: true,
    },
    uri: {
      argument: "",
      return: "common.str",
      description: "Get URI of the NFT",
      entry_point: 0x70e5d7b6,
      read_only: true,
    },
    get_info: {
      argument: "",
      return: "nft.info",
      description: "Get name, symbol and decimals",
      entry_point: 0xbd7f6850,
      read_only: true,
    },
    owner: {
      argument: "",
      return: "common.address",
      description: "Get the owner of the collection",
      entry_point: 0x4c102969,
      read_only: true,
    },
    total_supply: {
      argument: "",
      return: "common.uint64",
      description: "Get total supply",
      entry_point: 0xb0da3934,
      read_only: true,
    },
    royalties: {
      argument: "",
      return: "nft.royalties",
      description: "Get royalties",
      entry_point: 0x36e90cd0,
      read_only: true,
    },
    balance_of: {
      argument: "nft.balance_of_args",
      return: "common.uint64",
      description: "Get balance of an account",
      entry_point: 0x5c721497,
      read_only: true,
    },
    owner_of: {
      argument: "nft.token",
      return: "common.address",
      description: "Get the owner of a token",
      entry_point: 0xed61c847,
      read_only: true,
    },
    metadata_of: {
      argument: "nft.token",
      return: "common.str",
      description: "Get the metadata of a token",
      entry_point: 0x176c8f7f,
      read_only: true,
    },
    get_tokens: {
      argument: "nft.get_tokens_args",
      return: "nft.token_ids",
      description: "Get list of token IDs",
      entry_point: 0x7d5b5ed7,
      read_only: true,
    },
    get_tokens_by_owner: {
      argument: "nft.get_tokens_by_owner_args",
      return: "nft.token_ids",
      description: "Get tokens owned by an address",
      entry_point: 0xfc13eb75,
      read_only: true,
    },
    get_approved: {
      argument: "nft.token",
      return: "common.address",
      description: "Check if an account is approved to operate a token ID",
      entry_point: 0x4c731020,
      read_only: true,
    },
    is_approved_for_all: {
      argument: "nft.is_approved_for_all_args",
      return: "common.boole",
      description:
        "Check if an account is approved to operate all tokens owned by other account",
      entry_point: 0xe7ab8ce5,
      read_only: true,
    },
    get_operator_approvals: {
      argument: "nft.get_operators_args",
      return: "nft.get_operators_return",
      description: "Get allowances of an account",
      entry_point: 0xdb1bf60e,
      read_only: true,
    },
    transfer_ownership: {
      argument: "common.address",
      return: "",
      description: "Transfer ownership of the collection",
      entry_point: 0x394be702,
      read_only: false,
    },
    set_royalties: {
      argument: "nft.royalties",
      return: "",
      description: "Set royalties",
      entry_point: 0x3b5bb56b,
      read_only: false,
    },
    approve: {
      argument: "nft.approve_args",
      return: "",
      description:
        "Grant permissions to other account to manage a specific Token owned by the user. The user must approve only the accounts he trust.",
      entry_point: 0x74e21680,
      read_only: false,
    },
    set_approval_for_all: {
      argument: "nft.set_approval_for_all_args",
      return: "",
      description:
        "Grant permissions to other account to manage all Tokens owned by the user. The user must approve only the accounts he trust.",
      entry_point: 0x20442216,
      read_only: false,
    },
  },
  types:
    "CoQDCidrb2lub3Nib3gtcHJvdG8vbWFuYXNoYXJlci9jb21tb24ucHJvdG8SBmNvbW1vbhoUa29pbm9zL29wdGlvbnMucHJvdG8iGwoDc3RyEhQKBXZhbHVlGAEgASgJUgV2YWx1ZSIeCgZ1aW50MzISFAoFdmFsdWUYASABKA1SBXZhbHVlIiIKBnVpbnQ2NBIYCgV2YWx1ZRgBIAEoBEICMAFSBXZhbHVlIh0KBWJvb2xlEhQKBXZhbHVlGAEgASgIUgV2YWx1ZSIlCgdhZGRyZXNzEhoKBXZhbHVlGAEgASgMQgSAtRgGUgV2YWx1ZSJdCglsaXN0X2FyZ3MSGgoFc3RhcnQYASABKAxCBIC1GAZSBXN0YXJ0EhQKBWxpbWl0GAIgASgFUgVsaW1pdBIeCgpkZXNjZW5kaW5nGAMgASgIUgpkZXNjZW5kaW5nIi0KCWFkZHJlc3NlcxIgCghhY2NvdW50cxgBIAMoDEIEgLUYBlIIYWNjb3VudHNiBnByb3RvMwqkDAoda29pbm9zYm94LXByb3RvL25mdC9uZnQucHJvdG8SA25mdBoUa29pbm9zL29wdGlvbnMucHJvdG8iTQoHcm95YWx0eRIiCgpwZXJjZW50YWdlGAEgASgEQgIwAVIKcGVyY2VudGFnZRIeCgdhZGRyZXNzGAIgASgMQgSAtRgGUgdhZGRyZXNzIi8KCXJveWFsdGllcxIiCgV2YWx1ZRgBIAMoCzIMLm5mdC5yb3lhbHR5UgV2YWx1ZSJMCg1tZXRhZGF0YV9hcmdzEh8KCHRva2VuX2lkGAEgASgMQgSAtRgCUgd0b2tlbklkEhoKCG1ldGFkYXRhGAIgASgJUghtZXRhZGF0YSJmCgRpbmZvEhIKBG5hbWUYASABKAlSBG5hbWUSFgoGc3ltYm9sGAIgASgJUgZzeW1ib2wSEAoDdXJpGAMgASgJUgN1cmkSIAoLZGVzY3JpcHRpb24YBCABKAlSC2Rlc2NyaXB0aW9uIi0KD2JhbGFuY2Vfb2ZfYXJncxIaCgVvd25lchgBIAEoDEIEgLUYBlIFb3duZXIiKAoFdG9rZW4SHwoIdG9rZW5faWQYASABKAxCBIC1GAJSB3Rva2VuSWQiWAoYaXNfYXBwcm92ZWRfZm9yX2FsbF9hcmdzEhoKBW93bmVyGAEgASgMQgSAtRgGUgVvd25lchIgCghvcGVyYXRvchgCIAEoDEIEgLUYBlIIb3BlcmF0b3IiQgoJbWludF9hcmdzEhQKAnRvGAEgASgMQgSAtRgGUgJ0bxIfCgh0b2tlbl9pZBgCIAEoDEIEgLUYAlIHdG9rZW5JZCIsCglidXJuX2FyZ3MSHwoIdG9rZW5faWQYASABKAxCBIC1GAJSB3Rva2VuSWQidAoNdHJhbnNmZXJfYXJncxIYCgRmcm9tGAEgASgMQgSAtRgGUgRmcm9tEhQKAnRvGAIgASgMQgSAtRgGUgJ0bxIfCgh0b2tlbl9pZBgDIAEoDEIEgLUYAlIHdG9rZW5JZBISCgRtZW1vGAQgASgJUgRtZW1vInYKDGFwcHJvdmVfYXJncxIvChBhcHByb3Zlcl9hZGRyZXNzGAEgASgMQgSAtRgGUg9hcHByb3ZlckFkZHJlc3MSFAoCdG8YAiABKAxCBIC1GAZSAnRvEh8KCHRva2VuX2lkGAMgASgMQgSAtRgCUgd0b2tlbklkIpkBChlzZXRfYXBwcm92YWxfZm9yX2FsbF9hcmdzEi8KEGFwcHJvdmVyX2FkZHJlc3MYASABKAxCBIC1GAZSD2FwcHJvdmVyQWRkcmVzcxIvChBvcGVyYXRvcl9hZGRyZXNzGAIgASgMQgSAtRgGUg9vcGVyYXRvckFkZHJlc3MSGgoIYXBwcm92ZWQYAyABKAhSCGFwcHJvdmVkIoIBChJnZXRfb3BlcmF0b3JzX2FyZ3MSGgoFb3duZXIYASABKAxCBIC1GAZSBW93bmVyEhoKBXN0YXJ0GAIgASgMQgSAtRgGUgVzdGFydBIUCgVsaW1pdBgDIAEoBVIFbGltaXQSHgoKZGVzY2VuZGluZxgEIAEoCFIKZGVzY2VuZGluZyJWChRnZXRfb3BlcmF0b3JzX3JldHVybhIaCgVvd25lchgBIAEoDEIEgLUYBlIFb3duZXISIgoJb3BlcmF0b3JzGAIgAygMQgSAtRgGUglvcGVyYXRvcnMiYwoPZ2V0X3Rva2Vuc19hcmdzEhoKBXN0YXJ0GAEgASgMQgSAtRgCUgVzdGFydBIUCgVsaW1pdBgCIAEoBVIFbGltaXQSHgoKZGVzY2VuZGluZxgDIAEoCFIKZGVzY2VuZGluZyKIAQoYZ2V0X3Rva2Vuc19ieV9vd25lcl9hcmdzEhoKBW93bmVyGAEgASgMQgSAtRgGUgVvd25lchIaCgVzdGFydBgCIAEoDEIEgLUYAlIFc3RhcnQSFAoFbGltaXQYAyABKAVSBWxpbWl0Eh4KCmRlc2NlbmRpbmcYBCABKAhSCmRlc2NlbmRpbmciLgoJdG9rZW5faWRzEiEKCXRva2VuX2lkcxgBIAMoDEIEgLUYAlIIdG9rZW5JZHNiBnByb3RvMwrQCQoPbmlja25hbWVzLnByb3RvEgluaWNrbmFtZXMaFGtvaW5vcy9vcHRpb25zLnByb3RvIkYKCXRhYmlfaXRlbRIYCgdwYXR0ZXJuGAEgASgJUgdwYXR0ZXJuEh8KC2VudHJ5X3BvaW50GAIgASgNUgplbnRyeVBvaW50IjIKBHRhYmkSKgoFaXRlbXMYASADKAsyFC5uaWNrbmFtZXMudGFiaV9pdGVtUgVpdGVtcyJdCg9nZXRfdGFiaV9yZXN1bHQSKgoFaXRlbXMYASADKAsyFC5uaWNrbmFtZXMudGFiaV9pdGVtUgVpdGVtcxIeCgdhZGRyZXNzGAIgASgMQgSAtRgGUgdhZGRyZXNzIlUKDXNldF90YWJpX2FyZ3MSHwoIdG9rZW5faWQYASABKAxCBIC1GAJSB3Rva2VuSWQSIwoEdGFiaRgCIAEoCzIPLm5pY2tuYW1lcy50YWJpUgR0YWJpIoMBChBzZXRfYWRkcmVzc19hcmdzEh8KCHRva2VuX2lkGAEgASgMQgSAtRgCUgd0b2tlbklkEh4KB2FkZHJlc3MYAiABKAxCBIC1GAZSB2FkZHJlc3MSLgoTZ292X3Byb3Bvc2FsX3VwZGF0ZRgDIAEoCFIRZ292UHJvcG9zYWxVcGRhdGUi0gEKGnNldF9leHRlbmRlZF9tZXRhZGF0YV9hcmdzEh8KCHRva2VuX2lkGAEgASgMQgSAtRgCUgd0b2tlbklkEisKEXBlcm1hbmVudF9hZGRyZXNzGAMgASgIUhBwZXJtYW5lbnRBZGRyZXNzElAKJWFkZHJlc3NfbW9kaWZpYWJsZV9vbmx5X2J5X2dvdmVybmFuY2UYBCABKAhSIWFkZHJlc3NNb2RpZmlhYmxlT25seUJ5R292ZXJuYW5jZRIUCgVvdGhlchgKIAEoDFIFb3RoZXIiyQEKEWV4dGVuZGVkX21ldGFkYXRhEh8KCHRva2VuX2lkGAEgASgMQgSAtRgCUgd0b2tlbklkEisKEXBlcm1hbmVudF9hZGRyZXNzGAMgASgIUhBwZXJtYW5lbnRBZGRyZXNzElAKJWFkZHJlc3NfbW9kaWZpYWJsZV9vbmx5X2J5X2dvdmVybmFuY2UYBCABKAhSIWFkZHJlc3NNb2RpZmlhYmxlT25seUJ5R292ZXJuYW5jZRIUCgVvdGhlchgKIAEoDFIFb3RoZXIiqQEKDGFkZHJlc3NfZGF0YRIaCgV2YWx1ZRgBIAEoDEIEgLUYBlIFdmFsdWUSKwoRcGVybWFuZW50X2FkZHJlc3MYAiABKAhSEHBlcm1hbmVudEFkZHJlc3MSUAolYWRkcmVzc19tb2RpZmlhYmxlX29ubHlfYnlfZ292ZXJuYW5jZRgDIAEoCFIhYWRkcmVzc01vZGlmaWFibGVPbmx5QnlHb3Zlcm5hbmNlIo4BChpnZXRfdG9rZW5zX2J5X2FkZHJlc3NfYXJncxIeCgdhZGRyZXNzGAEgASgMQgSAtRgGUgdhZGRyZXNzEhoKBXN0YXJ0GAIgASgMQgSAtRgCUgVzdGFydBIUCgVsaW1pdBgDIAEoBVIFbGltaXQSHgoKZGVzY2VuZGluZxgEIAEoCFIKZGVzY2VuZGluZ2IGcHJvdG8z",
  koilib_types: {
    nested: {
      common: {
        nested: {
          str: {
            fields: {
              value: {
                type: "string",
                id: 1,
              },
            },
          },
          uint32: {
            fields: {
              value: {
                type: "uint32",
                id: 1,
              },
            },
          },
          uint64: {
            fields: {
              value: {
                type: "uint64",
                id: 1,
                options: {
                  jstype: "JS_STRING",
                },
              },
            },
          },
          boole: {
            fields: {
              value: {
                type: "bool",
                id: 1,
              },
            },
          },
          address: {
            fields: {
              value: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
            },
          },
          list_args: {
            fields: {
              start: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              limit: {
                type: "int32",
                id: 2,
              },
              descending: {
                type: "bool",
                id: 3,
              },
            },
          },
          addresses: {
            fields: {
              accounts: {
                rule: "repeated",
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
            },
          },
        },
      },
      koinos: {
        options: {
          go_package: "github.com/koinos/koinos-proto-golang/koinos",
        },
        nested: {
          bytes_type: {
            values: {
              BASE64: 0,
              BASE58: 1,
              HEX: 2,
              BLOCK_ID: 3,
              TRANSACTION_ID: 4,
              CONTRACT_ID: 5,
              ADDRESS: 6,
            },
          },
          _btype: {
            oneof: ["btype"],
          } as AnyNestedObject,
          btype: {
            type: "bytes_type",
            id: 50000,
            extend: "google.protobuf.FieldOptions",
            options: {
              proto3_optional: true,
            },
          },
        },
      },
      nft: {
        nested: {
          royalty: {
            fields: {
              percentage: {
                type: "uint64",
                id: 1,
                options: {
                  jstype: "JS_STRING",
                },
              },
              address: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
            },
          },
          royalties: {
            fields: {
              value: {
                rule: "repeated",
                type: "royalty",
                id: 1,
              },
            },
          },
          metadata_args: {
            fields: {
              token_id: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
              metadata: {
                type: "string",
                id: 2,
              },
            },
          },
          info: {
            fields: {
              name: {
                type: "string",
                id: 1,
              },
              symbol: {
                type: "string",
                id: 2,
              },
              uri: {
                type: "string",
                id: 3,
              },
              description: {
                type: "string",
                id: 4,
              },
            },
          },
          balance_of_args: {
            fields: {
              owner: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
            },
          },
          token: {
            fields: {
              token_id: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
            },
          },
          is_approved_for_all_args: {
            fields: {
              owner: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              operator: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
            },
          },
          mint_args: {
            fields: {
              to: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              token_id: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
            },
          },
          burn_args: {
            fields: {
              token_id: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
            },
          },
          transfer_args: {
            fields: {
              from: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              to: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              token_id: {
                type: "bytes",
                id: 3,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
              memo: {
                type: "string",
                id: 4,
              },
            },
          },
          approve_args: {
            fields: {
              approver_address: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              to: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              token_id: {
                type: "bytes",
                id: 3,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
            },
          },
          set_approval_for_all_args: {
            fields: {
              approver_address: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              operator_address: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              approved: {
                type: "bool",
                id: 3,
              },
            },
          },
          get_operators_args: {
            fields: {
              owner: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              start: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              limit: {
                type: "int32",
                id: 3,
              },
              descending: {
                type: "bool",
                id: 4,
              },
            },
          },
          get_operators_return: {
            fields: {
              owner: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              operators: {
                rule: "repeated",
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
            },
          },
          get_tokens_args: {
            fields: {
              start: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
              limit: {
                type: "int32",
                id: 2,
              },
              descending: {
                type: "bool",
                id: 3,
              },
            },
          },
          get_tokens_by_owner_args: {
            fields: {
              owner: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              start: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
              limit: {
                type: "int32",
                id: 3,
              },
              descending: {
                type: "bool",
                id: 4,
              },
            },
          },
          token_ids: {
            fields: {
              token_ids: {
                rule: "repeated",
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
            },
          },
        },
      },
      nicknames: {
        nested: {
          tabi_item: {
            fields: {
              pattern: {
                type: "string",
                id: 1,
              },
              entry_point: {
                type: "uint32",
                id: 2,
              },
            },
          },
          tabi: {
            fields: {
              items: {
                rule: "repeated",
                type: "tabi_item",
                id: 1,
              },
            },
          },
          get_tabi_result: {
            fields: {
              items: {
                rule: "repeated",
                type: "tabi_item",
                id: 1,
              },
              address: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
            },
          },
          set_tabi_args: {
            fields: {
              token_id: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
              tabi: {
                type: "tabi",
                id: 2,
              },
            },
          },
          set_address_args: {
            fields: {
              token_id: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
              address: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              gov_proposal_update: {
                type: "bool",
                id: 3,
              },
            },
          },
          set_extended_metadata_args: {
            fields: {
              token_id: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
              permanent_address: {
                type: "bool",
                id: 3,
              },
              address_modifiable_only_by_governance: {
                type: "bool",
                id: 4,
              },
              other: {
                type: "bytes",
                id: 10,
              },
            },
          },
          extended_metadata: {
            fields: {
              token_id: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
              permanent_address: {
                type: "bool",
                id: 3,
              },
              address_modifiable_only_by_governance: {
                type: "bool",
                id: 4,
              },
              other: {
                type: "bytes",
                id: 10,
              },
            },
          },
          address_data: {
            fields: {
              value: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              permanent_address: {
                type: "bool",
                id: 2,
              },
              address_modifiable_only_by_governance: {
                type: "bool",
                id: 3,
              },
            },
          },
          get_tokens_by_address_args: {
            fields: {
              address: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              start: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "HEX",
                },
              },
              limit: {
                type: "int32",
                id: 3,
              },
              descending: {
                type: "bool",
                id: 4,
              },
            },
          },
        },
      },
    },
  },
  events: {
    "collections.mint_event": {
      type: "nft.mint_args",
      argument: "nft.mint_args",
    },
    "collections.burn_event": {
      type: "nft.burn_args",
      argument: "nft.burn_args",
    },
    "collections.transfer_event": {
      type: "nft.transfer_args",
      argument: "nft.transfer_args",
    },
    "nicknames.set_tabi": {
      type: "nicknames.set_tabi_args",
      argument: "nicknames.set_tabi_args",
    },
    "collections.set_metadata_event": {
      type: "nft.metadata_args",
      argument: "nft.metadata_args",
    },
    address_updated: {
      type: "nicknames.set_address_args",
      argument: "nicknames.set_address_args",
    },
    extended_metadata_updated: {
      type: "nicknames.extended_metadata",
      argument: "nicknames.extended_metadata",
    },
    "collections.owner_event": {
      type: "common.address",
      argument: "common.address",
    },
    "collections.royalties_event": {
      type: "nft.royalties",
      argument: "nft.royalties",
    },
    "collections.token_approval_event": {
      type: "nft.approve_args",
      argument: "nft.approve_args",
    },
    "collections.operator_approval_event": {
      type: "nft.set_approval_for_all_args",
      argument: "nft.set_approval_for_all_args",
    },
  },
};

export default nicknamesAbi;
