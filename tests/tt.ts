// import { /* bitcoinEncode, */ bitcoinDecode, toHexString } from "../src/utils";
import { Signer } from "../src/Signer";
/* import { Contract } from "../src/Contract";
import { Wallet } from "../src/Wallet";
import { Provider } from "../src/Provider"; */

const w = Signer.fromSeed("julian gonzalez carro caballo");
console.log(w.address);
console.log(w.getPrivateKey());
console.log(w.getPrivateKey("wif"));
