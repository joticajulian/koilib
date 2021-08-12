import VariableBlob from "./VariableBlob";

export interface Abi {
  type: string | Abi[];
  name?: string;
  size?: number;
  subAbi?: Abi;
  variants?: Abi[];
}

export function serialize(data: unknown, abi: Abi) {
  const vb = new VariableBlob();
  // vb.dataBuffer = {};
  // const aux = new VariableBlob();
  if (Array.isArray(abi.type)) {
    const _data = data as Record<string, unknown>;
    abi.type.forEach((key: Abi) => {
      const { buffer /*, dataBuffer */ } = serialize(
        _data[key.name as string],
        key
      );
      // vb.dataBuffer[key.name] = dataBuffer;
      vb.write(buffer);
    });
    vb.resetCursor();
    return vb;
  }

  switch (abi.type) {
    case "opaque": {
      if (!abi.subAbi)
        throw new Error(`subAbi undefined in ${JSON.stringify(abi)}`);
      const native = serialize(data, abi.subAbi);
      vb.serializeBuffer(native.buffer);
      // vb.dataBuffer.native = native.dataBuffer;
      break;
    }
    case "vector": {
      if (!abi.subAbi)
        throw new Error(`subAbi undefined in ${JSON.stringify(abi)}`);
      if (!Array.isArray(data))
        throw new Error(`Invalid data, array expected. Received: ${data}`);
      vb.serializeVarint(data.length);
      // aux.serializeVarint(data.length); vb.dataBuffer.size = aux.buffer.toString();
      // vb.dataBuffer.items = [];
      if (!abi.subAbi)
        throw new Error(`subAbi undefined in ${JSON.stringify(abi)}`);
      data.forEach((item) => {
        const itemSerialized = serialize(item, abi.subAbi as Abi);
        vb.write(itemSerialized.buffer);
        // vb.dataBuffer.items.push(itemSerialized.dataBuffer);
      });
      break;
    }
    case "variant": {
      const _data = data as { type: string; value: unknown };
      if (!abi.variants) throw new Error("Abi variants are not defined");
      const variantId = abi.variants.findIndex((v) => v.name === _data.type);
      if (variantId < 0) throw new Error(`Variant ${_data.type} not found`);
      if (!abi.variants[variantId])
        throw new Error(
          `abi undefined in ${JSON.stringify(abi)} for id ${variantId}`
        );
      vb.serializeVarint(variantId);
      // aux.serializeVarint(variantId); vb.dataBuffer.variantId = aux.buffer.toString();
      const variantSerialized = serialize(_data.value, abi.variants[variantId]);
      vb.write(variantSerialized.buffer);
      // vb.dataBuffer.variant = variantSerialized.dataBuffer;
      break;
    }
    case "variableblob": {
      vb.serializeBuffer(data as string | Uint8Array);
      // aux.serializeBuffer(data); vb.dataBuffer.variableblob = aux.buffer.toString();
      break;
    }
    case "fixedblob": {
      vb.write(data as string | Uint8Array, abi.size);
      // aux.write(data, abi.size); vb.dataBuffer.fixedblob = aux.buffer.toString();
      break;
    }
    case "string": {
      vb.serializeString(data as string);
      // aux.serializeString(data); vb.dataBuffer.string = aux.buffer.toString();
      break;
    }
    case "varint": {
      vb.serializeVarint(data as number);
      // aux.serializeVarint(data); vb.dataBuffer.varint = aux.buffer.toString();
      break;
    }
    case "uint8": {
      vb.writeUint8(data as number);
      // aux.writeUint8(data); vb.dataBuffer.uint8 = aux.buffer.toString();
      break;
    }
    case "uint16": {
      vb.writeUint16(data as number);
      // aux.writeUint16(data); vb.dataBuffer.uint16 = aux.buffer.toString();
      break;
    }
    case "uint32": {
      vb.writeUint32(data as number);
      // aux.writeUint32(data); vb.dataBuffer.uint32 = aux.buffer.toString();
      break;
    }
    case "uint64": {
      vb.serializeBigint(data as number | string | bigint, 64);
      // aux.serializeBigint(data, 64); vb.dataBuffer.uint64 = aux.buffer.toString();
      break;
    }
    case "uint128": {
      vb.serializeBigint(data as number | string | bigint, 128);
      // aux.serializeBigint(data, 128); vb.dataBuffer.uint128 = aux.buffer.toString();
      break;
    }
    case "uint160": {
      vb.serializeBigint(data as number | string | bigint, 160);
      // aux.serializeBigint(data, 160); vb.dataBuffer.uint160 = aux.buffer.toString();
      break;
    }
    case "uint256": {
      vb.serializeBigint(data as number | string | bigint, 256);
      // aux.serializeBigint(data, 256); vb.dataBuffer.uint256 = aux.buffer.toString();
      break;
    }
    case "int8": {
      vb.writeInt8(data as number);
      // aux.writeInt8(data); vb.dataBuffer.int8 = aux.buffer.toString();
      break;
    }
    case "int16": {
      vb.writeInt16(data as number);
      // aux.writeInt16(data); vb.dataBuffer.int16 = aux.buffer.toString();
      break;
    }
    case "int32": {
      vb.writeInt32(data as number);
      // aux.writeInt32(data); vb.dataBuffer.int32 = aux.buffer.toString();
      break;
    }
    case "int64": {
      vb.serializeBigint(data as number | string | bigint, 64);
      // aux.serializeBigint(data, 64); vb.dataBuffer.int64 = aux.buffer.toString();
      break;
    }
    case "int128": {
      vb.serializeBigint(data as number | string | bigint, 128);
      // aux.serializeBigint(data, 128); vb.dataBuffer.int128 = aux.buffer.toString();
      break;
    }
    case "int160": {
      vb.serializeBigint(data as number | string | bigint, 160);
      // aux.serializeBigint(data, 160); vb.dataBuffer.int160 = aux.buffer.toString();
      break;
    }
    case "int256": {
      vb.serializeBigint(data as number | string | bigint, 256);
      // aux.serializeBigint(data, 256); vb.dataBuffer.int256 = aux.buffer.toString();
      break;
    }
    case "unused_extension":
      break;
    default: {
      throw new Error(`Unknown type ${abi.type}`);
    }
  }
  return vb;
}

