import { Abi, deserialize, serialize } from "./serializer";
import VariableBlob from "./VariableBlob";

export interface Entries {
  [x: string]: {
    id: number;
    args: Abi;
  };
}

export interface EncodedOperation {
  contract_id: string;
  entry_point: number;
  args?: string;
}

export interface DecodedOperation {
  name: string;
  args: unknown;
}

export class Contract {
  id: string;

  entries: Entries;

  constructor(c: { id: string; entries: Entries }) {
    this.id = c.id;
    this.entries = c.entries;
  }

  encodeOperation(op: DecodedOperation): EncodedOperation {
    if (!this.entries || !this.entries[op.name])
      throw new Error(`Operation ${op.name} unknown`);
    const entry = this.entries[op.name];
    return {
      contract_id: this.id,
      entry_point: entry.id,
      ...(entry.args && {
        args: serialize(op.args, entry.args).toString(),
      }),
    };
  }

  decodeOperation(op: EncodedOperation): DecodedOperation {
    if (op.contract_id !== this.id)
      throw new Error(
        `Invalid contract id. Expected: ${this.id}. Received: ${op.contract_id}`
      );
    for (let opName in this.entries) {
      const entry = this.entries[opName];
      if (op.entry_point === entry.id) {
        const vb = new VariableBlob(op.args);
        return {
          name: opName,
          args: deserialize(vb, entry.args),
        };
      }
    }
    throw new Error(`Unknown entry id ${op.entry_point}`);
  }
}

export default Contract;
