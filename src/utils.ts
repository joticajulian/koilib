import * as multibase from "multibase";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { Abi, TypeField } from "./interface";
import tokenProtoJson from "./jsonDescriptors/token-proto.json";

/**
 * Converts an hex string to Uint8Array
 */
export function toUint8Array(hex: string): Uint8Array {
  const pairs = hex.match(/[\dA-F]{2}/gi);
  if (!pairs) throw new Error("Invalid hex");
  return new Uint8Array(
    pairs.map((s) => parseInt(s, 16)) // convert to integers
  );
}

/**
 * Converts Uint8Array to hex string
 */
export function toHexString(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((n) => `0${Number(n).toString(16)}`.slice(-2))
    .join("");
}

/**
 * Encodes an Uint8Array in base58
 */
export function encodeBase58(buffer: Uint8Array): string {
  return new TextDecoder().decode(multibase.encode("z", buffer)).slice(1);
}

/**
 * Decodes a buffer formatted in base58
 */
export function decodeBase58(bs58: string): Uint8Array {
  return multibase.decode(`z${bs58}`);
}

/**
 * Encodes an Uint8Array in base64url
 */
export function encodeBase64url(buffer: Uint8Array): string {
  return new TextDecoder().decode(multibase.encode("U", buffer)).slice(1);
}

/**
 * Decodes a buffer formatted in base64url
 */
export function decodeBase64url(bs64url: string): Uint8Array {
  return multibase.decode(`U${bs64url}`);
}

/**
 * Encodes an Uint8Array in base64
 */
export function encodeBase64(buffer: Uint8Array): string {
  return new TextDecoder().decode(multibase.encode("M", buffer)).slice(1);
}

export function multihash(buffer: Uint8Array, code = "sha2-256"): Uint8Array {
  switch (code) {
    case "sha2-256": {
      return new Uint8Array([18, buffer.length, ...buffer]);
    }
    default:
      throw new Error(`multihash code ${code} not supported`);
  }
}

/**
 * Decodes a buffer formatted in base64
 */
export function decodeBase64(bs64: string): Uint8Array {
  return multibase.decode(`M${bs64}`);
}

/**
 * Calculates the merkle root of sha256 hashes
 */
export function calculateMerkleRoot(hashes: Uint8Array[]): Uint8Array {
  if (!hashes.length) return sha256(new Uint8Array());

  while (hashes.length > 1) {
    for (let i = 0; i < hashes.length; i += 2) {
      if (i + 1 < hashes.length) {
        const leftHash = hashes[i];
        const rightHash = hashes[i + 1];

        const sumHash = sha256(new Uint8Array([...leftHash, ...rightHash]));

        hashes[i / 2] = new Uint8Array(sumHash);
      } else {
        hashes[i / 2] = hashes[i];
      }
    }

    hashes = hashes.slice(0, Math.ceil(hashes.length / 2));
  }

  return hashes[0];
}

/**
 * Encodes a public or private key in base58 using
 * the bitcoin format (see [Bitcoin Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
 * and [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format)).
 *
 * For private keys this encode is also known as
 * wallet import format (WIF).
 */
export function bitcoinEncode(
  buffer: Uint8Array,
  type: "public" | "private",
  compressed = false
): string {
  let bufferCheck: Uint8Array;
  let prefixBuffer: Uint8Array;
  let offsetChecksum: number;
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
  const doubleHash = sha256(firstHash);
  const checksum = new Uint8Array(4);
  checksum.set(doubleHash.slice(0, 4));
  bufferCheck.set(buffer, 1);
  bufferCheck.set(checksum, offsetChecksum);
  return encodeBase58(bufferCheck);
}

/**
 * Decodes a public or private key formatted in base58 using
 * the bitcoin format (see [Bitcoin Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
 * and [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format)).
 *
 * For private keys this encode is also known as
 * wallet import format (WIF).
 */
export function bitcoinDecode(value: string): Uint8Array {
  const buffer = decodeBase58(value);
  const privateKey = new Uint8Array(32);
  const checksum = new Uint8Array(4);
  // const prefix = buffer[0];
  privateKey.set(buffer.slice(1, 33));
  if (value[0] !== "5") {
    // compressed
    checksum.set(buffer.slice(34, 38));
  } else {
    checksum.set(buffer.slice(33, 37));
  }
  // TODO: verify prefix and checksum
  return privateKey;
}

/**
 * Computes a bitcoin address, which is the format used in Koinos
 *
 * address = bitcoinEncode( ripemd160 ( sha256 ( publicKey ) ) )
 */
export function bitcoinAddress(publicKey: Uint8Array): string {
  const hash = sha256(publicKey);
  const hash160 = ripemd160(hash);
  return bitcoinEncode(hash160, "public");
}

/**
 * Checks if the last 4 bytes matches with the double sha256
 * of the first part
 */