export function deserialize(buffer: VariableBlob | string, abi: Abi): unknown {
  const vb = typeof buffer === "string" ? new VariableBlob(buffer) : buffer;

  if (Array.isArray(abi.type)) {
    const data: Record<string, unknown> = {};
    abi.type.forEach((key) => {
      data[key.name as string] = deserialize(vb, key);
    });
    return data;
  }

  switch (abi.type) {
    case "opaque": {
      if (!abi.subAbi) throw new Error("subAbi not defined");
      const blob = vb.deserializeBuffer();
      const subVb = new VariableBlob(blob);
      return deserialize(subVb, abi.subAbi);
    }
    case "vector": {
      const size = vb.deserializeVarint();
      const data = [];
      for (let i = 0; i < size; i += 1) {
        const item = deserialize(vb, abi.subAbi as Abi);
        data.push(item);
      }
    }
    case "variant": {
      const variantId = vb.deserializeVarint();
      const abiVariant = (abi.variants as Abi[])[variantId];
      const value = deserialize(vb, abiVariant);
      const type = abiVariant.name;
      return { type, value };
    }
    case "variableblob":
      return vb.deserializeBuffer(true);
    case "fixedblob":
      return vb.read(abi.size as number, true);
    case "string":
      return vb.deserializeString();
    case "varint":
      return vb.deserializeVarint();
    case "uint8":
      return vb.readUint8();
    case "uint16":
      return vb.readUint16();
    case "uint32":
      return vb.readUint32();
    case "uint64":
      return vb.deserializeBigint(64, true);
    case "uint128":
      return vb.deserializeBigint(128, true);
    case "uint160":
      return vb.deserializeBigint(160, true);
    case "uint256":
      return vb.deserializeBigint(256, true);
    case "int8":
      return vb.readInt8();
    case "int16":
      return vb.readInt16();
    case "int32":
      return vb.readInt32();
    case "int64":
      return vb.deserializeBigint(64, false);
    case "int128":
      return vb.deserializeBigint(128, false);
    case "int160":
      return vb.deserializeBigint(160, false);
    case "int256":
      return vb.deserializeBigint(256, false);
    case "unused_extension":
      return {};
    default:
      throw new Error(`Unknown type ${abi.type}`);
  }
}
