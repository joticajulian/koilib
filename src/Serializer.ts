/* eslint-disable @typescript-eslint/require-await */
import { Root, Type, INamespace, parse } from "protobufjs";
import * as koinosPbToProto from "@roamin/koinos-pb-to-proto";
import { TypeField } from "./interface";
import {
  btypeDecodeValue,
  btypeEncodeValue,
  decodeBase64url,
  decodeBase64,
} from "./utils";

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
 * protocol buffers. It accepts the descriptor in JSON or binary format
 *
 * NOTE: This class uses the [protobufjs](https://www.npmjs.com/package/protobufjs)
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
 * // using descriptor JSON
 * const descriptorJson = {
 *   nested: {
 *     awesomepackage: {
 *       nested: {
 *         AwesomeMessage: {
 *           fields: {
 *             awesome_field: {
 *               type: "string",
 *               id: 1,
 *             },
 *           },
 *         },
 *       },
 *     },
 *   },
 * };
 * const serializer1 = new Serializer(descriptorJson);
 * const message1 = await serializer1.deserialize(
 *   "CgZrb2lub3M=",
 *   "AwesomeMessage"
 * );
 * console.log(message1);
 * // { awesome_field: 'koinos' }
 *
 * // using descriptor binary
 * const descriptorBinary =
 *   "Cl4KDWF3ZXNvbWUucHJvdG8SDmF3ZXNvbWVwYWN" +
 *   "rYWdlIjUKDkF3ZXNvbWVNZXNzYWdlEiMKDWF3ZX" +
 *   "NvbWVfZmllbGQYASABKAlSDGF3ZXNvbWVGaWVsZ" +
 *   "GIGcHJvdG8z";
 * const serializer2 = new Serializer(descriptorBinary);
 * const message2 = await serializer2.deserialize(
 *   "CgZrb2lub3M=",
 *   "AwesomeMessage"
 * );
 * console.log(message2);
 * // { awesome_field: 'koinos' }
 * ```
 */
export class Serializer {
  /**
   * Protobuffers descriptor in JSON format.
   * See https://www.npmjs.com/package/protobufjs#using-json-descriptors
   */
  types: INamespace | string;

  /**
   * Protobuffer definitions
   */
  root: Root;

  /**
   * Default type for all serializations
   */
  defaultType?: Type;

  /**
   * Type name for arguments when using
   * [[Provider.invokeSystemCall]]
   */
  argumentsTypeName?: string;

  /**
   * Type name for the output when using
   * [[Provider.invokeSystemCall]]
   */
  returnTypeName?: string;

  /**
   * Preformat bytes for base64url, base58 or hex string
   */
  bytesConversion = true;

  /**
   * Verify checksum in addresses during serialization
   * or deserialization
   */
  verifyChecksum = {
    serialize: true,
    deserialize: false,
  };

  constructor(
    types: INamespace | string,
    opts?: {
      /**
       * Default type name. Use this option when you
       * always want to serialize/deserialize the same type
       */
      defaultTypeName?: string;

      /**
       * Type name for arguments when using
       * [[Provider.invokeSystemCall]]
       */
      argumentsTypeName?: string;

      /**
       * Type name for the output when using
       * [[Provider.invokeSystemCall]]
       */
      returnTypeName?: string;

      /**
       * Bytes conversion. Option to preformat bytes
       * when "(koinos_bytes_type)" is defined in the type
       * definitions. By default it is true.
       */
      bytesConversion?: boolean;
    }
  ) {
    this.types = types;
    if (typeof types === "string") {
      const protos = koinosPbToProto.convert(decodeBase64(types) as Buffer);
      this.root = new Root();
      for (const proto of protos) {
        parse(proto.definition, this.root, { keepCase: true });
      }
    } else {
      this.root = Root.fromJSON(types);
    }
    if (opts?.defaultTypeName)
      this.defaultType = this.root.lookupType(opts.defaultTypeName);
    if (opts?.argumentsTypeName)
      this.argumentsTypeName = opts.argumentsTypeName;
    if (opts?.returnTypeName) this.returnTypeName = opts.returnTypeName;
    if (opts && typeof opts.bytesConversion !== "undefined")
      this.bytesConversion = opts.bytesConversion;
  }

  btypeDecode(
    valueBtypeEncoded: Record<string, unknown> | unknown[],
    protobufType: Type,
    verifyChecksum: boolean
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
              const protoBuf = this.root.lookupTypeOrEnum(type);
              if (!protoBuf.fields) {
                // it's an enum
                return itemEncoded;
              }
              return this.btypeDecode(
                itemEncoded as Record<string, unknown>,
                protoBuf,
                verifyChecksum
              );
            }
            // native types
            return btypeDecodeValue(itemEncoded, typeField, verifyChecksum);
          }
        );
        return;
      }

      // custom objects
      if (!nativeTypes.includes(type)) {
        const protoBuf = this.root.lookupTypeOrEnum(type);
        if (!protoBuf.fields) {
          // it's an enum
          valueBtypeDecoded[name] = valueBtypeEncoded[name];
          return;
        }
        valueBtypeDecoded[name] = this.btypeDecode(
          valueBtypeEncoded[name] as Record<string, unknown>,
          protoBuf,
          verifyChecksum
        );
        return;
      }

      // native types
      valueBtypeDecoded[name] = btypeDecodeValue(
        valueBtypeEncoded[name],
        typeField,
        verifyChecksum
      );
    });

    return valueBtypeDecoded;
  }

  btypeEncode(
    valueBtypeDecoded: Record<string, unknown> | unknown[],
    protobufType: Type,
    verifyChecksum: boolean
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
              const protoBuf = this.root.lookupTypeOrEnum(type);
              if (!protoBuf.fields) {
                // it's an enum
                return itemDecoded;
              }
              return this.btypeEncode(
                itemDecoded as Record<string, unknown>,
                protoBuf,
                verifyChecksum
              );
            }
            // native types
            return btypeEncodeValue(itemDecoded, typeField, verifyChecksum);
          }
        );
        return;
      }

      // custom objects
      if (!nativeTypes.includes(type)) {
        const protoBuf = this.root.lookupTypeOrEnum(type);
        if (!protoBuf.fields) {
          // it's an enum
          valueBtypeEncoded[name] = valueBtypeDecoded[name];
          return;
        }
        valueBtypeEncoded[name] = this.btypeEncode(
          valueBtypeDecoded[name] as Record<string, unknown>,
          protoBuf,
          verifyChecksum
        );
        return;
      }

      // native types
      valueBtypeEncoded[name] = btypeEncodeValue(
        valueBtypeDecoded[name],
        typeField,
        verifyChecksum
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
    opts?: { bytesConversion?: boolean; verifyChecksum?: boolean }
  ): Promise<Uint8Array> {
    let protobufType: Type;
    if (this.defaultType) protobufType = this.defaultType;
    else if (!typeName) throw new Error("no typeName defined");
    else protobufType = this.root.lookupType(typeName);
    let object: Record<string, unknown> = {};
    const bytesConversion =
      opts?.bytesConversion === undefined
        ? this.bytesConversion
        : opts.bytesConversion;
    const verifyChecksum =
      opts?.verifyChecksum === undefined
        ? this.verifyChecksum.serialize
        : opts.verifyChecksum;
    if (bytesConversion) {
      object = this.btypeDecode(valueDecoded, protobufType, verifyChecksum);
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
    opts?: { bytesConversion?: boolean; verifyChecksum?: boolean }
  ): Promise<T> {
    const valueBuffer =
      typeof valueEncoded === "string"
        ? decodeBase64url(valueEncoded)
        : valueEncoded;
    let protobufType: Type;
    if (this.defaultType) protobufType = this.defaultType;
    else if (!typeName) throw new Error("no typeName defined");
    else protobufType = this.root.lookupType(typeName);
    const message = protobufType.decode(valueBuffer);
    const object = protobufType.toObject(message, {
      longs: String,
      defaults: true,
    });
    const bytesConversion =
      opts?.bytesConversion === undefined
        ? this.bytesConversion
        : opts.bytesConversion;
    const verifyChecksum =
      opts?.verifyChecksum === undefined
        ? this.verifyChecksum.deserialize
        : opts.verifyChecksum;
    if (bytesConversion) {
      return this.btypeEncode(object, protobufType, verifyChecksum) as T;
    }
    return object as T;
  }
}

export default Serializer;
