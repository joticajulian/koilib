import { AnyNestedObject } from "protobufjs";
import { Abi } from "../interface";

export const multicallAbi: Abi = {
  methods: {
    get: {
      argument: "multicall.get_args",
      return: "multicall.get_return",
      description: "Get the result of a multicall",
      entry_point: 697873187,
      read_only: true,
    },
  },
  types:
    "CvEDCg9tdWx0aWNhbGwucHJvdG8SCW11bHRpY2FsbBoUa29pbm9zL29wdGlvbnMucHJvdG8ibAoOY2FsbF9hcmd1bWVudHMSJQoLY29udHJhY3RfaWQYASABKAxCBIC1GAVSCmNvbnRyYWN0SWQSHwoLZW50cnlfcG9pbnQYAiABKA1SCmVudHJ5UG9pbnQSEgoEYXJncxgDIAEoDFIEYXJncyJaCgZyZXN1bHQSGAoGb2JqZWN0GAEgASgMSABSBm9iamVjdBItCgVlcnJvchgCIAEoCzIVLm11bHRpY2FsbC5lcnJvcl9kYXRhSABSBWVycm9yQgcKBXZhbHVlIiYKCmVycm9yX2RhdGESGAoHbWVzc2FnZRgBIAEoCVIHbWVzc2FnZSI7CghnZXRfYXJncxIvCgVjYWxscxgBIAMoCzIZLm11bHRpY2FsbC5jYWxsX2FyZ3VtZW50c1IFY2FsbHMiRgoLY2FsbF9yZXR1cm4SEgoEY29kZRgBIAEoBVIEY29kZRIjCgNyZXMYAiABKAsyES5tdWx0aWNhbGwucmVzdWx0UgNyZXMiPgoKZ2V0X3JldHVybhIwCgdyZXN1bHRzGAEgAygLMhYubXVsdGljYWxsLmNhbGxfcmV0dXJuUgdyZXN1bHRzYgZwcm90bzM=",
  koilib_types: {
    nested: {
      multicall: {
        nested: {
          call_arguments: {
            fields: {
              contract_id: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "CONTRACT_ID",
                },
              },
              entry_point: {
                type: "uint32",
                id: 2,
              },
              args: {
                type: "bytes",
                id: 3,
              },
            },
          },
          result: {
            oneofs: {
              value: {
                oneof: ["object", "error"],
              },
            },
            fields: {
              object: {
                type: "bytes",
                id: 1,
              },
              error: {
                type: "error_data",
                id: 2,
              },
            },
          },
          error_data: {
            fields: {
              message: {
                type: "string",
                id: 1,
              },
            },
          },
          get_args: {
            fields: {
              calls: {
                rule: "repeated",
                type: "call_arguments",
                id: 1,
              },
            },
          },
          call_return: {
            fields: {
              code: {
                type: "int32",
                id: 1,
              },
              res: {
                type: "result",
                id: 2,
              },
            },
          },
          get_return: {
            fields: {
              results: {
                rule: "repeated",
                type: "call_return",
                id: 1,
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
    },
  },
};
