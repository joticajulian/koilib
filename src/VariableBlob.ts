import multibase from "multibase";

export class VariableBlob {
  public buffer: Uint8Array;

  public offset: number;

  constructor(input?: string | Uint8Array) {
    if (typeof input === "string") {
      this.buffer = multibase.decode(input);
    } else {
      this.buffer = input ? input : new Uint8Array();
    }
    this.offset = 0;
  }

  resetCursor() {
    this.offset = 0;
    return this;
  }

  checkRemaining(size: number, canResize = false) {
    if (this.offset + size > this.buffer.length) {
      if (!canResize) throw new Error("Unexpected EOF");
      const newSize = this.offset + size;
      const buffer = new Uint8Array(newSize);
      buffer.set(this.buffer);
      this.buffer = buffer;
    }
  }

  write(data: string | Uint8Array, length = 0) {
    let bytes = typeof data === "string" ? multibase.decode(data) : data;
    if (length && bytes.length !== length)
      throw new Error(
        `Invalid length. Expected: ${length}. Received: ${bytes.length}`
      );
    this.checkRemaining(bytes.length, true);
    this.buffer.set(bytes, this.offset);
    this.offset += bytes.length;
  }

  read(
    size: number,
    outputString = false,
    nameOrCode: multibase.BaseNameOrCode = "M"
  ): Uint8Array | string {
    this.checkRemaining(size);
    const subBuffer = new Uint8Array(size);
    subBuffer.set(this.buffer.subarray(this.offset, this.offset + size));
    this.offset += size;
    if (outputString) {
      return new VariableBlob(subBuffer).toString(nameOrCode);
    }
    return subBuffer;
  }

  writeInt8(n: number) {
    this.checkRemaining(1, true);
    new DataView(this.buffer.buffer).setInt8(this.offset, n);
    this.offset += 1;
  }

  readInt8() {
    this.checkRemaining(1);
    const n = new DataView(this.buffer.buffer).getInt8(this.offset);
    this.offset += 1;
    return n;
  }

  writeInt16(n: number) {
    this.checkRemaining(2, true);
    new DataView(this.buffer.buffer).setInt16(this.offset, n);
    this.offset += 2;
  }

  readInt16() {
    this.checkRemaining(2);
    const n = new DataView(this.buffer.buffer).getInt16(this.offset);
    this.offset += 2;
    return n;
  }

  writeInt32(n: number) {
    this.checkRemaining(4, true);
    new DataView(this.buffer.buffer).setInt32(this.offset, n);
    this.offset += 4;
  }

  readInt32() {
    this.checkRemaining(4);
    const n = new DataView(this.buffer.buffer).getInt32(this.offset);
    this.offset += 4;
    return n;
  }

  writeUint8(n: number) {
    this.checkRemaining(1, true);
    // new DataView(this.buffer.buffer).setUint8(this.offset, n);
    this.buffer[this.offset] = n;
    this.offset += 1;
  }

  readUint8() {
    this.checkRemaining(1);
    // const n = new DataView(this.buffer.buffer).getUint8(this.offset);
    const n = this.buffer[this.offset];
    this.offset += 1;
    return n;
  }

  writeUint16(n: number) {
    this.checkRemaining(2, true);
    new DataView(this.buffer.buffer).setUint16(this.offset, n);
    this.offset += 2;
  }

  readUint16() {
    this.checkRemaining(2);
    const n = new DataView(this.buffer.buffer).getUint16(this.offset);
    this.offset += 2;
    return n;
  }

  writeUint32(n: number) {
    this.checkRemaining(4, true);
    new DataView(this.buffer.buffer).setUint32(this.offset, n);
    this.offset += 4;
  }

  readUint32() {
    this.checkRemaining(4);
    const n = new DataView(this.buffer.buffer).getUint32(this.offset);
    this.offset += 4;
    return n;
  }

  // Varint
  serializeVarint(num: number) {
    if (num === 0) {
      this.writeUint8(0);
      return;
    }
    let n = num;
    let shift7 = num;
    while (n > 0) {
      shift7 = n >> 7;
      const group7 = n - (shift7 << 7);
      const byte = shift7 > 0 ? 128 + group7 : group7;
      this.writeUint8(byte);
      n = shift7;
    }
  }

  deserializeVarint() {
    let i = 0;
    let n = 0;
    let endVarInt = false;
    while (!endVarInt) {
      const byte = this.readUint8();
      endVarInt = byte < 128;
      const mod = endVarInt ? byte : byte - 128;
      n += mod << (7 * i);
      i += 1;
    }
    return n;
  }

  // Buffer
  serializeBuffer(data: string | Uint8Array) {
    let bytes = typeof data === "string" ? multibase.decode(data) : data;
    this.serializeVarint(bytes.length);
    this.write(bytes);
  }

  deserializeBuffer(
    outputString = false,
    nameOrCode: multibase.BaseNameOrCode = "M"
  ): Uint8Array | string {
    const size = this.deserializeVarint();
    return this.read(size, outputString, nameOrCode);
  }

  // String
  serializeString(str: string) {
    const bytes = new TextEncoder().encode(str);
    this.serializeVarint(bytes.length);
    this.write(bytes);
  }

  deserializeString() {
    const size = this.deserializeVarint();
    const buffer = this.read(size) as Uint8Array;
    return new TextDecoder().decode(buffer);
  }

  // Bigint
  serializeBigint(num: string | number | bigint, bits: number) {
    const bignum = BigInt(num);
    let numString;
    if (bignum >= BigInt(0)) {
      numString = bignum.toString(16);
      numString = "0".repeat(bits / 4 - numString.length) + numString;
    } else {
      numString = (BigInt("0x1" + "0".repeat(bits / 4)) + bignum).toString(16);
    }
    for (let i = 0; i < bits / 4; i += 8) {
      const uint32 = Number("0x" + numString.substring(i, i + 8));
      this.writeUint32(uint32);
    }
  }

  deserializeBigint(bits: number, unsigned = true, outputBigint = true) {
    let numString = "0x";
    for (let i = 0; i < bits / 32; i += 1) {
      const uint32Str = this.readUint32().toString(16);
      numString += "0".repeat(8 - uint32Str.length) + uint32Str;
    }
    if (!unsigned && Number(numString.substring(0, 3)) >= 8) {
      // signed number and starts with bit 1 (negative number)
      return BigInt(numString) - BigInt("0x1" + "0".repeat(bits / 4));
    }
    const result = BigInt(numString);
    if (outputBigint) return result;
    if (result <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(result);
    return result.toString();
  }

  toString(nameOrCode: multibase.BaseNameOrCode = "M"): string {
    return new TextDecoder().decode(multibase.encode(nameOrCode, this.buffer));
  }
}

export default VariableBlob;
