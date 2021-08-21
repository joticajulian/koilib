import VariableBlob from "./VariableBlob";

/**
 * Multihash class
 */
export class Multihash {
  /**
   * Hash ID
   *
   * Identifier of the hash function. See the
   * complete [list of IDs in this link](https://github.com/multiformats/js-multihash/blob/master/src/constants.js)
   */
  id: number;

  /**
   * Digest
   */
  digest: Uint8Array;

  /**
   *
   * @param digest - digest
   * @param id - hash id. By default it uses 0x12 which corresponds with sha2-256
   *
   * @example
   * ```ts
   * const buffer = new Uint8Array(32);
   * const multihash = new Multihash(buffer);
   * ```
   */
  constructor(digest: Uint8Array, id = 0x12) {
    this.id = id;
    this.digest = digest;
  }

  /**
   * @returns Encodes the multihash in base58
   */
  toString(): string {
    const vb = new VariableBlob();
    vb.serializeVarint(this.id);
    vb.serializeBuffer(this.digest);
    return vb.toString("z");
  }
}

export default Multihash;
