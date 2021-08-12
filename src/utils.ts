import multibase from "multibase";
import { sha256 } from "js-sha256";
import ripemd160 from "noble-ripemd160";

export function toUint8Array(hex: string) {
  const pairs = hex.match(/[\dA-F]{2}/gi);
  if (!pairs) throw new Error("Invalid hex");
  return new Uint8Array(
    pairs.map((s) => parseInt(s, 16)) // convert to integers
  );
}

export function toHexString(buffer: Uint8Array) {
  return Array.from(buffer)
    .map((n) => `0${Number(n).toString(16)}`.slice(-2))
    .join("");
}

export function encodeBase58(buffer: Uint8Array) {
  return new TextDecoder().decode(multibase.encode("z", buffer)).slice(1);
}

export function decodeBase58(bs58: string): Uint8Array {
  return multibase.decode(`z${bs58}`);
}

export function bitcoinEncode(
  buffer: Uint8Array,
  type: string,
  compressed = false
) {
  let bufferCheck;
  let prefixBuffer;
  let offsetChecksum;
  if (type === "public") {
    bufferCheck = new Uint8Array(25);
    prefixBuffer = new Uint8Array(21);
    bufferCheck[0] = 0;
    prefixBuffer[0] = 0;
    offsetChecksum = 21;
  } else {
    if (compressed) {
      bufferCheck = new Uint8Array(38);
      prefixBuffer = new Uint8Array(34);
      offsetChecksum = 34;
      bufferCheck[33] = 1;
      prefixBuffer[33] = 1;
    } else {
      bufferCheck = new Uint8Array(37);
      prefixBuffer = new Uint8Array(33);
      offsetChecksum = 33;
    }
    bufferCheck[0] = 128;
    prefixBuffer[0] = 128;
  }
  prefixBuffer.set(buffer, 1);
  const firstHash = sha256(prefixBuffer);
  const doubleHash = sha256(toUint8Array(firstHash));
  const checksum = toUint8Array(doubleHash.substring(0, 8));
  bufferCheck.set(buffer, 1);
  bufferCheck.set(checksum, offsetChecksum);
  return encodeBase58(bufferCheck);
}

export function copyUint8Array(
  source: Uint8Array,
  target: Uint8Array,
  targetStart: number,
  sourceStart: number,
  sourceEnd: number
) {
  for (
    let cursorSource = sourceStart;
    cursorSource < sourceEnd;
    cursorSource += 1
  ) {
    const cursorTarget = targetStart + cursorSource - sourceStart;
    target[cursorTarget] = source[cursorSource];
  }
}

export function bitcoinDecode(value: string) {
  const buffer = decodeBase58(value);
  const privateKey = new Uint8Array(32);
  const checksum = new Uint8Array(4);
  const prefix = buffer[0];
  copyUint8Array(buffer, privateKey, 0, 1, 33);
  if (value[0] !== "5") {
    // compressed
    copyUint8Array(buffer, checksum, 0, 34, 38);
  } else {
    copyUint8Array(buffer, checksum, 0, 33, 37);
  }
  // TODO: verify prefix and checksum
  return privateKey;
}

export function bitcoinAddress(publicKey: Uint8Array, compressed = false) {
  const hash = sha256(publicKey);
  const hash160 = ripemd160(toUint8Array(hash));
  return bitcoinEncode(hash160, "public", compressed);
}
