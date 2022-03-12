import * as multibase from "multibase";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { Abi, TypeField } from "./interface";
import krc20ProtoJson from "./jsonDescriptors/krc20-proto.json";
//import protocolJson from "./jsonDescriptors/protocol-proto.json";

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

export function btypeDecodeValue(
  valueEncoded: unknown,
  typeField: TypeField
): unknown {
  // No byte conversion
  if (typeField.type !== "bytes") return valueEncoded;

  const value = valueEncoded as string;

  // Default byte conversion
  if (!typeField.btype) {
    return decodeBase64url(value);
  }

  // Specific byte conversion
  switch (typeField.btype) {
    case "BASE58":
    case "CONTRACT_ID":
    case "ADDRESS":
      return decodeBase58(value);
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
  typeField: TypeField
): unknown {
  // No byte conversion
  if (typeField.type !== "bytes") return valueDecoded;

  const value = valueDecoded as Uint8Array;

  // Default byte conversion
  if (!typeField.btype) {
    return encodeBase64url(value);
  }

  // Specific byte conversion
  switch (typeField.btype) {
    case "BASE58":
    case "CONTRACT_ID":
    case "ADDRESS":
      return encodeBase58(value);
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
  valueEncoded: Record<string, unknown>,
  fields: Record<string, TypeField>
) {
  if (typeof valueEncoded !== "object") return valueEncoded;
  const valueDecoded = {} as Record<string, unknown>;
  Object.keys(fields).forEach((name) => {
    if (!valueEncoded[name]) return;
    if (fields[name].subtypes)
      valueDecoded[name] = btypeDecode(
        valueEncoded[name] as Record<string, unknown>,
        fields[name].subtypes!
      );
    else
      valueDecoded[name] = btypeDecodeValue(valueEncoded[name], fields[name]);
  });
  return valueDecoded;
}

export function btypeEncode(
  valueDecoded: Record<string, unknown>,
  fields: Record<string, TypeField>
) {
  if (typeof valueDecoded !== "object") return valueDecoded;
  const valueEncoded = {} as Record<string, unknown>;
  Object.keys(fields).forEach((name) => {
    if (!valueDecoded[name]) return;
    if (fields[name].subtypes)
      valueEncoded[name] = btypeEncode(
        valueDecoded[name] as Record<string, unknown>,
        fields[name].subtypes!
      );
    valueEncoded[name] = btypeEncodeValue(valueDecoded[name], fields[name]);
  });
  return valueEncoded;
}

/**
 * ABI for tokens
 */
export const Krc20Abi: Abi = {
  methods: {
    name: {
      entryPoint: 0x82a3537f,
      input: "name_arguments",
      output: "name_result",
      readOnly: true,
    },
    symbol: {
      entryPoint: 0xb76a7ca1,
      input: "symbol_arguments",
      output: "symbol_result",
      readOnly: true,
    },
    decimals: {
      entryPoint: 0xee80fd2f,
      input: "decimals_arguments",
      output: "decimals_result",
      readOnly: true,
    },
    totalSupply: {
      entryPoint: 0xb0da3934,
      input: "total_supply_arguments",
      output: "total_supply_result",
      readOnly: true,
    },
    balanceOf: {
      entryPoint: 0x5c721497,
      input: "balance_of_arguments",
      output: "balance_of_result",
      readOnly: true,
      defaultOutput: { value: "0" },
    },
    transfer: {
      entryPoint: 0x27f576ca,
      input: "transfer_arguments",
      output: "transfer_result",
    },
    mint: {
      entryPoint: 0xdc6f17bb,
      input: "mint_arguments",
      output: "mint_result",
    },
  },
  types: krc20ProtoJson,
};

//export const ProtocolTypes = protocolJson;
