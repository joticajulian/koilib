import * as utils from "./utils";
import { Contract } from "./Contract";
import { Multihash } from "./Multihash";
import { serialize, deserialize } from "./serializer";
import { VariableBlob } from "./VariableBlob";
import { Wallet } from "./Wallet";
import * as abi from "./abi";

declare const window: any;

window.utils = utils;
window.Contract = Contract;
window.Multihash = Multihash;
window.serialize = serialize;
window.deserialize = deserialize;
window.Wallet = Wallet;
window.VariableBlob = VariableBlob;
window.abi = abi;
