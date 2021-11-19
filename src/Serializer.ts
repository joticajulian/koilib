/* eslint-disable @typescript-eslint/require-await */
import { Root, Type, INamespace } from "protobufjs/light";
import {
  decodeBase58,
  decodeBase64,
  encodeBase58,
  encodeBase64,
  toHexString,
  toUint8Array,
} from "./utils";

const OP_BYTES = "(koinos_bytes_type)";

/**
 * Makes a copy of a value. The returned value can be modified
 * without altering the original one. Although this is not needed
 * for strings or numbers and only needed for objects and arrays,
 * all these options are covered in a single function
 *
 * It is assumed that the argument is number, string, or contructions
 * of these types inside objects or arrays.
 */
function copyValue(value: unknown): unknown {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as unknown;
}

/**
 * The serializer class serialize and deserialize data using
 * protocol buffers.
 *
 * NOTE: This class uses the [protobufjs/light](https://www.npmjs.com/package/protobufjs)
 * library internally, which uses reflection (use of _eval_
 * and _new Function_) for the construction of the types.
 * This could cause issues in environments where _eval_ is not
 * allowed, like in browser extensions. In such cases, this class
 * must be confined in a [sandbox environment](https://developer.chrome.com/docs/apps/app_external/#sandboxing)
 * where _eval_ is allowed. This is the principal reason of
 * having the serializer in a separate class.
 *
 * @example
 *
 * ```ts
 * const descriptorJson = {
 *   nested: {
 *     awesomepackage: {
 *       nested: {
 *         AwesomeMessage: {
 *           fields: {
 *             awesomeField: {
 *               type: "string",
 *               id: 1
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 * const serializer = new Serializer(descriptorJson)
 * ```
 */
export class Serializer {
  /**
   * Protobuffers descriptor in JSON format.
   * See https://www.npmjs.com/package/protobufjs#using-json-descriptors
   */
  types: INamespace;

  /**
   * Protobuffer definitions
   */
  root: Root;

  /**
   * Default type for all serializations
   */
  defaultType?: Type;

  /**
   * Preformat bytes for base64, base58 or hex string
   */
  bytesConversion = true;

  constructor(
    types: INamespace,
    opts?: {
      /**
       * Default type name. Use this option when you
       * always want to serialize/deserialize the same type
       */
      defaultTypeName?: string;

      /**
       * Bytes conversion. Option to preformat bytes
       * when "(koinos_bytes_type)" is defined in the type
       * definitions. By default it is true.
       */
      bytesConversion?: boolean;
    }
  ) {
    this.types = types;
    this.root = Root.fromJSON(this.types);
    if (opts?.defaultTypeName)
      this.defaultType = this.root.lookupType(opts.defaultTypeName);
    if (opts && typeof opts.bytesConversion !== "undefined")
      this.bytesConversion = opts.bytesConversion;
  }

  /**
   * Function to encode a type using the protobuffer definitions
   * It also prepares the bytes for special cases (base58, hex string)
   * when bytesConversion param is true.
   */
  async serialize(
    valueDecoded: Record<string, unknown>,
    typeName?: string
  ): Promise<Uint8Array> {
    const protobufType =
      this.defaultType || this.root.lookupType(typeName as string);
    let object: Record<string, unknown> = {};
    if (this.bytesConversion) {
      // TODO: format from Buffer to base58/base64 for nested fields
      Object.keys(protobufType.fields).forEach((fieldName) => {
        const { options, name, type } = protobufType.fields[fieldName];

        // No byte conversion
        if (type !== "bytes") {
          object[name] = copyValue(valueDecoded[name]);
          return;
        }

        // Default byte conversion
        if (!options || !options[OP_BYTES]) {
          object[name] = decodeBase64(valueDecoded[name] as string);
          return;
        }

        // Specific byte conversion
        switch (options[OP_BYTES]) {
          case "BASE58":
          case "CONTRACT_ID":
          case "ADDRESS":
            object[name] = decodeBase58(valueDecoded[name] as string);
            break;
          case "BASE64":
            object[name] = decodeBase64(valueDecoded[name] as string);
            break;
          case "HEX":
          case "BLOCK_ID":
          case "TRANSACTION_ID":
            object[name] = toUint8Array(
              (valueDecoded[name] as string).replace("0x", "")
            );
            break;
          default:
            throw new Error(
              `unknown koinos_byte_type ${options[OP_BYTES] as string}`
            );
        }
      });
    } else {
      object = valueDecoded;
    }
    const message = protobufType.create(object);
    const buffer = protobufType.encode(message).finish();
    return buffer;
  }

  /**
   * Function to decode bytes using the protobuffer definitions
   * It also encodes the bytes for special cases (base58, hex string)
   * when bytesConversion param is true.
   */
  async deserialize<T = Record<string, unknown>>(
    valueEncoded: string | Uint8Array,
    typeName?: string
  ): Promise<T> {
    const valueBuffer =
      typeof valueEncoded === "string"
        ? decodeBase64(valueEncoded)
        : valueEncoded;
    const protobufType =
      this.defaultType || this.root.lookupType(typeName as string);
    const message = protobufType.decode(valueBuffer);
    const object = protobufType.toObject(message, { longs: String });
    if (!this.bytesConversion) return object as T;

    // TODO: format from Buffer to base58/base64 for nested fields
    Object.keys(protobufType.fields).forEach((fieldName) => {
      const { options, name, type } = protobufType.fields[fieldName];

      // No byte conversion
      if (type !== "bytes") return;

      // Default byte conversion
      if (!options || !options[OP_BYTES]) {
        object[name] = encodeBase64(object[name]);
        return;
      }

      // Specific byte conversion
      switch (options[OP_BYTES]) {
        case "BASE58":
        case "CONTRACT_ID":
        case "ADDRESS":
          object[name] = encodeBase58(object[name]);
          break;
        case "BASE64":
          object[name] = encodeBase64(object[name]);
          break;
        case "HEX":
        case "BLOCK_ID":
        case "TRANSACTION_ID":
          object[name] = `0x${toHexString(object[name])}`;
          break;
        default:
          throw new Error(
            `unknown koinos_byte_type ${options[OP_BYTES] as string}`
          );
      }
    });

    return object as T;
  }
}

export default Serializer;
