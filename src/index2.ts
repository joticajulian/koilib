/*! koilib - MIT License (c) Julian Gonzalez (joticajulian@gmail.com) */

import * as utils from "./utils";
import { Contract } from "./Contract";
import { Signer } from "./Signer";
import { Provider } from "./Provider";
import { Transaction } from "./Transaction";
import { Serializer } from "./Serializer";

declare const window: { [x: string]: unknown };

window.utils = utils;
window.Contract = Contract;
window.Signer = Signer;
window.Provider = Provider;
window.Transaction = Transaction;
window.Serializer = Serializer;
