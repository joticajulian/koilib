import VariableBlob from "./variableblob";

export class Multihash {
  id: number;

  digest: Uint8Array;
  constructor(digest: Uint8Array, id = 0x12) {
    this.id = id;
    this.digest = digest;
  }
  toString(): string {
    const vb = new VariableBlob();
    vb.serializeVarint(this.id);
    vb.serializeBuffer(this.digest);
    return vb.toString("z");
  }
}

export default Multihash;
