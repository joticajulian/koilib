/*! koilib - MIT License (c) Julian Gonzalez (joticajulian@gmail.com) */

import * as utils from "./utils";
import { Contract } from "./Contract";
import { Multihash } from "./Multihash";
import * as serializer from "./serializer";
import { VariableBlob } from "./VariableBlob";
import { Signer } from "./Signer";
import { Provider } from "./Provider";
import { Wallet } from "./Wallet";
import * as abi from "./abi";

declare const window: any;

window.utils = utils;
window.Contract = Contract;
window.Multihash = Multihash;
window.serializer = serializer;
window.Signer = Signer;
window.VariableBlob = VariableBlob;
window.Wallet = Wallet;
window.Provider = Provider;
window.abi = abi;