export function isChecksum(buffer: Uint8Array): boolean {
  const dataLength = buffer.length - 4;
  const data = new Uint8Array(dataLength);
  data.set(buffer.slice(0, dataLength));

  const checksum = new Uint8Array(4);
  checksum.set(buffer.slice(dataLength));

  const doubleHash = sha256(sha256(data));

  // checksum must be the first 4 bytes of the double hash
  for (let i = 0; i < 4; i += 1) {
    if (checksum[i] !== doubleHash[i]) return false;
  }

  return true;
}

/**
 * Checks if the checksum of an address is correct.
 *
 * The address has 3 parts in this order:
 * - prefix: 1 byte
 * - data: 20 bytes
 * - checksum: 4 bytes
 *
 * checks:
 * - It must be "pay to public key hash" (P2PKH). That is prefix 0
 * - checksum = first 4 bytes of sha256(sha256(prefix + data))
 *
 * See [How to generate a bitcoin address step by step](https://medium.com/coinmonks/how-to-generate-a-bitcoin-address-step-by-step-9d7fcbf1ad0b).
 */
export function isChecksumAddress(address: string | Uint8Array): boolean {
  const bufferAddress =
    typeof address === "string" ? decodeBase58(address) : address;

  // it must have 25 bytes
  if (bufferAddress.length !== 25) return false;

  // it must have prefix 0 (P2PKH address)
  if (bufferAddress[0] !== 0) return false;

  return isChecksum(bufferAddress);
}

/**
 * Checks if the checksum of an private key WIF is correct.
 *
 * The private key WIF has 3 parts in this order:
 * - prefix: 1 byte
 * - private key: 32 bytes
 * - compressed: 1 byte for compressed public key (no byte for uncompressed)
 * - checksum: 4 bytes
 *
 * checks:
 * - It must use version 0x80 in the prefix
 * - If the corresponding public key is compressed the byte 33 must be 0x01
 * - checksum = first 4 bytes of
 *     sha256(sha256(prefix + private key + compressed))
 *
 * See [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format).
 */
export function isChecksumWif(wif: string | Uint8Array): boolean {
  const bufferWif = typeof wif === "string" ? decodeBase58(wif) : wif;

  // it must have 37 or 38 bytes
  if (bufferWif.length !== 37 && bufferWif.length !== 38) return false;

  const compressed = bufferWif.length === 38;

  // if compressed then the last byte must be 0x01
  if (compressed && bufferWif[33] !== 1) return false;

  // it must have prefix version for private keys (0x80)
  if (bufferWif[0] !== 128) return false;

  return isChecksum(bufferWif);
}

/**
 * Function to format a number in a decimal point number
 * @example
 * ```js
 * const amount = formatUnits("123456", 8);
 * console.log(amount);
 * // '0.00123456'
 * ```
 */
export function formatUnits(
  value: string | number | bigint,
  decimals: number
): string {
  let v = typeof value === "string" ? value : BigInt(value).toString();
  const sign = v[0] === "-" ? "-" : "";
  v = v.replace("-", "").padStart(decimals + 1, "0");
  const integerPart = v
    .substring(0, v.length - decimals)
    .replace(/^0+(?=\d)/, "");
  const decimalPart = v.substring(v.length - decimals);
  return `${sign}${integerPart}.${decimalPart}`.replace(/(\.0+)?(0+)$/, "");
}

/**
 * Function to format a decimal point number in an integer
 * @example
 * ```js
 * const amount = parseUnits("0.00123456", 8);
 * console.log(amount);
 * // '123456'
 * ```
 */
export function parseUnits(value: string, decimals: number): string {
  const sign = value[0] === "-" ? "-" : "";
  // eslint-disable-next-line prefer-const
  let [integerPart, decimalPart] = value
    .replace("-", "")
    .replace(",", ".")
    .split(".");
  if (!decimalPart) decimalPart = "";
  decimalPart = decimalPart.padEnd(decimals, "0");
  return `${sign}${`${integerPart}${decimalPart}`.replace(/^0+(?=\d)/, "")}`;
}

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

export function btypeDecodeValue(
  valueEncoded: unknown,
  typeField: TypeField,
  verifyChecksum: boolean
): unknown {
  // No byte conversion
  if (typeField.type !== "bytes") return copyValue(valueEncoded);

  const value = valueEncoded as string;

  // Default byte conversion
  if (!typeField.btype) {
    return decodeBase64url(value);
  }

  // Specific byte conversion
  switch (typeField.btype) {
    case "BASE58":
      return decodeBase58(value);
    case "CONTRACT_ID":
    case "ADDRESS":
      const valueDecoded = decodeBase58(value);
      if (verifyChecksum && !isChecksumAddress(valueDecoded)) {
        throw new Error(`${value} is an invalid address`);
      }
      return valueDecoded;
    case "BASE64":
      return decodeBase64url(value);
    case "HEX":
    case "BLOCK_ID":
    case "TRANSACTION_ID":
      return toUint8Array(value.slice(2));
    default:
      throw new Error(`unknown btype ${typeField.btype}`);
  }
}

