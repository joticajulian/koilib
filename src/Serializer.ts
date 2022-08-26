/* eslint-disable @typescript-eslint/require-await */
import { Root, Type, INamespace } from "protobufjs/light";
import { TypeField } from "./interface";
import { btypeDecodeValue, btypeEncodeValue, decodeBase64url } from "./utils";

const OP_BYTES_1 = "(btype)";
const OP_BYTES_2 = "(koinos.btype)";

const nativeTypes = [
  "double",
  "float",
  "int32",
  "int64",
  "uint32",
  "uint64",
  "sint32",
  "sint64",
  "fixed32",
  "fixed64",
  "sfixed32",
  "sfixed64",
  "bool",
  "string",
  "bytes",
];

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
   * Preformat bytes for base64url, base58 or hex string
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

  btypeDecode(
    valueBtypeEncoded: Record<string, unknown> | unknown[],
    protobufType: Type
  ) {
    const valueBtypeDecoded = {} as Record<string, unknown>;
    Object.keys(protobufType.fields).forEach((fieldName) => {
      // @ts-ignore
      const { options, name, type, rule } = protobufType.fields[fieldName];
      if (!valueBtypeEncoded[name]) return;

      const typeField: TypeField = { type };
      if (options) {
        if (options[OP_BYTES_1])
          typeField.btype = options[OP_BYTES_1] as string;
        else if (options[OP_BYTES_2])
          typeField.btype = options[OP_BYTES_2] as string;
      }

      // arrays
      if (rule === "repeated") {
        valueBtypeDecoded[name] = (valueBtypeEncoded[name] as unknown[]).map(
          (itemEncoded) => {
            // custom objects
            if (!nativeTypes.includes(type)) {
              const protoBuf = this.root.lookupType(type);
              return this.btypeDecode(
                itemEncoded as Record<string, unknown>,
                protoBuf
              );
            }
            // native types
            return btypeDecodeValue(itemEncoded, typeField);
          }
        );
        return;
      }

      // custom objects
      if (!nativeTypes.includes(type)) {
        const protoBuf = this.root.lookupType(type);
        valueBtypeDecoded[name] = this.btypeDecode(
          valueBtypeEncoded[name] as Record<string, unknown>,
          protoBuf
        );
        return;
      }

      // native types
      valueBtypeDecoded[name] = btypeDecodeValue(
        valueBtypeEncoded[name],
        typeField
      );
    });

    return valueBtypeDecoded;
  }

  btypeEncode(
    valueBtypeDecoded: Record<string, unknown> | unknown[],
    protobufType: Type
  ) {
    const valueBtypeEncoded = {} as Record<string, unknown>;
    Object.keys(protobufType.fields).forEach((fieldName) => {
      // @ts-ignore
      const { options, name, type, rule } = protobufType.fields[fieldName];
      if (!valueBtypeDecoded[name]) return;

      const typeField: TypeField = { type };
      if (options) {
        if (options[OP_BYTES_1])
          typeField.btype = options[OP_BYTES_1] as string;
        else if (options[OP_BYTES_2])
          typeField.btype = options[OP_BYTES_2] as string;
      }

      // arrays
      if (rule === "repeated") {
        valueBtypeEncoded[name] = (valueBtypeDecoded[name] as unknown[]).map(
          (itemDecoded) => {
            // custom objects
            if (!nativeTypes.includes(type)) {
              const protoBuf = this.root.lookupType(type);
              return this.btypeEncode(
                itemDecoded as Record<string, unknown>,
                protoBuf
              );
            }
            // native types
            return btypeEncodeValue(itemDecoded, typeField);
          }
        );
        return;
      }

      // custom objects
      if (!nativeTypes.includes(type)) {
        const protoBuf = this.root.lookupType(type);
        valueBtypeEncoded[name] = this.btypeEncode(
          valueBtypeDecoded[name] as Record<string, unknown>,
          protoBuf
        );
        return;
      }

      // native types
      valueBtypeEncoded[name] = btypeEncodeValue(
        valueBtypeDecoded[name],
        typeField
      );
    });

    return valueBtypeEncoded;
  }

  /**
   * Function to encode a type using the protobuffer definitions
   * It also prepares the bytes for special cases (base58, hex string)
   * when bytesConversion param is true.
   */
  async serialize(
    valueDecoded: Record<string, unknown>,
    typeName?: string,
    opts?: { bytesConversion?: boolean }
  ): Promise<Uint8Array> {
    const protobufType =
      this.defaultType || this.root.lookupType(typeName as string);
    let object: Record<string, unknown> = {};
    const bytesConversion =
      opts?.bytesConversion === undefined
        ? this.bytesConversion
        : opts.bytesConversion;
    if (bytesConversion) {
      object = this.btypeDecode(valueDecoded, protobufType);
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
    typeName?: string,
    opts?: { bytesConversion?: boolean }
  ): Promise<T> {
    const valueBuffer =
      typeof valueEncoded === "string"
        ? decodeBase64url(valueEncoded)
        : valueEncoded;
    const protobufType =
      this.defaultType || this.root.lookupType(typeName as string);
    const message = protobufType.decode(valueBuffer);
    const object = protobufType.toObject(message, {
      longs: String,
      defaults: true,
    });
    const bytesConversion =
      opts?.bytesConversion === undefined
        ? this.bytesConversion
        : opts.bytesConversion;
    if (bytesConversion) {
      return this.btypeEncode(object, protobufType) as T;
    }
    return object as T;
  }
}

export default Serializer;
