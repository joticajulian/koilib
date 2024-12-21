import * as multibase from "multibase";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { Abi, TypeField } from "./interface";

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
  if (!decimals) return v;
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
  if (decimalPart.length > decimals) {
    // approximate
    const miniDecimals = decimalPart.substring(decimals);
    decimalPart = decimalPart.substring(0, decimals);
    if (miniDecimals.startsWith("5")) {
      decimalPart = (BigInt(decimalPart) + BigInt(1)).toString();
    }
  }
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
 *
 * @example
 * ```ts
 * import { Contract, Provider, utils } from "koilib";
 *
 * const provider = new Provider("https://api.koinos.io");
 * const koinContract = new Contract({
 *   id: "15DJN4a8SgrbGhhGksSBASiSYjGnMU8dGL",
 *   provider,
 *   abi: utils.tokenAbi,
 * });
 * ```
 */
export const tokenAbi: Abi = {
  methods: {
    name: {
      argument: "",
      return: "token.str",
      description: "Get name of the token",
      read_only: true,
      entry_point: 0x82a3537f,
    },
    symbol: {
      argument: "",
      return: "token.str",
      description: "Get the symbol of the token",
      read_only: true,
      entry_point: 0xb76a7ca1,
    },
    decimals: {
      argument: "",
      return: "token.uint32",
      description: "Get the decimals of the token",
      read_only: true,
      entry_point: 0xee80fd2f,
    },
    getInfo: {
      argument: "",
      return: "token.info",
      description: "Get name, symbol and decimals",
      read_only: true,
      entry_point: 0xbd7f6850,
    },
    totalSupply: {
      argument: "",
      return: "token.uint64",
      description: "Get total supply",
      read_only: true,
      entry_point: 0xb0da3934,
    },
    balanceOf: {
      argument: "token.balance_of_args",
      return: "token.uint64",
      description: "Get balance of an account",
      read_only: true,
      entry_point: 0x5c721497,
      default_output: { value: "0" },
    },
    allowance: {
      argument: "token.allowance_args",
      return: "token.uint64",
      description: "Get allowance",
      read_only: true,
      entry_point: 0x32f09fa1,
    },
    getAllowances: {
      argument: "token.get_allowances_args",
      return: "token.get_allowances_return",
      description: "Get allowances of an account",
      read_only: true,
      entry_point: 0x8fa16456,
    },
    approve: {
      argument: "token.approve_args",
      return: "",
      description:
        "Grant permissions to other account to manage the tokens owned by the user. The user must approve only the accounts he trust.",
      read_only: false,
      entry_point: 0x74e21680,
    },
    transfer: {
      argument: "token.transfer_args",
      return: "",
      description: "Transfer tokens",
      read_only: false,
      entry_point: 0x27f576ca,
    },
    mint: {
      argument: "token.mint_args",
      return: "",
      description: "Mint new tokens",
      read_only: false,
      entry_point: 0xdc6f17bb,
    },
    burn: {
      argument: "token.burn_args",
      return: "",
      description: "Burn tokens",
      read_only: false,
      entry_point: 0x859facc5,
    },
  },
  types:
    "CpoICiJrb2lub3MvY29udHJhY3RzL3Rva2VuL3Rva2VuLnByb3RvEhZrb2lub3MuY29udHJhY3RzLnRva2VuGhRrb2lub3Mvb3B0aW9ucy5wcm90byIQCg5uYW1lX2FyZ3VtZW50cyIjCgtuYW1lX3Jlc3VsdBIUCgV2YWx1ZRgBIAEoCVIFdmFsdWUiEgoQc3ltYm9sX2FyZ3VtZW50cyIlCg1zeW1ib2xfcmVzdWx0EhQKBXZhbHVlGAEgASgJUgV2YWx1ZSIUChJkZWNpbWFsc19hcmd1bWVudHMiJwoPZGVjaW1hbHNfcmVzdWx0EhQKBXZhbHVlGAEgASgNUgV2YWx1ZSIYChZ0b3RhbF9zdXBwbHlfYXJndW1lbnRzIi8KE3RvdGFsX3N1cHBseV9yZXN1bHQSGAoFdmFsdWUYASABKARCAjABUgV2YWx1ZSIyChRiYWxhbmNlX29mX2FyZ3VtZW50cxIaCgVvd25lchgBIAEoDEIEgLUYBlIFb3duZXIiLQoRYmFsYW5jZV9vZl9yZXN1bHQSGAoFdmFsdWUYASABKARCAjABUgV2YWx1ZSJeChJ0cmFuc2Zlcl9hcmd1bWVudHMSGAoEZnJvbRgBIAEoDEIEgLUYBlIEZnJvbRIUCgJ0bxgCIAEoDEIEgLUYBlICdG8SGAoFdmFsdWUYAyABKARCAjABUgV2YWx1ZSIRCg90cmFuc2Zlcl9yZXN1bHQiQAoObWludF9hcmd1bWVudHMSFAoCdG8YASABKAxCBIC1GAZSAnRvEhgKBXZhbHVlGAIgASgEQgIwAVIFdmFsdWUiDQoLbWludF9yZXN1bHQiRAoOYnVybl9hcmd1bWVudHMSGAoEZnJvbRgBIAEoDEIEgLUYBlIEZnJvbRIYCgV2YWx1ZRgCIAEoBEICMAFSBXZhbHVlIg0KC2J1cm5fcmVzdWx0IioKDmJhbGFuY2Vfb2JqZWN0EhgKBXZhbHVlGAEgASgEQgIwAVIFdmFsdWUiQAoKYnVybl9ldmVudBIYCgRmcm9tGAEgASgMQgSAtRgGUgRmcm9tEhgKBXZhbHVlGAIgASgEQgIwAVIFdmFsdWUiPAoKbWludF9ldmVudBIUCgJ0bxgBIAEoDEIEgLUYBlICdG8SGAoFdmFsdWUYAiABKARCAjABUgV2YWx1ZSJaCg50cmFuc2Zlcl9ldmVudBIYCgRmcm9tGAEgASgMQgSAtRgGUgRmcm9tEhQKAnRvGAIgASgMQgSAtRgGUgJ0bxIYCgV2YWx1ZRgDIAEoBEICMAFSBXZhbHVlQj5aPGdpdGh1Yi5jb20va29pbm9zL2tvaW5vcy1wcm90by1nb2xhbmcva29pbm9zL2NvbnRyYWN0cy90b2tlbmIGcHJvdG8zCvMKCgt0b2tlbi5wcm90bxIFdG9rZW4aFGtvaW5vcy9vcHRpb25zLnByb3RvIhsKA3N0chIUCgV2YWx1ZRgBIAEoCVIFdmFsdWUiHgoGdWludDMyEhQKBXZhbHVlGAEgASgNUgV2YWx1ZSIiCgZ1aW50NjQSGAoFdmFsdWUYASABKARCAjABUgV2YWx1ZSIdCgVib29sZRIUCgV2YWx1ZRgBIAEoCFIFdmFsdWUicAoEaW5mbxISCgRuYW1lGAEgASgJUgRuYW1lEhYKBnN5bWJvbBgCIAEoCVIGc3ltYm9sEhoKCGRlY2ltYWxzGAMgASgNUghkZWNpbWFscxIgCgtkZXNjcmlwdGlvbhgEIAEoCVILZGVzY3JpcHRpb24iLQoPYmFsYW5jZV9vZl9hcmdzEhoKBW93bmVyGAEgASgMQgSAtRgGUgVvd25lciJtCg10cmFuc2Zlcl9hcmdzEhgKBGZyb20YASABKAxCBIC1GAZSBGZyb20SFAoCdG8YAiABKAxCBIC1GAZSAnRvEhgKBXZhbHVlGAMgASgEQgIwAVIFdmFsdWUSEgoEbWVtbxgEIAEoCVIEbWVtbyI7CgltaW50X2FyZ3MSFAoCdG8YASABKAxCBIC1GAZSAnRvEhgKBXZhbHVlGAIgASgEQgIwAVIFdmFsdWUiPwoJYnVybl9hcmdzEhgKBGZyb20YASABKAxCBIC1GAZSBGZyb20SGAoFdmFsdWUYAiABKARCAjABUgV2YWx1ZSJkCgxhcHByb3ZlX2FyZ3MSGgoFb3duZXIYASABKAxCBIC1GAZSBW93bmVyEh4KB3NwZW5kZXIYAiABKAxCBIC1GAZSB3NwZW5kZXISGAoFdmFsdWUYAyABKARCAjABUgV2YWx1ZSJMCg5hbGxvd2FuY2VfYXJncxIaCgVvd25lchgBIAEoDEIEgLUYBlIFb3duZXISHgoHc3BlbmRlchgCIAEoDEIEgLUYBlIHc3BlbmRlciKDAQoTZ2V0X2FsbG93YW5jZXNfYXJncxIaCgVvd25lchgBIAEoDEIEgLUYBlIFb3duZXISGgoFc3RhcnQYAiABKAxCBIC1GAZSBXN0YXJ0EhQKBWxpbWl0GAMgASgFUgVsaW1pdBIeCgpkZXNjZW5kaW5nGAQgASgIUgpkZXNjZW5kaW5nIkkKDXNwZW5kZXJfdmFsdWUSHgoHc3BlbmRlchgBIAEoDEIEgLUYBlIHc3BlbmRlchIYCgV2YWx1ZRgCIAEoBEICMAFSBXZhbHVlImkKFWdldF9hbGxvd2FuY2VzX3JldHVybhIaCgVvd25lchgBIAEoDEIEgLUYBlIFb3duZXISNAoKYWxsb3dhbmNlcxgCIAMoCzIULnRva2VuLnNwZW5kZXJfdmFsdWVSCmFsbG93YW5jZXMiWgoOdHJhbnNmZXJfZXZlbnQSGAoEZnJvbRgBIAEoDEIEgLUYBlIEZnJvbRIUCgJ0bxgCIAEoDEIEgLUYBlICdG8SGAoFdmFsdWUYAyABKARCAjABUgV2YWx1ZSI8CgptaW50X2V2ZW50EhQKAnRvGAEgASgMQgSAtRgGUgJ0bxIYCgV2YWx1ZRgCIAEoBEICMAFSBXZhbHVlIkAKCmJ1cm5fZXZlbnQSGAoEZnJvbRgBIAEoDEIEgLUYBlIEZnJvbRIYCgV2YWx1ZRgCIAEoBEICMAFSBXZhbHVlImUKDWFwcHJvdmVfZXZlbnQSGgoFb3duZXIYASABKAxCBIC1GAZSBW93bmVyEh4KB3NwZW5kZXIYAiABKAxCBIC1GAZSB3NwZW5kZXISGAoFdmFsdWUYAyABKARCAjABUgV2YWx1ZWIGcHJvdG8z",
  koilib_types: {
    nested: {
      koinos: {
        options: {
          go_package: "github.com/koinos/koinos-proto-golang/koinos",
        },
        nested: {
          contracts: {
            nested: {
              token: {
                options: {
                  go_package:
                    "github.com/koinos/koinos-proto-golang/koinos/contracts/token",
                },
                nested: {
                  name_arguments: {
                    fields: {},
                  },
                  name_result: {
                    fields: {
                      value: {
                        type: "string",
                        id: 1,
                      },
                    },
                  },
                  symbol_arguments: {
                    fields: {},
                  },
                  symbol_result: {
                    fields: {
                      value: {
                        type: "string",
                        id: 1,
                      },
                    },
                  },
                  decimals_arguments: {
                    fields: {},
                  },
                  decimals_result: {
                    fields: {
                      value: {
                        type: "uint32",
                        id: 1,
                      },
                    },
                  },
                  total_supply_arguments: {
                    fields: {},
                  },
                  total_supply_result: {
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
                  balance_of_arguments: {
                    fields: {
                      owner: {
                        type: "bytes",
                        id: 1,
                        options: {
                          "(btype)": "ADDRESS",
                        },
                      },
                    },
                  },
                  balance_of_result: {
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
                  transfer_arguments: {
                    fields: {
                      from: {
                        type: "bytes",
                        id: 1,
                        options: {
                          "(btype)": "ADDRESS",
                        },
                      },
                      to: {
                        type: "bytes",
                        id: 2,
                        options: {
                          "(btype)": "ADDRESS",
                        },
                      },
                      value: {
                        type: "uint64",
                        id: 3,
                        options: {
                          jstype: "JS_STRING",
                        },
                      },
                    },
                  },
                  transfer_result: {
                    fields: {},
                  },
                  mint_arguments: {
                    fields: {
                      to: {
                        type: "bytes",
                        id: 1,
                        options: {
                          "(btype)": "ADDRESS",
                        },
                      },
                      value: {
                        type: "uint64",
                        id: 2,
                        options: {
                          jstype: "JS_STRING",
                        },
                      },
                    },
                  },
                  mint_result: {
                    fields: {},
                  },
                  burn_arguments: {
                    fields: {
                      from: {
                        type: "bytes",
                        id: 1,
                        options: {
                          "(btype)": "ADDRESS",
                        },
                      },
                      value: {
                        type: "uint64",
                        id: 2,
                        options: {
                          jstype: "JS_STRING",
                        },
                      },
                    },
                  },
                  burn_result: {
                    fields: {},
                  },
                  balance_object: {
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
                  burn_event: {
                    fields: {
                      from: {
                        type: "bytes",
                        id: 1,
                        options: {
                          "(btype)": "ADDRESS",
                        },
                      },
                      value: {
                        type: "uint64",
                        id: 2,
                        options: {
                          jstype: "JS_STRING",
                        },
                      },
                    },
                  },
                  mint_event: {
                    fields: {
                      to: {
                        type: "bytes",
                        id: 1,
                        options: {
                          "(btype)": "ADDRESS",
                        },
                      },
                      value: {
                        type: "uint64",
                        id: 2,
                        options: {
                          jstype: "JS_STRING",
                        },
                      },
                    },
                  },
                  transfer_event: {
                    fields: {
                      from: {
                        type: "bytes",
                        id: 1,
                        options: {
                          "(btype)": "ADDRESS",
                        },
                      },
                      to: {
                        type: "bytes",
                        id: 2,
                        options: {
                          "(btype)": "ADDRESS",
                        },
                      },
                      value: {
                        type: "uint64",
                        id: 3,
                        options: {
                          jstype: "JS_STRING",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
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
      token: {
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
              decimals: {
                type: "uint32",
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
              value: {
                type: "uint64",
                id: 3,
                options: {
                  jstype: "JS_STRING",
                },
              },
              memo: {
                type: "string",
                id: 4,
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
              value: {
                type: "uint64",
                id: 2,
                options: {
                  jstype: "JS_STRING",
                },
              },
            },
          },
          burn_args: {
            fields: {
              from: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              value: {
                type: "uint64",
                id: 2,
                options: {
                  jstype: "JS_STRING",
                },
              },
            },
          },
          approve_args: {
            fields: {
              owner: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              spender: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              value: {
                type: "uint64",
                id: 3,
                options: {
                  jstype: "JS_STRING",
                },
              },
            },
          },
          allowance_args: {
            fields: {
              owner: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              spender: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
            },
          },
          get_allowances_args: {
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
          spender_value: {
            fields: {
              spender: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              value: {
                type: "uint64",
                id: 2,
                options: {
                  jstype: "JS_STRING",
                },
              },
            },
          },
          get_allowances_return: {
            fields: {
              owner: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              allowances: {
                rule: "repeated",
                type: "spender_value",
                id: 2,
              },
            },
          },
          transfer_event: {
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
              value: {
                type: "uint64",
                id: 3,
                options: {
                  jstype: "JS_STRING",
                },
              },
            },
          },
          mint_event: {
            fields: {
              to: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              value: {
                type: "uint64",
                id: 2,
                options: {
                  jstype: "JS_STRING",
                },
              },
            },
          },
          burn_event: {
            fields: {
              from: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              value: {
                type: "uint64",
                id: 2,
                options: {
                  jstype: "JS_STRING",
                },
              },
            },
          },
          approve_event: {
            fields: {
              owner: {
                type: "bytes",
                id: 1,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              spender: {
                type: "bytes",
                id: 2,
                options: {
                  "(koinos.btype)": "ADDRESS",
                },
              },
              value: {
                type: "uint64",
                id: 3,
                options: {
                  jstype: "JS_STRING",
                },
              },
            },
          },
        },
      },
    },
  },
  events: {
    "token.mint_event": {
      argument: "token.mint_args",
      type: "token.mint_args",
    },
    "token.transfer_event": {
      argument: "token.transfer_args",
      type: "token.transfer_args",
    },
    "token.burn_event": {
      argument: "token.burn_args",
      type: "token.burn_args",
    },
  },
};

/**
 * ABI for NFTs
 *
 * @example
 * ```ts
 * import { Contract, Provider, utils } from "koilib";
 *
 * const provider = new Provider("https://api.koinos.io");
 * const nicknamesContract = new Contract({
 *   id: "1KD9Es7LBBjA1FY3ViCgQJ7e6WH1ipKbhz",
 *   provider,
 *   abi: utils.nftAbi,
 * });
 * const nicknames = nicknamesContract.functions;
 *
 * ...
 *
 * // get the address linked to the nickname "pob"
 * const pobId = `0x${utils.toHexString(new TextEncoder().encode("pob"))}`;
 * const { result } = await nicknames.ownerOf({ token_id: pobId });
 * console.log(result);
 *
 * // { value: '159myq5YUhhoVWu3wsHKHiJYKPKGUrGiyv' }
 })();
 * ```
 */
export const nftAbi: Abi = {
  methods: {
    name: {
      argument: "",
      return: "common.str",
      description: "Get name of the NFT",
      read_only: true,
      entry_point: 0x82a3537f,
    },
    symbol: {
      argument: "",
      return: "common.str",
      description: "Get the symbol of the NFT",
      read_only: true,
      entry_point: 0xb76a7ca1,
    },
    uri: {
      argument: "",
      return: "common.str",
      description: "Get URI of the NFT",
      read_only: true,
      entry_point: 0x70e5d7b6,
    },
    getInfo: {
      argument: "",
      return: "nft.info",
      description: "Get name, symbol and decimals",
      read_only: true,
      entry_point: 0xbd7f6850,
    },
    owner: {
      argument: "",
      return: "common.address",
      description: "Get the owner of the collection",
      read_only: true,
      entry_point: 0x4c102969,
    },
    totalSupply: {
      argument: "",
      return: "common.uint64",
      description: "Get total supply",
      read_only: true,
      entry_point: 0xb0da3934,
    },
    royalties: {
      argument: "",
      return: "nft.royalties",
      description: "Get royalties",
      read_only: true,
      entry_point: 0x36e90cd0,
    },
    balanceOf: {
      argument: "nft.balance_of_args",
      return: "common.uint64",
      description: "Get balance of an account",
      read_only: true,
      entry_point: 0x5c721497,
      default_output: { value: "0" },
    },
    ownerOf: {
      argument: "nft.token",
      return: "common.address",
      description: "Get the owner of a token",
      read_only: true,
      entry_point: 0xed61c847,
    },
    metadataOf: {
      argument: "nft.token",
      return: "common.str",
      description: "Get the metadata of a token",
      read_only: true,
      entry_point: 0x176c8f7f,
    },
    getTokens: {
      argument: "nft.get_tokens_args",
      return: "nft.token_ids",
      description: "Get list of token IDs",
      read_only: true,
      entry_point: 0x7d5b5ed7,
    },
    getTokensByOwner: {
      argument: "nft.get_tokens_by_owner_args",
      return: "nft.token_ids",
      description: "Get tokens owned by an address",
      read_only: true,
      entry_point: 0xfc13eb75,
    },
    getApproved: {
      argument: "nft.token",
      return: "common.address",
      description: "Check if an account is approved to operate a token ID",
      read_only: true,
      entry_point: 0x4c731020,
    },
    isApprovedForAll: {
      argument: "nft.is_approved_for_all_args",
      return: "common.boole",
      description:
        "Check if an account is approved to operate all tokens owned by other account",
      read_only: true,
      entry_point: 0xe7ab8ce5,
    },
    getOperatorApprovals: {
      argument: "nft.get_operators_args",
      return: "nft.get_operators_return",
      description: "Get allowances of an account",
      read_only: true,
      entry_point: 0xdb1bf60e,
    },
    transferOwnership: {
      argument: "common.address",
      return: "",
      description: "Transfer ownership of the collection",
      read_only: false,
      entry_point: 0x394be702,
    },
    setRoyalties: {
      argument: "nft.royalties",
      return: "",
      description: "Set royalties",
      read_only: false,
      entry_point: 0x3b5bb56b,
    },
    setMetadata: {
      argument: "nft.metadata_args",
      return: "",
      description: "Set metadata",
      read_only: false,
      entry_point: 0x3d59af19,
    },
    approve: {
      argument: "nft.approve_args",
      return: "",
      description:
        "Grant permissions to other account to manage a specific Token owned by the user. The user must approve only the accounts he trust.",
      read_only: false,
      entry_point: 0x74e21680,
    },
    setApprovalForAll: {
      argument: "nft.set_approval_for_all_args",
      return: "",
      description:
        "Grant permissions to other account to manage all Tokens owned by the user. The user must approve only the accounts he trust.",
      read_only: false,
      entry_point: 0x20442216,
    },
    transfer: {
      argument: "nft.transfer_args",
      return: "",
      description: "Transfer NFT",
      read_only: false,
      entry_point: 0x27f576ca,
    },
    mint: {
      argument: "nft.mint_args",
      return: "",
      description: "Mint NFT",
      read_only: false,
      entry_point: 0xdc6f17bb,
    },
    burn: {
      argument: "nft.burn_args",
      return: "",
      description: "Burn NFT",
      read_only: false,
      entry_point: 0x859facc5,
    },
  },
  types:
    "CoQDCidrb2lub3Nib3gtcHJvdG8vbWFuYXNoYXJlci9jb21tb24ucHJvdG8SBmNvbW1vbhoUa29pbm9zL29wdGlvbnMucHJvdG8iGwoDc3RyEhQKBXZhbHVlGAEgASgJUgV2YWx1ZSIeCgZ1aW50MzISFAoFdmFsdWUYASABKA1SBXZhbHVlIiIKBnVpbnQ2NBIYCgV2YWx1ZRgBIAEoBEICMAFSBXZhbHVlIh0KBWJvb2xlEhQKBXZhbHVlGAEgASgIUgV2YWx1ZSIlCgdhZGRyZXNzEhoKBXZhbHVlGAEgASgMQgSAtRgGUgV2YWx1ZSJdCglsaXN0X2FyZ3MSGgoFc3RhcnQYASABKAxCBIC1GAZSBXN0YXJ0EhQKBWxpbWl0GAIgASgFUgVsaW1pdBIeCgpkZXNjZW5kaW5nGAMgASgIUgpkZXNjZW5kaW5nIi0KCWFkZHJlc3NlcxIgCghhY2NvdW50cxgBIAMoDEIEgLUYBlIIYWNjb3VudHNiBnByb3RvMwqQDAoJbmZ0LnByb3RvEgNuZnQaFGtvaW5vcy9vcHRpb25zLnByb3RvIk0KB3JveWFsdHkSIgoKcGVyY2VudGFnZRgBIAEoBEICMAFSCnBlcmNlbnRhZ2USHgoHYWRkcmVzcxgCIAEoDEIEgLUYBlIHYWRkcmVzcyIvCglyb3lhbHRpZXMSIgoFdmFsdWUYASADKAsyDC5uZnQucm95YWx0eVIFdmFsdWUiTAoNbWV0YWRhdGFfYXJncxIfCgh0b2tlbl9pZBgBIAEoDEIEgLUYAlIHdG9rZW5JZBIaCghtZXRhZGF0YRgCIAEoCVIIbWV0YWRhdGEiZgoEaW5mbxISCgRuYW1lGAEgASgJUgRuYW1lEhYKBnN5bWJvbBgCIAEoCVIGc3ltYm9sEhAKA3VyaRgDIAEoCVIDdXJpEiAKC2Rlc2NyaXB0aW9uGAQgASgJUgtkZXNjcmlwdGlvbiItCg9iYWxhbmNlX29mX2FyZ3MSGgoFb3duZXIYASABKAxCBIC1GAZSBW93bmVyIigKBXRva2VuEh8KCHRva2VuX2lkGAEgASgMQgSAtRgCUgd0b2tlbklkIlgKGGlzX2FwcHJvdmVkX2Zvcl9hbGxfYXJncxIaCgVvd25lchgBIAEoDEIEgLUYBlIFb3duZXISIAoIb3BlcmF0b3IYAiABKAxCBIC1GAZSCG9wZXJhdG9yIkIKCW1pbnRfYXJncxIUCgJ0bxgBIAEoDEIEgLUYBlICdG8SHwoIdG9rZW5faWQYAiABKAxCBIC1GAJSB3Rva2VuSWQiLAoJYnVybl9hcmdzEh8KCHRva2VuX2lkGAEgASgMQgSAtRgCUgd0b2tlbklkInQKDXRyYW5zZmVyX2FyZ3MSGAoEZnJvbRgBIAEoDEIEgLUYBlIEZnJvbRIUCgJ0bxgCIAEoDEIEgLUYBlICdG8SHwoIdG9rZW5faWQYAyABKAxCBIC1GAJSB3Rva2VuSWQSEgoEbWVtbxgEIAEoCVIEbWVtbyJ2CgxhcHByb3ZlX2FyZ3MSLwoQYXBwcm92ZXJfYWRkcmVzcxgBIAEoDEIEgLUYBlIPYXBwcm92ZXJBZGRyZXNzEhQKAnRvGAIgASgMQgSAtRgGUgJ0bxIfCgh0b2tlbl9pZBgDIAEoDEIEgLUYAlIHdG9rZW5JZCKZAQoZc2V0X2FwcHJvdmFsX2Zvcl9hbGxfYXJncxIvChBhcHByb3Zlcl9hZGRyZXNzGAEgASgMQgSAtRgGUg9hcHByb3ZlckFkZHJlc3MSLwoQb3BlcmF0b3JfYWRkcmVzcxgCIAEoDEIEgLUYBlIPb3BlcmF0b3JBZGRyZXNzEhoKCGFwcHJvdmVkGAMgASgIUghhcHByb3ZlZCKCAQoSZ2V0X29wZXJhdG9yc19hcmdzEhoKBW93bmVyGAEgASgMQgSAtRgGUgVvd25lchIaCgVzdGFydBgCIAEoDEIEgLUYBlIFc3RhcnQSFAoFbGltaXQYAyABKAVSBWxpbWl0Eh4KCmRlc2NlbmRpbmcYBCABKAhSCmRlc2NlbmRpbmciVgoUZ2V0X29wZXJhdG9yc19yZXR1cm4SGgoFb3duZXIYASABKAxCBIC1GAZSBW93bmVyEiIKCW9wZXJhdG9ycxgCIAMoDEIEgLUYBlIJb3BlcmF0b3JzImMKD2dldF90b2tlbnNfYXJncxIaCgVzdGFydBgBIAEoDEIEgLUYAlIFc3RhcnQSFAoFbGltaXQYAiABKAVSBWxpbWl0Eh4KCmRlc2NlbmRpbmcYAyABKAhSCmRlc2NlbmRpbmciiAEKGGdldF90b2tlbnNfYnlfb3duZXJfYXJncxIaCgVvd25lchgBIAEoDEIEgLUYBlIFb3duZXISGgoFc3RhcnQYAiABKAxCBIC1GAJSBXN0YXJ0EhQKBWxpbWl0GAMgASgFUgVsaW1pdBIeCgpkZXNjZW5kaW5nGAQgASgIUgpkZXNjZW5kaW5nIi4KCXRva2VuX2lkcxIhCgl0b2tlbl9pZHMYASADKAxCBIC1GAJSCHRva2VuSWRzYgZwcm90bzM=",
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
    },
  },
  events: {
    "collections.owner_event": {
      argument: "common.address",
      type: "common.address",
    },
    "collections.royalties_event": {
      argument: "nft.royalties",
      type: "nft.royalties",
    },
    "collections.set_metadata_event": {
      argument: "nft.metadata_args",
      type: "nft.metadata_args",
    },
    "collections.token_approval_event": {
      argument: "nft.approve_args",
      type: "nft.approve_args",
    },
    "collections.operator_approval_event": {
      argument: "nft.set_approval_for_all_args",
      type: "nft.set_approval_for_all_args",
    },
    "collections.transfer_event": {
      argument: "nft.transfer_args",
      type: "nft.transfer_args",
    },
    "collections.mint_event": {
      argument: "nft.mint_args",
      type: "nft.mint_args",
    },
    "collections.burn_event": {
      argument: "nft.burn_args",
      type: "nft.burn_args",
    },
  },
};

//export const ProtocolTypes = protocolJson;