export function btypeEncodeValue(
  valueDecoded: unknown,
  typeField: TypeField,
  verifyChecksum: boolean
): unknown {
  // No byte conversion
  if (typeField.type !== "bytes") return copyValue(valueDecoded);

  const value = valueDecoded as Uint8Array;

  // Default byte conversion
  if (!typeField.btype) {
    return encodeBase64url(value);
  }

  // Specific byte conversion
  switch (typeField.btype) {
    case "BASE58":
      return encodeBase58(value);
    case "CONTRACT_ID":
    case "ADDRESS":
      const valueEncoded = encodeBase58(value);
      if (verifyChecksum && !isChecksumAddress(value)) {
        throw new Error(`${valueEncoded} is an invalid address`);
      }
      return valueEncoded;
    case "BASE64":
      return encodeBase64url(value);
    case "HEX":
    case "BLOCK_ID":
    case "TRANSACTION_ID":
      return `0x${toHexString(value)}`;
    default:
      throw new Error(`unknown btype ${typeField.btype}`);
  }
}

export function btypeDecode(
  valueEncoded: Record<string, unknown> | unknown[],
  fields: Record<string, TypeField>,
  verifyChecksum: boolean
) {
  if (typeof valueEncoded !== "object") return valueEncoded;
  const valueDecoded = {} as Record<string, unknown>;
  Object.keys(fields).forEach((name) => {
    if (!valueEncoded[name]) return;
    if (fields[name].rule === "repeated")
      valueDecoded[name] = (valueEncoded[name] as unknown[]).map(
        (itemEncoded) => {
          if (fields[name].subtypes)
            return btypeDecode(
              itemEncoded as Record<string, unknown>,
              fields[name].subtypes!,
              verifyChecksum
            );
          return btypeDecodeValue(itemEncoded, fields[name], verifyChecksum);
        }
      );
    else if (fields[name].subtypes)
      valueDecoded[name] = btypeDecode(
        valueEncoded[name] as Record<string, unknown>,
        fields[name].subtypes!,
        verifyChecksum
      );
    else
      valueDecoded[name] = btypeDecodeValue(
        valueEncoded[name],
        fields[name],
        verifyChecksum
      );
  });
  return valueDecoded;
}

export function btypeEncode(
  valueDecoded: Record<string, unknown> | unknown[],
  fields: Record<string, TypeField>,
  verifyChecksum: boolean
) {
  if (typeof valueDecoded !== "object") return valueDecoded;
  const valueEncoded = {} as Record<string, unknown>;
  Object.keys(fields).forEach((name) => {
    if (!valueDecoded[name]) return;
    if (fields[name].rule === "repeated")
      valueEncoded[name] = (valueDecoded[name] as unknown[]).map(
        (itemDecoded) => {
          if (fields[name].subtypes)
            return btypeEncode(
              itemDecoded as Record<string, unknown>,
              fields[name].subtypes!,
              verifyChecksum
            );
          return btypeEncodeValue(itemDecoded, fields[name], verifyChecksum);
        }
      );
    else if (fields[name].subtypes)
      valueEncoded[name] = btypeEncode(
        valueDecoded[name] as Record<string, unknown>,
        fields[name].subtypes!,
        verifyChecksum
      );
    else
      valueEncoded[name] = btypeEncodeValue(
        valueDecoded[name],
        fields[name],
        verifyChecksum
      );
  });
  return valueEncoded;
}

/**
 * ABI for tokens
 */
export const tokenAbi: Abi = {
  methods: {
    name: {
      entry_point: 0x82a3537f,
      argument: "name_arguments",
      return: "name_result",
      read_only: true,
    },
    symbol: {
      entry_point: 0xb76a7ca1,
      argument: "symbol_arguments",
      return: "symbol_result",
      read_only: true,
    },
    decimals: {
      entry_point: 0xee80fd2f,
      argument: "decimals_arguments",
      return: "decimals_result",
      read_only: true,
    },
    totalSupply: {
      entry_point: 0xb0da3934,
      argument: "total_supply_arguments",
      return: "total_supply_result",
      read_only: true,
    },
    balanceOf: {
      entry_point: 0x5c721497,
      argument: "balance_of_arguments",
      return: "balance_of_result",
      read_only: true,
      default_output: { value: "0" },
    },
    transfer: {
      entry_point: 0x27f576ca,
      argument: "transfer_arguments",
      return: "transfer_result",
    },
    mint: {
      entry_point: 0xdc6f17bb,
      argument: "mint_arguments",
      return: "mint_result",
    },
    burn: {
      entry_point: 0x859facc5,
      argument: "burn_arguments",
      return: "burn_result",
    },
  },
  koilib_types: tokenProtoJson,
};

//export const ProtocolTypes = protocolJson;
