/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 8820:
/***/ ((module) => {

"use strict";

// base-x encoding / decoding
// Copyright (c) 2018 base-x contributors
// Copyright (c) 2014-2018 The Bitcoin Core developers (base58.cpp)
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
function base (ALPHABET) {
  if (ALPHABET.length >= 255) { throw new TypeError('Alphabet too long') }
  var BASE_MAP = new Uint8Array(256)
  for (var j = 0; j < BASE_MAP.length; j++) {
    BASE_MAP[j] = 255
  }
  for (var i = 0; i < ALPHABET.length; i++) {
    var x = ALPHABET.charAt(i)
    var xc = x.charCodeAt(0)
    if (BASE_MAP[xc] !== 255) { throw new TypeError(x + ' is ambiguous') }
    BASE_MAP[xc] = i
  }
  var BASE = ALPHABET.length
  var LEADER = ALPHABET.charAt(0)
  var FACTOR = Math.log(BASE) / Math.log(256) // log(BASE) / log(256), rounded up
  var iFACTOR = Math.log(256) / Math.log(BASE) // log(256) / log(BASE), rounded up
  function encode (source) {
    if (source instanceof Uint8Array) {
    } else if (ArrayBuffer.isView(source)) {
      source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
    } else if (Array.isArray(source)) {
      source = Uint8Array.from(source)
    }
    if (!(source instanceof Uint8Array)) { throw new TypeError('Expected Uint8Array') }
    if (source.length === 0) { return '' }
        // Skip & count leading zeroes.
    var zeroes = 0
    var length = 0
    var pbegin = 0
    var pend = source.length
    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++
      zeroes++
    }
        // Allocate enough space in big-endian base58 representation.
    var size = ((pend - pbegin) * iFACTOR + 1) >>> 0
    var b58 = new Uint8Array(size)
        // Process the bytes.
    while (pbegin !== pend) {
      var carry = source[pbegin]
            // Apply "b58 = b58 * 256 + ch".
      var i = 0
      for (var it1 = size - 1; (carry !== 0 || i < length) && (it1 !== -1); it1--, i++) {
        carry += (256 * b58[it1]) >>> 0
        b58[it1] = (carry % BASE) >>> 0
        carry = (carry / BASE) >>> 0
      }
      if (carry !== 0) { throw new Error('Non-zero carry') }
      length = i
      pbegin++
    }
        // Skip leading zeroes in base58 result.
    var it2 = size - length
    while (it2 !== size && b58[it2] === 0) {
      it2++
    }
        // Translate the result into a string.
    var str = LEADER.repeat(zeroes)
    for (; it2 < size; ++it2) { str += ALPHABET.charAt(b58[it2]) }
    return str
  }
  function decodeUnsafe (source) {
    if (typeof source !== 'string') { throw new TypeError('Expected String') }
    if (source.length === 0) { return new Uint8Array() }
    var psz = 0
        // Skip leading spaces.
    if (source[psz] === ' ') { return }
        // Skip and count leading '1's.
    var zeroes = 0
    var length = 0
    while (source[psz] === LEADER) {
      zeroes++
      psz++
    }
        // Allocate enough space in big-endian base256 representation.
    var size = (((source.length - psz) * FACTOR) + 1) >>> 0 // log(58) / log(256), rounded up.
    var b256 = new Uint8Array(size)
        // Process the characters.
    while (source[psz]) {
            // Decode character
      var carry = BASE_MAP[source.charCodeAt(psz)]
            // Invalid character
      if (carry === 255) { return }
      var i = 0
      for (var it3 = size - 1; (carry !== 0 || i < length) && (it3 !== -1); it3--, i++) {
        carry += (BASE * b256[it3]) >>> 0
        b256[it3] = (carry % 256) >>> 0
        carry = (carry / 256) >>> 0
      }
      if (carry !== 0) { throw new Error('Non-zero carry') }
      length = i
      psz++
    }
        // Skip trailing spaces.
    if (source[psz] === ' ') { return }
        // Skip leading zeroes in b256.
    var it4 = size - length
    while (it4 !== size && b256[it4] === 0) {
      it4++
    }
    var vch = new Uint8Array(zeroes + (size - it4))
    var j = zeroes
    while (it4 !== size) {
      vch[j++] = b256[it4++]
    }
    return vch
  }
  function decode (string) {
    var buffer = decodeUnsafe(string)
    if (buffer) { return buffer }
    throw new Error('Non-base' + BASE + ' character')
  }
  return {
    encode: encode,
    decodeUnsafe: decodeUnsafe,
    decode: decode
  }
}
module.exports = base


/***/ }),

/***/ 7505:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SHA2 = void 0;
const utils_js_1 = __webpack_require__(8089);
// Polyfill for Safari 14
function setBigUint64(view, byteOffset, value, isLE) {
    if (typeof view.setBigUint64 === 'function')
        return view.setBigUint64(byteOffset, value, isLE);
    const _32n = BigInt(32);
    const _u32_max = BigInt(0xffffffff);
    const wh = Number((value >> _32n) & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE ? 4 : 0;
    const l = isLE ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE);
    view.setUint32(byteOffset + l, wl, isLE);
}
// Base SHA2 class (RFC 6234)
class SHA2 extends utils_js_1.Hash {
    constructor(blockLen, outputLen, padOffset, isLE) {
        super();
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE;
        this.finished = false;
        this.length = 0;
        this.pos = 0;
        this.destroyed = false;
        this.buffer = new Uint8Array(blockLen);
        this.view = (0, utils_js_1.createView)(this.buffer);
    }
    update(data) {
        if (this.destroyed)
            throw new Error('instance is destroyed');
        const { view, buffer, blockLen, finished } = this;
        if (finished)
            throw new Error('digest() was already called');
        data = (0, utils_js_1.toBytes)(data);
        const len = data.length;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            // Fast path: we have at least one block in input, cast it to view and process
            if (take === blockLen) {
                const dataView = (0, utils_js_1.createView)(data);
                for (; blockLen <= len - pos; pos += blockLen)
                    this.process(dataView, pos);
                continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
                this.process(view, 0);
                this.pos = 0;
            }
        }
        this.length += data.length;
        this.roundClean();
        return this;
    }
    digestInto(out) {
        if (this.destroyed)
            throw new Error('instance is destroyed');
        if (!(out instanceof Uint8Array) || out.length < this.outputLen)
            throw new Error('_Sha2: Invalid output buffer');
        if (this.finished)
            throw new Error('digest() was already called');
        this.finished = true;
        // Padding
        // We can avoid allocation of buffer for padding completely if it
        // was previously not allocated here. But it won't change performance.
        const { buffer, view, blockLen, isLE } = this;
        let { pos } = this;
        // append the bit '1' to the message
        buffer[pos++] = 0b10000000;
        this.buffer.subarray(pos).fill(0);
        // we have less than padOffset left in buffer, so we cannot put length in current block, need process it and pad again
        if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
        }
        // Pad until full block byte with zeros
        for (let i = pos; i < blockLen; i++)
            buffer[i] = 0;
        // NOTE: sha512 requires length to be 128bit integer, but length in JS will overflow before that
        // You need to write around 2 exabytes (u64_max / 8 / (1024**6)) for this to happen.
        // So we just write lowest 64bit of that value.
        setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
        this.process(view, 0);
        const oview = (0, utils_js_1.createView)(out);
        this.get().forEach((v, i) => oview.setUint32(4 * i, v, isLE));
    }
    digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
    }
    _cloneInto(to) {
        to || (to = new this.constructor());
        to.set(...this.get());
        const { blockLen, buffer, length, finished, destroyed, pos } = this;
        to.length = length;
        to.pos = pos;
        to.finished = finished;
        to.destroyed = destroyed;
        if (length % blockLen)
            to.buffer.set(buffer);
        return to;
    }
}
exports.SHA2 = SHA2;


/***/ }),

/***/ 4421:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.crypto = void 0;
exports.crypto = {
    node: undefined,
    web: typeof self === 'object' && 'crypto' in self ? self.crypto : undefined,
};


/***/ }),

/***/ 830:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ripemd160 = exports.RIPEMD160 = void 0;
const _sha2_js_1 = __webpack_require__(7505);
const utils_js_1 = __webpack_require__(8089);
// https://homes.esat.kuleuven.be/~bosselae/ripemd160.html
// https://homes.esat.kuleuven.be/~bosselae/ripemd160/pdf/AB-9601/AB-9601.pdf
const Rho = new Uint8Array([7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8]);
const Id = Uint8Array.from({ length: 16 }, (_, i) => i);
const Pi = Id.map((i) => (9 * i + 5) % 16);
let idxL = [Id];
let idxR = [Pi];
for (let i = 0; i < 4; i++)
    for (let j of [idxL, idxR])
        j.push(j[i].map((k) => Rho[k]));
const shifts = [
    [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
    [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
    [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
    [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
    [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5],
].map((i) => new Uint8Array(i));
const shiftsL = idxL.map((idx, i) => idx.map((j) => shifts[i][j]));
const shiftsR = idxR.map((idx, i) => idx.map((j) => shifts[i][j]));
const Kl = new Uint32Array([0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e]);
const Kr = new Uint32Array([0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000]);
// The rotate left (circular left shift) operation for uint32
const rotl = (word, shift) => (word << shift) | (word >>> (32 - shift));
// It's called f() in spec.
function f(group, x, y, z) {
    if (group === 0)
        return x ^ y ^ z;
    else if (group === 1)
        return (x & y) | (~x & z);
    else if (group === 2)
        return (x | ~y) ^ z;
    else if (group === 3)
        return (x & z) | (y & ~z);
    else
        return x ^ (y | ~z);
}
// Temporary buffer, not used to store anything between runs
const BUF = new Uint32Array(16);
class RIPEMD160 extends _sha2_js_1.SHA2 {
    constructor() {
        super(64, 20, 8, true);
        this.h0 = 0x67452301 | 0;
        this.h1 = 0xefcdab89 | 0;
        this.h2 = 0x98badcfe | 0;
        this.h3 = 0x10325476 | 0;
        this.h4 = 0xc3d2e1f0 | 0;
    }
    get() {
        const { h0, h1, h2, h3, h4 } = this;
        return [h0, h1, h2, h3, h4];
    }
    set(h0, h1, h2, h3, h4) {
        this.h0 = h0 | 0;
        this.h1 = h1 | 0;
        this.h2 = h2 | 0;
        this.h3 = h3 | 0;
        this.h4 = h4 | 0;
    }
    process(view, offset) {
        for (let i = 0; i < 16; i++, offset += 4)
            BUF[i] = view.getUint32(offset, true);
        // prettier-ignore
        let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
        // Instead of iterating 0 to 80, we split it into 5 groups
        // And use the groups in constants, functions, etc. Much simpler
        for (let group = 0; group < 5; group++) {
            const rGroup = 4 - group;
            const hbl = Kl[group], hbr = Kr[group]; // prettier-ignore
            const rl = idxL[group], rr = idxR[group]; // prettier-ignore
            const sl = shiftsL[group], sr = shiftsR[group]; // prettier-ignore
            for (let i = 0; i < 16; i++) {
                const tl = (rotl(al + f(group, bl, cl, dl) + BUF[rl[i]] + hbl, sl[i]) + el) | 0;
                al = el, el = dl, dl = rotl(cl, 10) | 0, cl = bl, bl = tl; // prettier-ignore
            }
            // 2 loops are 10% faster
            for (let i = 0; i < 16; i++) {
                const tr = (rotl(ar + f(rGroup, br, cr, dr) + BUF[rr[i]] + hbr, sr[i]) + er) | 0;
                ar = er, er = dr, dr = rotl(cr, 10) | 0, cr = br, br = tr; // prettier-ignore
            }
        }
        // Add the compressed chunk to the current hash value
        this.set((this.h1 + cl + dr) | 0, (this.h2 + dl + er) | 0, (this.h3 + el + ar) | 0, (this.h4 + al + br) | 0, (this.h0 + bl + cr) | 0);
    }
    roundClean() {
        BUF.fill(0);
    }
    destroy() {
        this.destroyed = true;
        this.buffer.fill(0);
        this.set(0, 0, 0, 0, 0);
    }
}
exports.RIPEMD160 = RIPEMD160;
/**
 * RIPEMD-160 - a hash function from 1990s.
 * @param message - msg that would be hashed
 */
exports.ripemd160 = (0, utils_js_1.wrapConstructor)(() => new RIPEMD160());


/***/ }),

/***/ 3061:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sha256 = void 0;
const _sha2_js_1 = __webpack_require__(7505);
const utils_js_1 = __webpack_require__(8089);
// Choice: a ? b : c
const Chi = (a, b, c) => (a & b) ^ (~a & c);
// Majority function, true if any two inpust is true
const Maj = (a, b, c) => (a & b) ^ (a & c) ^ (b & c);
// Round constants:
// first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
// prettier-ignore
const SHA256_K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
// Initial state (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19):
// prettier-ignore
const IV = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
]);
// Temporary buffer, not used to store anything between runs
// Named this way because it matches specification.
const SHA256_W = new Uint32Array(64);
class SHA256 extends _sha2_js_1.SHA2 {
    constructor() {
        super(64, 32, 8, false);
        // We cannot use array here since array allows indexing by variable
        // which means optimizer/compiler cannot use registers.
        this.A = IV[0] | 0;
        this.B = IV[1] | 0;
        this.C = IV[2] | 0;
        this.D = IV[3] | 0;
        this.E = IV[4] | 0;
        this.F = IV[5] | 0;
        this.G = IV[6] | 0;
        this.H = IV[7] | 0;
    }
    get() {
        const { A, B, C, D, E, F, G, H } = this;
        return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4)
            SHA256_W[i] = view.getUint32(offset, false);
        for (let i = 16; i < 64; i++) {
            const W15 = SHA256_W[i - 15];
            const W2 = SHA256_W[i - 2];
            const s0 = (0, utils_js_1.rotr)(W15, 7) ^ (0, utils_js_1.rotr)(W15, 18) ^ (W15 >>> 3);
            const s1 = (0, utils_js_1.rotr)(W2, 17) ^ (0, utils_js_1.rotr)(W2, 19) ^ (W2 >>> 10);
            SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
        }
        // Compression function main loop, 64 rounds
        let { A, B, C, D, E, F, G, H } = this;
        for (let i = 0; i < 64; i++) {
            const sigma1 = (0, utils_js_1.rotr)(E, 6) ^ (0, utils_js_1.rotr)(E, 11) ^ (0, utils_js_1.rotr)(E, 25);
            const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const sigma0 = (0, utils_js_1.rotr)(A, 2) ^ (0, utils_js_1.rotr)(A, 13) ^ (0, utils_js_1.rotr)(A, 22);
            const T2 = (sigma0 + Maj(A, B, C)) | 0;
            H = G;
            G = F;
            F = E;
            E = (D + T1) | 0;
            D = C;
            C = B;
            B = A;
            A = (T1 + T2) | 0;
        }
        // Add the compressed chunk to the current hash value
        A = (A + this.A) | 0;
        B = (B + this.B) | 0;
        C = (C + this.C) | 0;
        D = (D + this.D) | 0;
        E = (E + this.E) | 0;
        F = (F + this.F) | 0;
        G = (G + this.G) | 0;
        H = (H + this.H) | 0;
        this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
        SHA256_W.fill(0);
    }
    destroy() {
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        this.buffer.fill(0);
    }
}
/**
 * SHA2-256 hash function
 * @param message - data that would be hashed
 */
exports.sha256 = (0, utils_js_1.wrapConstructor)(() => new SHA256());


/***/ }),

/***/ 8089:
/***/ ((module, exports, __webpack_require__) => {

"use strict";
/* module decorator */ module = __webpack_require__.nmd(module);

/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.randomBytes = exports.wrapConstructorWithOpts = exports.wrapConstructor = exports.checkOpts = exports.Hash = exports.assertHash = exports.assertBytes = exports.assertBool = exports.assertNumber = exports.concatBytes = exports.toBytes = exports.utf8ToBytes = exports.asyncLoop = exports.nextTick = exports.hexToBytes = exports.bytesToHex = exports.isLE = exports.rotr = exports.createView = exports.u32 = exports.u8 = void 0;
// The import here is via the package name. This is to ensure
// that exports mapping/resolution does fall into place.
const crypto_1 = __webpack_require__(4421);
// Cast array to different type
const u8 = (arr) => new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
exports.u8 = u8;
const u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
exports.u32 = u32;
// Cast array to view
const createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
exports.createView = createView;
// The rotate right (circular right shift) operation for uint32
const rotr = (word, shift) => (word << (32 - shift)) | (word >>> shift);
exports.rotr = rotr;
exports.isLE = new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;
// There is almost no big endian hardware, but js typed arrays uses platform specific endianess.
// So, just to be sure not to corrupt anything.
if (!exports.isLE)
    throw new Error('Non little-endian hardware is not supported');
const hexes = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, '0'));
/**
 * @example bytesToHex(Uint8Array.from([0xde, 0xad, 0xbe, 0xef]))
 */
function bytesToHex(uint8a) {
    // pre-caching improves the speed 6x
    let hex = '';
    for (let i = 0; i < uint8a.length; i++) {
        hex += hexes[uint8a[i]];
    }
    return hex;
}
exports.bytesToHex = bytesToHex;
/**
 * @example hexToBytes('deadbeef')
 */
function hexToBytes(hex) {
    if (typeof hex !== 'string') {
        throw new TypeError('hexToBytes: expected string, got ' + typeof hex);
    }
    if (hex.length % 2)
        throw new Error('hexToBytes: received invalid unpadded hex');
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < array.length; i++) {
        const j = i * 2;
        const hexByte = hex.slice(j, j + 2);
        const byte = Number.parseInt(hexByte, 16);
        if (Number.isNaN(byte))
            throw new Error('Invalid byte sequence');
        array[i] = byte;
    }
    return array;
}
exports.hexToBytes = hexToBytes;
// Currently avoid insertion of polyfills with packers (browserify/webpack/etc)
// But setTimeout is pretty slow, maybe worth to investigate howto do minimal polyfill here
exports.nextTick = (() => {
    const nodeRequire =  true &&
        typeof module.require === 'function' &&
        module.require.bind(module);
    try {
        if (nodeRequire) {
            const { setImmediate } = nodeRequire('timers');
            return () => new Promise((resolve) => setImmediate(resolve));
        }
    }
    catch (e) { }
    return () => new Promise((resolve) => setTimeout(resolve, 0));
})();
// Returns control to thread each 'tick' ms to avoid blocking
async function asyncLoop(iters, tick, cb) {
    let ts = Date.now();
    for (let i = 0; i < iters; i++) {
        cb(i);
        // Date.now() is not monotonic, so in case if clock goes backwards we return return control too
        const diff = Date.now() - ts;
        if (diff >= 0 && diff < tick)
            continue;
        await (0, exports.nextTick)();
        ts += diff;
    }
}
exports.asyncLoop = asyncLoop;
function utf8ToBytes(str) {
    if (typeof str !== 'string') {
        throw new TypeError(`utf8ToBytes expected string, got ${typeof str}`);
    }
    return new TextEncoder().encode(str);
}
exports.utf8ToBytes = utf8ToBytes;
function toBytes(data) {
    if (typeof data === 'string')
        data = utf8ToBytes(data);
    if (!(data instanceof Uint8Array))
        throw new TypeError(`Expected input type is Uint8Array (got ${typeof data})`);
    return data;
}
exports.toBytes = toBytes;
/**
 * Concats Uint8Array-s into one; like `Buffer.concat([buf1, buf2])`
 * @example concatBytes(buf1, buf2)
 */
function concatBytes(...arrays) {
    if (!arrays.every((a) => a instanceof Uint8Array))
        throw new Error('Uint8Array list expected');
    if (arrays.length === 1)
        return arrays[0];
    const length = arrays.reduce((a, arr) => a + arr.length, 0);
    const result = new Uint8Array(length);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
        const arr = arrays[i];
        result.set(arr, pad);
        pad += arr.length;
    }
    return result;
}
exports.concatBytes = concatBytes;
function assertNumber(n) {
    if (!Number.isSafeInteger(n) || n < 0)
        throw new Error(`Wrong positive integer: ${n}`);
}
exports.assertNumber = assertNumber;
function assertBool(b) {
    if (typeof b !== 'boolean') {
        throw new Error(`Expected boolean, not ${b}`);
    }
}
exports.assertBool = assertBool;
function assertBytes(bytes, ...lengths) {
    if (bytes instanceof Uint8Array && (!lengths.length || lengths.includes(bytes.length))) {
        return;
    }
    throw new TypeError(`Expected ${lengths} bytes, not ${typeof bytes} with length=${bytes.length}`);
}
exports.assertBytes = assertBytes;
function assertHash(hash) {
    if (typeof hash !== 'function' || typeof hash.create !== 'function')
        throw new Error('Hash should be wrapped by utils.wrapConstructor');
    assertNumber(hash.outputLen);
    assertNumber(hash.blockLen);
}
exports.assertHash = assertHash;
// For runtime check if class implements interface
class Hash {
    // Safe version that clones internal state
    clone() {
        return this._cloneInto();
    }
}
exports.Hash = Hash;
// Check if object doens't have custom constructor (like Uint8Array/Array)
const isPlainObject = (obj) => Object.prototype.toString.call(obj) === '[object Object]' && obj.constructor === Object;
function checkOpts(def, _opts) {
    if (_opts !== undefined && (typeof _opts !== 'object' || !isPlainObject(_opts)))
        throw new TypeError('Options should be object or undefined');
    const opts = Object.assign(def, _opts);
    return opts;
}
exports.checkOpts = checkOpts;
function wrapConstructor(hashConstructor) {
    const hashC = (message) => hashConstructor().update(toBytes(message)).digest();
    const tmp = hashConstructor();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = () => hashConstructor();
    return hashC;
}
exports.wrapConstructor = wrapConstructor;
function wrapConstructorWithOpts(hashCons) {
    const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
    const tmp = hashCons({});
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = (opts) => hashCons(opts);
    return hashC;
}
exports.wrapConstructorWithOpts = wrapConstructorWithOpts;
/**
 * Secure PRNG
 */
function randomBytes(bytesLength = 32) {
    if (crypto_1.crypto.web) {
        return crypto_1.crypto.web.getRandomValues(new Uint8Array(bytesLength));
    }
    else if (crypto_1.crypto.node) {
        return new Uint8Array(crypto_1.crypto.node.randomBytes(bytesLength).buffer);
    }
    else {
        throw new Error("The environment doesn't have randomBytes function");
    }
}
exports.randomBytes = randomBytes;


/***/ }),

/***/ 9656:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/*! noble-secp256k1 - MIT License (c) 2019 Paul Miller (paulmillr.com) */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.utils = exports.schnorr = exports.verify = exports.signSync = exports.sign = exports.getSharedSecret = exports.recoverPublicKey = exports.getPublicKey = exports.Signature = exports.Point = exports.CURVE = void 0;
const crypto_1 = __importDefault(__webpack_require__(9159));
const _0n = BigInt(0);
const _1n = BigInt(1);
const _2n = BigInt(2);
const _3n = BigInt(3);
const _8n = BigInt(8);
const POW_2_256 = _2n ** BigInt(256);
const CURVE = {
    a: _0n,
    b: BigInt(7),
    P: POW_2_256 - _2n ** BigInt(32) - BigInt(977),
    n: POW_2_256 - BigInt('432420386565659656852420866394968145599'),
    h: _1n,
    Gx: BigInt('55066263022277343669578718895168534326250603453777594175500187360389116729240'),
    Gy: BigInt('32670510020758816978083085130507043184471273380659243275938904335757337482424'),
    beta: BigInt('0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'),
};
exports.CURVE = CURVE;
function weistrass(x) {
    const { a, b } = CURVE;
    const x2 = mod(x * x);
    const x3 = mod(x2 * x);
    return mod(x3 + a * x + b);
}
const USE_ENDOMORPHISM = CURVE.a === _0n;
class JacobianPoint {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static fromAffine(p) {
        if (!(p instanceof Point)) {
            throw new TypeError('JacobianPoint#fromAffine: expected Point');
        }
        return new JacobianPoint(p.x, p.y, _1n);
    }
    static toAffineBatch(points) {
        const toInv = invertBatch(points.map((p) => p.z));
        return points.map((p, i) => p.toAffine(toInv[i]));
    }
    static normalizeZ(points) {
        return JacobianPoint.toAffineBatch(points).map(JacobianPoint.fromAffine);
    }
    equals(other) {
        const a = this;
        const b = other;
        const az2 = mod(a.z * a.z);
        const az3 = mod(a.z * az2);
        const bz2 = mod(b.z * b.z);
        const bz3 = mod(b.z * bz2);
        return mod(a.x * bz2) === mod(az2 * b.x) && mod(a.y * bz3) === mod(az3 * b.y);
    }
    negate() {
        return new JacobianPoint(this.x, mod(-this.y), this.z);
    }
    double() {
        const X1 = this.x;
        const Y1 = this.y;
        const Z1 = this.z;
        const A = mod(X1 ** _2n);
        const B = mod(Y1 ** _2n);
        const C = mod(B ** _2n);
        const D = mod(_2n * (mod(mod((X1 + B) ** _2n)) - A - C));
        const E = mod(_3n * A);
        const F = mod(E ** _2n);
        const X3 = mod(F - _2n * D);
        const Y3 = mod(E * (D - X3) - _8n * C);
        const Z3 = mod(_2n * Y1 * Z1);
        return new JacobianPoint(X3, Y3, Z3);
    }
    add(other) {
        if (!(other instanceof JacobianPoint)) {
            throw new TypeError('JacobianPoint#add: expected JacobianPoint');
        }
        const X1 = this.x;
        const Y1 = this.y;
        const Z1 = this.z;
        const X2 = other.x;
        const Y2 = other.y;
        const Z2 = other.z;
        if (X2 === _0n || Y2 === _0n)
            return this;
        if (X1 === _0n || Y1 === _0n)
            return other;
        const Z1Z1 = mod(Z1 ** _2n);
        const Z2Z2 = mod(Z2 ** _2n);
        const U1 = mod(X1 * Z2Z2);
        const U2 = mod(X2 * Z1Z1);
        const S1 = mod(Y1 * Z2 * Z2Z2);
        const S2 = mod(mod(Y2 * Z1) * Z1Z1);
        const H = mod(U2 - U1);
        const r = mod(S2 - S1);
        if (H === _0n) {
            if (r === _0n) {
                return this.double();
            }
            else {
                return JacobianPoint.ZERO;
            }
        }
        const HH = mod(H ** _2n);
        const HHH = mod(H * HH);
        const V = mod(U1 * HH);
        const X3 = mod(r ** _2n - HHH - _2n * V);
        const Y3 = mod(r * (V - X3) - S1 * HHH);
        const Z3 = mod(Z1 * Z2 * H);
        return new JacobianPoint(X3, Y3, Z3);
    }
    subtract(other) {
        return this.add(other.negate());
    }
    multiplyUnsafe(scalar) {
        let n = normalizeScalar(scalar);
        if (!USE_ENDOMORPHISM) {
            let p = JacobianPoint.ZERO;
            let d = this;
            while (n > _0n) {
                if (n & _1n)
                    p = p.add(d);
                d = d.double();
                n >>= _1n;
            }
            return p;
        }
        let { k1neg, k1, k2neg, k2 } = splitScalarEndo(n);
        let k1p = JacobianPoint.ZERO;
        let k2p = JacobianPoint.ZERO;
        let d = this;
        while (k1 > _0n || k2 > _0n) {
            if (k1 & _1n)
                k1p = k1p.add(d);
            if (k2 & _1n)
                k2p = k2p.add(d);
            d = d.double();
            k1 >>= _1n;
            k2 >>= _1n;
        }
        if (k1neg)
            k1p = k1p.negate();
        if (k2neg)
            k2p = k2p.negate();
        k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z);
        return k1p.add(k2p);
    }
    precomputeWindow(W) {
        const windows = USE_ENDOMORPHISM ? 128 / W + 1 : 256 / W + 1;
        const points = [];
        let p = this;
        let base = p;
        for (let window = 0; window < windows; window++) {
            base = p;
            points.push(base);
            for (let i = 1; i < 2 ** (W - 1); i++) {
                base = base.add(p);
                points.push(base);
            }
            p = base.double();
        }
        return points;
    }
    wNAF(n, affinePoint) {
        if (!affinePoint && this.equals(JacobianPoint.BASE))
            affinePoint = Point.BASE;
        const W = (affinePoint && affinePoint._WINDOW_SIZE) || 1;
        if (256 % W) {
            throw new Error('Point#wNAF: Invalid precomputation window, must be power of 2');
        }
        let precomputes = affinePoint && pointPrecomputes.get(affinePoint);
        if (!precomputes) {
            precomputes = this.precomputeWindow(W);
            if (affinePoint && W !== 1) {
                precomputes = JacobianPoint.normalizeZ(precomputes);
                pointPrecomputes.set(affinePoint, precomputes);
            }
        }
        let p = JacobianPoint.ZERO;
        let f = JacobianPoint.ZERO;
        const windows = USE_ENDOMORPHISM ? 128 / W + 1 : 256 / W + 1;
        const windowSize = 2 ** (W - 1);
        const mask = BigInt(2 ** W - 1);
        const maxNumber = 2 ** W;
        const shiftBy = BigInt(W);
        for (let window = 0; window < windows; window++) {
            const offset = window * windowSize;
            let wbits = Number(n & mask);
            n >>= shiftBy;
            if (wbits > windowSize) {
                wbits -= maxNumber;
                n += _1n;
            }
            if (wbits === 0) {
                let pr = precomputes[offset];
                if (window % 2)
                    pr = pr.negate();
                f = f.add(pr);
            }
            else {
                let cached = precomputes[offset + Math.abs(wbits) - 1];
                if (wbits < 0)
                    cached = cached.negate();
                p = p.add(cached);
            }
        }
        return { p, f };
    }
    multiply(scalar, affinePoint) {
        let n = normalizeScalar(scalar);
        let point;
        let fake;
        if (USE_ENDOMORPHISM) {
            let { k1neg, k1, k2neg, k2 } = splitScalarEndo(n);
            let { p: k1p, f: f1p } = this.wNAF(k1, affinePoint);
            let { p: k2p, f: f2p } = this.wNAF(k2, affinePoint);
            if (k1neg)
                k1p = k1p.negate();
            if (k2neg)
                k2p = k2p.negate();
            k2p = new JacobianPoint(mod(k2p.x * CURVE.beta), k2p.y, k2p.z);
            point = k1p.add(k2p);
            fake = f1p.add(f2p);
        }
        else {
            let { p, f } = this.wNAF(n, affinePoint);
            point = p;
            fake = f;
        }
        return JacobianPoint.normalizeZ([point, fake])[0];
    }
    toAffine(invZ = invert(this.z)) {
        const invZ2 = invZ ** _2n;
        const x = mod(this.x * invZ2);
        const y = mod(this.y * invZ2 * invZ);
        return new Point(x, y);
    }
}
JacobianPoint.BASE = new JacobianPoint(CURVE.Gx, CURVE.Gy, _1n);
JacobianPoint.ZERO = new JacobianPoint(_0n, _1n, _0n);
const pointPrecomputes = new WeakMap();
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    _setWindowSize(windowSize) {
        this._WINDOW_SIZE = windowSize;
        pointPrecomputes.delete(this);
    }
    static fromCompressedHex(bytes) {
        const isShort = bytes.length === 32;
        const x = bytesToNumber(isShort ? bytes : bytes.slice(1));
        const y2 = weistrass(x);
        let y = sqrtMod(y2);
        const isYOdd = (y & _1n) === _1n;
        if (isShort) {
            if (isYOdd)
                y = mod(-y);
        }
        else {
            const isFirstByteOdd = (bytes[0] & 1) === 1;
            if (isFirstByteOdd !== isYOdd)
                y = mod(-y);
        }
        const point = new Point(x, y);
        point.assertValidity();
        return point;
    }
    static fromUncompressedHex(bytes) {
        const x = bytesToNumber(bytes.slice(1, 33));
        const y = bytesToNumber(bytes.slice(33));
        const point = new Point(x, y);
        point.assertValidity();
        return point;
    }
    static fromHex(hex) {
        const bytes = ensureBytes(hex);
        const header = bytes[0];
        if (bytes.length === 32 || (bytes.length === 33 && (header === 0x02 || header === 0x03))) {
            return this.fromCompressedHex(bytes);
        }
        if (bytes.length === 65 && header === 0x04)
            return this.fromUncompressedHex(bytes);
        throw new Error(`Point.fromHex: received invalid point. Expected 32-33 compressed bytes or 65 uncompressed bytes, not ${bytes.length}`);
    }
    static fromPrivateKey(privateKey) {
        return Point.BASE.multiply(normalizePrivateKey(privateKey));
    }
    static fromSignature(msgHash, signature, recovery) {
        let h = msgHash instanceof Uint8Array ? bytesToNumber(msgHash) : hexToNumber(msgHash);
        const sig = normalizeSignature(signature);
        const { r, s } = sig;
        if (recovery !== 0 && recovery !== 1) {
            throw new Error('Cannot recover signature: invalid recovery bit');
        }
        const prefix = 2 + (recovery & 1);
        const P_ = Point.fromHex(`0${prefix}${pad64(r)}`);
        const sP = JacobianPoint.fromAffine(P_).multiplyUnsafe(s);
        const hG = JacobianPoint.BASE.multiply(h);
        const rinv = invert(r, CURVE.n);
        const Q = sP.subtract(hG).multiplyUnsafe(rinv);
        const point = Q.toAffine();
        point.assertValidity();
        return point;
    }
    toRawBytes(isCompressed = false) {
        return hexToBytes(this.toHex(isCompressed));
    }
    toHex(isCompressed = false) {
        const x = pad64(this.x);
        if (isCompressed) {
            return `${this.y & _1n ? '03' : '02'}${x}`;
        }
        else {
            return `04${x}${pad64(this.y)}`;
        }
    }
    toHexX() {
        return this.toHex(true).slice(2);
    }
    toRawX() {
        return this.toRawBytes(true).slice(1);
    }
    assertValidity() {
        const msg = 'Point is not on elliptic curve';
        const { x, y } = this;
        if (!isWithinCurvePrime(x) || !isWithinCurvePrime(y))
            throw new Error(msg);
        const left = mod(y * y);
        const right = weistrass(x);
        if (mod(left - right) !== _0n)
            throw new Error(msg);
    }
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    negate() {
        return new Point(this.x, mod(-this.y));
    }
    double() {
        return JacobianPoint.fromAffine(this).double().toAffine();
    }
    add(other) {
        return JacobianPoint.fromAffine(this).add(JacobianPoint.fromAffine(other)).toAffine();
    }
    subtract(other) {
        return this.add(other.negate());
    }
    multiply(scalar) {
        return JacobianPoint.fromAffine(this).multiply(scalar, this).toAffine();
    }
}
exports.Point = Point;
Point.BASE = new Point(CURVE.Gx, CURVE.Gy);
Point.ZERO = new Point(_0n, _0n);
function sliceDER(s) {
    return Number.parseInt(s[0], 16) >= 8 ? '00' + s : s;
}
function parseDERInt(data) {
    if (data.length < 2 || data[0] !== 0x02) {
        throw new Error(`Invalid signature integer tag: ${bytesToHex(data)}`);
    }
    const len = data[1];
    const res = data.subarray(2, len + 2);
    if (!len || res.length !== len) {
        throw new Error(`Invalid signature integer: wrong length`);
    }
    if (res[0] === 0x00 && res[1] <= 0x7f) {
        throw new Error('Invalid signature integer: trailing length');
    }
    return { data: bytesToNumber(res), left: data.subarray(len + 2) };
}
function parseDERSignature(data) {
    if (data.length < 2 || data[0] != 0x30) {
        throw new Error(`Invalid signature tag: ${bytesToHex(data)}`);
    }
    if (data[1] !== data.length - 2) {
        throw new Error('Invalid signature: incorrect length');
    }
    const { data: r, left: sBytes } = parseDERInt(data.subarray(2));
    const { data: s, left: rBytesLeft } = parseDERInt(sBytes);
    if (rBytesLeft.length) {
        throw new Error(`Invalid signature: left bytes after parsing: ${bytesToHex(rBytesLeft)}`);
    }
    return { r, s };
}
class Signature {
    constructor(r, s) {
        this.r = r;
        this.s = s;
        this.assertValidity();
    }
    static fromCompact(hex) {
        const arr = hex instanceof Uint8Array;
        const name = 'Signature.fromCompact';
        if (typeof hex !== 'string' && !arr)
            throw new TypeError(`${name}: Expected string or Uint8Array`);
        const str = arr ? bytesToHex(hex) : hex;
        if (str.length !== 128)
            throw new Error(`${name}: Expected 64-byte hex`);
        return new Signature(hexToNumber(str.slice(0, 64)), hexToNumber(str.slice(64, 128)));
    }
    static fromDER(hex) {
        const arr = hex instanceof Uint8Array;
        if (typeof hex !== 'string' && !arr)
            throw new TypeError(`Signature.fromDER: Expected string or Uint8Array`);
        const { r, s } = parseDERSignature(arr ? hex : hexToBytes(hex));
        return new Signature(r, s);
    }
    static fromHex(hex) {
        return this.fromDER(hex);
    }
    assertValidity() {
        const { r, s } = this;
        if (!isWithinCurveOrder(r))
            throw new Error('Invalid Signature: r must be 0 < r < n');
        if (!isWithinCurveOrder(s))
            throw new Error('Invalid Signature: s must be 0 < s < n');
    }
    hasHighS() {
        const HALF = CURVE.n >> _1n;
        return this.s > HALF;
    }
    normalizeS() {
        return this.hasHighS() ? new Signature(this.r, CURVE.n - this.s) : this;
    }
    toDERRawBytes(isCompressed = false) {
        return hexToBytes(this.toDERHex(isCompressed));
    }
    toDERHex(isCompressed = false) {
        const sHex = sliceDER(numberToHex(this.s));
        if (isCompressed)
            return sHex;
        const rHex = sliceDER(numberToHex(this.r));
        const rLen = numberToHex(rHex.length / 2);
        const sLen = numberToHex(sHex.length / 2);
        const length = numberToHex(rHex.length / 2 + sHex.length / 2 + 4);
        return `30${length}02${rLen}${rHex}02${sLen}${sHex}`;
    }
    toRawBytes() {
        return this.toDERRawBytes();
    }
    toHex() {
        return this.toDERHex();
    }
    toCompactRawBytes() {
        return hexToBytes(this.toCompactHex());
    }
    toCompactHex() {
        return pad64(this.r) + pad64(this.s);
    }
}
exports.Signature = Signature;
function concatBytes(...arrays) {
    if (!arrays.every((a) => a instanceof Uint8Array))
        throw new Error('Uint8Array list expected');
    if (arrays.length === 1)
        return arrays[0];
    const length = arrays.reduce((a, arr) => a + arr.length, 0);
    const result = new Uint8Array(length);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
        const arr = arrays[i];
        result.set(arr, pad);
        pad += arr.length;
    }
    return result;
}
const hexes = Array.from({ length: 256 }, (v, i) => i.toString(16).padStart(2, '0'));
function bytesToHex(uint8a) {
    let hex = '';
    for (let i = 0; i < uint8a.length; i++) {
        hex += hexes[uint8a[i]];
    }
    return hex;
}
function pad64(num) {
    if (num > POW_2_256)
        throw new Error('pad64: invalid number');
    return num.toString(16).padStart(64, '0');
}
function pad32b(num) {
    return hexToBytes(pad64(num));
}
function numberToHex(num) {
    const hex = num.toString(16);
    return hex.length & 1 ? `0${hex}` : hex;
}
function hexToNumber(hex) {
    if (typeof hex !== 'string') {
        throw new TypeError('hexToNumber: expected string, got ' + typeof hex);
    }
    return BigInt(`0x${hex}`);
}
function hexToBytes(hex) {
    if (typeof hex !== 'string') {
        throw new TypeError('hexToBytes: expected string, got ' + typeof hex);
    }
    if (hex.length % 2)
        throw new Error('hexToBytes: received invalid unpadded hex' + hex.length);
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < array.length; i++) {
        const j = i * 2;
        const hexByte = hex.slice(j, j + 2);
        const byte = Number.parseInt(hexByte, 16);
        if (Number.isNaN(byte))
            throw new Error('Invalid byte sequence');
        array[i] = byte;
    }
    return array;
}
function ensureBytes(hex) {
    return hex instanceof Uint8Array ? hex : hexToBytes(hex);
}
function bytesToNumber(bytes) {
    if (!(bytes instanceof Uint8Array))
        throw new Error('Expected Uint8Array');
    return hexToNumber(bytesToHex(bytes));
}
function normalizeScalar(num) {
    if (typeof num === 'number' && num > 0 && Number.isSafeInteger(num))
        return BigInt(num);
    if (typeof num === 'bigint' && isWithinCurveOrder(num))
        return num;
    throw new TypeError('Expected valid private scalar: 0 < scalar < curve.n');
}
function mod(a, b = CURVE.P) {
    const result = a % b;
    return result >= 0 ? result : b + result;
}
function pow2(x, power) {
    const { P } = CURVE;
    let res = x;
    while (power-- > _0n) {
        res *= res;
        res %= P;
    }
    return res;
}
function sqrtMod(x) {
    const { P } = CURVE;
    const _6n = BigInt(6);
    const _11n = BigInt(11);
    const _22n = BigInt(22);
    const _23n = BigInt(23);
    const _44n = BigInt(44);
    const _88n = BigInt(88);
    const b2 = (x * x * x) % P;
    const b3 = (b2 * b2 * x) % P;
    const b6 = (pow2(b3, _3n) * b3) % P;
    const b9 = (pow2(b6, _3n) * b3) % P;
    const b11 = (pow2(b9, _2n) * b2) % P;
    const b22 = (pow2(b11, _11n) * b11) % P;
    const b44 = (pow2(b22, _22n) * b22) % P;
    const b88 = (pow2(b44, _44n) * b44) % P;
    const b176 = (pow2(b88, _88n) * b88) % P;
    const b220 = (pow2(b176, _44n) * b44) % P;
    const b223 = (pow2(b220, _3n) * b3) % P;
    const t1 = (pow2(b223, _23n) * b22) % P;
    const t2 = (pow2(t1, _6n) * b2) % P;
    return pow2(t2, _2n);
}
function invert(number, modulo = CURVE.P) {
    if (number === _0n || modulo <= _0n) {
        throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
    }
    let a = mod(number, modulo);
    let b = modulo;
    let x = _0n, y = _1n, u = _1n, v = _0n;
    while (a !== _0n) {
        const q = b / a;
        const r = b % a;
        const m = x - u * q;
        const n = y - v * q;
        b = a, a = r, x = u, y = v, u = m, v = n;
    }
    const gcd = b;
    if (gcd !== _1n)
        throw new Error('invert: does not exist');
    return mod(x, modulo);
}
function invertBatch(nums, n = CURVE.P) {
    const len = nums.length;
    const scratch = new Array(len);
    let acc = _1n;
    for (let i = 0; i < len; i++) {
        if (nums[i] === _0n)
            continue;
        scratch[i] = acc;
        acc = mod(acc * nums[i], n);
    }
    acc = invert(acc, n);
    for (let i = len - 1; i >= 0; i--) {
        if (nums[i] === _0n)
            continue;
        const tmp = mod(acc * nums[i], n);
        nums[i] = mod(acc * scratch[i], n);
        acc = tmp;
    }
    return nums;
}
const divNearest = (a, b) => (a + b / _2n) / b;
const POW_2_128 = _2n ** BigInt(128);
function splitScalarEndo(k) {
    const { n } = CURVE;
    const a1 = BigInt('0x3086d221a7d46bcde86c90e49284eb15');
    const b1 = -_1n * BigInt('0xe4437ed6010e88286f547fa90abfe4c3');
    const a2 = BigInt('0x114ca50f7a8e2f3f657c1108d9d44cfd8');
    const b2 = a1;
    const c1 = divNearest(b2 * k, n);
    const c2 = divNearest(-b1 * k, n);
    let k1 = mod(k - c1 * a1 - c2 * a2, n);
    let k2 = mod(-c1 * b1 - c2 * b2, n);
    const k1neg = k1 > POW_2_128;
    const k2neg = k2 > POW_2_128;
    if (k1neg)
        k1 = n - k1;
    if (k2neg)
        k2 = n - k2;
    if (k1 > POW_2_128 || k2 > POW_2_128)
        throw new Error('splitScalarEndo: Endomorphism failed');
    return { k1neg, k1, k2neg, k2 };
}
function truncateHash(hash) {
    if (typeof hash !== 'string')
        hash = bytesToHex(hash);
    let msg = hexToNumber(hash || '0');
    const byteLength = hash.length / 2;
    const delta = byteLength * 8 - 256;
    if (delta > 0) {
        msg = msg >> BigInt(delta);
    }
    if (msg >= CURVE.n) {
        msg -= CURVE.n;
    }
    return msg;
}
class HmacDrbg {
    constructor() {
        this.v = new Uint8Array(32).fill(1);
        this.k = new Uint8Array(32).fill(0);
        this.counter = 0;
    }
    hmac(...values) {
        return exports.utils.hmacSha256(this.k, ...values);
    }
    hmacSync(...values) {
        if (typeof exports.utils.hmacSha256Sync !== 'function')
            throw new Error('utils.hmacSha256Sync is undefined, you need to set it');
        const res = exports.utils.hmacSha256Sync(this.k, ...values);
        if (res instanceof Promise)
            throw new Error('To use sync sign(), ensure utils.hmacSha256 is sync');
        return res;
    }
    incr() {
        if (this.counter >= 1000) {
            throw new Error('Tried 1,000 k values for sign(), all were invalid');
        }
        this.counter += 1;
    }
    async reseed(seed = new Uint8Array()) {
        this.k = await this.hmac(this.v, Uint8Array.from([0x00]), seed);
        this.v = await this.hmac(this.v);
        if (seed.length === 0)
            return;
        this.k = await this.hmac(this.v, Uint8Array.from([0x01]), seed);
        this.v = await this.hmac(this.v);
    }
    reseedSync(seed = new Uint8Array()) {
        this.k = this.hmacSync(this.v, Uint8Array.from([0x00]), seed);
        this.v = this.hmacSync(this.v);
        if (seed.length === 0)
            return;
        this.k = this.hmacSync(this.v, Uint8Array.from([0x01]), seed);
        this.v = this.hmacSync(this.v);
    }
    async generate() {
        this.incr();
        this.v = await this.hmac(this.v);
        return this.v;
    }
    generateSync() {
        this.incr();
        this.v = this.hmacSync(this.v);
        return this.v;
    }
}
function isWithinCurveOrder(num) {
    return _0n < num && num < CURVE.n;
}
function isWithinCurvePrime(num) {
    return 0n < num && num < CURVE.P;
}
function kmdToSig(kBytes, m, d) {
    const k = bytesToNumber(kBytes);
    if (!isWithinCurveOrder(k))
        return;
    const { n } = CURVE;
    const q = Point.BASE.multiply(k);
    const r = mod(q.x, n);
    if (r === _0n)
        return;
    const s = mod(invert(k, n) * mod(m + d * r, n), n);
    if (s === _0n)
        return;
    const sig = new Signature(r, s);
    const recovery = (q.x === sig.r ? 0 : 2) | Number(q.y & _1n);
    return { sig, recovery };
}
function normalizePrivateKey(key) {
    let num;
    if (typeof key === 'bigint') {
        num = key;
    }
    else if (typeof key === 'number' && Number.isSafeInteger(key) && key > 0) {
        num = BigInt(key);
    }
    else if (typeof key === 'string') {
        if (key.length !== 64)
            throw new Error('Expected 32 bytes of private key');
        num = hexToNumber(key);
    }
    else if (key instanceof Uint8Array) {
        if (key.length !== 32)
            throw new Error('Expected 32 bytes of private key');
        num = bytesToNumber(key);
    }
    else {
        throw new TypeError('Expected valid private key');
    }
    if (!isWithinCurveOrder(num))
        throw new Error('Expected private key: 0 < key < n');
    return num;
}
function normalizePublicKey(publicKey) {
    if (publicKey instanceof Point) {
        publicKey.assertValidity();
        return publicKey;
    }
    else {
        return Point.fromHex(publicKey);
    }
}
function normalizeSignature(signature) {
    if (signature instanceof Signature) {
        signature.assertValidity();
        return signature;
    }
    try {
        return Signature.fromDER(signature);
    }
    catch (error) {
        return Signature.fromCompact(signature);
    }
}
function getPublicKey(privateKey, isCompressed = false) {
    return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
}
exports.getPublicKey = getPublicKey;
function recoverPublicKey(msgHash, signature, recovery) {
    return Point.fromSignature(msgHash, signature, recovery).toRawBytes();
}
exports.recoverPublicKey = recoverPublicKey;
function isPub(item) {
    const arr = item instanceof Uint8Array;
    const str = typeof item === 'string';
    const len = (arr || str) && item.length;
    if (arr)
        return len === 33 || len === 65;
    if (str)
        return len === 66 || len === 130;
    if (item instanceof Point)
        return true;
    return false;
}
function getSharedSecret(privateA, publicB, isCompressed = false) {
    if (isPub(privateA))
        throw new TypeError('getSharedSecret: first arg must be private key');
    if (!isPub(publicB))
        throw new TypeError('getSharedSecret: second arg must be public key');
    const b = normalizePublicKey(publicB);
    b.assertValidity();
    return b.multiply(normalizePrivateKey(privateA)).toRawBytes(isCompressed);
}
exports.getSharedSecret = getSharedSecret;
function bits2int(bytes) {
    const slice = bytes.length > 32 ? bytes.slice(0, 32) : bytes;
    return bytesToNumber(slice);
}
function bits2octets(bytes) {
    const z1 = bits2int(bytes);
    const z2 = mod(z1, CURVE.n);
    return int2octets(z2 < _0n ? z1 : z2);
}
function int2octets(num) {
    if (typeof num !== 'bigint')
        throw new Error('Expected bigint');
    const hex = pad64(num);
    return hexToBytes(hex);
}
function initSigArgs(msgHash, privateKey, extraEntropy) {
    if (msgHash == null)
        throw new Error(`sign: expected valid msgHash, not "${msgHash}"`);
    const h1 = ensureBytes(msgHash);
    const d = normalizePrivateKey(privateKey);
    const seedArgs = [int2octets(d), bits2octets(h1)];
    if (extraEntropy != null) {
        if (extraEntropy === true)
            extraEntropy = exports.utils.randomBytes(32);
        const e = pad32b(bytesToNumber(ensureBytes(extraEntropy)));
        if (e.length !== 32)
            throw new Error('secp256k1: Expected 32 bytes of extra data');
        seedArgs.push(e);
    }
    const seed = concatBytes(...seedArgs);
    const m = bits2int(h1);
    return { seed, m, d };
}
function finalizeSig(recSig, opts) {
    let { sig, recovery } = recSig;
    const { canonical, der, recovered } = Object.assign({ canonical: true, der: true }, opts);
    if (canonical && sig.hasHighS()) {
        sig = sig.normalizeS();
        recovery ^= 1;
    }
    const hashed = der ? sig.toDERRawBytes() : sig.toCompactRawBytes();
    return recovered ? [hashed, recovery] : hashed;
}
async function sign(msgHash, privKey, opts = {}) {
    const { seed, m, d } = initSigArgs(msgHash, privKey, opts.extraEntropy);
    let sig;
    const drbg = new HmacDrbg();
    await drbg.reseed(seed);
    while (!(sig = kmdToSig(await drbg.generate(), m, d)))
        await drbg.reseed();
    return finalizeSig(sig, opts);
}
exports.sign = sign;
function signSync(msgHash, privKey, opts = {}) {
    const { seed, m, d } = initSigArgs(msgHash, privKey, opts.extraEntropy);
    let sig;
    const drbg = new HmacDrbg();
    drbg.reseedSync(seed);
    while (!(sig = kmdToSig(drbg.generateSync(), m, d)))
        drbg.reseedSync();
    return finalizeSig(sig, opts);
}
exports.signSync = signSync;
const vopts = { strict: true };
function verify(signature, msgHash, publicKey, opts = vopts) {
    let sig;
    try {
        sig = normalizeSignature(signature);
    }
    catch (error) {
        return false;
    }
    const { r, s } = sig;
    if (opts.strict && sig.hasHighS())
        return false;
    const h = truncateHash(msgHash);
    if (h === _0n)
        return false;
    let pubKey;
    try {
        pubKey = JacobianPoint.fromAffine(normalizePublicKey(publicKey));
    }
    catch (error) {
        return false;
    }
    const { n } = CURVE;
    const s1 = invert(s, n);
    const u1 = mod(h * s1, n);
    const u2 = mod(r * s1, n);
    const Ghs1 = JacobianPoint.BASE.multiply(u1);
    const Prs1 = pubKey.multiplyUnsafe(u2);
    const R = Ghs1.add(Prs1).toAffine();
    const v = mod(R.x, n);
    return v === r;
}
exports.verify = verify;
async function taggedHash(tag, ...messages) {
    const tagB = new Uint8Array(tag.split('').map((c) => c.charCodeAt(0)));
    const tagH = await exports.utils.sha256(tagB);
    const h = await exports.utils.sha256(concatBytes(tagH, tagH, ...messages));
    return bytesToNumber(h);
}
async function createChallenge(x, P, message) {
    const rx = pad32b(x);
    const t = await taggedHash('BIP0340/challenge', rx, P.toRawX(), message);
    return mod(t, CURVE.n);
}
function hasEvenY(point) {
    return mod(point.y, _2n) === _0n;
}
class SchnorrSignature {
    constructor(r, s) {
        this.r = r;
        this.s = s;
        if (!isWithinCurvePrime(r) || !isWithinCurveOrder(s))
            throw new Error('Invalid signature');
    }
    static fromHex(hex) {
        const bytes = ensureBytes(hex);
        if (bytes.length !== 64)
            throw new TypeError(`SchnorrSignature.fromHex: expected 64 bytes, not ${bytes.length}`);
        const r = bytesToNumber(bytes.slice(0, 32));
        const s = bytesToNumber(bytes.slice(32, 64));
        return new SchnorrSignature(r, s);
    }
    toHex() {
        return pad64(this.r) + pad64(this.s);
    }
    toRawBytes() {
        return hexToBytes(this.toHex());
    }
}
function schnorrGetPublicKey(privateKey) {
    return Point.fromPrivateKey(privateKey).toRawX();
}
async function schnorrSign(message, privateKey, auxRand = exports.utils.randomBytes()) {
    if (message == null)
        throw new TypeError(`sign: Expected valid message, not "${message}"`);
    const { n } = CURVE;
    const m = ensureBytes(message);
    const d0 = normalizePrivateKey(privateKey);
    const rand = ensureBytes(auxRand);
    if (rand.length !== 32)
        throw new TypeError('sign: Expected 32 bytes of aux randomness');
    const P = Point.fromPrivateKey(d0);
    const d = hasEvenY(P) ? d0 : n - d0;
    const t0h = await taggedHash('BIP0340/aux', rand);
    const t = d ^ t0h;
    const k0h = await taggedHash('BIP0340/nonce', pad32b(t), P.toRawX(), m);
    const k0 = mod(k0h, n);
    if (k0 === _0n)
        throw new Error('sign: Creation of signature failed. k is zero');
    const R = Point.fromPrivateKey(k0);
    const k = hasEvenY(R) ? k0 : n - k0;
    const e = await createChallenge(R.x, P, m);
    const sig = new SchnorrSignature(R.x, mod(k + e * d, n));
    const isValid = await schnorrVerify(sig.toRawBytes(), m, P.toRawX());
    if (!isValid)
        throw new Error('sign: Invalid signature produced');
    return sig.toRawBytes();
}
async function schnorrVerify(signature, message, publicKey) {
    const sig = signature instanceof SchnorrSignature ? signature : SchnorrSignature.fromHex(signature);
    const m = ensureBytes(message);
    const P = normalizePublicKey(publicKey);
    const e = await createChallenge(sig.r, P, m);
    const sG = Point.fromPrivateKey(sig.s);
    const eP = P.multiply(e);
    const R = sG.subtract(eP);
    if (R.equals(Point.BASE) || !hasEvenY(R) || R.x !== sig.r)
        return false;
    return true;
}
exports.schnorr = {
    Signature: SchnorrSignature,
    getPublicKey: schnorrGetPublicKey,
    sign: schnorrSign,
    verify: schnorrVerify,
};
Point.BASE._setWindowSize(8);
const crypto = {
    node: crypto_1.default,
    web: typeof self === 'object' && 'crypto' in self ? self.crypto : undefined,
};
exports.utils = {
    isValidPrivateKey(privateKey) {
        try {
            normalizePrivateKey(privateKey);
            return true;
        }
        catch (error) {
            return false;
        }
    },
    randomBytes: (bytesLength = 32) => {
        if (crypto.web) {
            return crypto.web.getRandomValues(new Uint8Array(bytesLength));
        }
        else if (crypto.node) {
            const { randomBytes } = crypto.node;
            return Uint8Array.from(randomBytes(bytesLength));
        }
        else {
            throw new Error("The environment doesn't have randomBytes function");
        }
    },
    randomPrivateKey: () => {
        let i = 8;
        while (i--) {
            const b32 = exports.utils.randomBytes(32);
            const num = bytesToNumber(b32);
            if (isWithinCurveOrder(num) && num !== _1n)
                return b32;
        }
        throw new Error('Valid private key was not found in 8 iterations. PRNG is broken');
    },
    bytesToHex,
    sha256: async (message) => {
        if (crypto.web) {
            const buffer = await crypto.web.subtle.digest('SHA-256', message.buffer);
            return new Uint8Array(buffer);
        }
        else if (crypto.node) {
            const { createHash } = crypto.node;
            return Uint8Array.from(createHash('sha256').update(message).digest());
        }
        else {
            throw new Error("The environment doesn't have sha256 function");
        }
    },
    hmacSha256: async (key, ...messages) => {
        if (crypto.web) {
            const ckey = await crypto.web.subtle.importKey('raw', key, { name: 'HMAC', hash: { name: 'SHA-256' } }, false, ['sign']);
            const message = concatBytes(...messages);
            const buffer = await crypto.web.subtle.sign('HMAC', ckey, message);
            return new Uint8Array(buffer);
        }
        else if (crypto.node) {
            const { createHmac } = crypto.node;
            const hash = createHmac('sha256', key);
            messages.forEach((m) => hash.update(m));
            return Uint8Array.from(hash.digest());
        }
        else {
            throw new Error("The environment doesn't have hmac-sha256 function");
        }
    },
    sha256Sync: undefined,
    hmacSha256Sync: undefined,
    precompute(windowSize = 8, point = Point.BASE) {
        const cached = point === Point.BASE ? point : new Point(point.x, point.y);
        cached._setWindowSize(windowSize);
        cached.multiply(_3n);
        return cached;
    },
};


/***/ }),

/***/ 4537:
/***/ ((module) => {

"use strict";

module.exports = asPromise;

/**
 * Callback as used by {@link util.asPromise}.
 * @typedef asPromiseCallback
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {...*} params Additional arguments
 * @returns {undefined}
 */

/**
 * Returns a promise from a node-style callback function.
 * @memberof util
 * @param {asPromiseCallback} fn Function to call
 * @param {*} ctx Function context
 * @param {...*} params Function arguments
 * @returns {Promise<*>} Promisified function
 */
function asPromise(fn, ctx/*, varargs */) {
    var params  = new Array(arguments.length - 1),
        offset  = 0,
        index   = 2,
        pending = true;
    while (index < arguments.length)
        params[offset++] = arguments[index++];
    return new Promise(function executor(resolve, reject) {
        params[offset] = function callback(err/*, varargs */) {
            if (pending) {
                pending = false;
                if (err)
                    reject(err);
                else {
                    var params = new Array(arguments.length - 1),
                        offset = 0;
                    while (offset < params.length)
                        params[offset++] = arguments[offset];
                    resolve.apply(null, params);
                }
            }
        };
        try {
            fn.apply(ctx || null, params);
        } catch (err) {
            if (pending) {
                pending = false;
                reject(err);
            }
        }
    });
}


/***/ }),

/***/ 7419:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


/**
 * A minimal base64 implementation for number arrays.
 * @memberof util
 * @namespace
 */
var base64 = exports;

/**
 * Calculates the byte length of a base64 encoded string.
 * @param {string} string Base64 encoded string
 * @returns {number} Byte length
 */
base64.length = function length(string) {
    var p = string.length;
    if (!p)
        return 0;
    var n = 0;
    while (--p % 4 > 1 && string.charAt(p) === "=")
        ++n;
    return Math.ceil(string.length * 3) / 4 - n;
};

// Base64 encoding table
var b64 = new Array(64);

// Base64 decoding table
var s64 = new Array(123);

// 65..90, 97..122, 48..57, 43, 47
for (var i = 0; i < 64;)
    s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;

/**
 * Encodes a buffer to a base64 encoded string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} Base64 encoded string
 */
base64.encode = function encode(buffer, start, end) {
    var parts = null,
        chunk = [];
    var i = 0, // output index
        j = 0, // goto index
        t;     // temporary
    while (start < end) {
        var b = buffer[start++];
        switch (j) {
            case 0:
                chunk[i++] = b64[b >> 2];
                t = (b & 3) << 4;
                j = 1;
                break;
            case 1:
                chunk[i++] = b64[t | b >> 4];
                t = (b & 15) << 2;
                j = 2;
                break;
            case 2:
                chunk[i++] = b64[t | b >> 6];
                chunk[i++] = b64[b & 63];
                j = 0;
                break;
        }
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (j) {
        chunk[i++] = b64[t];
        chunk[i++] = 61;
        if (j === 1)
            chunk[i++] = 61;
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};

var invalidEncoding = "invalid encoding";

/**
 * Decodes a base64 encoded string to a buffer.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Number of bytes written
 * @throws {Error} If encoding is invalid
 */
base64.decode = function decode(string, buffer, offset) {
    var start = offset;
    var j = 0, // goto index
        t;     // temporary
    for (var i = 0; i < string.length;) {
        var c = string.charCodeAt(i++);
        if (c === 61 && j > 1)
            break;
        if ((c = s64[c]) === undefined)
            throw Error(invalidEncoding);
        switch (j) {
            case 0:
                t = c;
                j = 1;
                break;
            case 1:
                buffer[offset++] = t << 2 | (c & 48) >> 4;
                t = c;
                j = 2;
                break;
            case 2:
                buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
                t = c;
                j = 3;
                break;
            case 3:
                buffer[offset++] = (t & 3) << 6 | c;
                j = 0;
                break;
        }
    }
    if (j === 1)
        throw Error(invalidEncoding);
    return offset - start;
};

/**
 * Tests if the specified string appears to be base64 encoded.
 * @param {string} string String to test
 * @returns {boolean} `true` if probably base64 encoded, otherwise false
 */
base64.test = function test(string) {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
};


/***/ }),

/***/ 5124:
/***/ ((module) => {

"use strict";

module.exports = codegen;

/**
 * Begins generating a function.
 * @memberof util
 * @param {string[]} functionParams Function parameter names
 * @param {string} [functionName] Function name if not anonymous
 * @returns {Codegen} Appender that appends code to the function's body
 */
function codegen(functionParams, functionName) {

    /* istanbul ignore if */
    if (typeof functionParams === "string") {
        functionName = functionParams;
        functionParams = undefined;
    }

    var body = [];

    /**
     * Appends code to the function's body or finishes generation.
     * @typedef Codegen
     * @type {function}
     * @param {string|Object.<string,*>} [formatStringOrScope] Format string or, to finish the function, an object of additional scope variables, if any
     * @param {...*} [formatParams] Format parameters
     * @returns {Codegen|Function} Itself or the generated function if finished
     * @throws {Error} If format parameter counts do not match
     */

    function Codegen(formatStringOrScope) {
        // note that explicit array handling below makes this ~50% faster

        // finish the function
        if (typeof formatStringOrScope !== "string") {
            var source = toString();
            if (codegen.verbose)
                console.log("codegen: " + source); // eslint-disable-line no-console
            source = "return " + source;
            if (formatStringOrScope) {
                var scopeKeys   = Object.keys(formatStringOrScope),
                    scopeParams = new Array(scopeKeys.length + 1),
                    scopeValues = new Array(scopeKeys.length),
                    scopeOffset = 0;
                while (scopeOffset < scopeKeys.length) {
                    scopeParams[scopeOffset] = scopeKeys[scopeOffset];
                    scopeValues[scopeOffset] = formatStringOrScope[scopeKeys[scopeOffset++]];
                }
                scopeParams[scopeOffset] = source;
                return Function.apply(null, scopeParams).apply(null, scopeValues); // eslint-disable-line no-new-func
            }
            return Function(source)(); // eslint-disable-line no-new-func
        }

        // otherwise append to body
        var formatParams = new Array(arguments.length - 1),
            formatOffset = 0;
        while (formatOffset < formatParams.length)
            formatParams[formatOffset] = arguments[++formatOffset];
        formatOffset = 0;
        formatStringOrScope = formatStringOrScope.replace(/%([%dfijs])/g, function replace($0, $1) {
            var value = formatParams[formatOffset++];
            switch ($1) {
                case "d": case "f": return String(Number(value));
                case "i": return String(Math.floor(value));
                case "j": return JSON.stringify(value);
                case "s": return String(value);
            }
            return "%";
        });
        if (formatOffset !== formatParams.length)
            throw Error("parameter count mismatch");
        body.push(formatStringOrScope);
        return Codegen;
    }

    function toString(functionNameOverride) {
        return "function " + (functionNameOverride || functionName || "") + "(" + (functionParams && functionParams.join(",") || "") + "){\n  " + body.join("\n  ") + "\n}";
    }

    Codegen.toString = toString;
    return Codegen;
}

/**
 * Begins generating a function.
 * @memberof util
 * @function codegen
 * @param {string} [functionName] Function name if not anonymous
 * @returns {Codegen} Appender that appends code to the function's body
 * @variation 2
 */

/**
 * When set to `true`, codegen will log generated code to console. Useful for debugging.
 * @name util.codegen.verbose
 * @type {boolean}
 */
codegen.verbose = false;


/***/ }),

/***/ 9211:
/***/ ((module) => {

"use strict";

module.exports = EventEmitter;

/**
 * Constructs a new event emitter instance.
 * @classdesc A minimal event emitter.
 * @memberof util
 * @constructor
 */
function EventEmitter() {

    /**
     * Registered listeners.
     * @type {Object.<string,*>}
     * @private
     */
    this._listeners = {};
}

/**
 * Registers an event listener.
 * @param {string} evt Event name
 * @param {function} fn Listener
 * @param {*} [ctx] Listener context
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.on = function on(evt, fn, ctx) {
    (this._listeners[evt] || (this._listeners[evt] = [])).push({
        fn  : fn,
        ctx : ctx || this
    });
    return this;
};

/**
 * Removes an event listener or any matching listeners if arguments are omitted.
 * @param {string} [evt] Event name. Removes all listeners if omitted.
 * @param {function} [fn] Listener to remove. Removes all listeners of `evt` if omitted.
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.off = function off(evt, fn) {
    if (evt === undefined)
        this._listeners = {};
    else {
        if (fn === undefined)
            this._listeners[evt] = [];
        else {
            var listeners = this._listeners[evt];
            for (var i = 0; i < listeners.length;)
                if (listeners[i].fn === fn)
                    listeners.splice(i, 1);
                else
                    ++i;
        }
    }
    return this;
};

/**
 * Emits an event by calling its listeners with the specified arguments.
 * @param {string} evt Event name
 * @param {...*} args Arguments
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.emit = function emit(evt) {
    var listeners = this._listeners[evt];
    if (listeners) {
        var args = [],
            i = 1;
        for (; i < arguments.length;)
            args.push(arguments[i++]);
        for (i = 0; i < listeners.length;)
            listeners[i].fn.apply(listeners[i++].ctx, args);
    }
    return this;
};


/***/ }),

/***/ 9054:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = fetch;

var asPromise = __webpack_require__(4537),
    inquire   = __webpack_require__(7199);

var fs = inquire("fs");

/**
 * Node-style callback as used by {@link util.fetch}.
 * @typedef FetchCallback
 * @type {function}
 * @param {?Error} error Error, if any, otherwise `null`
 * @param {string} [contents] File contents, if there hasn't been an error
 * @returns {undefined}
 */

/**
 * Options as used by {@link util.fetch}.
 * @typedef FetchOptions
 * @type {Object}
 * @property {boolean} [binary=false] Whether expecting a binary response
 * @property {boolean} [xhr=false] If `true`, forces the use of XMLHttpRequest
 */

/**
 * Fetches the contents of a file.
 * @memberof util
 * @param {string} filename File path or url
 * @param {FetchOptions} options Fetch options
 * @param {FetchCallback} callback Callback function
 * @returns {undefined}
 */
function fetch(filename, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    } else if (!options)
        options = {};

    if (!callback)
        return asPromise(fetch, this, filename, options); // eslint-disable-line no-invalid-this

    // if a node-like filesystem is present, try it first but fall back to XHR if nothing is found.
    if (!options.xhr && fs && fs.readFile)
        return fs.readFile(filename, function fetchReadFileCallback(err, contents) {
            return err && typeof XMLHttpRequest !== "undefined"
                ? fetch.xhr(filename, options, callback)
                : err
                ? callback(err)
                : callback(null, options.binary ? contents : contents.toString("utf8"));
        });

    // use the XHR version otherwise.
    return fetch.xhr(filename, options, callback);
}

/**
 * Fetches the contents of a file.
 * @name util.fetch
 * @function
 * @param {string} path File path or url
 * @param {FetchCallback} callback Callback function
 * @returns {undefined}
 * @variation 2
 */

/**
 * Fetches the contents of a file.
 * @name util.fetch
 * @function
 * @param {string} path File path or url
 * @param {FetchOptions} [options] Fetch options
 * @returns {Promise<string|Uint8Array>} Promise
 * @variation 3
 */

/**/
fetch.xhr = function fetch_xhr(filename, options, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange /* works everywhere */ = function fetchOnReadyStateChange() {

        if (xhr.readyState !== 4)
            return undefined;

        // local cors security errors return status 0 / empty string, too. afaik this cannot be
        // reliably distinguished from an actually empty file for security reasons. feel free
        // to send a pull request if you are aware of a solution.
        if (xhr.status !== 0 && xhr.status !== 200)
            return callback(Error("status " + xhr.status));

        // if binary data is expected, make sure that some sort of array is returned, even if
        // ArrayBuffers are not supported. the binary string fallback, however, is unsafe.
        if (options.binary) {
            var buffer = xhr.response;
            if (!buffer) {
                buffer = [];
                for (var i = 0; i < xhr.responseText.length; ++i)
                    buffer.push(xhr.responseText.charCodeAt(i) & 255);
            }
            return callback(null, typeof Uint8Array !== "undefined" ? new Uint8Array(buffer) : buffer);
        }
        return callback(null, xhr.responseText);
    };

    if (options.binary) {
        // ref: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data#Receiving_binary_data_in_older_browsers
        if ("overrideMimeType" in xhr)
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        xhr.responseType = "arraybuffer";
    }

    xhr.open("GET", filename);
    xhr.send();
};


/***/ }),

/***/ 945:
/***/ ((module) => {

"use strict";


module.exports = factory(factory);

/**
 * Reads / writes floats / doubles from / to buffers.
 * @name util.float
 * @namespace
 */

/**
 * Writes a 32 bit float to a buffer using little endian byte order.
 * @name util.float.writeFloatLE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Writes a 32 bit float to a buffer using big endian byte order.
 * @name util.float.writeFloatBE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Reads a 32 bit float from a buffer using little endian byte order.
 * @name util.float.readFloatLE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Reads a 32 bit float from a buffer using big endian byte order.
 * @name util.float.readFloatBE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Writes a 64 bit double to a buffer using little endian byte order.
 * @name util.float.writeDoubleLE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Writes a 64 bit double to a buffer using big endian byte order.
 * @name util.float.writeDoubleBE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Reads a 64 bit double from a buffer using little endian byte order.
 * @name util.float.readDoubleLE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Reads a 64 bit double from a buffer using big endian byte order.
 * @name util.float.readDoubleBE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

// Factory function for the purpose of node-based testing in modified global environments
function factory(exports) {

    // float: typed array
    if (typeof Float32Array !== "undefined") (function() {

        var f32 = new Float32Array([ -0 ]),
            f8b = new Uint8Array(f32.buffer),
            le  = f8b[3] === 128;

        function writeFloat_f32_cpy(val, buf, pos) {
            f32[0] = val;
            buf[pos    ] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
        }

        function writeFloat_f32_rev(val, buf, pos) {
            f32[0] = val;
            buf[pos    ] = f8b[3];
            buf[pos + 1] = f8b[2];
            buf[pos + 2] = f8b[1];
            buf[pos + 3] = f8b[0];
        }

        /* istanbul ignore next */
        exports.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
        /* istanbul ignore next */
        exports.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;

        function readFloat_f32_cpy(buf, pos) {
            f8b[0] = buf[pos    ];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            return f32[0];
        }

        function readFloat_f32_rev(buf, pos) {
            f8b[3] = buf[pos    ];
            f8b[2] = buf[pos + 1];
            f8b[1] = buf[pos + 2];
            f8b[0] = buf[pos + 3];
            return f32[0];
        }

        /* istanbul ignore next */
        exports.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
        /* istanbul ignore next */
        exports.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;

    // float: ieee754
    })(); else (function() {

        function writeFloat_ieee754(writeUint, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
                val = -val;
            if (val === 0)
                writeUint(1 / val > 0 ? /* positive */ 0 : /* negative 0 */ 2147483648, buf, pos);
            else if (isNaN(val))
                writeUint(2143289344, buf, pos);
            else if (val > 3.4028234663852886e+38) // +-Infinity
                writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
            else if (val < 1.1754943508222875e-38) // denormal
                writeUint((sign << 31 | Math.round(val / 1.401298464324817e-45)) >>> 0, buf, pos);
            else {
                var exponent = Math.floor(Math.log(val) / Math.LN2),
                    mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
                writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
            }
        }

        exports.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
        exports.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);

        function readFloat_ieee754(readUint, buf, pos) {
            var uint = readUint(buf, pos),
                sign = (uint >> 31) * 2 + 1,
                exponent = uint >>> 23 & 255,
                mantissa = uint & 8388607;
            return exponent === 255
                ? mantissa
                ? NaN
                : sign * Infinity
                : exponent === 0 // denormal
                ? sign * 1.401298464324817e-45 * mantissa
                : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
        }

        exports.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
        exports.readFloatBE = readFloat_ieee754.bind(null, readUintBE);

    })();

    // double: typed array
    if (typeof Float64Array !== "undefined") (function() {

        var f64 = new Float64Array([-0]),
            f8b = new Uint8Array(f64.buffer),
            le  = f8b[7] === 128;

        function writeDouble_f64_cpy(val, buf, pos) {
            f64[0] = val;
            buf[pos    ] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
            buf[pos + 4] = f8b[4];
            buf[pos + 5] = f8b[5];
            buf[pos + 6] = f8b[6];
            buf[pos + 7] = f8b[7];
        }

        function writeDouble_f64_rev(val, buf, pos) {
            f64[0] = val;
            buf[pos    ] = f8b[7];
            buf[pos + 1] = f8b[6];
            buf[pos + 2] = f8b[5];
            buf[pos + 3] = f8b[4];
            buf[pos + 4] = f8b[3];
            buf[pos + 5] = f8b[2];
            buf[pos + 6] = f8b[1];
            buf[pos + 7] = f8b[0];
        }

        /* istanbul ignore next */
        exports.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
        /* istanbul ignore next */
        exports.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;

        function readDouble_f64_cpy(buf, pos) {
            f8b[0] = buf[pos    ];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            f8b[4] = buf[pos + 4];
            f8b[5] = buf[pos + 5];
            f8b[6] = buf[pos + 6];
            f8b[7] = buf[pos + 7];
            return f64[0];
        }

        function readDouble_f64_rev(buf, pos) {
            f8b[7] = buf[pos    ];
            f8b[6] = buf[pos + 1];
            f8b[5] = buf[pos + 2];
            f8b[4] = buf[pos + 3];
            f8b[3] = buf[pos + 4];
            f8b[2] = buf[pos + 5];
            f8b[1] = buf[pos + 6];
            f8b[0] = buf[pos + 7];
            return f64[0];
        }

        /* istanbul ignore next */
        exports.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
        /* istanbul ignore next */
        exports.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;

    // double: ieee754
    })(); else (function() {

        function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
                val = -val;
            if (val === 0) {
                writeUint(0, buf, pos + off0);
                writeUint(1 / val > 0 ? /* positive */ 0 : /* negative 0 */ 2147483648, buf, pos + off1);
            } else if (isNaN(val)) {
                writeUint(0, buf, pos + off0);
                writeUint(2146959360, buf, pos + off1);
            } else if (val > 1.7976931348623157e+308) { // +-Infinity
                writeUint(0, buf, pos + off0);
                writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
            } else {
                var mantissa;
                if (val < 2.2250738585072014e-308) { // denormal
                    mantissa = val / 5e-324;
                    writeUint(mantissa >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
                } else {
                    var exponent = Math.floor(Math.log(val) / Math.LN2);
                    if (exponent === 1024)
                        exponent = 1023;
                    mantissa = val * Math.pow(2, -exponent);
                    writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
                }
            }
        }

        exports.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
        exports.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);

        function readDouble_ieee754(readUint, off0, off1, buf, pos) {
            var lo = readUint(buf, pos + off0),
                hi = readUint(buf, pos + off1);
            var sign = (hi >> 31) * 2 + 1,
                exponent = hi >>> 20 & 2047,
                mantissa = 4294967296 * (hi & 1048575) + lo;
            return exponent === 2047
                ? mantissa
                ? NaN
                : sign * Infinity
                : exponent === 0 // denormal
                ? sign * 5e-324 * mantissa
                : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
        }

        exports.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
        exports.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);

    })();

    return exports;
}

// uint helpers

function writeUintLE(val, buf, pos) {
    buf[pos    ] =  val        & 255;
    buf[pos + 1] =  val >>> 8  & 255;
    buf[pos + 2] =  val >>> 16 & 255;
    buf[pos + 3] =  val >>> 24;
}

function writeUintBE(val, buf, pos) {
    buf[pos    ] =  val >>> 24;
    buf[pos + 1] =  val >>> 16 & 255;
    buf[pos + 2] =  val >>> 8  & 255;
    buf[pos + 3] =  val        & 255;
}

function readUintLE(buf, pos) {
    return (buf[pos    ]
          | buf[pos + 1] << 8
          | buf[pos + 2] << 16
          | buf[pos + 3] << 24) >>> 0;
}

function readUintBE(buf, pos) {
    return (buf[pos    ] << 24
          | buf[pos + 1] << 16
          | buf[pos + 2] << 8
          | buf[pos + 3]) >>> 0;
}


/***/ }),

/***/ 7199:
/***/ ((module) => {

"use strict";

module.exports = inquire;

/**
 * Requires a module only if available.
 * @memberof util
 * @param {string} moduleName Module to require
 * @returns {?Object} Required module if available and not empty, otherwise `null`
 */
function inquire(moduleName) {
    try {
        var mod = eval("quire".replace(/^/,"re"))(moduleName); // eslint-disable-line no-eval
        if (mod && (mod.length || Object.keys(mod).length))
            return mod;
    } catch (e) {} // eslint-disable-line no-empty
    return null;
}


/***/ }),

/***/ 8626:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


/**
 * A minimal path module to resolve Unix, Windows and URL paths alike.
 * @memberof util
 * @namespace
 */
var path = exports;

var isAbsolute =
/**
 * Tests if the specified path is absolute.
 * @param {string} path Path to test
 * @returns {boolean} `true` if path is absolute
 */
path.isAbsolute = function isAbsolute(path) {
    return /^(?:\/|\w+:)/.test(path);
};

var normalize =
/**
 * Normalizes the specified path.
 * @param {string} path Path to normalize
 * @returns {string} Normalized path
 */
path.normalize = function normalize(path) {
    path = path.replace(/\\/g, "/")
               .replace(/\/{2,}/g, "/");
    var parts    = path.split("/"),
        absolute = isAbsolute(path),
        prefix   = "";
    if (absolute)
        prefix = parts.shift() + "/";
    for (var i = 0; i < parts.length;) {
        if (parts[i] === "..") {
            if (i > 0 && parts[i - 1] !== "..")
                parts.splice(--i, 2);
            else if (absolute)
                parts.splice(i, 1);
            else
                ++i;
        } else if (parts[i] === ".")
            parts.splice(i, 1);
        else
            ++i;
    }
    return prefix + parts.join("/");
};

/**
 * Resolves the specified include path against the specified origin path.
 * @param {string} originPath Path to the origin file
 * @param {string} includePath Include path relative to origin path
 * @param {boolean} [alreadyNormalized=false] `true` if both paths are already known to be normalized
 * @returns {string} Path to the include file
 */
path.resolve = function resolve(originPath, includePath, alreadyNormalized) {
    if (!alreadyNormalized)
        includePath = normalize(includePath);
    if (isAbsolute(includePath))
        return includePath;
    if (!alreadyNormalized)
        originPath = normalize(originPath);
    return (originPath = originPath.replace(/(?:\/|^)[^/]+$/, "")).length ? normalize(originPath + "/" + includePath) : includePath;
};


/***/ }),

/***/ 6662:
/***/ ((module) => {

"use strict";

module.exports = pool;

/**
 * An allocator as used by {@link util.pool}.
 * @typedef PoolAllocator
 * @type {function}
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */

/**
 * A slicer as used by {@link util.pool}.
 * @typedef PoolSlicer
 * @type {function}
 * @param {number} start Start offset
 * @param {number} end End offset
 * @returns {Uint8Array} Buffer slice
 * @this {Uint8Array}
 */

/**
 * A general purpose buffer pool.
 * @memberof util
 * @function
 * @param {PoolAllocator} alloc Allocator
 * @param {PoolSlicer} slice Slicer
 * @param {number} [size=8192] Slab size
 * @returns {PoolAllocator} Pooled allocator
 */
function pool(alloc, slice, size) {
    var SIZE   = size || 8192;
    var MAX    = SIZE >>> 1;
    var slab   = null;
    var offset = SIZE;
    return function pool_alloc(size) {
        if (size < 1 || size > MAX)
            return alloc(size);
        if (offset + size > SIZE) {
            slab = alloc(SIZE);
            offset = 0;
        }
        var buf = slice.call(slab, offset, offset += size);
        if (offset & 7) // align to 32 bit
            offset = (offset | 7) + 1;
        return buf;
    };
}


/***/ }),

/***/ 4997:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


/**
 * A minimal UTF8 implementation for number arrays.
 * @memberof util
 * @namespace
 */
var utf8 = exports;

/**
 * Calculates the UTF8 byte length of a string.
 * @param {string} string String
 * @returns {number} Byte length
 */
utf8.length = function utf8_length(string) {
    var len = 0,
        c = 0;
    for (var i = 0; i < string.length; ++i) {
        c = string.charCodeAt(i);
        if (c < 128)
            len += 1;
        else if (c < 2048)
            len += 2;
        else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
            ++i;
            len += 4;
        } else
            len += 3;
    }
    return len;
};

/**
 * Reads UTF8 bytes as a string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
utf8.read = function utf8_read(buffer, start, end) {
    var len = end - start;
    if (len < 1)
        return "";
    var parts = null,
        chunk = [],
        i = 0, // char offset
        t;     // temporary
    while (start < end) {
        t = buffer[start++];
        if (t < 128)
            chunk[i++] = t;
        else if (t > 191 && t < 224)
            chunk[i++] = (t & 31) << 6 | buffer[start++] & 63;
        else if (t > 239 && t < 365) {
            t = ((t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 0x10000;
            chunk[i++] = 0xD800 + (t >> 10);
            chunk[i++] = 0xDC00 + (t & 1023);
        } else
            chunk[i++] = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};

/**
 * Writes a string as UTF8 bytes.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
utf8.write = function utf8_write(string, buffer, offset) {
    var start = offset,
        c1, // character 1
        c2; // character 2
    for (var i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
            buffer[offset++] = c1;
        } else if (c1 < 2048) {
            buffer[offset++] = c1 >> 6       | 192;
            buffer[offset++] = c1       & 63 | 128;
        } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
            c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
            ++i;
            buffer[offset++] = c1 >> 18      | 240;
            buffer[offset++] = c1 >> 12 & 63 | 128;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        } else {
            buffer[offset++] = c1 >> 12      | 224;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        }
    }
    return offset - start;
};


/***/ }),

/***/ 556:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const { encodeText } = __webpack_require__(2413)

/** @typedef {import('./types').CodecFactory} CodecFactory */
/** @typedef {import("./types").BaseName} BaseName */
/** @typedef {import("./types").BaseCode} BaseCode */

/**
 * Class to encode/decode in the supported Bases
 *
 */
class Base {
  /**
   * @param {BaseName} name
   * @param {BaseCode} code
   * @param {CodecFactory} factory
   * @param {string} alphabet
   */
  constructor (name, code, factory, alphabet) {
    this.name = name
    this.code = code
    this.codeBuf = encodeText(this.code)
    this.alphabet = alphabet
    this.codec = factory(alphabet)
  }

  /**
   * @param {Uint8Array} buf
   * @returns {string}
   */
  encode (buf) {
    return this.codec.encode(buf)
  }

  /**
   * @param {string} string
   * @returns {Uint8Array}
   */
  decode (string) {
    for (const char of string) {
      if (this.alphabet && this.alphabet.indexOf(char) < 0) {
        throw new Error(`invalid character '${char}' in '${string}'`)
      }
    }
    return this.codec.decode(string)
  }
}

module.exports = Base


/***/ }),

/***/ 5077:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


const baseX = __webpack_require__(8820)
const Base = __webpack_require__(556)
const { rfc4648 } = __webpack_require__(6727)
const { decodeText, encodeText } = __webpack_require__(2413)

/** @typedef {import('./types').CodecFactory} CodecFactory */
/** @typedef {import('./types').Codec} Codec */
/** @typedef {import('./types').BaseName} BaseName */
/** @typedef {import('./types').BaseCode} BaseCode */

/** @type {CodecFactory} */
const identity = () => {
  return {
    encode: decodeText,
    decode: encodeText
  }
}

/**
 *
 * name, code, implementation, alphabet
 *
 * @type {Array<[BaseName, BaseCode, CodecFactory, string]>}
 */
const constants = [
  ['identity', '\x00', identity, ''],
  ['base2', '0', rfc4648(1), '01'],
  ['base8', '7', rfc4648(3), '01234567'],
  ['base10', '9', baseX, '0123456789'],
  ['base16', 'f', rfc4648(4), '0123456789abcdef'],
  ['base16upper', 'F', rfc4648(4), '0123456789ABCDEF'],
  ['base32hex', 'v', rfc4648(5), '0123456789abcdefghijklmnopqrstuv'],
  ['base32hexupper', 'V', rfc4648(5), '0123456789ABCDEFGHIJKLMNOPQRSTUV'],
  ['base32hexpad', 't', rfc4648(5), '0123456789abcdefghijklmnopqrstuv='],
  ['base32hexpadupper', 'T', rfc4648(5), '0123456789ABCDEFGHIJKLMNOPQRSTUV='],
  ['base32', 'b', rfc4648(5), 'abcdefghijklmnopqrstuvwxyz234567'],
  ['base32upper', 'B', rfc4648(5), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'],
  ['base32pad', 'c', rfc4648(5), 'abcdefghijklmnopqrstuvwxyz234567='],
  ['base32padupper', 'C', rfc4648(5), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567='],
  ['base32z', 'h', rfc4648(5), 'ybndrfg8ejkmcpqxot1uwisza345h769'],
  ['base36', 'k', baseX, '0123456789abcdefghijklmnopqrstuvwxyz'],
  ['base36upper', 'K', baseX, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  ['base58btc', 'z', baseX, '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'],
  ['base58flickr', 'Z', baseX, '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'],
  ['base64', 'm', rfc4648(6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'],
  ['base64pad', 'M', rfc4648(6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='],
  ['base64url', 'u', rfc4648(6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'],
  ['base64urlpad', 'U', rfc4648(6), 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=']
]

/** @type {Record<BaseName,Base>} */
const names = constants.reduce((prev, tupple) => {
  prev[tupple[0]] = new Base(tupple[0], tupple[1], tupple[2], tupple[3])
  return prev
}, /** @type {Record<BaseName,Base>} */({}))

/** @type {Record<BaseCode,Base>} */
const codes = constants.reduce((prev, tupple) => {
  prev[tupple[1]] = names[tupple[0]]
  return prev
}, /** @type {Record<BaseCode,Base>} */({}))

module.exports = {
  names,
  codes
}


/***/ }),

/***/ 6957:
/***/ ((module, exports, __webpack_require__) => {

"use strict";
/**
 * Implementation of the [multibase](https://github.com/multiformats/multibase) specification.
 *
 */


const constants = __webpack_require__(5077)
const { encodeText, decodeText, concat } = __webpack_require__(2413)

/** @typedef {import('./base')} Base */
/** @typedef {import("./types").BaseNameOrCode} BaseNameOrCode */
/** @typedef {import("./types").BaseCode} BaseCode */
/** @typedef {import("./types").BaseName} BaseName */

/**
 * Create a new Uint8Array with the multibase varint+code.
 *
 * @param {BaseNameOrCode} nameOrCode - The multibase name or code number.
 * @param {Uint8Array} buf - The data to be prefixed with multibase.
 * @returns {Uint8Array}
 * @throws {Error} Will throw if the encoding is not supported
 */
function multibase (nameOrCode, buf) {
  if (!buf) {
    throw new Error('requires an encoded Uint8Array')
  }
  const { name, codeBuf } = encoding(nameOrCode)
  validEncode(name, buf)

  return concat([codeBuf, buf], codeBuf.length + buf.length)
}

/**
 * Encode data with the specified base and add the multibase prefix.
 *
 * @param {BaseNameOrCode} nameOrCode - The multibase name or code number.
 * @param {Uint8Array} buf - The data to be encoded.
 * @returns {Uint8Array}
 * @throws {Error} Will throw if the encoding is not supported
 *
 */
function encode (nameOrCode, buf) {
  const enc = encoding(nameOrCode)
  const data = encodeText(enc.encode(buf))

  return concat([enc.codeBuf, data], enc.codeBuf.length + data.length)
}

/**
 * Takes a Uint8Array or string encoded with multibase header, decodes it and
 * returns the decoded buffer
 *
 * @param {Uint8Array|string} data
 * @returns {Uint8Array}
 * @throws {Error} Will throw if the encoding is not supported
 *
 */
function decode (data) {
  if (data instanceof Uint8Array) {
    data = decodeText(data)
  }
  const prefix = data[0]

  // Make all encodings case-insensitive except the ones that include upper and lower chars in the alphabet
  if (['f', 'F', 'v', 'V', 't', 'T', 'b', 'B', 'c', 'C', 'h', 'k', 'K'].includes(prefix)) {
    data = data.toLowerCase()
  }
  const enc = encoding(/** @type {BaseCode} */(data[0]))
  return enc.decode(data.substring(1))
}

/**
 * Is the given data multibase encoded?
 *
 * @param {Uint8Array|string} data
 */
function isEncoded (data) {
  if (data instanceof Uint8Array) {
    data = decodeText(data)
  }

  // Ensure bufOrString is a string
  if (Object.prototype.toString.call(data) !== '[object String]') {
    return false
  }

  try {
    const enc = encoding(/** @type {BaseCode} */(data[0]))
    return enc.name
  } catch (err) {
    return false
  }
}

/**
 * Validate encoded data
 *
 * @param {BaseNameOrCode} name
 * @param {Uint8Array} buf
 * @returns {void}
 * @throws {Error} Will throw if the encoding is not supported
 */
function validEncode (name, buf) {
  const enc = encoding(name)
  enc.decode(decodeText(buf))
}

/**
 * Get the encoding by name or code
 *
 * @param {BaseNameOrCode} nameOrCode
 * @returns {Base}
 * @throws {Error} Will throw if the encoding is not supported
 */
function encoding (nameOrCode) {
  if (Object.prototype.hasOwnProperty.call(constants.names, /** @type {BaseName} */(nameOrCode))) {
    return constants.names[/** @type {BaseName} */(nameOrCode)]
  } else if (Object.prototype.hasOwnProperty.call(constants.codes, /** @type {BaseCode} */(nameOrCode))) {
    return constants.codes[/** @type {BaseCode} */(nameOrCode)]
  } else {
    throw new Error(`Unsupported encoding: ${nameOrCode}`)
  }
}

/**
 * Get encoding from data
 *
 * @param {string|Uint8Array} data
 * @returns {Base}
 * @throws {Error} Will throw if the encoding is not supported
 */
function encodingFromData (data) {
  if (data instanceof Uint8Array) {
    data = decodeText(data)
  }

  return encoding(/** @type {BaseCode} */(data[0]))
}

exports = module.exports = multibase
exports.encode = encode
exports.decode = decode
exports.isEncoded = isEncoded
exports.encoding = encoding
exports.encodingFromData = encodingFromData
const names = Object.freeze(constants.names)
const codes = Object.freeze(constants.codes)
exports.names = names
exports.codes = codes


/***/ }),

/***/ 6727:
/***/ ((module) => {

"use strict";


/** @typedef {import('./types').CodecFactory} CodecFactory */

/**
 * @param {string} string
 * @param {string} alphabet
 * @param {number} bitsPerChar
 * @returns {Uint8Array}
 */
const decode = (string, alphabet, bitsPerChar) => {
  // Build the character lookup table:
  /** @type {Record<string, number>} */
  const codes = {}
  for (let i = 0; i < alphabet.length; ++i) {
    codes[alphabet[i]] = i
  }

  // Count the padding bytes:
  let end = string.length
  while (string[end - 1] === '=') {
    --end
  }

  // Allocate the output:
  const out = new Uint8Array((end * bitsPerChar / 8) | 0)

  // Parse the data:
  let bits = 0 // Number of bits currently in the buffer
  let buffer = 0 // Bits waiting to be written out, MSB first
  let written = 0 // Next byte to write
  for (let i = 0; i < end; ++i) {
    // Read one character from the string:
    const value = codes[string[i]]
    if (value === undefined) {
      throw new SyntaxError('Invalid character ' + string[i])
    }

    // Append the bits to the buffer:
    buffer = (buffer << bitsPerChar) | value
    bits += bitsPerChar

    // Write out some bits if the buffer has a byte's worth:
    if (bits >= 8) {
      bits -= 8
      out[written++] = 0xff & (buffer >> bits)
    }
  }

  // Verify that we have received just enough bits:
  if (bits >= bitsPerChar || 0xff & (buffer << (8 - bits))) {
    throw new SyntaxError('Unexpected end of data')
  }

  return out
}

/**
 * @param {Uint8Array} data
 * @param {string} alphabet
 * @param {number} bitsPerChar
 * @returns {string}
 */
const encode = (data, alphabet, bitsPerChar) => {
  const pad = alphabet[alphabet.length - 1] === '='
  const mask = (1 << bitsPerChar) - 1
  let out = ''

  let bits = 0 // Number of bits currently in the buffer
  let buffer = 0 // Bits waiting to be written out, MSB first
  for (let i = 0; i < data.length; ++i) {
    // Slurp data into the buffer:
    buffer = (buffer << 8) | data[i]
    bits += 8

    // Write out as much as we can:
    while (bits > bitsPerChar) {
      bits -= bitsPerChar
      out += alphabet[mask & (buffer >> bits)]
    }
  }

  // Partial character:
  if (bits) {
    out += alphabet[mask & (buffer << (bitsPerChar - bits))]
  }

  // Add padding characters until we hit a byte boundary:
  if (pad) {
    while ((out.length * bitsPerChar) & 7) {
      out += '='
    }
  }

  return out
}

/**
 * RFC4648 Factory
 *
 * @param {number} bitsPerChar
 * @returns {CodecFactory}
 */
const rfc4648 = (bitsPerChar) => (alphabet) => {
  return {
    /**
     * @param {Uint8Array} input
     * @returns {string}
     */
    encode (input) {
      return encode(input, alphabet, bitsPerChar)
    },
    /**
     * @param {string} input
     * @returns {Uint8Array}
     */
    decode (input) {
      return decode(input, alphabet, bitsPerChar)
    }
  }
}

module.exports = { rfc4648 }


/***/ }),

/***/ 2413:
/***/ ((module) => {

"use strict";


const textDecoder = new TextDecoder()
/**
 * @param {ArrayBufferView|ArrayBuffer} bytes
 * @returns {string}
 */
const decodeText = (bytes) => textDecoder.decode(bytes)

const textEncoder = new TextEncoder()
/**
 * @param {string} text
 * @returns {Uint8Array}
 */
const encodeText = (text) => textEncoder.encode(text)

/**
 * Returns a new Uint8Array created by concatenating the passed Arrays
 *
 * @param {Array<ArrayLike<number>>} arrs
 * @param {number} length
 * @returns {Uint8Array}
 */
function concat (arrs, length) {
  const output = new Uint8Array(length)
  let offset = 0

  for (const arr of arrs) {
    output.set(arr, offset)
    offset += arr.length
  }

  return output
}

module.exports = { decodeText, encodeText, concat }


/***/ }),

/***/ 4492:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// light library entry point.


module.exports = __webpack_require__(8836);

/***/ }),

/***/ 2100:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
// minimal library entry point.


module.exports = __webpack_require__(9482);


/***/ }),

/***/ 3996:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

/**
 * Runtime message from/to plain object converters.
 * @namespace
 */
var converter = exports;

var Enum = __webpack_require__(7025),
    util = __webpack_require__(9935);

/**
 * Generates a partial value fromObject conveter.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {number} fieldIndex Field index
 * @param {string} prop Property reference
 * @returns {Codegen} Codegen instance
 * @ignore
 */
function genValuePartial_fromObject(gen, field, fieldIndex, prop) {
    /* eslint-disable no-unexpected-multiline, block-scoped-var, no-redeclare */
    if (field.resolvedType) {
        if (field.resolvedType instanceof Enum) { gen
            ("switch(d%s){", prop);
            for (var values = field.resolvedType.values, keys = Object.keys(values), i = 0; i < keys.length; ++i) {
                if (field.repeated && values[keys[i]] === field.typeDefault) gen
                ("default:");
                gen
                ("case%j:", keys[i])
                ("case %i:", values[keys[i]])
                    ("m%s=%j", prop, values[keys[i]])
                    ("break");
            } gen
            ("}");
        } else gen
            ("if(typeof d%s!==\"object\")", prop)
                ("throw TypeError(%j)", field.fullName + ": object expected")
            ("m%s=types[%i].fromObject(d%s)", prop, fieldIndex, prop);
    } else {
        var isUnsigned = false;
        switch (field.type) {
            case "double":
            case "float": gen
                ("m%s=Number(d%s)", prop, prop); // also catches "NaN", "Infinity"
                break;
            case "uint32":
            case "fixed32": gen
                ("m%s=d%s>>>0", prop, prop);
                break;
            case "int32":
            case "sint32":
            case "sfixed32": gen
                ("m%s=d%s|0", prop, prop);
                break;
            case "uint64":
                isUnsigned = true;
                // eslint-disable-line no-fallthrough
            case "int64":
            case "sint64":
            case "fixed64":
            case "sfixed64": gen
                ("if(util.Long)")
                    ("(m%s=util.Long.fromValue(d%s)).unsigned=%j", prop, prop, isUnsigned)
                ("else if(typeof d%s===\"string\")", prop)
                    ("m%s=parseInt(d%s,10)", prop, prop)
                ("else if(typeof d%s===\"number\")", prop)
                    ("m%s=d%s", prop, prop)
                ("else if(typeof d%s===\"object\")", prop)
                    ("m%s=new util.LongBits(d%s.low>>>0,d%s.high>>>0).toNumber(%s)", prop, prop, prop, isUnsigned ? "true" : "");
                break;
            case "bytes": gen
                ("if(typeof d%s===\"string\")", prop)
                    ("util.base64.decode(d%s,m%s=util.newBuffer(util.base64.length(d%s)),0)", prop, prop, prop)
                ("else if(d%s.length)", prop)
                    ("m%s=d%s", prop, prop);
                break;
            case "string": gen
                ("m%s=String(d%s)", prop, prop);
                break;
            case "bool": gen
                ("m%s=Boolean(d%s)", prop, prop);
                break;
            /* default: gen
                ("m%s=d%s", prop, prop);
                break; */
        }
    }
    return gen;
    /* eslint-enable no-unexpected-multiline, block-scoped-var, no-redeclare */
}

/**
 * Generates a plain object to runtime message converter specific to the specified message type.
 * @param {Type} mtype Message type
 * @returns {Codegen} Codegen instance
 */
converter.fromObject = function fromObject(mtype) {
    /* eslint-disable no-unexpected-multiline, block-scoped-var, no-redeclare */
    var fields = mtype.fieldsArray;
    var gen = util.codegen(["d"], mtype.name + "$fromObject")
    ("if(d instanceof this.ctor)")
        ("return d");
    if (!fields.length) return gen
    ("return new this.ctor");
    gen
    ("var m=new this.ctor");
    for (var i = 0; i < fields.length; ++i) {
        var field  = fields[i].resolve(),
            prop   = util.safeProp(field.name);

        // Map fields
        if (field.map) { gen
    ("if(d%s){", prop)
        ("if(typeof d%s!==\"object\")", prop)
            ("throw TypeError(%j)", field.fullName + ": object expected")
        ("m%s={}", prop)
        ("for(var ks=Object.keys(d%s),i=0;i<ks.length;++i){", prop);
            genValuePartial_fromObject(gen, field, /* not sorted */ i, prop + "[ks[i]]")
        ("}")
    ("}");

        // Repeated fields
        } else if (field.repeated) { gen
    ("if(d%s){", prop)
        ("if(!Array.isArray(d%s))", prop)
            ("throw TypeError(%j)", field.fullName + ": array expected")
        ("m%s=[]", prop)
        ("for(var i=0;i<d%s.length;++i){", prop);
            genValuePartial_fromObject(gen, field, /* not sorted */ i, prop + "[i]")
        ("}")
    ("}");

        // Non-repeated fields
        } else {
            if (!(field.resolvedType instanceof Enum)) gen // no need to test for null/undefined if an enum (uses switch)
    ("if(d%s!=null){", prop); // !== undefined && !== null
        genValuePartial_fromObject(gen, field, /* not sorted */ i, prop);
            if (!(field.resolvedType instanceof Enum)) gen
    ("}");
        }
    } return gen
    ("return m");
    /* eslint-enable no-unexpected-multiline, block-scoped-var, no-redeclare */
};

/**
 * Generates a partial value toObject converter.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {number} fieldIndex Field index
 * @param {string} prop Property reference
 * @returns {Codegen} Codegen instance
 * @ignore
 */
function genValuePartial_toObject(gen, field, fieldIndex, prop) {
    /* eslint-disable no-unexpected-multiline, block-scoped-var, no-redeclare */
    if (field.resolvedType) {
        if (field.resolvedType instanceof Enum) gen
            ("d%s=o.enums===String?types[%i].values[m%s]:m%s", prop, fieldIndex, prop, prop);
        else gen
            ("d%s=types[%i].toObject(m%s,o)", prop, fieldIndex, prop);
    } else {
        var isUnsigned = false;
        switch (field.type) {
            case "double":
            case "float": gen
            ("d%s=o.json&&!isFinite(m%s)?String(m%s):m%s", prop, prop, prop, prop);
                break;
            case "uint64":
                isUnsigned = true;
                // eslint-disable-line no-fallthrough
            case "int64":
            case "sint64":
            case "fixed64":
            case "sfixed64": gen
            ("if(typeof m%s===\"number\")", prop)
                ("d%s=o.longs===String?String(m%s):m%s", prop, prop, prop)
            ("else") // Long-like
                ("d%s=o.longs===String?util.Long.prototype.toString.call(m%s):o.longs===Number?new util.LongBits(m%s.low>>>0,m%s.high>>>0).toNumber(%s):m%s", prop, prop, prop, prop, isUnsigned ? "true": "", prop);
                break;
            case "bytes": gen
            ("d%s=o.bytes===String?util.base64.encode(m%s,0,m%s.length):o.bytes===Array?Array.prototype.slice.call(m%s):m%s", prop, prop, prop, prop, prop);
                break;
            default: gen
            ("d%s=m%s", prop, prop);
                break;
        }
    }
    return gen;
    /* eslint-enable no-unexpected-multiline, block-scoped-var, no-redeclare */
}

/**
 * Generates a runtime message to plain object converter specific to the specified message type.
 * @param {Type} mtype Message type
 * @returns {Codegen} Codegen instance
 */
converter.toObject = function toObject(mtype) {
    /* eslint-disable no-unexpected-multiline, block-scoped-var, no-redeclare */
    var fields = mtype.fieldsArray.slice().sort(util.compareFieldsById);
    if (!fields.length)
        return util.codegen()("return {}");
    var gen = util.codegen(["m", "o"], mtype.name + "$toObject")
    ("if(!o)")
        ("o={}")
    ("var d={}");

    var repeatedFields = [],
        mapFields = [],
        normalFields = [],
        i = 0;
    for (; i < fields.length; ++i)
        if (!fields[i].partOf)
            ( fields[i].resolve().repeated ? repeatedFields
            : fields[i].map ? mapFields
            : normalFields).push(fields[i]);

    if (repeatedFields.length) { gen
    ("if(o.arrays||o.defaults){");
        for (i = 0; i < repeatedFields.length; ++i) gen
        ("d%s=[]", util.safeProp(repeatedFields[i].name));
        gen
    ("}");
    }

    if (mapFields.length) { gen
    ("if(o.objects||o.defaults){");
        for (i = 0; i < mapFields.length; ++i) gen
        ("d%s={}", util.safeProp(mapFields[i].name));
        gen
    ("}");
    }

    if (normalFields.length) { gen
    ("if(o.defaults){");
        for (i = 0; i < normalFields.length; ++i) {
            var field = normalFields[i],
                prop  = util.safeProp(field.name);
            if (field.resolvedType instanceof Enum) gen
        ("d%s=o.enums===String?%j:%j", prop, field.resolvedType.valuesById[field.typeDefault], field.typeDefault);
            else if (field.long) gen
        ("if(util.Long){")
            ("var n=new util.Long(%i,%i,%j)", field.typeDefault.low, field.typeDefault.high, field.typeDefault.unsigned)
            ("d%s=o.longs===String?n.toString():o.longs===Number?n.toNumber():n", prop)
        ("}else")
            ("d%s=o.longs===String?%j:%i", prop, field.typeDefault.toString(), field.typeDefault.toNumber());
            else if (field.bytes) {
                var arrayDefault = "[" + Array.prototype.slice.call(field.typeDefault).join(",") + "]";
                gen
        ("if(o.bytes===String)d%s=%j", prop, String.fromCharCode.apply(String, field.typeDefault))
        ("else{")
            ("d%s=%s", prop, arrayDefault)
            ("if(o.bytes!==Array)d%s=util.newBuffer(d%s)", prop, prop)
        ("}");
            } else gen
        ("d%s=%j", prop, field.typeDefault); // also messages (=null)
        } gen
    ("}");
    }
    var hasKs2 = false;
    for (i = 0; i < fields.length; ++i) {
        var field = fields[i],
            index = mtype._fieldsArray.indexOf(field),
            prop  = util.safeProp(field.name);
        if (field.map) {
            if (!hasKs2) { hasKs2 = true; gen
    ("var ks2");
            } gen
    ("if(m%s&&(ks2=Object.keys(m%s)).length){", prop, prop)
        ("d%s={}", prop)
        ("for(var j=0;j<ks2.length;++j){");
            genValuePartial_toObject(gen, field, /* sorted */ index, prop + "[ks2[j]]")
        ("}");
        } else if (field.repeated) { gen
    ("if(m%s&&m%s.length){", prop, prop)
        ("d%s=[]", prop)
        ("for(var j=0;j<m%s.length;++j){", prop);
            genValuePartial_toObject(gen, field, /* sorted */ index, prop + "[j]")
        ("}");
        } else { gen
    ("if(m%s!=null&&m.hasOwnProperty(%j)){", prop, field.name); // !== undefined && !== null
        genValuePartial_toObject(gen, field, /* sorted */ index, prop);
        if (field.partOf) gen
        ("if(o.oneofs)")
            ("d%s=%j", util.safeProp(field.partOf.name), field.name);
        }
        gen
    ("}");
    }
    return gen
    ("return d");
    /* eslint-enable no-unexpected-multiline, block-scoped-var, no-redeclare */
};


/***/ }),

/***/ 5305:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = decoder;

var Enum    = __webpack_require__(7025),
    types   = __webpack_require__(7063),
    util    = __webpack_require__(9935);

function missing(field) {
    return "missing required '" + field.name + "'";
}

/**
 * Generates a decoder specific to the specified message type.
 * @param {Type} mtype Message type
 * @returns {Codegen} Codegen instance
 */
function decoder(mtype) {
    /* eslint-disable no-unexpected-multiline */
    var gen = util.codegen(["r", "l"], mtype.name + "$decode")
    ("if(!(r instanceof Reader))")
        ("r=Reader.create(r)")
    ("var c=l===undefined?r.len:r.pos+l,m=new this.ctor" + (mtype.fieldsArray.filter(function(field) { return field.map; }).length ? ",k,value" : ""))
    ("while(r.pos<c){")
        ("var t=r.uint32()");
    if (mtype.group) gen
        ("if((t&7)===4)")
            ("break");
    gen
        ("switch(t>>>3){");

    var i = 0;
    for (; i < /* initializes */ mtype.fieldsArray.length; ++i) {
        var field = mtype._fieldsArray[i].resolve(),
            type  = field.resolvedType instanceof Enum ? "int32" : field.type,
            ref   = "m" + util.safeProp(field.name); gen
            ("case %i:", field.id);

        // Map fields
        if (field.map) { gen
                ("if(%s===util.emptyObject)", ref)
                    ("%s={}", ref)
                ("var c2 = r.uint32()+r.pos");

            if (types.defaults[field.keyType] !== undefined) gen
                ("k=%j", types.defaults[field.keyType]);
            else gen
                ("k=null");

            if (types.defaults[type] !== undefined) gen
                ("value=%j", types.defaults[type]);
            else gen
                ("value=null");

            gen
                ("while(r.pos<c2){")
                    ("var tag2=r.uint32()")
                    ("switch(tag2>>>3){")
                        ("case 1: k=r.%s(); break", field.keyType)
                        ("case 2:");

            if (types.basic[type] === undefined) gen
                            ("value=types[%i].decode(r,r.uint32())", i); // can't be groups
            else gen
                            ("value=r.%s()", type);

            gen
                            ("break")
                        ("default:")
                            ("r.skipType(tag2&7)")
                            ("break")
                    ("}")
                ("}");

            if (types.long[field.keyType] !== undefined) gen
                ("%s[typeof k===\"object\"?util.longToHash(k):k]=value", ref);
            else gen
                ("%s[k]=value", ref);

        // Repeated fields
        } else if (field.repeated) { gen

                ("if(!(%s&&%s.length))", ref, ref)
                    ("%s=[]", ref);

            // Packable (always check for forward and backward compatiblity)
            if (types.packed[type] !== undefined) gen
                ("if((t&7)===2){")
                    ("var c2=r.uint32()+r.pos")
                    ("while(r.pos<c2)")
                        ("%s.push(r.%s())", ref, type)
                ("}else");

            // Non-packed
            if (types.basic[type] === undefined) gen(field.resolvedType.group
                    ? "%s.push(types[%i].decode(r))"
                    : "%s.push(types[%i].decode(r,r.uint32()))", ref, i);
            else gen
                    ("%s.push(r.%s())", ref, type);

        // Non-repeated
        } else if (types.basic[type] === undefined) gen(field.resolvedType.group
                ? "%s=types[%i].decode(r)"
                : "%s=types[%i].decode(r,r.uint32())", ref, i);
        else gen
                ("%s=r.%s()", ref, type);
        gen
                ("break");
    // Unknown fields
    } gen
            ("default:")
                ("r.skipType(t&7)")
                ("break")

        ("}")
    ("}");

    // Field presence
    for (i = 0; i < mtype._fieldsArray.length; ++i) {
        var rfield = mtype._fieldsArray[i];
        if (rfield.required) gen
    ("if(!m.hasOwnProperty(%j))", rfield.name)
        ("throw util.ProtocolError(%j,{instance:m})", missing(rfield));
    }

    return gen
    ("return m");
    /* eslint-enable no-unexpected-multiline */
}


/***/ }),

/***/ 4928:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = encoder;

var Enum     = __webpack_require__(7025),
    types    = __webpack_require__(7063),
    util     = __webpack_require__(9935);

/**
 * Generates a partial message type encoder.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {number} fieldIndex Field index
 * @param {string} ref Variable reference
 * @returns {Codegen} Codegen instance
 * @ignore
 */
function genTypePartial(gen, field, fieldIndex, ref) {
    return field.resolvedType.group
        ? gen("types[%i].encode(%s,w.uint32(%i)).uint32(%i)", fieldIndex, ref, (field.id << 3 | 3) >>> 0, (field.id << 3 | 4) >>> 0)
        : gen("types[%i].encode(%s,w.uint32(%i).fork()).ldelim()", fieldIndex, ref, (field.id << 3 | 2) >>> 0);
}

/**
 * Generates an encoder specific to the specified message type.
 * @param {Type} mtype Message type
 * @returns {Codegen} Codegen instance
 */
function encoder(mtype) {
    /* eslint-disable no-unexpected-multiline, block-scoped-var, no-redeclare */
    var gen = util.codegen(["m", "w"], mtype.name + "$encode")
    ("if(!w)")
        ("w=Writer.create()");

    var i, ref;

    // "when a message is serialized its known fields should be written sequentially by field number"
    var fields = /* initializes */ mtype.fieldsArray.slice().sort(util.compareFieldsById);

    for (var i = 0; i < fields.length; ++i) {
        var field    = fields[i].resolve(),
            index    = mtype._fieldsArray.indexOf(field),
            type     = field.resolvedType instanceof Enum ? "int32" : field.type,
            wireType = types.basic[type];
            ref      = "m" + util.safeProp(field.name);

        // Map fields
        if (field.map) {
            gen
    ("if(%s!=null&&Object.hasOwnProperty.call(m,%j)){", ref, field.name) // !== undefined && !== null
        ("for(var ks=Object.keys(%s),i=0;i<ks.length;++i){", ref)
            ("w.uint32(%i).fork().uint32(%i).%s(ks[i])", (field.id << 3 | 2) >>> 0, 8 | types.mapKey[field.keyType], field.keyType);
            if (wireType === undefined) gen
            ("types[%i].encode(%s[ks[i]],w.uint32(18).fork()).ldelim().ldelim()", index, ref); // can't be groups
            else gen
            (".uint32(%i).%s(%s[ks[i]]).ldelim()", 16 | wireType, type, ref);
            gen
        ("}")
    ("}");

            // Repeated fields
        } else if (field.repeated) { gen
    ("if(%s!=null&&%s.length){", ref, ref); // !== undefined && !== null

            // Packed repeated
            if (field.packed && types.packed[type] !== undefined) { gen

        ("w.uint32(%i).fork()", (field.id << 3 | 2) >>> 0)
        ("for(var i=0;i<%s.length;++i)", ref)
            ("w.%s(%s[i])", type, ref)
        ("w.ldelim()");

            // Non-packed
            } else { gen

        ("for(var i=0;i<%s.length;++i)", ref);
                if (wireType === undefined)
            genTypePartial(gen, field, index, ref + "[i]");
                else gen
            ("w.uint32(%i).%s(%s[i])", (field.id << 3 | wireType) >>> 0, type, ref);

            } gen
    ("}");

        // Non-repeated
        } else {
            if (field.optional) gen
    ("if(%s!=null&&Object.hasOwnProperty.call(m,%j))", ref, field.name); // !== undefined && !== null

            if (wireType === undefined)
        genTypePartial(gen, field, index, ref);
            else gen
        ("w.uint32(%i).%s(%s)", (field.id << 3 | wireType) >>> 0, type, ref);

        }
    }

    return gen
    ("return w");
    /* eslint-enable no-unexpected-multiline, block-scoped-var, no-redeclare */
}


/***/ }),

/***/ 7025:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = Enum;

// extends ReflectionObject
var ReflectionObject = __webpack_require__(3243);
((Enum.prototype = Object.create(ReflectionObject.prototype)).constructor = Enum).className = "Enum";

var Namespace = __webpack_require__(9313),
    util = __webpack_require__(9935);

/**
 * Constructs a new enum instance.
 * @classdesc Reflected enum.
 * @extends ReflectionObject
 * @constructor
 * @param {string} name Unique name within its namespace
 * @param {Object.<string,number>} [values] Enum values as an object, by name
 * @param {Object.<string,*>} [options] Declared options
 * @param {string} [comment] The comment for this enum
 * @param {Object.<string,string>} [comments] The value comments for this enum
 */
function Enum(name, values, options, comment, comments) {
    ReflectionObject.call(this, name, options);

    if (values && typeof values !== "object")
        throw TypeError("values must be an object");

    /**
     * Enum values by id.
     * @type {Object.<number,string>}
     */
    this.valuesById = {};

    /**
     * Enum values by name.
     * @type {Object.<string,number>}
     */
    this.values = Object.create(this.valuesById); // toJSON, marker

    /**
     * Enum comment text.
     * @type {string|null}
     */
    this.comment = comment;

    /**
     * Value comment texts, if any.
     * @type {Object.<string,string>}
     */
    this.comments = comments || {};

    /**
     * Reserved ranges, if any.
     * @type {Array.<number[]|string>}
     */
    this.reserved = undefined; // toJSON

    // Note that values inherit valuesById on their prototype which makes them a TypeScript-
    // compatible enum. This is used by pbts to write actual enum definitions that work for
    // static and reflection code alike instead of emitting generic object definitions.

    if (values)
        for (var keys = Object.keys(values), i = 0; i < keys.length; ++i)
            if (typeof values[keys[i]] === "number") // use forward entries only
                this.valuesById[ this.values[keys[i]] = values[keys[i]] ] = keys[i];
}

/**
 * Enum descriptor.
 * @interface IEnum
 * @property {Object.<string,number>} values Enum values
 * @property {Object.<string,*>} [options] Enum options
 */

/**
 * Constructs an enum from an enum descriptor.
 * @param {string} name Enum name
 * @param {IEnum} json Enum descriptor
 * @returns {Enum} Created enum
 * @throws {TypeError} If arguments are invalid
 */
Enum.fromJSON = function fromJSON(name, json) {
    var enm = new Enum(name, json.values, json.options, json.comment, json.comments);
    enm.reserved = json.reserved;
    return enm;
};

/**
 * Converts this enum to an enum descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IEnum} Enum descriptor
 */
Enum.prototype.toJSON = function toJSON(toJSONOptions) {
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "options"  , this.options,
        "values"   , this.values,
        "reserved" , this.reserved && this.reserved.length ? this.reserved : undefined,
        "comment"  , keepComments ? this.comment : undefined,
        "comments" , keepComments ? this.comments : undefined
    ]);
};

/**
 * Adds a value to this enum.
 * @param {string} name Value name
 * @param {number} id Value id
 * @param {string} [comment] Comment, if any
 * @returns {Enum} `this`
 * @throws {TypeError} If arguments are invalid
 * @throws {Error} If there is already a value with this name or id
 */
Enum.prototype.add = function add(name, id, comment) {
    // utilized by the parser but not by .fromJSON

    if (!util.isString(name))
        throw TypeError("name must be a string");

    if (!util.isInteger(id))
        throw TypeError("id must be an integer");

    if (this.values[name] !== undefined)
        throw Error("duplicate name '" + name + "' in " + this);

    if (this.isReservedId(id))
        throw Error("id " + id + " is reserved in " + this);

    if (this.isReservedName(name))
        throw Error("name '" + name + "' is reserved in " + this);

    if (this.valuesById[id] !== undefined) {
        if (!(this.options && this.options.allow_alias))
            throw Error("duplicate id " + id + " in " + this);
        this.values[name] = id;
    } else
        this.valuesById[this.values[name] = id] = name;

    this.comments[name] = comment || null;
    return this;
};

/**
 * Removes a value from this enum
 * @param {string} name Value name
 * @returns {Enum} `this`
 * @throws {TypeError} If arguments are invalid
 * @throws {Error} If `name` is not a name of this enum
 */
Enum.prototype.remove = function remove(name) {

    if (!util.isString(name))
        throw TypeError("name must be a string");

    var val = this.values[name];
    if (val == null)
        throw Error("name '" + name + "' does not exist in " + this);

    delete this.valuesById[val];
    delete this.values[name];
    delete this.comments[name];

    return this;
};

/**
 * Tests if the specified id is reserved.
 * @param {number} id Id to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
Enum.prototype.isReservedId = function isReservedId(id) {
    return Namespace.isReservedId(this.reserved, id);
};

/**
 * Tests if the specified name is reserved.
 * @param {string} name Name to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
Enum.prototype.isReservedName = function isReservedName(name) {
    return Namespace.isReservedName(this.reserved, name);
};


/***/ }),

/***/ 3548:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = Field;

// extends ReflectionObject
var ReflectionObject = __webpack_require__(3243);
((Field.prototype = Object.create(ReflectionObject.prototype)).constructor = Field).className = "Field";

var Enum  = __webpack_require__(7025),
    types = __webpack_require__(7063),
    util  = __webpack_require__(9935);

var Type; // cyclic

var ruleRe = /^required|optional|repeated$/;

/**
 * Constructs a new message field instance. Note that {@link MapField|map fields} have their own class.
 * @name Field
 * @classdesc Reflected message field.
 * @extends FieldBase
 * @constructor
 * @param {string} name Unique name within its namespace
 * @param {number} id Unique id within its namespace
 * @param {string} type Value type
 * @param {string|Object.<string,*>} [rule="optional"] Field rule
 * @param {string|Object.<string,*>} [extend] Extended type if different from parent
 * @param {Object.<string,*>} [options] Declared options
 */

/**
 * Constructs a field from a field descriptor.
 * @param {string} name Field name
 * @param {IField} json Field descriptor
 * @returns {Field} Created field
 * @throws {TypeError} If arguments are invalid
 */
Field.fromJSON = function fromJSON(name, json) {
    return new Field(name, json.id, json.type, json.rule, json.extend, json.options, json.comment);
};

/**
 * Not an actual constructor. Use {@link Field} instead.
 * @classdesc Base class of all reflected message fields. This is not an actual class but here for the sake of having consistent type definitions.
 * @exports FieldBase
 * @extends ReflectionObject
 * @constructor
 * @param {string} name Unique name within its namespace
 * @param {number} id Unique id within its namespace
 * @param {string} type Value type
 * @param {string|Object.<string,*>} [rule="optional"] Field rule
 * @param {string|Object.<string,*>} [extend] Extended type if different from parent
 * @param {Object.<string,*>} [options] Declared options
 * @param {string} [comment] Comment associated with this field
 */
function Field(name, id, type, rule, extend, options, comment) {

    if (util.isObject(rule)) {
        comment = extend;
        options = rule;
        rule = extend = undefined;
    } else if (util.isObject(extend)) {
        comment = options;
        options = extend;
        extend = undefined;
    }

    ReflectionObject.call(this, name, options);

    if (!util.isInteger(id) || id < 0)
        throw TypeError("id must be a non-negative integer");

    if (!util.isString(type))
        throw TypeError("type must be a string");

    if (rule !== undefined && !ruleRe.test(rule = rule.toString().toLowerCase()))
        throw TypeError("rule must be a string rule");

    if (extend !== undefined && !util.isString(extend))
        throw TypeError("extend must be a string");

    if (rule === "proto3_optional") {
        rule = "optional";
    }
    /**
     * Field rule, if any.
     * @type {string|undefined}
     */
    this.rule = rule && rule !== "optional" ? rule : undefined; // toJSON

    /**
     * Field type.
     * @type {string}
     */
    this.type = type; // toJSON

    /**
     * Unique field id.
     * @type {number}
     */
    this.id = id; // toJSON, marker

    /**
     * Extended type if different from parent.
     * @type {string|undefined}
     */
    this.extend = extend || undefined; // toJSON

    /**
     * Whether this field is required.
     * @type {boolean}
     */
    this.required = rule === "required";

    /**
     * Whether this field is optional.
     * @type {boolean}
     */
    this.optional = !this.required;

    /**
     * Whether this field is repeated.
     * @type {boolean}
     */
    this.repeated = rule === "repeated";

    /**
     * Whether this field is a map or not.
     * @type {boolean}
     */
    this.map = false;

    /**
     * Message this field belongs to.
     * @type {Type|null}
     */
    this.message = null;

    /**
     * OneOf this field belongs to, if any,
     * @type {OneOf|null}
     */
    this.partOf = null;

    /**
     * The field type's default value.
     * @type {*}
     */
    this.typeDefault = null;

    /**
     * The field's default value on prototypes.
     * @type {*}
     */
    this.defaultValue = null;

    /**
     * Whether this field's value should be treated as a long.
     * @type {boolean}
     */
    this.long = util.Long ? types.long[type] !== undefined : /* istanbul ignore next */ false;

    /**
     * Whether this field's value is a buffer.
     * @type {boolean}
     */
    this.bytes = type === "bytes";

    /**
     * Resolved type if not a basic type.
     * @type {Type|Enum|null}
     */
    this.resolvedType = null;

    /**
     * Sister-field within the extended type if a declaring extension field.
     * @type {Field|null}
     */
    this.extensionField = null;

    /**
     * Sister-field within the declaring namespace if an extended field.
     * @type {Field|null}
     */
    this.declaringField = null;

    /**
     * Internally remembers whether this field is packed.
     * @type {boolean|null}
     * @private
     */
    this._packed = null;

    /**
     * Comment for this field.
     * @type {string|null}
     */
    this.comment = comment;
}

/**
 * Determines whether this field is packed. Only relevant when repeated and working with proto2.
 * @name Field#packed
 * @type {boolean}
 * @readonly
 */
Object.defineProperty(Field.prototype, "packed", {
    get: function() {
        // defaults to packed=true if not explicity set to false
        if (this._packed === null)
            this._packed = this.getOption("packed") !== false;
        return this._packed;
    }
});

/**
 * @override
 */
Field.prototype.setOption = function setOption(name, value, ifNotSet) {
    if (name === "packed") // clear cached before setting
        this._packed = null;
    return ReflectionObject.prototype.setOption.call(this, name, value, ifNotSet);
};

/**
 * Field descriptor.
 * @interface IField
 * @property {string} [rule="optional"] Field rule
 * @property {string} type Field type
 * @property {number} id Field id
 * @property {Object.<string,*>} [options] Field options
 */

/**
 * Extension field descriptor.
 * @interface IExtensionField
 * @extends IField
 * @property {string} extend Extended type
 */

/**
 * Converts this field to a field descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IField} Field descriptor
 */
Field.prototype.toJSON = function toJSON(toJSONOptions) {
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "rule"    , this.rule !== "optional" && this.rule || undefined,
        "type"    , this.type,
        "id"      , this.id,
        "extend"  , this.extend,
        "options" , this.options,
        "comment" , keepComments ? this.comment : undefined
    ]);
};

/**
 * Resolves this field's type references.
 * @returns {Field} `this`
 * @throws {Error} If any reference cannot be resolved
 */
Field.prototype.resolve = function resolve() {

    if (this.resolved)
        return this;

    if ((this.typeDefault = types.defaults[this.type]) === undefined) { // if not a basic type, resolve it
        this.resolvedType = (this.declaringField ? this.declaringField.parent : this.parent).lookupTypeOrEnum(this.type);
        if (this.resolvedType instanceof Type)
            this.typeDefault = null;
        else // instanceof Enum
            this.typeDefault = this.resolvedType.values[Object.keys(this.resolvedType.values)[0]]; // first defined
    }

    // use explicitly set default value if present
    if (this.options && this.options["default"] != null) {
        this.typeDefault = this.options["default"];
        if (this.resolvedType instanceof Enum && typeof this.typeDefault === "string")
            this.typeDefault = this.resolvedType.values[this.typeDefault];
    }

    // remove unnecessary options
    if (this.options) {
        if (this.options.packed === true || this.options.packed !== undefined && this.resolvedType && !(this.resolvedType instanceof Enum))
            delete this.options.packed;
        if (!Object.keys(this.options).length)
            this.options = undefined;
    }

    // convert to internal data type if necesssary
    if (this.long) {
        this.typeDefault = util.Long.fromNumber(this.typeDefault, this.type.charAt(0) === "u");

        /* istanbul ignore else */
        if (Object.freeze)
            Object.freeze(this.typeDefault); // long instances are meant to be immutable anyway (i.e. use small int cache that even requires it)

    } else if (this.bytes && typeof this.typeDefault === "string") {
        var buf;
        if (util.base64.test(this.typeDefault))
            util.base64.decode(this.typeDefault, buf = util.newBuffer(util.base64.length(this.typeDefault)), 0);
        else
            util.utf8.write(this.typeDefault, buf = util.newBuffer(util.utf8.length(this.typeDefault)), 0);
        this.typeDefault = buf;
    }

    // take special care of maps and repeated fields
    if (this.map)
        this.defaultValue = util.emptyObject;
    else if (this.repeated)
        this.defaultValue = util.emptyArray;
    else
        this.defaultValue = this.typeDefault;

    // ensure proper value on prototype
    if (this.parent instanceof Type)
        this.parent.ctor.prototype[this.name] = this.defaultValue;

    return ReflectionObject.prototype.resolve.call(this);
};

/**
 * Decorator function as returned by {@link Field.d} and {@link MapField.d} (TypeScript).
 * @typedef FieldDecorator
 * @type {function}
 * @param {Object} prototype Target prototype
 * @param {string} fieldName Field name
 * @returns {undefined}
 */

/**
 * Field decorator (TypeScript).
 * @name Field.d
 * @function
 * @param {number} fieldId Field id
 * @param {"double"|"float"|"int32"|"uint32"|"sint32"|"fixed32"|"sfixed32"|"int64"|"uint64"|"sint64"|"fixed64"|"sfixed64"|"string"|"bool"|"bytes"|Object} fieldType Field type
 * @param {"optional"|"required"|"repeated"} [fieldRule="optional"] Field rule
 * @param {T} [defaultValue] Default value
 * @returns {FieldDecorator} Decorator function
 * @template T extends number | number[] | Long | Long[] | string | string[] | boolean | boolean[] | Uint8Array | Uint8Array[] | Buffer | Buffer[]
 */
Field.d = function decorateField(fieldId, fieldType, fieldRule, defaultValue) {

    // submessage: decorate the submessage and use its name as the type
    if (typeof fieldType === "function")
        fieldType = util.decorateType(fieldType).name;

    // enum reference: create a reflected copy of the enum and keep reuseing it
    else if (fieldType && typeof fieldType === "object")
        fieldType = util.decorateEnum(fieldType).name;

    return function fieldDecorator(prototype, fieldName) {
        util.decorateType(prototype.constructor)
            .add(new Field(fieldName, fieldId, fieldType, fieldRule, { "default": defaultValue }));
    };
};

/**
 * Field decorator (TypeScript).
 * @name Field.d
 * @function
 * @param {number} fieldId Field id
 * @param {Constructor<T>|string} fieldType Field type
 * @param {"optional"|"required"|"repeated"} [fieldRule="optional"] Field rule
 * @returns {FieldDecorator} Decorator function
 * @template T extends Message<T>
 * @variation 2
 */
// like Field.d but without a default value

// Sets up cyclic dependencies (called in index-light)
Field._configure = function configure(Type_) {
    Type = Type_;
};


/***/ }),

/***/ 8836:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var protobuf = module.exports = __webpack_require__(9482);

protobuf.build = "light";

/**
 * A node-style callback as used by {@link load} and {@link Root#load}.
 * @typedef LoadCallback
 * @type {function}
 * @param {Error|null} error Error, if any, otherwise `null`
 * @param {Root} [root] Root, if there hasn't been an error
 * @returns {undefined}
 */

/**
 * Loads one or multiple .proto or preprocessed .json files into a common root namespace and calls the callback.
 * @param {string|string[]} filename One or multiple files to load
 * @param {Root} root Root namespace, defaults to create a new one if omitted.
 * @param {LoadCallback} callback Callback function
 * @returns {undefined}
 * @see {@link Root#load}
 */
function load(filename, root, callback) {
    if (typeof root === "function") {
        callback = root;
        root = new protobuf.Root();
    } else if (!root)
        root = new protobuf.Root();
    return root.load(filename, callback);
}

/**
 * Loads one or multiple .proto or preprocessed .json files into a common root namespace and calls the callback.
 * @name load
 * @function
 * @param {string|string[]} filename One or multiple files to load
 * @param {LoadCallback} callback Callback function
 * @returns {undefined}
 * @see {@link Root#load}
 * @variation 2
 */
// function load(filename:string, callback:LoadCallback):undefined

/**
 * Loads one or multiple .proto or preprocessed .json files into a common root namespace and returns a promise.
 * @name load
 * @function
 * @param {string|string[]} filename One or multiple files to load
 * @param {Root} [root] Root namespace, defaults to create a new one if omitted.
 * @returns {Promise<Root>} Promise
 * @see {@link Root#load}
 * @variation 3
 */
// function load(filename:string, [root:Root]):Promise<Root>

protobuf.load = load;

/**
 * Synchronously loads one or multiple .proto or preprocessed .json files into a common root namespace (node only).
 * @param {string|string[]} filename One or multiple files to load
 * @param {Root} [root] Root namespace, defaults to create a new one if omitted.
 * @returns {Root} Root namespace
 * @throws {Error} If synchronous fetching is not supported (i.e. in browsers) or if a file's syntax is invalid
 * @see {@link Root#loadSync}
 */
function loadSync(filename, root) {
    if (!root)
        root = new protobuf.Root();
    return root.loadSync(filename);
}

protobuf.loadSync = loadSync;

// Serialization
protobuf.encoder          = __webpack_require__(4928);
protobuf.decoder          = __webpack_require__(5305);
protobuf.verifier         = __webpack_require__(4497);
protobuf.converter        = __webpack_require__(3996);

// Reflection
protobuf.ReflectionObject = __webpack_require__(3243);
protobuf.Namespace        = __webpack_require__(9313);
protobuf.Root             = __webpack_require__(9424);
protobuf.Enum             = __webpack_require__(7025);
protobuf.Type             = __webpack_require__(7645);
protobuf.Field            = __webpack_require__(3548);
protobuf.OneOf            = __webpack_require__(7598);
protobuf.MapField         = __webpack_require__(6039);
protobuf.Service          = __webpack_require__(7513);
protobuf.Method           = __webpack_require__(4429);

// Runtime
protobuf.Message          = __webpack_require__(8368);
protobuf.wrappers         = __webpack_require__(1667);

// Utility
protobuf.types            = __webpack_require__(7063);
protobuf.util             = __webpack_require__(9935);

// Set up possibly cyclic reflection dependencies
protobuf.ReflectionObject._configure(protobuf.Root);
protobuf.Namespace._configure(protobuf.Type, protobuf.Service, protobuf.Enum);
protobuf.Root._configure(protobuf.Type);
protobuf.Field._configure(protobuf.Type);


/***/ }),

/***/ 9482:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

var protobuf = exports;

/**
 * Build type, one of `"full"`, `"light"` or `"minimal"`.
 * @name build
 * @type {string}
 * @const
 */
protobuf.build = "minimal";

// Serialization
protobuf.Writer       = __webpack_require__(1173);
protobuf.BufferWriter = __webpack_require__(3155);
protobuf.Reader       = __webpack_require__(1408);
protobuf.BufferReader = __webpack_require__(593);

// Utility
protobuf.util         = __webpack_require__(9693);
protobuf.rpc          = __webpack_require__(5994);
protobuf.roots        = __webpack_require__(5054);
protobuf.configure    = configure;

/* istanbul ignore next */
/**
 * Reconfigures the library according to the environment.
 * @returns {undefined}
 */
function configure() {
    protobuf.util._configure();
    protobuf.Writer._configure(protobuf.BufferWriter);
    protobuf.Reader._configure(protobuf.BufferReader);
}

// Set up buffer utility according to the environment
configure();


/***/ }),

/***/ 6039:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = MapField;

// extends Field
var Field = __webpack_require__(3548);
((MapField.prototype = Object.create(Field.prototype)).constructor = MapField).className = "MapField";

var types   = __webpack_require__(7063),
    util    = __webpack_require__(9935);

/**
 * Constructs a new map field instance.
 * @classdesc Reflected map field.
 * @extends FieldBase
 * @constructor
 * @param {string} name Unique name within its namespace
 * @param {number} id Unique id within its namespace
 * @param {string} keyType Key type
 * @param {string} type Value type
 * @param {Object.<string,*>} [options] Declared options
 * @param {string} [comment] Comment associated with this field
 */
function MapField(name, id, keyType, type, options, comment) {
    Field.call(this, name, id, type, undefined, undefined, options, comment);

    /* istanbul ignore if */
    if (!util.isString(keyType))
        throw TypeError("keyType must be a string");

    /**
     * Key type.
     * @type {string}
     */
    this.keyType = keyType; // toJSON, marker

    /**
     * Resolved key type if not a basic type.
     * @type {ReflectionObject|null}
     */
    this.resolvedKeyType = null;

    // Overrides Field#map
    this.map = true;
}

/**
 * Map field descriptor.
 * @interface IMapField
 * @extends {IField}
 * @property {string} keyType Key type
 */

/**
 * Extension map field descriptor.
 * @interface IExtensionMapField
 * @extends IMapField
 * @property {string} extend Extended type
 */

/**
 * Constructs a map field from a map field descriptor.
 * @param {string} name Field name
 * @param {IMapField} json Map field descriptor
 * @returns {MapField} Created map field
 * @throws {TypeError} If arguments are invalid
 */
MapField.fromJSON = function fromJSON(name, json) {
    return new MapField(name, json.id, json.keyType, json.type, json.options, json.comment);
};

/**
 * Converts this map field to a map field descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IMapField} Map field descriptor
 */
MapField.prototype.toJSON = function toJSON(toJSONOptions) {
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "keyType" , this.keyType,
        "type"    , this.type,
        "id"      , this.id,
        "extend"  , this.extend,
        "options" , this.options,
        "comment" , keepComments ? this.comment : undefined
    ]);
};

/**
 * @override
 */
MapField.prototype.resolve = function resolve() {
    if (this.resolved)
        return this;

    // Besides a value type, map fields have a key type that may be "any scalar type except for floating point types and bytes"
    if (types.mapKey[this.keyType] === undefined)
        throw Error("invalid key type: " + this.keyType);

    return Field.prototype.resolve.call(this);
};

/**
 * Map field decorator (TypeScript).
 * @name MapField.d
 * @function
 * @param {number} fieldId Field id
 * @param {"int32"|"uint32"|"sint32"|"fixed32"|"sfixed32"|"int64"|"uint64"|"sint64"|"fixed64"|"sfixed64"|"bool"|"string"} fieldKeyType Field key type
 * @param {"double"|"float"|"int32"|"uint32"|"sint32"|"fixed32"|"sfixed32"|"int64"|"uint64"|"sint64"|"fixed64"|"sfixed64"|"bool"|"string"|"bytes"|Object|Constructor<{}>} fieldValueType Field value type
 * @returns {FieldDecorator} Decorator function
 * @template T extends { [key: string]: number | Long | string | boolean | Uint8Array | Buffer | number[] | Message<{}> }
 */
MapField.d = function decorateMapField(fieldId, fieldKeyType, fieldValueType) {

    // submessage value: decorate the submessage and use its name as the type
    if (typeof fieldValueType === "function")
        fieldValueType = util.decorateType(fieldValueType).name;

    // enum reference value: create a reflected copy of the enum and keep reuseing it
    else if (fieldValueType && typeof fieldValueType === "object")
        fieldValueType = util.decorateEnum(fieldValueType).name;

    return function mapFieldDecorator(prototype, fieldName) {
        util.decorateType(prototype.constructor)
            .add(new MapField(fieldName, fieldId, fieldKeyType, fieldValueType));
    };
};


/***/ }),

/***/ 8368:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = Message;

var util = __webpack_require__(9693);

/**
 * Constructs a new message instance.
 * @classdesc Abstract runtime message.
 * @constructor
 * @param {Properties<T>} [properties] Properties to set
 * @template T extends object = object
 */
function Message(properties) {
    // not used internally
    if (properties)
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            this[keys[i]] = properties[keys[i]];
}

/**
 * Reference to the reflected type.
 * @name Message.$type
 * @type {Type}
 * @readonly
 */

/**
 * Reference to the reflected type.
 * @name Message#$type
 * @type {Type}
 * @readonly
 */

/*eslint-disable valid-jsdoc*/

/**
 * Creates a new message of this type using the specified properties.
 * @param {Object.<string,*>} [properties] Properties to set
 * @returns {Message<T>} Message instance
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.create = function create(properties) {
    return this.$type.create(properties);
};

/**
 * Encodes a message of this type.
 * @param {T|Object.<string,*>} message Message to encode
 * @param {Writer} [writer] Writer to use
 * @returns {Writer} Writer
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.encode = function encode(message, writer) {
    return this.$type.encode(message, writer);
};

/**
 * Encodes a message of this type preceeded by its length as a varint.
 * @param {T|Object.<string,*>} message Message to encode
 * @param {Writer} [writer] Writer to use
 * @returns {Writer} Writer
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.encodeDelimited = function encodeDelimited(message, writer) {
    return this.$type.encodeDelimited(message, writer);
};

/**
 * Decodes a message of this type.
 * @name Message.decode
 * @function
 * @param {Reader|Uint8Array} reader Reader or buffer to decode
 * @returns {T} Decoded message
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.decode = function decode(reader) {
    return this.$type.decode(reader);
};

/**
 * Decodes a message of this type preceeded by its length as a varint.
 * @name Message.decodeDelimited
 * @function
 * @param {Reader|Uint8Array} reader Reader or buffer to decode
 * @returns {T} Decoded message
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.decodeDelimited = function decodeDelimited(reader) {
    return this.$type.decodeDelimited(reader);
};

/**
 * Verifies a message of this type.
 * @name Message.verify
 * @function
 * @param {Object.<string,*>} message Plain object to verify
 * @returns {string|null} `null` if valid, otherwise the reason why it is not
 */
Message.verify = function verify(message) {
    return this.$type.verify(message);
};

/**
 * Creates a new message of this type from a plain object. Also converts values to their respective internal types.
 * @param {Object.<string,*>} object Plain object
 * @returns {T} Message instance
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.fromObject = function fromObject(object) {
    return this.$type.fromObject(object);
};

/**
 * Creates a plain object from a message of this type. Also converts values to other types if specified.
 * @param {T} message Message instance
 * @param {IConversionOptions} [options] Conversion options
 * @returns {Object.<string,*>} Plain object
 * @template T extends Message<T>
 * @this Constructor<T>
 */
Message.toObject = function toObject(message, options) {
    return this.$type.toObject(message, options);
};

/**
 * Converts this message to JSON.
 * @returns {Object.<string,*>} JSON object
 */
Message.prototype.toJSON = function toJSON() {
    return this.$type.toObject(this, util.toJSONOptions);
};

/*eslint-enable valid-jsdoc*/

/***/ }),

/***/ 4429:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = Method;

// extends ReflectionObject
var ReflectionObject = __webpack_require__(3243);
((Method.prototype = Object.create(ReflectionObject.prototype)).constructor = Method).className = "Method";

var util = __webpack_require__(9935);

/**
 * Constructs a new service method instance.
 * @classdesc Reflected service method.
 * @extends ReflectionObject
 * @constructor
 * @param {string} name Method name
 * @param {string|undefined} type Method type, usually `"rpc"`
 * @param {string} requestType Request message type
 * @param {string} responseType Response message type
 * @param {boolean|Object.<string,*>} [requestStream] Whether the request is streamed
 * @param {boolean|Object.<string,*>} [responseStream] Whether the response is streamed
 * @param {Object.<string,*>} [options] Declared options
 * @param {string} [comment] The comment for this method
 * @param {Object.<string,*>} [parsedOptions] Declared options, properly parsed into an object
 */
function Method(name, type, requestType, responseType, requestStream, responseStream, options, comment, parsedOptions) {

    /* istanbul ignore next */
    if (util.isObject(requestStream)) {
        options = requestStream;
        requestStream = responseStream = undefined;
    } else if (util.isObject(responseStream)) {
        options = responseStream;
        responseStream = undefined;
    }

    /* istanbul ignore if */
    if (!(type === undefined || util.isString(type)))
        throw TypeError("type must be a string");

    /* istanbul ignore if */
    if (!util.isString(requestType))
        throw TypeError("requestType must be a string");

    /* istanbul ignore if */
    if (!util.isString(responseType))
        throw TypeError("responseType must be a string");

    ReflectionObject.call(this, name, options);

    /**
     * Method type.
     * @type {string}
     */
    this.type = type || "rpc"; // toJSON

    /**
     * Request type.
     * @type {string}
     */
    this.requestType = requestType; // toJSON, marker

    /**
     * Whether requests are streamed or not.
     * @type {boolean|undefined}
     */
    this.requestStream = requestStream ? true : undefined; // toJSON

    /**
     * Response type.
     * @type {string}
     */
    this.responseType = responseType; // toJSON

    /**
     * Whether responses are streamed or not.
     * @type {boolean|undefined}
     */
    this.responseStream = responseStream ? true : undefined; // toJSON

    /**
     * Resolved request type.
     * @type {Type|null}
     */
    this.resolvedRequestType = null;

    /**
     * Resolved response type.
     * @type {Type|null}
     */
    this.resolvedResponseType = null;

    /**
     * Comment for this method
     * @type {string|null}
     */
    this.comment = comment;

    /**
     * Options properly parsed into an object
     */
    this.parsedOptions = parsedOptions;
}

/**
 * Method descriptor.
 * @interface IMethod
 * @property {string} [type="rpc"] Method type
 * @property {string} requestType Request type
 * @property {string} responseType Response type
 * @property {boolean} [requestStream=false] Whether requests are streamed
 * @property {boolean} [responseStream=false] Whether responses are streamed
 * @property {Object.<string,*>} [options] Method options
 * @property {string} comment Method comments
 * @property {Object.<string,*>} [parsedOptions] Method options properly parsed into an object
 */

/**
 * Constructs a method from a method descriptor.
 * @param {string} name Method name
 * @param {IMethod} json Method descriptor
 * @returns {Method} Created method
 * @throws {TypeError} If arguments are invalid
 */
Method.fromJSON = function fromJSON(name, json) {
    return new Method(name, json.type, json.requestType, json.responseType, json.requestStream, json.responseStream, json.options, json.comment, json.parsedOptions);
};

/**
 * Converts this method to a method descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IMethod} Method descriptor
 */
Method.prototype.toJSON = function toJSON(toJSONOptions) {
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "type"           , this.type !== "rpc" && /* istanbul ignore next */ this.type || undefined,
        "requestType"    , this.requestType,
        "requestStream"  , this.requestStream,
        "responseType"   , this.responseType,
        "responseStream" , this.responseStream,
        "options"        , this.options,
        "comment"        , keepComments ? this.comment : undefined,
        "parsedOptions"  , this.parsedOptions,
    ]);
};

/**
 * @override
 */
Method.prototype.resolve = function resolve() {

    /* istanbul ignore if */
    if (this.resolved)
        return this;

    this.resolvedRequestType = this.parent.lookupType(this.requestType);
    this.resolvedResponseType = this.parent.lookupType(this.responseType);

    return ReflectionObject.prototype.resolve.call(this);
};


/***/ }),

/***/ 9313:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = Namespace;

// extends ReflectionObject
var ReflectionObject = __webpack_require__(3243);
((Namespace.prototype = Object.create(ReflectionObject.prototype)).constructor = Namespace).className = "Namespace";

var Field    = __webpack_require__(3548),
    OneOf    = __webpack_require__(7598),
    util     = __webpack_require__(9935);

var Type,    // cyclic
    Service,
    Enum;

/**
 * Constructs a new namespace instance.
 * @name Namespace
 * @classdesc Reflected namespace.
 * @extends NamespaceBase
 * @constructor
 * @param {string} name Namespace name
 * @param {Object.<string,*>} [options] Declared options
 */

/**
 * Constructs a namespace from JSON.
 * @memberof Namespace
 * @function
 * @param {string} name Namespace name
 * @param {Object.<string,*>} json JSON object
 * @returns {Namespace} Created namespace
 * @throws {TypeError} If arguments are invalid
 */
Namespace.fromJSON = function fromJSON(name, json) {
    return new Namespace(name, json.options).addJSON(json.nested);
};

/**
 * Converts an array of reflection objects to JSON.
 * @memberof Namespace
 * @param {ReflectionObject[]} array Object array
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {Object.<string,*>|undefined} JSON object or `undefined` when array is empty
 */
function arrayToJSON(array, toJSONOptions) {
    if (!(array && array.length))
        return undefined;
    var obj = {};
    for (var i = 0; i < array.length; ++i)
        obj[array[i].name] = array[i].toJSON(toJSONOptions);
    return obj;
}

Namespace.arrayToJSON = arrayToJSON;

/**
 * Tests if the specified id is reserved.
 * @param {Array.<number[]|string>|undefined} reserved Array of reserved ranges and names
 * @param {number} id Id to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
Namespace.isReservedId = function isReservedId(reserved, id) {
    if (reserved)
        for (var i = 0; i < reserved.length; ++i)
            if (typeof reserved[i] !== "string" && reserved[i][0] <= id && reserved[i][1] > id)
                return true;
    return false;
};

/**
 * Tests if the specified name is reserved.
 * @param {Array.<number[]|string>|undefined} reserved Array of reserved ranges and names
 * @param {string} name Name to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
Namespace.isReservedName = function isReservedName(reserved, name) {
    if (reserved)
        for (var i = 0; i < reserved.length; ++i)
            if (reserved[i] === name)
                return true;
    return false;
};

/**
 * Not an actual constructor. Use {@link Namespace} instead.
 * @classdesc Base class of all reflection objects containing nested objects. This is not an actual class but here for the sake of having consistent type definitions.
 * @exports NamespaceBase
 * @extends ReflectionObject
 * @abstract
 * @constructor
 * @param {string} name Namespace name
 * @param {Object.<string,*>} [options] Declared options
 * @see {@link Namespace}
 */
function Namespace(name, options) {
    ReflectionObject.call(this, name, options);

    /**
     * Nested objects by name.
     * @type {Object.<string,ReflectionObject>|undefined}
     */
    this.nested = undefined; // toJSON

    /**
     * Cached nested objects as an array.
     * @type {ReflectionObject[]|null}
     * @private
     */
    this._nestedArray = null;
}

function clearCache(namespace) {
    namespace._nestedArray = null;
    return namespace;
}

/**
 * Nested objects of this namespace as an array for iteration.
 * @name NamespaceBase#nestedArray
 * @type {ReflectionObject[]}
 * @readonly
 */
Object.defineProperty(Namespace.prototype, "nestedArray", {
    get: function() {
        return this._nestedArray || (this._nestedArray = util.toArray(this.nested));
    }
});

/**
 * Namespace descriptor.
 * @interface INamespace
 * @property {Object.<string,*>} [options] Namespace options
 * @property {Object.<string,AnyNestedObject>} [nested] Nested object descriptors
 */

/**
 * Any extension field descriptor.
 * @typedef AnyExtensionField
 * @type {IExtensionField|IExtensionMapField}
 */

/**
 * Any nested object descriptor.
 * @typedef AnyNestedObject
 * @type {IEnum|IType|IService|AnyExtensionField|INamespace}
 */
// ^ BEWARE: VSCode hangs forever when using more than 5 types (that's why AnyExtensionField exists in the first place)

/**
 * Converts this namespace to a namespace descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {INamespace} Namespace descriptor
 */
Namespace.prototype.toJSON = function toJSON(toJSONOptions) {
    return util.toObject([
        "options" , this.options,
        "nested"  , arrayToJSON(this.nestedArray, toJSONOptions)
    ]);
};

/**
 * Adds nested objects to this namespace from nested object descriptors.
 * @param {Object.<string,AnyNestedObject>} nestedJson Any nested object descriptors
 * @returns {Namespace} `this`
 */
Namespace.prototype.addJSON = function addJSON(nestedJson) {
    var ns = this;
    /* istanbul ignore else */
    if (nestedJson) {
        for (var names = Object.keys(nestedJson), i = 0, nested; i < names.length; ++i) {
            nested = nestedJson[names[i]];
            ns.add( // most to least likely
                ( nested.fields !== undefined
                ? Type.fromJSON
                : nested.values !== undefined
                ? Enum.fromJSON
                : nested.methods !== undefined
                ? Service.fromJSON
                : nested.id !== undefined
                ? Field.fromJSON
                : Namespace.fromJSON )(names[i], nested)
            );
        }
    }
    return this;
};

/**
 * Gets the nested object of the specified name.
 * @param {string} name Nested object name
 * @returns {ReflectionObject|null} The reflection object or `null` if it doesn't exist
 */
Namespace.prototype.get = function get(name) {
    return this.nested && this.nested[name]
        || null;
};

/**
 * Gets the values of the nested {@link Enum|enum} of the specified name.
 * This methods differs from {@link Namespace#get|get} in that it returns an enum's values directly and throws instead of returning `null`.
 * @param {string} name Nested enum name
 * @returns {Object.<string,number>} Enum values
 * @throws {Error} If there is no such enum
 */
Namespace.prototype.getEnum = function getEnum(name) {
    if (this.nested && this.nested[name] instanceof Enum)
        return this.nested[name].values;
    throw Error("no such enum: " + name);
};

/**
 * Adds a nested object to this namespace.
 * @param {ReflectionObject} object Nested object to add
 * @returns {Namespace} `this`
 * @throws {TypeError} If arguments are invalid
 * @throws {Error} If there is already a nested object with this name
 */
Namespace.prototype.add = function add(object) {

    if (!(object instanceof Field && object.extend !== undefined || object instanceof Type || object instanceof Enum || object instanceof Service || object instanceof Namespace || object instanceof OneOf))
        throw TypeError("object must be a valid nested object");

    if (!this.nested)
        this.nested = {};
    else {
        var prev = this.get(object.name);
        if (prev) {
            if (prev instanceof Namespace && object instanceof Namespace && !(prev instanceof Type || prev instanceof Service)) {
                // replace plain namespace but keep existing nested elements and options
                var nested = prev.nestedArray;
                for (var i = 0; i < nested.length; ++i)
                    object.add(nested[i]);
                this.remove(prev);
                if (!this.nested)
                    this.nested = {};
                object.setOptions(prev.options, true);

            } else
                throw Error("duplicate name '" + object.name + "' in " + this);
        }
    }
    this.nested[object.name] = object;
    object.onAdd(this);
    return clearCache(this);
};

/**
 * Removes a nested object from this namespace.
 * @param {ReflectionObject} object Nested object to remove
 * @returns {Namespace} `this`
 * @throws {TypeError} If arguments are invalid
 * @throws {Error} If `object` is not a member of this namespace
 */
Namespace.prototype.remove = function remove(object) {

    if (!(object instanceof ReflectionObject))
        throw TypeError("object must be a ReflectionObject");
    if (object.parent !== this)
        throw Error(object + " is not a member of " + this);

    delete this.nested[object.name];
    if (!Object.keys(this.nested).length)
        this.nested = undefined;

    object.onRemove(this);
    return clearCache(this);
};

/**
 * Defines additial namespaces within this one if not yet existing.
 * @param {string|string[]} path Path to create
 * @param {*} [json] Nested types to create from JSON
 * @returns {Namespace} Pointer to the last namespace created or `this` if path is empty
 */
Namespace.prototype.define = function define(path, json) {

    if (util.isString(path))
        path = path.split(".");
    else if (!Array.isArray(path))
        throw TypeError("illegal path");
    if (path && path.length && path[0] === "")
        throw Error("path must be relative");

    var ptr = this;
    while (path.length > 0) {
        var part = path.shift();
        if (ptr.nested && ptr.nested[part]) {
            ptr = ptr.nested[part];
            if (!(ptr instanceof Namespace))
                throw Error("path conflicts with non-namespace objects");
        } else
            ptr.add(ptr = new Namespace(part));
    }
    if (json)
        ptr.addJSON(json);
    return ptr;
};

/**
 * Resolves this namespace's and all its nested objects' type references. Useful to validate a reflection tree, but comes at a cost.
 * @returns {Namespace} `this`
 */
Namespace.prototype.resolveAll = function resolveAll() {
    var nested = this.nestedArray, i = 0;
    while (i < nested.length)
        if (nested[i] instanceof Namespace)
            nested[i++].resolveAll();
        else
            nested[i++].resolve();
    return this.resolve();
};

/**
 * Recursively looks up the reflection object matching the specified path in the scope of this namespace.
 * @param {string|string[]} path Path to look up
 * @param {*|Array.<*>} filterTypes Filter types, any combination of the constructors of `protobuf.Type`, `protobuf.Enum`, `protobuf.Service` etc.
 * @param {boolean} [parentAlreadyChecked=false] If known, whether the parent has already been checked
 * @returns {ReflectionObject|null} Looked up object or `null` if none could be found
 */
Namespace.prototype.lookup = function lookup(path, filterTypes, parentAlreadyChecked) {

    /* istanbul ignore next */
    if (typeof filterTypes === "boolean") {
        parentAlreadyChecked = filterTypes;
        filterTypes = undefined;
    } else if (filterTypes && !Array.isArray(filterTypes))
        filterTypes = [ filterTypes ];

    if (util.isString(path) && path.length) {
        if (path === ".")
            return this.root;
        path = path.split(".");
    } else if (!path.length)
        return this;

    // Start at root if path is absolute
    if (path[0] === "")
        return this.root.lookup(path.slice(1), filterTypes);

    // Test if the first part matches any nested object, and if so, traverse if path contains more
    var found = this.get(path[0]);
    if (found) {
        if (path.length === 1) {
            if (!filterTypes || filterTypes.indexOf(found.constructor) > -1)
                return found;
        } else if (found instanceof Namespace && (found = found.lookup(path.slice(1), filterTypes, true)))
            return found;

    // Otherwise try each nested namespace
    } else
        for (var i = 0; i < this.nestedArray.length; ++i)
            if (this._nestedArray[i] instanceof Namespace && (found = this._nestedArray[i].lookup(path, filterTypes, true)))
                return found;

    // If there hasn't been a match, try again at the parent
    if (this.parent === null || parentAlreadyChecked)
        return null;
    return this.parent.lookup(path, filterTypes);
};

/**
 * Looks up the reflection object at the specified path, relative to this namespace.
 * @name NamespaceBase#lookup
 * @function
 * @param {string|string[]} path Path to look up
 * @param {boolean} [parentAlreadyChecked=false] Whether the parent has already been checked
 * @returns {ReflectionObject|null} Looked up object or `null` if none could be found
 * @variation 2
 */
// lookup(path: string, [parentAlreadyChecked: boolean])

/**
 * Looks up the {@link Type|type} at the specified path, relative to this namespace.
 * Besides its signature, this methods differs from {@link Namespace#lookup|lookup} in that it throws instead of returning `null`.
 * @param {string|string[]} path Path to look up
 * @returns {Type} Looked up type
 * @throws {Error} If `path` does not point to a type
 */
Namespace.prototype.lookupType = function lookupType(path) {
    var found = this.lookup(path, [ Type ]);
    if (!found)
        throw Error("no such type: " + path);
    return found;
};

/**
 * Looks up the values of the {@link Enum|enum} at the specified path, relative to this namespace.
 * Besides its signature, this methods differs from {@link Namespace#lookup|lookup} in that it throws instead of returning `null`.
 * @param {string|string[]} path Path to look up
 * @returns {Enum} Looked up enum
 * @throws {Error} If `path` does not point to an enum
 */
Namespace.prototype.lookupEnum = function lookupEnum(path) {
    var found = this.lookup(path, [ Enum ]);
    if (!found)
        throw Error("no such Enum '" + path + "' in " + this);
    return found;
};

/**
 * Looks up the {@link Type|type} or {@link Enum|enum} at the specified path, relative to this namespace.
 * Besides its signature, this methods differs from {@link Namespace#lookup|lookup} in that it throws instead of returning `null`.
 * @param {string|string[]} path Path to look up
 * @returns {Type} Looked up type or enum
 * @throws {Error} If `path` does not point to a type or enum
 */
Namespace.prototype.lookupTypeOrEnum = function lookupTypeOrEnum(path) {
    var found = this.lookup(path, [ Type, Enum ]);
    if (!found)
        throw Error("no such Type or Enum '" + path + "' in " + this);
    return found;
};

/**
 * Looks up the {@link Service|service} at the specified path, relative to this namespace.
 * Besides its signature, this methods differs from {@link Namespace#lookup|lookup} in that it throws instead of returning `null`.
 * @param {string|string[]} path Path to look up
 * @returns {Service} Looked up service
 * @throws {Error} If `path` does not point to a service
 */
Namespace.prototype.lookupService = function lookupService(path) {
    var found = this.lookup(path, [ Service ]);
    if (!found)
        throw Error("no such Service '" + path + "' in " + this);
    return found;
};

// Sets up cyclic dependencies (called in index-light)
Namespace._configure = function(Type_, Service_, Enum_) {
    Type    = Type_;
    Service = Service_;
    Enum    = Enum_;
};


/***/ }),

/***/ 3243:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = ReflectionObject;

ReflectionObject.className = "ReflectionObject";

var util = __webpack_require__(9935);

var Root; // cyclic

/**
 * Constructs a new reflection object instance.
 * @classdesc Base class of all reflection objects.
 * @constructor
 * @param {string} name Object name
 * @param {Object.<string,*>} [options] Declared options
 * @abstract
 */
function ReflectionObject(name, options) {

    if (!util.isString(name))
        throw TypeError("name must be a string");

    if (options && !util.isObject(options))
        throw TypeError("options must be an object");

    /**
     * Options.
     * @type {Object.<string,*>|undefined}
     */
    this.options = options; // toJSON

    /**
     * Parsed Options.
     * @type {Array.<Object.<string,*>>|undefined}
     */
    this.parsedOptions = null;

    /**
     * Unique name within its namespace.
     * @type {string}
     */
    this.name = name;

    /**
     * Parent namespace.
     * @type {Namespace|null}
     */
    this.parent = null;

    /**
     * Whether already resolved or not.
     * @type {boolean}
     */
    this.resolved = false;

    /**
     * Comment text, if any.
     * @type {string|null}
     */
    this.comment = null;

    /**
     * Defining file name.
     * @type {string|null}
     */
    this.filename = null;
}

Object.defineProperties(ReflectionObject.prototype, {

    /**
     * Reference to the root namespace.
     * @name ReflectionObject#root
     * @type {Root}
     * @readonly
     */
    root: {
        get: function() {
            var ptr = this;
            while (ptr.parent !== null)
                ptr = ptr.parent;
            return ptr;
        }
    },

    /**
     * Full name including leading dot.
     * @name ReflectionObject#fullName
     * @type {string}
     * @readonly
     */
    fullName: {
        get: function() {
            var path = [ this.name ],
                ptr = this.parent;
            while (ptr) {
                path.unshift(ptr.name);
                ptr = ptr.parent;
            }
            return path.join(".");
        }
    }
});

/**
 * Converts this reflection object to its descriptor representation.
 * @returns {Object.<string,*>} Descriptor
 * @abstract
 */
ReflectionObject.prototype.toJSON = /* istanbul ignore next */ function toJSON() {
    throw Error(); // not implemented, shouldn't happen
};

/**
 * Called when this object is added to a parent.
 * @param {ReflectionObject} parent Parent added to
 * @returns {undefined}
 */
ReflectionObject.prototype.onAdd = function onAdd(parent) {
    if (this.parent && this.parent !== parent)
        this.parent.remove(this);
    this.parent = parent;
    this.resolved = false;
    var root = parent.root;
    if (root instanceof Root)
        root._handleAdd(this);
};

/**
 * Called when this object is removed from a parent.
 * @param {ReflectionObject} parent Parent removed from
 * @returns {undefined}
 */
ReflectionObject.prototype.onRemove = function onRemove(parent) {
    var root = parent.root;
    if (root instanceof Root)
        root._handleRemove(this);
    this.parent = null;
    this.resolved = false;
};

/**
 * Resolves this objects type references.
 * @returns {ReflectionObject} `this`
 */
ReflectionObject.prototype.resolve = function resolve() {
    if (this.resolved)
        return this;
    if (this.root instanceof Root)
        this.resolved = true; // only if part of a root
    return this;
};

/**
 * Gets an option value.
 * @param {string} name Option name
 * @returns {*} Option value or `undefined` if not set
 */
ReflectionObject.prototype.getOption = function getOption(name) {
    if (this.options)
        return this.options[name];
    return undefined;
};

/**
 * Sets an option.
 * @param {string} name Option name
 * @param {*} value Option value
 * @param {boolean} [ifNotSet] Sets the option only if it isn't currently set
 * @returns {ReflectionObject} `this`
 */
ReflectionObject.prototype.setOption = function setOption(name, value, ifNotSet) {
    if (!ifNotSet || !this.options || this.options[name] === undefined)
        (this.options || (this.options = {}))[name] = value;
    return this;
};

/**
 * Sets a parsed option.
 * @param {string} name parsed Option name
 * @param {*} value Option value
 * @param {string} propName dot '.' delimited full path of property within the option to set. if undefined\empty, will add a new option with that value
 * @returns {ReflectionObject} `this`
 */
ReflectionObject.prototype.setParsedOption = function setParsedOption(name, value, propName) {
    if (!this.parsedOptions) {
        this.parsedOptions = [];
    }
    var parsedOptions = this.parsedOptions;
    if (propName) {
        // If setting a sub property of an option then try to merge it
        // with an existing option
        var opt = parsedOptions.find(function (opt) {
            return Object.prototype.hasOwnProperty.call(opt, name);
        });
        if (opt) {
            // If we found an existing option - just merge the property value
            var newValue = opt[name];
            util.setProperty(newValue, propName, value);
        } else {
            // otherwise, create a new option, set it's property and add it to the list
            opt = {};
            opt[name] = util.setProperty({}, propName, value);
            parsedOptions.push(opt);
        }
    } else {
        // Always create a new option when setting the value of the option itself
        var newOpt = {};
        newOpt[name] = value;
        parsedOptions.push(newOpt);
    }
    return this;
};

/**
 * Sets multiple options.
 * @param {Object.<string,*>} options Options to set
 * @param {boolean} [ifNotSet] Sets an option only if it isn't currently set
 * @returns {ReflectionObject} `this`
 */
ReflectionObject.prototype.setOptions = function setOptions(options, ifNotSet) {
    if (options)
        for (var keys = Object.keys(options), i = 0; i < keys.length; ++i)
            this.setOption(keys[i], options[keys[i]], ifNotSet);
    return this;
};

/**
 * Converts this instance to its string representation.
 * @returns {string} Class name[, space, full name]
 */
ReflectionObject.prototype.toString = function toString() {
    var className = this.constructor.className,
        fullName  = this.fullName;
    if (fullName.length)
        return className + " " + fullName;
    return className;
};

// Sets up cyclic dependencies (called in index-light)
ReflectionObject._configure = function(Root_) {
    Root = Root_;
};


/***/ }),

/***/ 7598:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = OneOf;

// extends ReflectionObject
var ReflectionObject = __webpack_require__(3243);
((OneOf.prototype = Object.create(ReflectionObject.prototype)).constructor = OneOf).className = "OneOf";

var Field = __webpack_require__(3548),
    util  = __webpack_require__(9935);

/**
 * Constructs a new oneof instance.
 * @classdesc Reflected oneof.
 * @extends ReflectionObject
 * @constructor
 * @param {string} name Oneof name
 * @param {string[]|Object.<string,*>} [fieldNames] Field names
 * @param {Object.<string,*>} [options] Declared options
 * @param {string} [comment] Comment associated with this field
 */
function OneOf(name, fieldNames, options, comment) {
    if (!Array.isArray(fieldNames)) {
        options = fieldNames;
        fieldNames = undefined;
    }
    ReflectionObject.call(this, name, options);

    /* istanbul ignore if */
    if (!(fieldNames === undefined || Array.isArray(fieldNames)))
        throw TypeError("fieldNames must be an Array");

    /**
     * Field names that belong to this oneof.
     * @type {string[]}
     */
    this.oneof = fieldNames || []; // toJSON, marker

    /**
     * Fields that belong to this oneof as an array for iteration.
     * @type {Field[]}
     * @readonly
     */
    this.fieldsArray = []; // declared readonly for conformance, possibly not yet added to parent

    /**
     * Comment for this field.
     * @type {string|null}
     */
    this.comment = comment;
}

/**
 * Oneof descriptor.
 * @interface IOneOf
 * @property {Array.<string>} oneof Oneof field names
 * @property {Object.<string,*>} [options] Oneof options
 */

/**
 * Constructs a oneof from a oneof descriptor.
 * @param {string} name Oneof name
 * @param {IOneOf} json Oneof descriptor
 * @returns {OneOf} Created oneof
 * @throws {TypeError} If arguments are invalid
 */
OneOf.fromJSON = function fromJSON(name, json) {
    return new OneOf(name, json.oneof, json.options, json.comment);
};

/**
 * Converts this oneof to a oneof descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IOneOf} Oneof descriptor
 */
OneOf.prototype.toJSON = function toJSON(toJSONOptions) {
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "options" , this.options,
        "oneof"   , this.oneof,
        "comment" , keepComments ? this.comment : undefined
    ]);
};

/**
 * Adds the fields of the specified oneof to the parent if not already done so.
 * @param {OneOf} oneof The oneof
 * @returns {undefined}
 * @inner
 * @ignore
 */
function addFieldsToParent(oneof) {
    if (oneof.parent)
        for (var i = 0; i < oneof.fieldsArray.length; ++i)
            if (!oneof.fieldsArray[i].parent)
                oneof.parent.add(oneof.fieldsArray[i]);
}

/**
 * Adds a field to this oneof and removes it from its current parent, if any.
 * @param {Field} field Field to add
 * @returns {OneOf} `this`
 */
OneOf.prototype.add = function add(field) {

    /* istanbul ignore if */
    if (!(field instanceof Field))
        throw TypeError("field must be a Field");

    if (field.parent && field.parent !== this.parent)
        field.parent.remove(field);
    this.oneof.push(field.name);
    this.fieldsArray.push(field);
    field.partOf = this; // field.parent remains null
    addFieldsToParent(this);
    return this;
};

/**
 * Removes a field from this oneof and puts it back to the oneof's parent.
 * @param {Field} field Field to remove
 * @returns {OneOf} `this`
 */
OneOf.prototype.remove = function remove(field) {

    /* istanbul ignore if */
    if (!(field instanceof Field))
        throw TypeError("field must be a Field");

    var index = this.fieldsArray.indexOf(field);

    /* istanbul ignore if */
    if (index < 0)
        throw Error(field + " is not a member of " + this);

    this.fieldsArray.splice(index, 1);
    index = this.oneof.indexOf(field.name);

    /* istanbul ignore else */
    if (index > -1) // theoretical
        this.oneof.splice(index, 1);

    field.partOf = null;
    return this;
};

/**
 * @override
 */
OneOf.prototype.onAdd = function onAdd(parent) {
    ReflectionObject.prototype.onAdd.call(this, parent);
    var self = this;
    // Collect present fields
    for (var i = 0; i < this.oneof.length; ++i) {
        var field = parent.get(this.oneof[i]);
        if (field && !field.partOf) {
            field.partOf = self;
            self.fieldsArray.push(field);
        }
    }
    // Add not yet present fields
    addFieldsToParent(this);
};

/**
 * @override
 */
OneOf.prototype.onRemove = function onRemove(parent) {
    for (var i = 0, field; i < this.fieldsArray.length; ++i)
        if ((field = this.fieldsArray[i]).parent)
            field.parent.remove(field);
    ReflectionObject.prototype.onRemove.call(this, parent);
};

/**
 * Decorator function as returned by {@link OneOf.d} (TypeScript).
 * @typedef OneOfDecorator
 * @type {function}
 * @param {Object} prototype Target prototype
 * @param {string} oneofName OneOf name
 * @returns {undefined}
 */

/**
 * OneOf decorator (TypeScript).
 * @function
 * @param {...string} fieldNames Field names
 * @returns {OneOfDecorator} Decorator function
 * @template T extends string
 */
OneOf.d = function decorateOneOf() {
    var fieldNames = new Array(arguments.length),
        index = 0;
    while (index < arguments.length)
        fieldNames[index] = arguments[index++];
    return function oneOfDecorator(prototype, oneofName) {
        util.decorateType(prototype.constructor)
            .add(new OneOf(oneofName, fieldNames));
        Object.defineProperty(prototype, oneofName, {
            get: util.oneOfGetter(fieldNames),
            set: util.oneOfSetter(fieldNames)
        });
    };
};


/***/ }),

/***/ 1408:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = Reader;

var util      = __webpack_require__(9693);

var BufferReader; // cyclic

var LongBits  = util.LongBits,
    utf8      = util.utf8;

/* istanbul ignore next */
function indexOutOfRange(reader, writeLength) {
    return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
}

/**
 * Constructs a new reader instance using the specified buffer.
 * @classdesc Wire format reader using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 * @param {Uint8Array} buffer Buffer to read from
 */
function Reader(buffer) {

    /**
     * Read buffer.
     * @type {Uint8Array}
     */
    this.buf = buffer;

    /**
     * Read buffer position.
     * @type {number}
     */
    this.pos = 0;

    /**
     * Read buffer length.
     * @type {number}
     */
    this.len = buffer.length;
}

var create_array = typeof Uint8Array !== "undefined"
    ? function create_typed_array(buffer) {
        if (buffer instanceof Uint8Array || Array.isArray(buffer))
            return new Reader(buffer);
        throw Error("illegal buffer");
    }
    /* istanbul ignore next */
    : function create_array(buffer) {
        if (Array.isArray(buffer))
            return new Reader(buffer);
        throw Error("illegal buffer");
    };

var create = function create() {
    return util.Buffer
        ? function create_buffer_setup(buffer) {
            return (Reader.create = function create_buffer(buffer) {
                return util.Buffer.isBuffer(buffer)
                    ? new BufferReader(buffer)
                    /* istanbul ignore next */
                    : create_array(buffer);
            })(buffer);
        }
        /* istanbul ignore next */
        : create_array;
};

/**
 * Creates a new reader using the specified buffer.
 * @function
 * @param {Uint8Array|Buffer} buffer Buffer to read from
 * @returns {Reader|BufferReader} A {@link BufferReader} if `buffer` is a Buffer, otherwise a {@link Reader}
 * @throws {Error} If `buffer` is not a valid buffer
 */
Reader.create = create();

Reader.prototype._slice = util.Array.prototype.subarray || /* istanbul ignore next */ util.Array.prototype.slice;

/**
 * Reads a varint as an unsigned 32 bit value.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.uint32 = (function read_uint32_setup() {
    var value = 4294967295; // optimizer type-hint, tends to deopt otherwise (?!)
    return function read_uint32() {
        value = (         this.buf[this.pos] & 127       ) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) <<  7) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 14) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 21) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] &  15) << 28) >>> 0; if (this.buf[this.pos++] < 128) return value;

        /* istanbul ignore if */
        if ((this.pos += 5) > this.len) {
            this.pos = this.len;
            throw indexOutOfRange(this, 10);
        }
        return value;
    };
})();

/**
 * Reads a varint as a signed 32 bit value.
 * @returns {number} Value read
 */
Reader.prototype.int32 = function read_int32() {
    return this.uint32() | 0;
};

/**
 * Reads a zig-zag encoded varint as a signed 32 bit value.
 * @returns {number} Value read
 */
Reader.prototype.sint32 = function read_sint32() {
    var value = this.uint32();
    return value >>> 1 ^ -(value & 1) | 0;
};

/* eslint-disable no-invalid-this */

function readLongVarint() {
    // tends to deopt with local vars for octet etc.
    var bits = new LongBits(0, 0);
    var i = 0;
    if (this.len - this.pos > 4) { // fast route (lo)
        for (; i < 4; ++i) {
            // 1st..4th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        // 5th
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) >>  4) >>> 0;
        if (this.buf[this.pos++] < 128)
            return bits;
        i = 0;
    } else {
        for (; i < 3; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            // 1st..3th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        // 4th
        bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
        return bits;
    }
    if (this.len - this.pos > 4) { // fast route (hi)
        for (; i < 5; ++i) {
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    } else {
        for (; i < 5; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    }
    /* istanbul ignore next */
    throw Error("invalid varint encoding");
}

/* eslint-enable no-invalid-this */

/**
 * Reads a varint as a signed 64 bit value.
 * @name Reader#int64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as an unsigned 64 bit value.
 * @name Reader#uint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a zig-zag encoded varint as a signed 64 bit value.
 * @name Reader#sint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as a boolean.
 * @returns {boolean} Value read
 */
Reader.prototype.bool = function read_bool() {
    return this.uint32() !== 0;
};

function readFixed32_end(buf, end) { // note that this uses `end`, not `pos`
    return (buf[end - 4]
          | buf[end - 3] << 8
          | buf[end - 2] << 16
          | buf[end - 1] << 24) >>> 0;
}

/**
 * Reads fixed 32 bits as an unsigned 32 bit integer.
 * @returns {number} Value read
 */
Reader.prototype.fixed32 = function read_fixed32() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    return readFixed32_end(this.buf, this.pos += 4);
};

/**
 * Reads fixed 32 bits as a signed 32 bit integer.
 * @returns {number} Value read
 */
Reader.prototype.sfixed32 = function read_sfixed32() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    return readFixed32_end(this.buf, this.pos += 4) | 0;
};

/* eslint-disable no-invalid-this */

function readFixed64(/* this: Reader */) {

    /* istanbul ignore if */
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 8);

    return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
}

/* eslint-enable no-invalid-this */

/**
 * Reads fixed 64 bits.
 * @name Reader#fixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads zig-zag encoded fixed 64 bits.
 * @name Reader#sfixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a float (32 bit) as a number.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.float = function read_float() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    var value = util.float.readFloatLE(this.buf, this.pos);
    this.pos += 4;
    return value;
};

/**
 * Reads a double (64 bit float) as a number.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.double = function read_double() {

    /* istanbul ignore if */
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 4);

    var value = util.float.readDoubleLE(this.buf, this.pos);
    this.pos += 8;
    return value;
};

/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @returns {Uint8Array} Value read
 */
Reader.prototype.bytes = function read_bytes() {
    var length = this.uint32(),
        start  = this.pos,
        end    = this.pos + length;

    /* istanbul ignore if */
    if (end > this.len)
        throw indexOutOfRange(this, length);

    this.pos += length;
    if (Array.isArray(this.buf)) // plain array
        return this.buf.slice(start, end);
    return start === end // fix for IE 10/Win8 and others' subarray returning array of size 1
        ? new this.buf.constructor(0)
        : this._slice.call(this.buf, start, end);
};

/**
 * Reads a string preceeded by its byte length as a varint.
 * @returns {string} Value read
 */
Reader.prototype.string = function read_string() {
    var bytes = this.bytes();
    return utf8.read(bytes, 0, bytes.length);
};

/**
 * Skips the specified number of bytes if specified, otherwise skips a varint.
 * @param {number} [length] Length if known, otherwise a varint is assumed
 * @returns {Reader} `this`
 */
Reader.prototype.skip = function skip(length) {
    if (typeof length === "number") {
        /* istanbul ignore if */
        if (this.pos + length > this.len)
            throw indexOutOfRange(this, length);
        this.pos += length;
    } else {
        do {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
        } while (this.buf[this.pos++] & 128);
    }
    return this;
};

/**
 * Skips the next element of the specified wire type.
 * @param {number} wireType Wire type received
 * @returns {Reader} `this`
 */
Reader.prototype.skipType = function(wireType) {
    switch (wireType) {
        case 0:
            this.skip();
            break;
        case 1:
            this.skip(8);
            break;
        case 2:
            this.skip(this.uint32());
            break;
        case 3:
            while ((wireType = this.uint32() & 7) !== 4) {
                this.skipType(wireType);
            }
            break;
        case 5:
            this.skip(4);
            break;

        /* istanbul ignore next */
        default:
            throw Error("invalid wire type " + wireType + " at offset " + this.pos);
    }
    return this;
};

Reader._configure = function(BufferReader_) {
    BufferReader = BufferReader_;
    Reader.create = create();
    BufferReader._configure();

    var fn = util.Long ? "toLong" : /* istanbul ignore next */ "toNumber";
    util.merge(Reader.prototype, {

        int64: function read_int64() {
            return readLongVarint.call(this)[fn](false);
        },

        uint64: function read_uint64() {
            return readLongVarint.call(this)[fn](true);
        },

        sint64: function read_sint64() {
            return readLongVarint.call(this).zzDecode()[fn](false);
        },

        fixed64: function read_fixed64() {
            return readFixed64.call(this)[fn](true);
        },

        sfixed64: function read_sfixed64() {
            return readFixed64.call(this)[fn](false);
        }

    });
};


/***/ }),

/***/ 593:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = BufferReader;

// extends Reader
var Reader = __webpack_require__(1408);
(BufferReader.prototype = Object.create(Reader.prototype)).constructor = BufferReader;

var util = __webpack_require__(9693);

/**
 * Constructs a new buffer reader instance.
 * @classdesc Wire format reader using node buffers.
 * @extends Reader
 * @constructor
 * @param {Buffer} buffer Buffer to read from
 */
function BufferReader(buffer) {
    Reader.call(this, buffer);

    /**
     * Read buffer.
     * @name BufferReader#buf
     * @type {Buffer}
     */
}

BufferReader._configure = function () {
    /* istanbul ignore else */
    if (util.Buffer)
        BufferReader.prototype._slice = util.Buffer.prototype.slice;
};


/**
 * @override
 */
BufferReader.prototype.string = function read_string_buffer() {
    var len = this.uint32(); // modifies pos
    return this.buf.utf8Slice
        ? this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len))
        : this.buf.toString("utf-8", this.pos, this.pos = Math.min(this.pos + len, this.len));
};

/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @name BufferReader#bytes
 * @function
 * @returns {Buffer} Value read
 */

BufferReader._configure();


/***/ }),

/***/ 9424:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = Root;

// extends Namespace
var Namespace = __webpack_require__(9313);
((Root.prototype = Object.create(Namespace.prototype)).constructor = Root).className = "Root";

var Field   = __webpack_require__(3548),
    Enum    = __webpack_require__(7025),
    OneOf   = __webpack_require__(7598),
    util    = __webpack_require__(9935);

var Type,   // cyclic
    parse,  // might be excluded
    common; // "

/**
 * Constructs a new root namespace instance.
 * @classdesc Root namespace wrapping all types, enums, services, sub-namespaces etc. that belong together.
 * @extends NamespaceBase
 * @constructor
 * @param {Object.<string,*>} [options] Top level options
 */
function Root(options) {
    Namespace.call(this, "", options);

    /**
     * Deferred extension fields.
     * @type {Field[]}
     */
    this.deferred = [];

    /**
     * Resolved file names of loaded files.
     * @type {string[]}
     */
    this.files = [];
}

/**
 * Loads a namespace descriptor into a root namespace.
 * @param {INamespace} json Nameespace descriptor
 * @param {Root} [root] Root namespace, defaults to create a new one if omitted
 * @returns {Root} Root namespace
 */
Root.fromJSON = function fromJSON(json, root) {
    if (!root)
        root = new Root();
    if (json.options)
        root.setOptions(json.options);
    return root.addJSON(json.nested);
};

/**
 * Resolves the path of an imported file, relative to the importing origin.
 * This method exists so you can override it with your own logic in case your imports are scattered over multiple directories.
 * @function
 * @param {string} origin The file name of the importing file
 * @param {string} target The file name being imported
 * @returns {string|null} Resolved path to `target` or `null` to skip the file
 */
Root.prototype.resolvePath = util.path.resolve;

/**
 * Fetch content from file path or url
 * This method exists so you can override it with your own logic.
 * @function
 * @param {string} path File path or url
 * @param {FetchCallback} callback Callback function
 * @returns {undefined}
 */
Root.prototype.fetch = util.fetch;

// A symbol-like function to safely signal synchronous loading
/* istanbul ignore next */
function SYNC() {} // eslint-disable-line no-empty-function

/**
 * Loads one or multiple .proto or preprocessed .json files into this root namespace and calls the callback.
 * @param {string|string[]} filename Names of one or multiple files to load
 * @param {IParseOptions} options Parse options
 * @param {LoadCallback} callback Callback function
 * @returns {undefined}
 */
Root.prototype.load = function load(filename, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = undefined;
    }
    var self = this;
    if (!callback)
        return util.asPromise(load, self, filename, options);

    var sync = callback === SYNC; // undocumented

    // Finishes loading by calling the callback (exactly once)
    function finish(err, root) {
        /* istanbul ignore if */
        if (!callback)
            return;
        var cb = callback;
        callback = null;
        if (sync)
            throw err;
        cb(err, root);
    }

    // Bundled definition existence checking
    function getBundledFileName(filename) {
        var idx = filename.lastIndexOf("google/protobuf/");
        if (idx > -1) {
            var altname = filename.substring(idx);
            if (altname in common) return altname;
        }
        return null;
    }

    // Processes a single file
    function process(filename, source) {
        try {
            if (util.isString(source) && source.charAt(0) === "{")
                source = JSON.parse(source);
            if (!util.isString(source))
                self.setOptions(source.options).addJSON(source.nested);
            else {
                parse.filename = filename;
                var parsed = parse(source, self, options),
                    resolved,
                    i = 0;
                if (parsed.imports)
                    for (; i < parsed.imports.length; ++i)
                        if (resolved = getBundledFileName(parsed.imports[i]) || self.resolvePath(filename, parsed.imports[i]))
                            fetch(resolved);
                if (parsed.weakImports)
                    for (i = 0; i < parsed.weakImports.length; ++i)
                        if (resolved = getBundledFileName(parsed.weakImports[i]) || self.resolvePath(filename, parsed.weakImports[i]))
                            fetch(resolved, true);
            }
        } catch (err) {
            finish(err);
        }
        if (!sync && !queued)
            finish(null, self); // only once anyway
    }

    // Fetches a single file
    function fetch(filename, weak) {

        // Skip if already loaded / attempted
        if (self.files.indexOf(filename) > -1)
            return;
        self.files.push(filename);

        // Shortcut bundled definitions
        if (filename in common) {
            if (sync)
                process(filename, common[filename]);
            else {
                ++queued;
                setTimeout(function() {
                    --queued;
                    process(filename, common[filename]);
                });
            }
            return;
        }

        // Otherwise fetch from disk or network
        if (sync) {
            var source;
            try {
                source = util.fs.readFileSync(filename).toString("utf8");
            } catch (err) {
                if (!weak)
                    finish(err);
                return;
            }
            process(filename, source);
        } else {
            ++queued;
            self.fetch(filename, function(err, source) {
                --queued;
                /* istanbul ignore if */
                if (!callback)
                    return; // terminated meanwhile
                if (err) {
                    /* istanbul ignore else */
                    if (!weak)
                        finish(err);
                    else if (!queued) // can't be covered reliably
                        finish(null, self);
                    return;
                }
                process(filename, source);
            });
        }
    }
    var queued = 0;

    // Assembling the root namespace doesn't require working type
    // references anymore, so we can load everything in parallel
    if (util.isString(filename))
        filename = [ filename ];
    for (var i = 0, resolved; i < filename.length; ++i)
        if (resolved = self.resolvePath("", filename[i]))
            fetch(resolved);

    if (sync)
        return self;
    if (!queued)
        finish(null, self);
    return undefined;
};
// function load(filename:string, options:IParseOptions, callback:LoadCallback):undefined

/**
 * Loads one or multiple .proto or preprocessed .json files into this root namespace and calls the callback.
 * @function Root#load
 * @param {string|string[]} filename Names of one or multiple files to load
 * @param {LoadCallback} callback Callback function
 * @returns {undefined}
 * @variation 2
 */
// function load(filename:string, callback:LoadCallback):undefined

/**
 * Loads one or multiple .proto or preprocessed .json files into this root namespace and returns a promise.
 * @function Root#load
 * @param {string|string[]} filename Names of one or multiple files to load
 * @param {IParseOptions} [options] Parse options. Defaults to {@link parse.defaults} when omitted.
 * @returns {Promise<Root>} Promise
 * @variation 3
 */
// function load(filename:string, [options:IParseOptions]):Promise<Root>

/**
 * Synchronously loads one or multiple .proto or preprocessed .json files into this root namespace (node only).
 * @function Root#loadSync
 * @param {string|string[]} filename Names of one or multiple files to load
 * @param {IParseOptions} [options] Parse options. Defaults to {@link parse.defaults} when omitted.
 * @returns {Root} Root namespace
 * @throws {Error} If synchronous fetching is not supported (i.e. in browsers) or if a file's syntax is invalid
 */
Root.prototype.loadSync = function loadSync(filename, options) {
    if (!util.isNode)
        throw Error("not supported");
    return this.load(filename, options, SYNC);
};

/**
 * @override
 */
Root.prototype.resolveAll = function resolveAll() {
    if (this.deferred.length)
        throw Error("unresolvable extensions: " + this.deferred.map(function(field) {
            return "'extend " + field.extend + "' in " + field.parent.fullName;
        }).join(", "));
    return Namespace.prototype.resolveAll.call(this);
};

// only uppercased (and thus conflict-free) children are exposed, see below
var exposeRe = /^[A-Z]/;

/**
 * Handles a deferred declaring extension field by creating a sister field to represent it within its extended type.
 * @param {Root} root Root instance
 * @param {Field} field Declaring extension field witin the declaring type
 * @returns {boolean} `true` if successfully added to the extended type, `false` otherwise
 * @inner
 * @ignore
 */
function tryHandleExtension(root, field) {
    var extendedType = field.parent.lookup(field.extend);
    if (extendedType) {
        var sisterField = new Field(field.fullName, field.id, field.type, field.rule, undefined, field.options);
        sisterField.declaringField = field;
        field.extensionField = sisterField;
        extendedType.add(sisterField);
        return true;
    }
    return false;
}

/**
 * Called when any object is added to this root or its sub-namespaces.
 * @param {ReflectionObject} object Object added
 * @returns {undefined}
 * @private
 */
Root.prototype._handleAdd = function _handleAdd(object) {
    if (object instanceof Field) {

        if (/* an extension field (implies not part of a oneof) */ object.extend !== undefined && /* not already handled */ !object.extensionField)
            if (!tryHandleExtension(this, object))
                this.deferred.push(object);

    } else if (object instanceof Enum) {

        if (exposeRe.test(object.name))
            object.parent[object.name] = object.values; // expose enum values as property of its parent

    } else if (!(object instanceof OneOf)) /* everything else is a namespace */ {

        if (object instanceof Type) // Try to handle any deferred extensions
            for (var i = 0; i < this.deferred.length;)
                if (tryHandleExtension(this, this.deferred[i]))
                    this.deferred.splice(i, 1);
                else
                    ++i;
        for (var j = 0; j < /* initializes */ object.nestedArray.length; ++j) // recurse into the namespace
            this._handleAdd(object._nestedArray[j]);
        if (exposeRe.test(object.name))
            object.parent[object.name] = object; // expose namespace as property of its parent
    }

    // The above also adds uppercased (and thus conflict-free) nested types, services and enums as
    // properties of namespaces just like static code does. This allows using a .d.ts generated for
    // a static module with reflection-based solutions where the condition is met.
};

/**
 * Called when any object is removed from this root or its sub-namespaces.
 * @param {ReflectionObject} object Object removed
 * @returns {undefined}
 * @private
 */
Root.prototype._handleRemove = function _handleRemove(object) {
    if (object instanceof Field) {

        if (/* an extension field */ object.extend !== undefined) {
            if (/* already handled */ object.extensionField) { // remove its sister field
                object.extensionField.parent.remove(object.extensionField);
                object.extensionField = null;
            } else { // cancel the extension
                var index = this.deferred.indexOf(object);
                /* istanbul ignore else */
                if (index > -1)
                    this.deferred.splice(index, 1);
            }
        }

    } else if (object instanceof Enum) {

        if (exposeRe.test(object.name))
            delete object.parent[object.name]; // unexpose enum values

    } else if (object instanceof Namespace) {

        for (var i = 0; i < /* initializes */ object.nestedArray.length; ++i) // recurse into the namespace
            this._handleRemove(object._nestedArray[i]);

        if (exposeRe.test(object.name))
            delete object.parent[object.name]; // unexpose namespaces

    }
};

// Sets up cyclic dependencies (called in index-light)
Root._configure = function(Type_, parse_, common_) {
    Type   = Type_;
    parse  = parse_;
    common = common_;
};


/***/ }),

/***/ 5054:
/***/ ((module) => {

"use strict";

module.exports = {};

/**
 * Named roots.
 * This is where pbjs stores generated structures (the option `-r, --root` specifies a name).
 * Can also be used manually to make roots available accross modules.
 * @name roots
 * @type {Object.<string,Root>}
 * @example
 * // pbjs -r myroot -o compiled.js ...
 *
 * // in another module:
 * require("./compiled.js");
 *
 * // in any subsequent module:
 * var root = protobuf.roots["myroot"];
 */


/***/ }),

/***/ 5994:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


/**
 * Streaming RPC helpers.
 * @namespace
 */
var rpc = exports;

/**
 * RPC implementation passed to {@link Service#create} performing a service request on network level, i.e. by utilizing http requests or websockets.
 * @typedef RPCImpl
 * @type {function}
 * @param {Method|rpc.ServiceMethod<Message<{}>,Message<{}>>} method Reflected or static method being called
 * @param {Uint8Array} requestData Request data
 * @param {RPCImplCallback} callback Callback function
 * @returns {undefined}
 * @example
 * function rpcImpl(method, requestData, callback) {
 *     if (protobuf.util.lcFirst(method.name) !== "myMethod") // compatible with static code
 *         throw Error("no such method");
 *     asynchronouslyObtainAResponse(requestData, function(err, responseData) {
 *         callback(err, responseData);
 *     });
 * }
 */

/**
 * Node-style callback as used by {@link RPCImpl}.
 * @typedef RPCImplCallback
 * @type {function}
 * @param {Error|null} error Error, if any, otherwise `null`
 * @param {Uint8Array|null} [response] Response data or `null` to signal end of stream, if there hasn't been an error
 * @returns {undefined}
 */

rpc.Service = __webpack_require__(7948);


/***/ }),

/***/ 7948:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = Service;

var util = __webpack_require__(9693);

// Extends EventEmitter
(Service.prototype = Object.create(util.EventEmitter.prototype)).constructor = Service;

/**
 * A service method callback as used by {@link rpc.ServiceMethod|ServiceMethod}.
 *
 * Differs from {@link RPCImplCallback} in that it is an actual callback of a service method which may not return `response = null`.
 * @typedef rpc.ServiceMethodCallback
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {TRes} [response] Response message
 * @returns {undefined}
 */

/**
 * A service method part of a {@link rpc.Service} as created by {@link Service.create}.
 * @typedef rpc.ServiceMethod
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} [callback] Node-style callback called with the error, if any, and the response message
 * @returns {Promise<Message<TRes>>} Promise if `callback` has been omitted, otherwise `undefined`
 */

/**
 * Constructs a new RPC service instance.
 * @classdesc An RPC service as returned by {@link Service#create}.
 * @exports rpc.Service
 * @extends util.EventEmitter
 * @constructor
 * @param {RPCImpl} rpcImpl RPC implementation
 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
 */
function Service(rpcImpl, requestDelimited, responseDelimited) {

    if (typeof rpcImpl !== "function")
        throw TypeError("rpcImpl must be a function");

    util.EventEmitter.call(this);

    /**
     * RPC implementation. Becomes `null` once the service is ended.
     * @type {RPCImpl|null}
     */
    this.rpcImpl = rpcImpl;

    /**
     * Whether requests are length-delimited.
     * @type {boolean}
     */
    this.requestDelimited = Boolean(requestDelimited);

    /**
     * Whether responses are length-delimited.
     * @type {boolean}
     */
    this.responseDelimited = Boolean(responseDelimited);
}

/**
 * Calls a service method through {@link rpc.Service#rpcImpl|rpcImpl}.
 * @param {Method|rpc.ServiceMethod<TReq,TRes>} method Reflected or static method
 * @param {Constructor<TReq>} requestCtor Request constructor
 * @param {Constructor<TRes>} responseCtor Response constructor
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} callback Service callback
 * @returns {undefined}
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 */
Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {

    if (!request)
        throw TypeError("request must be specified");

    var self = this;
    if (!callback)
        return util.asPromise(rpcCall, self, method, requestCtor, responseCtor, request);

    if (!self.rpcImpl) {
        setTimeout(function() { callback(Error("already ended")); }, 0);
        return undefined;
    }

    try {
        return self.rpcImpl(
            method,
            requestCtor[self.requestDelimited ? "encodeDelimited" : "encode"](request).finish(),
            function rpcCallback(err, response) {

                if (err) {
                    self.emit("error", err, method);
                    return callback(err);
                }

                if (response === null) {
                    self.end(/* endedByRPC */ true);
                    return undefined;
                }

                if (!(response instanceof responseCtor)) {
                    try {
                        response = responseCtor[self.responseDelimited ? "decodeDelimited" : "decode"](response);
                    } catch (err) {
                        self.emit("error", err, method);
                        return callback(err);
                    }
                }

                self.emit("data", response, method);
                return callback(null, response);
            }
        );
    } catch (err) {
        self.emit("error", err, method);
        setTimeout(function() { callback(err); }, 0);
        return undefined;
    }
};

/**
 * Ends this service and emits the `end` event.
 * @param {boolean} [endedByRPC=false] Whether the service has been ended by the RPC implementation.
 * @returns {rpc.Service} `this`
 */
Service.prototype.end = function end(endedByRPC) {
    if (this.rpcImpl) {
        if (!endedByRPC) // signal end to rpcImpl
            this.rpcImpl(null, null, null);
        this.rpcImpl = null;
        this.emit("end").off();
    }
    return this;
};


/***/ }),

/***/ 7513:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = Service;

// extends Namespace
var Namespace = __webpack_require__(9313);
((Service.prototype = Object.create(Namespace.prototype)).constructor = Service).className = "Service";

var Method = __webpack_require__(4429),
    util   = __webpack_require__(9935),
    rpc    = __webpack_require__(5994);

/**
 * Constructs a new service instance.
 * @classdesc Reflected service.
 * @extends NamespaceBase
 * @constructor
 * @param {string} name Service name
 * @param {Object.<string,*>} [options] Service options
 * @throws {TypeError} If arguments are invalid
 */
function Service(name, options) {
    Namespace.call(this, name, options);

    /**
     * Service methods.
     * @type {Object.<string,Method>}
     */
    this.methods = {}; // toJSON, marker

    /**
     * Cached methods as an array.
     * @type {Method[]|null}
     * @private
     */
    this._methodsArray = null;
}

/**
 * Service descriptor.
 * @interface IService
 * @extends INamespace
 * @property {Object.<string,IMethod>} methods Method descriptors
 */

/**
 * Constructs a service from a service descriptor.
 * @param {string} name Service name
 * @param {IService} json Service descriptor
 * @returns {Service} Created service
 * @throws {TypeError} If arguments are invalid
 */
Service.fromJSON = function fromJSON(name, json) {
    var service = new Service(name, json.options);
    /* istanbul ignore else */
    if (json.methods)
        for (var names = Object.keys(json.methods), i = 0; i < names.length; ++i)
            service.add(Method.fromJSON(names[i], json.methods[names[i]]));
    if (json.nested)
        service.addJSON(json.nested);
    service.comment = json.comment;
    return service;
};

/**
 * Converts this service to a service descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IService} Service descriptor
 */
Service.prototype.toJSON = function toJSON(toJSONOptions) {
    var inherited = Namespace.prototype.toJSON.call(this, toJSONOptions);
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "options" , inherited && inherited.options || undefined,
        "methods" , Namespace.arrayToJSON(this.methodsArray, toJSONOptions) || /* istanbul ignore next */ {},
        "nested"  , inherited && inherited.nested || undefined,
        "comment" , keepComments ? this.comment : undefined
    ]);
};

/**
 * Methods of this service as an array for iteration.
 * @name Service#methodsArray
 * @type {Method[]}
 * @readonly
 */
Object.defineProperty(Service.prototype, "methodsArray", {
    get: function() {
        return this._methodsArray || (this._methodsArray = util.toArray(this.methods));
    }
});

function clearCache(service) {
    service._methodsArray = null;
    return service;
}

/**
 * @override
 */
Service.prototype.get = function get(name) {
    return this.methods[name]
        || Namespace.prototype.get.call(this, name);
};

/**
 * @override
 */
Service.prototype.resolveAll = function resolveAll() {
    var methods = this.methodsArray;
    for (var i = 0; i < methods.length; ++i)
        methods[i].resolve();
    return Namespace.prototype.resolve.call(this);
};

/**
 * @override
 */
Service.prototype.add = function add(object) {

    /* istanbul ignore if */
    if (this.get(object.name))
        throw Error("duplicate name '" + object.name + "' in " + this);

    if (object instanceof Method) {
        this.methods[object.name] = object;
        object.parent = this;
        return clearCache(this);
    }
    return Namespace.prototype.add.call(this, object);
};

/**
 * @override
 */
Service.prototype.remove = function remove(object) {
    if (object instanceof Method) {

        /* istanbul ignore if */
        if (this.methods[object.name] !== object)
            throw Error(object + " is not a member of " + this);

        delete this.methods[object.name];
        object.parent = null;
        return clearCache(this);
    }
    return Namespace.prototype.remove.call(this, object);
};

/**
 * Creates a runtime service using the specified rpc implementation.
 * @param {RPCImpl} rpcImpl RPC implementation
 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
 * @returns {rpc.Service} RPC service. Useful where requests and/or responses are streamed.
 */
Service.prototype.create = function create(rpcImpl, requestDelimited, responseDelimited) {
    var rpcService = new rpc.Service(rpcImpl, requestDelimited, responseDelimited);
    for (var i = 0, method; i < /* initializes */ this.methodsArray.length; ++i) {
        var methodName = util.lcFirst((method = this._methodsArray[i]).resolve().name).replace(/[^$\w_]/g, "");
        rpcService[methodName] = util.codegen(["r","c"], util.isReserved(methodName) ? methodName + "_" : methodName)("return this.rpcCall(m,q,s,r,c)")({
            m: method,
            q: method.resolvedRequestType.ctor,
            s: method.resolvedResponseType.ctor
        });
    }
    return rpcService;
};


/***/ }),

/***/ 7645:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = Type;

// extends Namespace
var Namespace = __webpack_require__(9313);
((Type.prototype = Object.create(Namespace.prototype)).constructor = Type).className = "Type";

var Enum      = __webpack_require__(7025),
    OneOf     = __webpack_require__(7598),
    Field     = __webpack_require__(3548),
    MapField  = __webpack_require__(6039),
    Service   = __webpack_require__(7513),
    Message   = __webpack_require__(8368),
    Reader    = __webpack_require__(1408),
    Writer    = __webpack_require__(1173),
    util      = __webpack_require__(9935),
    encoder   = __webpack_require__(4928),
    decoder   = __webpack_require__(5305),
    verifier  = __webpack_require__(4497),
    converter = __webpack_require__(3996),
    wrappers  = __webpack_require__(1667);

/**
 * Constructs a new reflected message type instance.
 * @classdesc Reflected message type.
 * @extends NamespaceBase
 * @constructor
 * @param {string} name Message name
 * @param {Object.<string,*>} [options] Declared options
 */
function Type(name, options) {
    Namespace.call(this, name, options);

    /**
     * Message fields.
     * @type {Object.<string,Field>}
     */
    this.fields = {};  // toJSON, marker

    /**
     * Oneofs declared within this namespace, if any.
     * @type {Object.<string,OneOf>}
     */
    this.oneofs = undefined; // toJSON

    /**
     * Extension ranges, if any.
     * @type {number[][]}
     */
    this.extensions = undefined; // toJSON

    /**
     * Reserved ranges, if any.
     * @type {Array.<number[]|string>}
     */
    this.reserved = undefined; // toJSON

    /*?
     * Whether this type is a legacy group.
     * @type {boolean|undefined}
     */
    this.group = undefined; // toJSON

    /**
     * Cached fields by id.
     * @type {Object.<number,Field>|null}
     * @private
     */
    this._fieldsById = null;

    /**
     * Cached fields as an array.
     * @type {Field[]|null}
     * @private
     */
    this._fieldsArray = null;

    /**
     * Cached oneofs as an array.
     * @type {OneOf[]|null}
     * @private
     */
    this._oneofsArray = null;

    /**
     * Cached constructor.
     * @type {Constructor<{}>}
     * @private
     */
    this._ctor = null;
}

Object.defineProperties(Type.prototype, {

    /**
     * Message fields by id.
     * @name Type#fieldsById
     * @type {Object.<number,Field>}
     * @readonly
     */
    fieldsById: {
        get: function() {

            /* istanbul ignore if */
            if (this._fieldsById)
                return this._fieldsById;

            this._fieldsById = {};
            for (var names = Object.keys(this.fields), i = 0; i < names.length; ++i) {
                var field = this.fields[names[i]],
                    id = field.id;

                /* istanbul ignore if */
                if (this._fieldsById[id])
                    throw Error("duplicate id " + id + " in " + this);

                this._fieldsById[id] = field;
            }
            return this._fieldsById;
        }
    },

    /**
     * Fields of this message as an array for iteration.
     * @name Type#fieldsArray
     * @type {Field[]}
     * @readonly
     */
    fieldsArray: {
        get: function() {
            return this._fieldsArray || (this._fieldsArray = util.toArray(this.fields));
        }
    },

    /**
     * Oneofs of this message as an array for iteration.
     * @name Type#oneofsArray
     * @type {OneOf[]}
     * @readonly
     */
    oneofsArray: {
        get: function() {
            return this._oneofsArray || (this._oneofsArray = util.toArray(this.oneofs));
        }
    },

    /**
     * The registered constructor, if any registered, otherwise a generic constructor.
     * Assigning a function replaces the internal constructor. If the function does not extend {@link Message} yet, its prototype will be setup accordingly and static methods will be populated. If it already extends {@link Message}, it will just replace the internal constructor.
     * @name Type#ctor
     * @type {Constructor<{}>}
     */
    ctor: {
        get: function() {
            return this._ctor || (this.ctor = Type.generateConstructor(this)());
        },
        set: function(ctor) {

            // Ensure proper prototype
            var prototype = ctor.prototype;
            if (!(prototype instanceof Message)) {
                (ctor.prototype = new Message()).constructor = ctor;
                util.merge(ctor.prototype, prototype);
            }

            // Classes and messages reference their reflected type
            ctor.$type = ctor.prototype.$type = this;

            // Mix in static methods
            util.merge(ctor, Message, true);

            this._ctor = ctor;

            // Messages have non-enumerable default values on their prototype
            var i = 0;
            for (; i < /* initializes */ this.fieldsArray.length; ++i)
                this._fieldsArray[i].resolve(); // ensures a proper value

            // Messages have non-enumerable getters and setters for each virtual oneof field
            var ctorProperties = {};
            for (i = 0; i < /* initializes */ this.oneofsArray.length; ++i)
                ctorProperties[this._oneofsArray[i].resolve().name] = {
                    get: util.oneOfGetter(this._oneofsArray[i].oneof),
                    set: util.oneOfSetter(this._oneofsArray[i].oneof)
                };
            if (i)
                Object.defineProperties(ctor.prototype, ctorProperties);
        }
    }
});

/**
 * Generates a constructor function for the specified type.
 * @param {Type} mtype Message type
 * @returns {Codegen} Codegen instance
 */
Type.generateConstructor = function generateConstructor(mtype) {
    /* eslint-disable no-unexpected-multiline */
    var gen = util.codegen(["p"], mtype.name);
    // explicitly initialize mutable object/array fields so that these aren't just inherited from the prototype
    for (var i = 0, field; i < mtype.fieldsArray.length; ++i)
        if ((field = mtype._fieldsArray[i]).map) gen
            ("this%s={}", util.safeProp(field.name));
        else if (field.repeated) gen
            ("this%s=[]", util.safeProp(field.name));
    return gen
    ("if(p)for(var ks=Object.keys(p),i=0;i<ks.length;++i)if(p[ks[i]]!=null)") // omit undefined or null
        ("this[ks[i]]=p[ks[i]]");
    /* eslint-enable no-unexpected-multiline */
};

function clearCache(type) {
    type._fieldsById = type._fieldsArray = type._oneofsArray = null;
    delete type.encode;
    delete type.decode;
    delete type.verify;
    return type;
}

/**
 * Message type descriptor.
 * @interface IType
 * @extends INamespace
 * @property {Object.<string,IOneOf>} [oneofs] Oneof descriptors
 * @property {Object.<string,IField>} fields Field descriptors
 * @property {number[][]} [extensions] Extension ranges
 * @property {number[][]} [reserved] Reserved ranges
 * @property {boolean} [group=false] Whether a legacy group or not
 */

/**
 * Creates a message type from a message type descriptor.
 * @param {string} name Message name
 * @param {IType} json Message type descriptor
 * @returns {Type} Created message type
 */
Type.fromJSON = function fromJSON(name, json) {
    var type = new Type(name, json.options);
    type.extensions = json.extensions;
    type.reserved = json.reserved;
    var names = Object.keys(json.fields),
        i = 0;
    for (; i < names.length; ++i)
        type.add(
            ( typeof json.fields[names[i]].keyType !== "undefined"
            ? MapField.fromJSON
            : Field.fromJSON )(names[i], json.fields[names[i]])
        );
    if (json.oneofs)
        for (names = Object.keys(json.oneofs), i = 0; i < names.length; ++i)
            type.add(OneOf.fromJSON(names[i], json.oneofs[names[i]]));
    if (json.nested)
        for (names = Object.keys(json.nested), i = 0; i < names.length; ++i) {
            var nested = json.nested[names[i]];
            type.add( // most to least likely
                ( nested.id !== undefined
                ? Field.fromJSON
                : nested.fields !== undefined
                ? Type.fromJSON
                : nested.values !== undefined
                ? Enum.fromJSON
                : nested.methods !== undefined
                ? Service.fromJSON
                : Namespace.fromJSON )(names[i], nested)
            );
        }
    if (json.extensions && json.extensions.length)
        type.extensions = json.extensions;
    if (json.reserved && json.reserved.length)
        type.reserved = json.reserved;
    if (json.group)
        type.group = true;
    if (json.comment)
        type.comment = json.comment;
    return type;
};

/**
 * Converts this message type to a message type descriptor.
 * @param {IToJSONOptions} [toJSONOptions] JSON conversion options
 * @returns {IType} Message type descriptor
 */
Type.prototype.toJSON = function toJSON(toJSONOptions) {
    var inherited = Namespace.prototype.toJSON.call(this, toJSONOptions);
    var keepComments = toJSONOptions ? Boolean(toJSONOptions.keepComments) : false;
    return util.toObject([
        "options"    , inherited && inherited.options || undefined,
        "oneofs"     , Namespace.arrayToJSON(this.oneofsArray, toJSONOptions),
        "fields"     , Namespace.arrayToJSON(this.fieldsArray.filter(function(obj) { return !obj.declaringField; }), toJSONOptions) || {},
        "extensions" , this.extensions && this.extensions.length ? this.extensions : undefined,
        "reserved"   , this.reserved && this.reserved.length ? this.reserved : undefined,
        "group"      , this.group || undefined,
        "nested"     , inherited && inherited.nested || undefined,
        "comment"    , keepComments ? this.comment : undefined
    ]);
};

/**
 * @override
 */
Type.prototype.resolveAll = function resolveAll() {
    var fields = this.fieldsArray, i = 0;
    while (i < fields.length)
        fields[i++].resolve();
    var oneofs = this.oneofsArray; i = 0;
    while (i < oneofs.length)
        oneofs[i++].resolve();
    return Namespace.prototype.resolveAll.call(this);
};

/**
 * @override
 */
Type.prototype.get = function get(name) {
    return this.fields[name]
        || this.oneofs && this.oneofs[name]
        || this.nested && this.nested[name]
        || null;
};

/**
 * Adds a nested object to this type.
 * @param {ReflectionObject} object Nested object to add
 * @returns {Type} `this`
 * @throws {TypeError} If arguments are invalid
 * @throws {Error} If there is already a nested object with this name or, if a field, when there is already a field with this id
 */
Type.prototype.add = function add(object) {

    if (this.get(object.name))
        throw Error("duplicate name '" + object.name + "' in " + this);

    if (object instanceof Field && object.extend === undefined) {
        // NOTE: Extension fields aren't actual fields on the declaring type, but nested objects.
        // The root object takes care of adding distinct sister-fields to the respective extended
        // type instead.

        // avoids calling the getter if not absolutely necessary because it's called quite frequently
        if (this._fieldsById ? /* istanbul ignore next */ this._fieldsById[object.id] : this.fieldsById[object.id])
            throw Error("duplicate id " + object.id + " in " + this);
        if (this.isReservedId(object.id))
            throw Error("id " + object.id + " is reserved in " + this);
        if (this.isReservedName(object.name))
            throw Error("name '" + object.name + "' is reserved in " + this);

        if (object.parent)
            object.parent.remove(object);
        this.fields[object.name] = object;
        object.message = this;
        object.onAdd(this);
        return clearCache(this);
    }
    if (object instanceof OneOf) {
        if (!this.oneofs)
            this.oneofs = {};
        this.oneofs[object.name] = object;
        object.onAdd(this);
        return clearCache(this);
    }
    return Namespace.prototype.add.call(this, object);
};

/**
 * Removes a nested object from this type.
 * @param {ReflectionObject} object Nested object to remove
 * @returns {Type} `this`
 * @throws {TypeError} If arguments are invalid
 * @throws {Error} If `object` is not a member of this type
 */
Type.prototype.remove = function remove(object) {
    if (object instanceof Field && object.extend === undefined) {
        // See Type#add for the reason why extension fields are excluded here.

        /* istanbul ignore if */
        if (!this.fields || this.fields[object.name] !== object)
            throw Error(object + " is not a member of " + this);

        delete this.fields[object.name];
        object.parent = null;
        object.onRemove(this);
        return clearCache(this);
    }
    if (object instanceof OneOf) {

        /* istanbul ignore if */
        if (!this.oneofs || this.oneofs[object.name] !== object)
            throw Error(object + " is not a member of " + this);

        delete this.oneofs[object.name];
        object.parent = null;
        object.onRemove(this);
        return clearCache(this);
    }
    return Namespace.prototype.remove.call(this, object);
};

/**
 * Tests if the specified id is reserved.
 * @param {number} id Id to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
Type.prototype.isReservedId = function isReservedId(id) {
    return Namespace.isReservedId(this.reserved, id);
};

/**
 * Tests if the specified name is reserved.
 * @param {string} name Name to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
Type.prototype.isReservedName = function isReservedName(name) {
    return Namespace.isReservedName(this.reserved, name);
};

/**
 * Creates a new message of this type using the specified properties.
 * @param {Object.<string,*>} [properties] Properties to set
 * @returns {Message<{}>} Message instance
 */
Type.prototype.create = function create(properties) {
    return new this.ctor(properties);
};

/**
 * Sets up {@link Type#encode|encode}, {@link Type#decode|decode} and {@link Type#verify|verify}.
 * @returns {Type} `this`
 */
Type.prototype.setup = function setup() {
    // Sets up everything at once so that the prototype chain does not have to be re-evaluated
    // multiple times (V8, soft-deopt prototype-check).

    var fullName = this.fullName,
        types    = [];
    for (var i = 0; i < /* initializes */ this.fieldsArray.length; ++i)
        types.push(this._fieldsArray[i].resolve().resolvedType);

    // Replace setup methods with type-specific generated functions
    this.encode = encoder(this)({
        Writer : Writer,
        types  : types,
        util   : util
    });
    this.decode = decoder(this)({
        Reader : Reader,
        types  : types,
        util   : util
    });
    this.verify = verifier(this)({
        types : types,
        util  : util
    });
    this.fromObject = converter.fromObject(this)({
        types : types,
        util  : util
    });
    this.toObject = converter.toObject(this)({
        types : types,
        util  : util
    });

    // Inject custom wrappers for common types
    var wrapper = wrappers[fullName];
    if (wrapper) {
        var originalThis = Object.create(this);
        // if (wrapper.fromObject) {
            originalThis.fromObject = this.fromObject;
            this.fromObject = wrapper.fromObject.bind(originalThis);
        // }
        // if (wrapper.toObject) {
            originalThis.toObject = this.toObject;
            this.toObject = wrapper.toObject.bind(originalThis);
        // }
    }

    return this;
};

/**
 * Encodes a message of this type. Does not implicitly {@link Type#verify|verify} messages.
 * @param {Message<{}>|Object.<string,*>} message Message instance or plain object
 * @param {Writer} [writer] Writer to encode to
 * @returns {Writer} writer
 */
Type.prototype.encode = function encode_setup(message, writer) {
    return this.setup().encode(message, writer); // overrides this method
};

/**
 * Encodes a message of this type preceeded by its byte length as a varint. Does not implicitly {@link Type#verify|verify} messages.
 * @param {Message<{}>|Object.<string,*>} message Message instance or plain object
 * @param {Writer} [writer] Writer to encode to
 * @returns {Writer} writer
 */
Type.prototype.encodeDelimited = function encodeDelimited(message, writer) {
    return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
};

/**
 * Decodes a message of this type.
 * @param {Reader|Uint8Array} reader Reader or buffer to decode from
 * @param {number} [length] Length of the message, if known beforehand
 * @returns {Message<{}>} Decoded message
 * @throws {Error} If the payload is not a reader or valid buffer
 * @throws {util.ProtocolError<{}>} If required fields are missing
 */
Type.prototype.decode = function decode_setup(reader, length) {
    return this.setup().decode(reader, length); // overrides this method
};

/**
 * Decodes a message of this type preceeded by its byte length as a varint.
 * @param {Reader|Uint8Array} reader Reader or buffer to decode from
 * @returns {Message<{}>} Decoded message
 * @throws {Error} If the payload is not a reader or valid buffer
 * @throws {util.ProtocolError} If required fields are missing
 */
Type.prototype.decodeDelimited = function decodeDelimited(reader) {
    if (!(reader instanceof Reader))
        reader = Reader.create(reader);
    return this.decode(reader, reader.uint32());
};

/**
 * Verifies that field values are valid and that required fields are present.
 * @param {Object.<string,*>} message Plain object to verify
 * @returns {null|string} `null` if valid, otherwise the reason why it is not
 */
Type.prototype.verify = function verify_setup(message) {
    return this.setup().verify(message); // overrides this method
};

/**
 * Creates a new message of this type from a plain object. Also converts values to their respective internal types.
 * @param {Object.<string,*>} object Plain object to convert
 * @returns {Message<{}>} Message instance
 */
Type.prototype.fromObject = function fromObject(object) {
    return this.setup().fromObject(object);
};

/**
 * Conversion options as used by {@link Type#toObject} and {@link Message.toObject}.
 * @interface IConversionOptions
 * @property {Function} [longs] Long conversion type.
 * Valid values are `String` and `Number` (the global types).
 * Defaults to copy the present value, which is a possibly unsafe number without and a {@link Long} with a long library.
 * @property {Function} [enums] Enum value conversion type.
 * Only valid value is `String` (the global type).
 * Defaults to copy the present value, which is the numeric id.
 * @property {Function} [bytes] Bytes value conversion type.
 * Valid values are `Array` and (a base64 encoded) `String` (the global types).
 * Defaults to copy the present value, which usually is a Buffer under node and an Uint8Array in the browser.
 * @property {boolean} [defaults=false] Also sets default values on the resulting object
 * @property {boolean} [arrays=false] Sets empty arrays for missing repeated fields even if `defaults=false`
 * @property {boolean} [objects=false] Sets empty objects for missing map fields even if `defaults=false`
 * @property {boolean} [oneofs=false] Includes virtual oneof properties set to the present field's name, if any
 * @property {boolean} [json=false] Performs additional JSON compatibility conversions, i.e. NaN and Infinity to strings
 */

/**
 * Creates a plain object from a message of this type. Also converts values to other types if specified.
 * @param {Message<{}>} message Message instance
 * @param {IConversionOptions} [options] Conversion options
 * @returns {Object.<string,*>} Plain object
 */
Type.prototype.toObject = function toObject(message, options) {
    return this.setup().toObject(message, options);
};

/**
 * Decorator function as returned by {@link Type.d} (TypeScript).
 * @typedef TypeDecorator
 * @type {function}
 * @param {Constructor<T>} target Target constructor
 * @returns {undefined}
 * @template T extends Message<T>
 */

/**
 * Type decorator (TypeScript).
 * @param {string} [typeName] Type name, defaults to the constructor's name
 * @returns {TypeDecorator<T>} Decorator function
 * @template T extends Message<T>
 */
Type.d = function decorateType(typeName) {
    return function typeDecorator(target) {
        util.decorateType(target, typeName);
    };
};


/***/ }),

/***/ 7063:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


/**
 * Common type constants.
 * @namespace
 */
var types = exports;

var util = __webpack_require__(9935);

var s = [
    "double",   // 0
    "float",    // 1
    "int32",    // 2
    "uint32",   // 3
    "sint32",   // 4
    "fixed32",  // 5
    "sfixed32", // 6
    "int64",    // 7
    "uint64",   // 8
    "sint64",   // 9
    "fixed64",  // 10
    "sfixed64", // 11
    "bool",     // 12
    "string",   // 13
    "bytes"     // 14
];

function bake(values, offset) {
    var i = 0, o = {};
    offset |= 0;
    while (i < values.length) o[s[i + offset]] = values[i++];
    return o;
}

/**
 * Basic type wire types.
 * @type {Object.<string,number>}
 * @const
 * @property {number} double=1 Fixed64 wire type
 * @property {number} float=5 Fixed32 wire type
 * @property {number} int32=0 Varint wire type
 * @property {number} uint32=0 Varint wire type
 * @property {number} sint32=0 Varint wire type
 * @property {number} fixed32=5 Fixed32 wire type
 * @property {number} sfixed32=5 Fixed32 wire type
 * @property {number} int64=0 Varint wire type
 * @property {number} uint64=0 Varint wire type
 * @property {number} sint64=0 Varint wire type
 * @property {number} fixed64=1 Fixed64 wire type
 * @property {number} sfixed64=1 Fixed64 wire type
 * @property {number} bool=0 Varint wire type
 * @property {number} string=2 Ldelim wire type
 * @property {number} bytes=2 Ldelim wire type
 */
types.basic = bake([
    /* double   */ 1,
    /* float    */ 5,
    /* int32    */ 0,
    /* uint32   */ 0,
    /* sint32   */ 0,
    /* fixed32  */ 5,
    /* sfixed32 */ 5,
    /* int64    */ 0,
    /* uint64   */ 0,
    /* sint64   */ 0,
    /* fixed64  */ 1,
    /* sfixed64 */ 1,
    /* bool     */ 0,
    /* string   */ 2,
    /* bytes    */ 2
]);

/**
 * Basic type defaults.
 * @type {Object.<string,*>}
 * @const
 * @property {number} double=0 Double default
 * @property {number} float=0 Float default
 * @property {number} int32=0 Int32 default
 * @property {number} uint32=0 Uint32 default
 * @property {number} sint32=0 Sint32 default
 * @property {number} fixed32=0 Fixed32 default
 * @property {number} sfixed32=0 Sfixed32 default
 * @property {number} int64=0 Int64 default
 * @property {number} uint64=0 Uint64 default
 * @property {number} sint64=0 Sint32 default
 * @property {number} fixed64=0 Fixed64 default
 * @property {number} sfixed64=0 Sfixed64 default
 * @property {boolean} bool=false Bool default
 * @property {string} string="" String default
 * @property {Array.<number>} bytes=Array(0) Bytes default
 * @property {null} message=null Message default
 */
types.defaults = bake([
    /* double   */ 0,
    /* float    */ 0,
    /* int32    */ 0,
    /* uint32   */ 0,
    /* sint32   */ 0,
    /* fixed32  */ 0,
    /* sfixed32 */ 0,
    /* int64    */ 0,
    /* uint64   */ 0,
    /* sint64   */ 0,
    /* fixed64  */ 0,
    /* sfixed64 */ 0,
    /* bool     */ false,
    /* string   */ "",
    /* bytes    */ util.emptyArray,
    /* message  */ null
]);

/**
 * Basic long type wire types.
 * @type {Object.<string,number>}
 * @const
 * @property {number} int64=0 Varint wire type
 * @property {number} uint64=0 Varint wire type
 * @property {number} sint64=0 Varint wire type
 * @property {number} fixed64=1 Fixed64 wire type
 * @property {number} sfixed64=1 Fixed64 wire type
 */
types.long = bake([
    /* int64    */ 0,
    /* uint64   */ 0,
    /* sint64   */ 0,
    /* fixed64  */ 1,
    /* sfixed64 */ 1
], 7);

/**
 * Allowed types for map keys with their associated wire type.
 * @type {Object.<string,number>}
 * @const
 * @property {number} int32=0 Varint wire type
 * @property {number} uint32=0 Varint wire type
 * @property {number} sint32=0 Varint wire type
 * @property {number} fixed32=5 Fixed32 wire type
 * @property {number} sfixed32=5 Fixed32 wire type
 * @property {number} int64=0 Varint wire type
 * @property {number} uint64=0 Varint wire type
 * @property {number} sint64=0 Varint wire type
 * @property {number} fixed64=1 Fixed64 wire type
 * @property {number} sfixed64=1 Fixed64 wire type
 * @property {number} bool=0 Varint wire type
 * @property {number} string=2 Ldelim wire type
 */
types.mapKey = bake([
    /* int32    */ 0,
    /* uint32   */ 0,
    /* sint32   */ 0,
    /* fixed32  */ 5,
    /* sfixed32 */ 5,
    /* int64    */ 0,
    /* uint64   */ 0,
    /* sint64   */ 0,
    /* fixed64  */ 1,
    /* sfixed64 */ 1,
    /* bool     */ 0,
    /* string   */ 2
], 2);

/**
 * Allowed types for packed repeated fields with their associated wire type.
 * @type {Object.<string,number>}
 * @const
 * @property {number} double=1 Fixed64 wire type
 * @property {number} float=5 Fixed32 wire type
 * @property {number} int32=0 Varint wire type
 * @property {number} uint32=0 Varint wire type
 * @property {number} sint32=0 Varint wire type
 * @property {number} fixed32=5 Fixed32 wire type
 * @property {number} sfixed32=5 Fixed32 wire type
 * @property {number} int64=0 Varint wire type
 * @property {number} uint64=0 Varint wire type
 * @property {number} sint64=0 Varint wire type
 * @property {number} fixed64=1 Fixed64 wire type
 * @property {number} sfixed64=1 Fixed64 wire type
 * @property {number} bool=0 Varint wire type
 */
types.packed = bake([
    /* double   */ 1,
    /* float    */ 5,
    /* int32    */ 0,
    /* uint32   */ 0,
    /* sint32   */ 0,
    /* fixed32  */ 5,
    /* sfixed32 */ 5,
    /* int64    */ 0,
    /* uint64   */ 0,
    /* sint64   */ 0,
    /* fixed64  */ 1,
    /* sfixed64 */ 1,
    /* bool     */ 0
]);


/***/ }),

/***/ 9935:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/**
 * Various utility functions.
 * @namespace
 */
var util = module.exports = __webpack_require__(9693);

var roots = __webpack_require__(5054);

var Type, // cyclic
    Enum;

util.codegen = __webpack_require__(5124);
util.fetch   = __webpack_require__(9054);
util.path    = __webpack_require__(8626);

/**
 * Node's fs module if available.
 * @type {Object.<string,*>}
 */
util.fs = util.inquire("fs");

/**
 * Converts an object's values to an array.
 * @param {Object.<string,*>} object Object to convert
 * @returns {Array.<*>} Converted array
 */
util.toArray = function toArray(object) {
    if (object) {
        var keys  = Object.keys(object),
            array = new Array(keys.length),
            index = 0;
        while (index < keys.length)
            array[index] = object[keys[index++]];
        return array;
    }
    return [];
};

/**
 * Converts an array of keys immediately followed by their respective value to an object, omitting undefined values.
 * @param {Array.<*>} array Array to convert
 * @returns {Object.<string,*>} Converted object
 */
util.toObject = function toObject(array) {
    var object = {},
        index  = 0;
    while (index < array.length) {
        var key = array[index++],
            val = array[index++];
        if (val !== undefined)
            object[key] = val;
    }
    return object;
};

var safePropBackslashRe = /\\/g,
    safePropQuoteRe     = /"/g;

/**
 * Tests whether the specified name is a reserved word in JS.
 * @param {string} name Name to test
 * @returns {boolean} `true` if reserved, otherwise `false`
 */
util.isReserved = function isReserved(name) {
    return /^(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$/.test(name);
};

/**
 * Returns a safe property accessor for the specified property name.
 * @param {string} prop Property name
 * @returns {string} Safe accessor
 */
util.safeProp = function safeProp(prop) {
    if (!/^[$\w_]+$/.test(prop) || util.isReserved(prop))
        return "[\"" + prop.replace(safePropBackslashRe, "\\\\").replace(safePropQuoteRe, "\\\"") + "\"]";
    return "." + prop;
};

/**
 * Converts the first character of a string to upper case.
 * @param {string} str String to convert
 * @returns {string} Converted string
 */
util.ucFirst = function ucFirst(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
};

var camelCaseRe = /_([a-z])/g;

/**
 * Converts a string to camel case.
 * @param {string} str String to convert
 * @returns {string} Converted string
 */
util.camelCase = function camelCase(str) {
    return str.substring(0, 1)
         + str.substring(1)
               .replace(camelCaseRe, function($0, $1) { return $1.toUpperCase(); });
};

/**
 * Compares reflected fields by id.
 * @param {Field} a First field
 * @param {Field} b Second field
 * @returns {number} Comparison value
 */
util.compareFieldsById = function compareFieldsById(a, b) {
    return a.id - b.id;
};

/**
 * Decorator helper for types (TypeScript).
 * @param {Constructor<T>} ctor Constructor function
 * @param {string} [typeName] Type name, defaults to the constructor's name
 * @returns {Type} Reflected type
 * @template T extends Message<T>
 * @property {Root} root Decorators root
 */
util.decorateType = function decorateType(ctor, typeName) {

    /* istanbul ignore if */
    if (ctor.$type) {
        if (typeName && ctor.$type.name !== typeName) {
            util.decorateRoot.remove(ctor.$type);
            ctor.$type.name = typeName;
            util.decorateRoot.add(ctor.$type);
        }
        return ctor.$type;
    }

    /* istanbul ignore next */
    if (!Type)
        Type = __webpack_require__(7645);

    var type = new Type(typeName || ctor.name);
    util.decorateRoot.add(type);
    type.ctor = ctor; // sets up .encode, .decode etc.
    Object.defineProperty(ctor, "$type", { value: type, enumerable: false });
    Object.defineProperty(ctor.prototype, "$type", { value: type, enumerable: false });
    return type;
};

var decorateEnumIndex = 0;

/**
 * Decorator helper for enums (TypeScript).
 * @param {Object} object Enum object
 * @returns {Enum} Reflected enum
 */
util.decorateEnum = function decorateEnum(object) {

    /* istanbul ignore if */
    if (object.$type)
        return object.$type;

    /* istanbul ignore next */
    if (!Enum)
        Enum = __webpack_require__(7025);

    var enm = new Enum("Enum" + decorateEnumIndex++, object);
    util.decorateRoot.add(enm);
    Object.defineProperty(object, "$type", { value: enm, enumerable: false });
    return enm;
};


/**
 * Sets the value of a property by property path. If a value already exists, it is turned to an array
 * @param {Object.<string,*>} dst Destination object
 * @param {string} path dot '.' delimited path of the property to set
 * @param {Object} value the value to set
 * @returns {Object.<string,*>} Destination object
 */
util.setProperty = function setProperty(dst, path, value) {
    function setProp(dst, path, value) {
        var part = path.shift();
        if (path.length > 0) {
            dst[part] = setProp(dst[part] || {}, path, value);
        } else {
            var prevValue = dst[part];
            if (prevValue)
                value = [].concat(prevValue).concat(value);
            dst[part] = value;
        }
        return dst;
    }

    if (typeof dst !== "object")
        throw TypeError("dst must be an object");
    if (!path)
        throw TypeError("path must be specified");

    path = path.split(".");
    return setProp(dst, path, value);
};

/**
 * Decorator root (TypeScript).
 * @name util.decorateRoot
 * @type {Root}
 * @readonly
 */
Object.defineProperty(util, "decorateRoot", {
    get: function() {
        return roots["decorated"] || (roots["decorated"] = new (__webpack_require__(9424))());
    }
});


/***/ }),

/***/ 1945:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = LongBits;

var util = __webpack_require__(9693);

/**
 * Constructs new long bits.
 * @classdesc Helper class for working with the low and high bits of a 64 bit value.
 * @memberof util
 * @constructor
 * @param {number} lo Low 32 bits, unsigned
 * @param {number} hi High 32 bits, unsigned
 */
function LongBits(lo, hi) {

    // note that the casts below are theoretically unnecessary as of today, but older statically
    // generated converter code might still call the ctor with signed 32bits. kept for compat.

    /**
     * Low bits.
     * @type {number}
     */
    this.lo = lo >>> 0;

    /**
     * High bits.
     * @type {number}
     */
    this.hi = hi >>> 0;
}

/**
 * Zero bits.
 * @memberof util.LongBits
 * @type {util.LongBits}
 */
var zero = LongBits.zero = new LongBits(0, 0);

zero.toNumber = function() { return 0; };
zero.zzEncode = zero.zzDecode = function() { return this; };
zero.length = function() { return 1; };

/**
 * Zero hash.
 * @memberof util.LongBits
 * @type {string}
 */
var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";

/**
 * Constructs new long bits from the specified number.
 * @param {number} value Value
 * @returns {util.LongBits} Instance
 */
LongBits.fromNumber = function fromNumber(value) {
    if (value === 0)
        return zero;
    var sign = value < 0;
    if (sign)
        value = -value;
    var lo = value >>> 0,
        hi = (value - lo) / 4294967296 >>> 0;
    if (sign) {
        hi = ~hi >>> 0;
        lo = ~lo >>> 0;
        if (++lo > 4294967295) {
            lo = 0;
            if (++hi > 4294967295)
                hi = 0;
        }
    }
    return new LongBits(lo, hi);
};

/**
 * Constructs new long bits from a number, long or string.
 * @param {Long|number|string} value Value
 * @returns {util.LongBits} Instance
 */
LongBits.from = function from(value) {
    if (typeof value === "number")
        return LongBits.fromNumber(value);
    if (util.isString(value)) {
        /* istanbul ignore else */
        if (util.Long)
            value = util.Long.fromString(value);
        else
            return LongBits.fromNumber(parseInt(value, 10));
    }
    return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
};

/**
 * Converts this long bits to a possibly unsafe JavaScript number.
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {number} Possibly unsafe number
 */
LongBits.prototype.toNumber = function toNumber(unsigned) {
    if (!unsigned && this.hi >>> 31) {
        var lo = ~this.lo + 1 >>> 0,
            hi = ~this.hi     >>> 0;
        if (!lo)
            hi = hi + 1 >>> 0;
        return -(lo + hi * 4294967296);
    }
    return this.lo + this.hi * 4294967296;
};

/**
 * Converts this long bits to a long.
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {Long} Long
 */
LongBits.prototype.toLong = function toLong(unsigned) {
    return util.Long
        ? new util.Long(this.lo | 0, this.hi | 0, Boolean(unsigned))
        /* istanbul ignore next */
        : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
};

var charCodeAt = String.prototype.charCodeAt;

/**
 * Constructs new long bits from the specified 8 characters long hash.
 * @param {string} hash Hash
 * @returns {util.LongBits} Bits
 */
LongBits.fromHash = function fromHash(hash) {
    if (hash === zeroHash)
        return zero;
    return new LongBits(
        ( charCodeAt.call(hash, 0)
        | charCodeAt.call(hash, 1) << 8
        | charCodeAt.call(hash, 2) << 16
        | charCodeAt.call(hash, 3) << 24) >>> 0
    ,
        ( charCodeAt.call(hash, 4)
        | charCodeAt.call(hash, 5) << 8
        | charCodeAt.call(hash, 6) << 16
        | charCodeAt.call(hash, 7) << 24) >>> 0
    );
};

/**
 * Converts this long bits to a 8 characters long hash.
 * @returns {string} Hash
 */
LongBits.prototype.toHash = function toHash() {
    return String.fromCharCode(
        this.lo        & 255,
        this.lo >>> 8  & 255,
        this.lo >>> 16 & 255,
        this.lo >>> 24      ,
        this.hi        & 255,
        this.hi >>> 8  & 255,
        this.hi >>> 16 & 255,
        this.hi >>> 24
    );
};

/**
 * Zig-zag encodes this long bits.
 * @returns {util.LongBits} `this`
 */
LongBits.prototype.zzEncode = function zzEncode() {
    var mask =   this.hi >> 31;
    this.hi  = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
    this.lo  = ( this.lo << 1                   ^ mask) >>> 0;
    return this;
};

/**
 * Zig-zag decodes this long bits.
 * @returns {util.LongBits} `this`
 */
LongBits.prototype.zzDecode = function zzDecode() {
    var mask = -(this.lo & 1);
    this.lo  = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
    this.hi  = ( this.hi >>> 1                  ^ mask) >>> 0;
    return this;
};

/**
 * Calculates the length of this longbits when encoded as a varint.
 * @returns {number} Length
 */
LongBits.prototype.length = function length() {
    var part0 =  this.lo,
        part1 = (this.lo >>> 28 | this.hi << 4) >>> 0,
        part2 =  this.hi >>> 24;
    return part2 === 0
         ? part1 === 0
           ? part0 < 16384
             ? part0 < 128 ? 1 : 2
             : part0 < 2097152 ? 3 : 4
           : part1 < 16384
             ? part1 < 128 ? 5 : 6
             : part1 < 2097152 ? 7 : 8
         : part2 < 128 ? 9 : 10;
};


/***/ }),

/***/ 9693:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var util = exports;

// used to return a Promise where callback is omitted
util.asPromise = __webpack_require__(4537);

// converts to / from base64 encoded strings
util.base64 = __webpack_require__(7419);

// base class of rpc.Service
util.EventEmitter = __webpack_require__(9211);

// float handling accross browsers
util.float = __webpack_require__(945);

// requires modules optionally and hides the call from bundlers
util.inquire = __webpack_require__(7199);

// converts to / from utf8 encoded strings
util.utf8 = __webpack_require__(4997);

// provides a node-like buffer pool in the browser
util.pool = __webpack_require__(6662);

// utility to work with the low and high bits of a 64 bit value
util.LongBits = __webpack_require__(1945);

/**
 * Whether running within node or not.
 * @memberof util
 * @type {boolean}
 */
util.isNode = Boolean(typeof __webpack_require__.g !== "undefined"
                   && __webpack_require__.g
                   && __webpack_require__.g.process
                   && __webpack_require__.g.process.versions
                   && __webpack_require__.g.process.versions.node);

/**
 * Global object reference.
 * @memberof util
 * @type {Object}
 */
util.global = util.isNode && __webpack_require__.g
           || typeof window !== "undefined" && window
           || typeof self   !== "undefined" && self
           || this; // eslint-disable-line no-invalid-this

/**
 * An immuable empty array.
 * @memberof util
 * @type {Array.<*>}
 * @const
 */
util.emptyArray = Object.freeze ? Object.freeze([]) : /* istanbul ignore next */ []; // used on prototypes

/**
 * An immutable empty object.
 * @type {Object}
 * @const
 */
util.emptyObject = Object.freeze ? Object.freeze({}) : /* istanbul ignore next */ {}; // used on prototypes

/**
 * Tests if the specified value is an integer.
 * @function
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is an integer
 */
util.isInteger = Number.isInteger || /* istanbul ignore next */ function isInteger(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
};

/**
 * Tests if the specified value is a string.
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is a string
 */
util.isString = function isString(value) {
    return typeof value === "string" || value instanceof String;
};

/**
 * Tests if the specified value is a non-null object.
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is a non-null object
 */
util.isObject = function isObject(value) {
    return value && typeof value === "object";
};

/**
 * Checks if a property on a message is considered to be present.
 * This is an alias of {@link util.isSet}.
 * @function
 * @param {Object} obj Plain object or message instance
 * @param {string} prop Property name
 * @returns {boolean} `true` if considered to be present, otherwise `false`
 */
util.isset =

/**
 * Checks if a property on a message is considered to be present.
 * @param {Object} obj Plain object or message instance
 * @param {string} prop Property name
 * @returns {boolean} `true` if considered to be present, otherwise `false`
 */
util.isSet = function isSet(obj, prop) {
    var value = obj[prop];
    if (value != null && obj.hasOwnProperty(prop)) // eslint-disable-line eqeqeq, no-prototype-builtins
        return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
    return false;
};

/**
 * Any compatible Buffer instance.
 * This is a minimal stand-alone definition of a Buffer instance. The actual type is that exported by node's typings.
 * @interface Buffer
 * @extends Uint8Array
 */

/**
 * Node's Buffer class if available.
 * @type {Constructor<Buffer>}
 */
util.Buffer = (function() {
    try {
        var Buffer = util.inquire("buffer").Buffer;
        // refuse to use non-node buffers if not explicitly assigned (perf reasons):
        return Buffer.prototype.utf8Write ? Buffer : /* istanbul ignore next */ null;
    } catch (e) {
        /* istanbul ignore next */
        return null;
    }
})();

// Internal alias of or polyfull for Buffer.from.
util._Buffer_from = null;

// Internal alias of or polyfill for Buffer.allocUnsafe.
util._Buffer_allocUnsafe = null;

/**
 * Creates a new buffer of whatever type supported by the environment.
 * @param {number|number[]} [sizeOrArray=0] Buffer size or number array
 * @returns {Uint8Array|Buffer} Buffer
 */
util.newBuffer = function newBuffer(sizeOrArray) {
    /* istanbul ignore next */
    return typeof sizeOrArray === "number"
        ? util.Buffer
            ? util._Buffer_allocUnsafe(sizeOrArray)
            : new util.Array(sizeOrArray)
        : util.Buffer
            ? util._Buffer_from(sizeOrArray)
            : typeof Uint8Array === "undefined"
                ? sizeOrArray
                : new Uint8Array(sizeOrArray);
};

/**
 * Array implementation used in the browser. `Uint8Array` if supported, otherwise `Array`.
 * @type {Constructor<Uint8Array>}
 */
util.Array = typeof Uint8Array !== "undefined" ? Uint8Array /* istanbul ignore next */ : Array;

/**
 * Any compatible Long instance.
 * This is a minimal stand-alone definition of a Long instance. The actual type is that exported by long.js.
 * @interface Long
 * @property {number} low Low bits
 * @property {number} high High bits
 * @property {boolean} unsigned Whether unsigned or not
 */

/**
 * Long.js's Long class if available.
 * @type {Constructor<Long>}
 */
util.Long = /* istanbul ignore next */ util.global.dcodeIO && /* istanbul ignore next */ util.global.dcodeIO.Long
         || /* istanbul ignore next */ util.global.Long
         || util.inquire("long");

/**
 * Regular expression used to verify 2 bit (`bool`) map keys.
 * @type {RegExp}
 * @const
 */
util.key2Re = /^true|false|0|1$/;

/**
 * Regular expression used to verify 32 bit (`int32` etc.) map keys.
 * @type {RegExp}
 * @const
 */
util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;

/**
 * Regular expression used to verify 64 bit (`int64` etc.) map keys.
 * @type {RegExp}
 * @const
 */
util.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;

/**
 * Converts a number or long to an 8 characters long hash string.
 * @param {Long|number} value Value to convert
 * @returns {string} Hash
 */
util.longToHash = function longToHash(value) {
    return value
        ? util.LongBits.from(value).toHash()
        : util.LongBits.zeroHash;
};

/**
 * Converts an 8 characters long hash string to a long or number.
 * @param {string} hash Hash
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {Long|number} Original value
 */
util.longFromHash = function longFromHash(hash, unsigned) {
    var bits = util.LongBits.fromHash(hash);
    if (util.Long)
        return util.Long.fromBits(bits.lo, bits.hi, unsigned);
    return bits.toNumber(Boolean(unsigned));
};

/**
 * Merges the properties of the source object into the destination object.
 * @memberof util
 * @param {Object.<string,*>} dst Destination object
 * @param {Object.<string,*>} src Source object
 * @param {boolean} [ifNotSet=false] Merges only if the key is not already set
 * @returns {Object.<string,*>} Destination object
 */
function merge(dst, src, ifNotSet) { // used by converters
    for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
        if (dst[keys[i]] === undefined || !ifNotSet)
            dst[keys[i]] = src[keys[i]];
    return dst;
}

util.merge = merge;

/**
 * Converts the first character of a string to lower case.
 * @param {string} str String to convert
 * @returns {string} Converted string
 */
util.lcFirst = function lcFirst(str) {
    return str.charAt(0).toLowerCase() + str.substring(1);
};

/**
 * Creates a custom error constructor.
 * @memberof util
 * @param {string} name Error name
 * @returns {Constructor<Error>} Custom error constructor
 */
function newError(name) {

    function CustomError(message, properties) {

        if (!(this instanceof CustomError))
            return new CustomError(message, properties);

        // Error.call(this, message);
        // ^ just returns a new error instance because the ctor can be called as a function

        Object.defineProperty(this, "message", { get: function() { return message; } });

        /* istanbul ignore next */
        if (Error.captureStackTrace) // node
            Error.captureStackTrace(this, CustomError);
        else
            Object.defineProperty(this, "stack", { value: new Error().stack || "" });

        if (properties)
            merge(this, properties);
    }

    (CustomError.prototype = Object.create(Error.prototype)).constructor = CustomError;

    Object.defineProperty(CustomError.prototype, "name", { get: function() { return name; } });

    CustomError.prototype.toString = function toString() {
        return this.name + ": " + this.message;
    };

    return CustomError;
}

util.newError = newError;

/**
 * Constructs a new protocol error.
 * @classdesc Error subclass indicating a protocol specifc error.
 * @memberof util
 * @extends Error
 * @template T extends Message<T>
 * @constructor
 * @param {string} message Error message
 * @param {Object.<string,*>} [properties] Additional properties
 * @example
 * try {
 *     MyMessage.decode(someBuffer); // throws if required fields are missing
 * } catch (e) {
 *     if (e instanceof ProtocolError && e.instance)
 *         console.log("decoded so far: " + JSON.stringify(e.instance));
 * }
 */
util.ProtocolError = newError("ProtocolError");

/**
 * So far decoded message instance.
 * @name util.ProtocolError#instance
 * @type {Message<T>}
 */

/**
 * A OneOf getter as returned by {@link util.oneOfGetter}.
 * @typedef OneOfGetter
 * @type {function}
 * @returns {string|undefined} Set field name, if any
 */

/**
 * Builds a getter for a oneof's present field name.
 * @param {string[]} fieldNames Field names
 * @returns {OneOfGetter} Unbound getter
 */
util.oneOfGetter = function getOneOf(fieldNames) {
    var fieldMap = {};
    for (var i = 0; i < fieldNames.length; ++i)
        fieldMap[fieldNames[i]] = 1;

    /**
     * @returns {string|undefined} Set field name, if any
     * @this Object
     * @ignore
     */
    return function() { // eslint-disable-line consistent-return
        for (var keys = Object.keys(this), i = keys.length - 1; i > -1; --i)
            if (fieldMap[keys[i]] === 1 && this[keys[i]] !== undefined && this[keys[i]] !== null)
                return keys[i];
    };
};

/**
 * A OneOf setter as returned by {@link util.oneOfSetter}.
 * @typedef OneOfSetter
 * @type {function}
 * @param {string|undefined} value Field name
 * @returns {undefined}
 */

/**
 * Builds a setter for a oneof's present field name.
 * @param {string[]} fieldNames Field names
 * @returns {OneOfSetter} Unbound setter
 */
util.oneOfSetter = function setOneOf(fieldNames) {

    /**
     * @param {string} name Field name
     * @returns {undefined}
     * @this Object
     * @ignore
     */
    return function(name) {
        for (var i = 0; i < fieldNames.length; ++i)
            if (fieldNames[i] !== name)
                delete this[fieldNames[i]];
    };
};

/**
 * Default conversion options used for {@link Message#toJSON} implementations.
 *
 * These options are close to proto3's JSON mapping with the exception that internal types like Any are handled just like messages. More precisely:
 *
 * - Longs become strings
 * - Enums become string keys
 * - Bytes become base64 encoded strings
 * - (Sub-)Messages become plain objects
 * - Maps become plain objects with all string keys
 * - Repeated fields become arrays
 * - NaN and Infinity for float and double fields become strings
 *
 * @type {IConversionOptions}
 * @see https://developers.google.com/protocol-buffers/docs/proto3?hl=en#json
 */
util.toJSONOptions = {
    longs: String,
    enums: String,
    bytes: String,
    json: true
};

// Sets up buffer utility according to the environment (called in index-minimal)
util._configure = function() {
    var Buffer = util.Buffer;
    /* istanbul ignore if */
    if (!Buffer) {
        util._Buffer_from = util._Buffer_allocUnsafe = null;
        return;
    }
    // because node 4.x buffers are incompatible & immutable
    // see: https://github.com/dcodeIO/protobuf.js/pull/665
    util._Buffer_from = Buffer.from !== Uint8Array.from && Buffer.from ||
        /* istanbul ignore next */
        function Buffer_from(value, encoding) {
            return new Buffer(value, encoding);
        };
    util._Buffer_allocUnsafe = Buffer.allocUnsafe ||
        /* istanbul ignore next */
        function Buffer_allocUnsafe(size) {
            return new Buffer(size);
        };
};


/***/ }),

/***/ 4497:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = verifier;

var Enum      = __webpack_require__(7025),
    util      = __webpack_require__(9935);

function invalid(field, expected) {
    return field.name + ": " + expected + (field.repeated && expected !== "array" ? "[]" : field.map && expected !== "object" ? "{k:"+field.keyType+"}" : "") + " expected";
}

/**
 * Generates a partial value verifier.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {number} fieldIndex Field index
 * @param {string} ref Variable reference
 * @returns {Codegen} Codegen instance
 * @ignore
 */
function genVerifyValue(gen, field, fieldIndex, ref) {
    /* eslint-disable no-unexpected-multiline */
    if (field.resolvedType) {
        if (field.resolvedType instanceof Enum) { gen
            ("switch(%s){", ref)
                ("default:")
                    ("return%j", invalid(field, "enum value"));
            for (var keys = Object.keys(field.resolvedType.values), j = 0; j < keys.length; ++j) gen
                ("case %i:", field.resolvedType.values[keys[j]]);
            gen
                    ("break")
            ("}");
        } else {
            gen
            ("{")
                ("var e=types[%i].verify(%s);", fieldIndex, ref)
                ("if(e)")
                    ("return%j+e", field.name + ".")
            ("}");
        }
    } else {
        switch (field.type) {
            case "int32":
            case "uint32":
            case "sint32":
            case "fixed32":
            case "sfixed32": gen
                ("if(!util.isInteger(%s))", ref)
                    ("return%j", invalid(field, "integer"));
                break;
            case "int64":
            case "uint64":
            case "sint64":
            case "fixed64":
            case "sfixed64": gen
                ("if(!util.isInteger(%s)&&!(%s&&util.isInteger(%s.low)&&util.isInteger(%s.high)))", ref, ref, ref, ref)
                    ("return%j", invalid(field, "integer|Long"));
                break;
            case "float":
            case "double": gen
                ("if(typeof %s!==\"number\")", ref)
                    ("return%j", invalid(field, "number"));
                break;
            case "bool": gen
                ("if(typeof %s!==\"boolean\")", ref)
                    ("return%j", invalid(field, "boolean"));
                break;
            case "string": gen
                ("if(!util.isString(%s))", ref)
                    ("return%j", invalid(field, "string"));
                break;
            case "bytes": gen
                ("if(!(%s&&typeof %s.length===\"number\"||util.isString(%s)))", ref, ref, ref)
                    ("return%j", invalid(field, "buffer"));
                break;
        }
    }
    return gen;
    /* eslint-enable no-unexpected-multiline */
}

/**
 * Generates a partial key verifier.
 * @param {Codegen} gen Codegen instance
 * @param {Field} field Reflected field
 * @param {string} ref Variable reference
 * @returns {Codegen} Codegen instance
 * @ignore
 */
function genVerifyKey(gen, field, ref) {
    /* eslint-disable no-unexpected-multiline */
    switch (field.keyType) {
        case "int32":
        case "uint32":
        case "sint32":
        case "fixed32":
        case "sfixed32": gen
            ("if(!util.key32Re.test(%s))", ref)
                ("return%j", invalid(field, "integer key"));
            break;
        case "int64":
        case "uint64":
        case "sint64":
        case "fixed64":
        case "sfixed64": gen
            ("if(!util.key64Re.test(%s))", ref) // see comment above: x is ok, d is not
                ("return%j", invalid(field, "integer|Long key"));
            break;
        case "bool": gen
            ("if(!util.key2Re.test(%s))", ref)
                ("return%j", invalid(field, "boolean key"));
            break;
    }
    return gen;
    /* eslint-enable no-unexpected-multiline */
}

/**
 * Generates a verifier specific to the specified message type.
 * @param {Type} mtype Message type
 * @returns {Codegen} Codegen instance
 */
function verifier(mtype) {
    /* eslint-disable no-unexpected-multiline */

    var gen = util.codegen(["m"], mtype.name + "$verify")
    ("if(typeof m!==\"object\"||m===null)")
        ("return%j", "object expected");
    var oneofs = mtype.oneofsArray,
        seenFirstField = {};
    if (oneofs.length) gen
    ("var p={}");

    for (var i = 0; i < /* initializes */ mtype.fieldsArray.length; ++i) {
        var field = mtype._fieldsArray[i].resolve(),
            ref   = "m" + util.safeProp(field.name);

        if (field.optional) gen
        ("if(%s!=null&&m.hasOwnProperty(%j)){", ref, field.name); // !== undefined && !== null

        // map fields
        if (field.map) { gen
            ("if(!util.isObject(%s))", ref)
                ("return%j", invalid(field, "object"))
            ("var k=Object.keys(%s)", ref)
            ("for(var i=0;i<k.length;++i){");
                genVerifyKey(gen, field, "k[i]");
                genVerifyValue(gen, field, i, ref + "[k[i]]")
            ("}");

        // repeated fields
        } else if (field.repeated) { gen
            ("if(!Array.isArray(%s))", ref)
                ("return%j", invalid(field, "array"))
            ("for(var i=0;i<%s.length;++i){", ref);
                genVerifyValue(gen, field, i, ref + "[i]")
            ("}");

        // required or present fields
        } else {
            if (field.partOf) {
                var oneofProp = util.safeProp(field.partOf.name);
                if (seenFirstField[field.partOf.name] === 1) gen
            ("if(p%s===1)", oneofProp)
                ("return%j", field.partOf.name + ": multiple values");
                seenFirstField[field.partOf.name] = 1;
                gen
            ("p%s=1", oneofProp);
            }
            genVerifyValue(gen, field, i, ref);
        }
        if (field.optional) gen
        ("}");
    }
    return gen
    ("return null");
    /* eslint-enable no-unexpected-multiline */
}

/***/ }),

/***/ 1667:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


/**
 * Wrappers for common types.
 * @type {Object.<string,IWrapper>}
 * @const
 */
var wrappers = exports;

var Message = __webpack_require__(8368);

/**
 * From object converter part of an {@link IWrapper}.
 * @typedef WrapperFromObjectConverter
 * @type {function}
 * @param {Object.<string,*>} object Plain object
 * @returns {Message<{}>} Message instance
 * @this Type
 */

/**
 * To object converter part of an {@link IWrapper}.
 * @typedef WrapperToObjectConverter
 * @type {function}
 * @param {Message<{}>} message Message instance
 * @param {IConversionOptions} [options] Conversion options
 * @returns {Object.<string,*>} Plain object
 * @this Type
 */

/**
 * Common type wrapper part of {@link wrappers}.
 * @interface IWrapper
 * @property {WrapperFromObjectConverter} [fromObject] From object converter
 * @property {WrapperToObjectConverter} [toObject] To object converter
 */

// Custom wrapper for Any
wrappers[".google.protobuf.Any"] = {

    fromObject: function(object) {

        // unwrap value type if mapped
        if (object && object["@type"]) {
             // Only use fully qualified type name after the last '/'
            var name = object["@type"].substring(object["@type"].lastIndexOf("/") + 1);
            var type = this.lookup(name);
            /* istanbul ignore else */
            if (type) {
                // type_url does not accept leading "."
                var type_url = object["@type"].charAt(0) === "." ?
                    object["@type"].substr(1) : object["@type"];
                // type_url prefix is optional, but path seperator is required
                if (type_url.indexOf("/") === -1) {
                    type_url = "/" + type_url;
                }
                return this.create({
                    type_url: type_url,
                    value: type.encode(type.fromObject(object)).finish()
                });
            }
        }

        return this.fromObject(object);
    },

    toObject: function(message, options) {

        // Default prefix
        var googleApi = "type.googleapis.com/";
        var prefix = "";
        var name = "";

        // decode value if requested and unmapped
        if (options && options.json && message.type_url && message.value) {
            // Only use fully qualified type name after the last '/'
            name = message.type_url.substring(message.type_url.lastIndexOf("/") + 1);
            // Separate the prefix used
            prefix = message.type_url.substring(0, message.type_url.lastIndexOf("/") + 1);
            var type = this.lookup(name);
            /* istanbul ignore else */
            if (type)
                message = type.decode(message.value);
        }

        // wrap value if unmapped
        if (!(message instanceof this.ctor) && message instanceof Message) {
            var object = message.$type.toObject(message, options);
            var messageName = message.$type.fullName[0] === "." ?
                message.$type.fullName.substr(1) : message.$type.fullName;
            // Default to type.googleapis.com prefix if no prefix is used
            if (prefix === "") {
                prefix = googleApi;
            }
            name = prefix + messageName;
            object["@type"] = name;
            return object;
        }

        return this.toObject(message, options);
    }
};


/***/ }),

/***/ 1173:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = Writer;

var util      = __webpack_require__(9693);

var BufferWriter; // cyclic

var LongBits  = util.LongBits,
    base64    = util.base64,
    utf8      = util.utf8;

/**
 * Constructs a new writer operation instance.
 * @classdesc Scheduled writer operation.
 * @constructor
 * @param {function(*, Uint8Array, number)} fn Function to call
 * @param {number} len Value byte length
 * @param {*} val Value to write
 * @ignore
 */
function Op(fn, len, val) {

    /**
     * Function to call.
     * @type {function(Uint8Array, number, *)}
     */
    this.fn = fn;

    /**
     * Value byte length.
     * @type {number}
     */
    this.len = len;

    /**
     * Next operation.
     * @type {Writer.Op|undefined}
     */
    this.next = undefined;

    /**
     * Value to write.
     * @type {*}
     */
    this.val = val; // type varies
}

/* istanbul ignore next */
function noop() {} // eslint-disable-line no-empty-function

/**
 * Constructs a new writer state instance.
 * @classdesc Copied writer state.
 * @memberof Writer
 * @constructor
 * @param {Writer} writer Writer to copy state from
 * @ignore
 */
function State(writer) {

    /**
     * Current head.
     * @type {Writer.Op}
     */
    this.head = writer.head;

    /**
     * Current tail.
     * @type {Writer.Op}
     */
    this.tail = writer.tail;

    /**
     * Current buffer length.
     * @type {number}
     */
    this.len = writer.len;

    /**
     * Next state.
     * @type {State|null}
     */
    this.next = writer.states;
}

/**
 * Constructs a new writer instance.
 * @classdesc Wire format writer using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 */
function Writer() {

    /**
     * Current length.
     * @type {number}
     */
    this.len = 0;

    /**
     * Operations head.
     * @type {Object}
     */
    this.head = new Op(noop, 0, 0);

    /**
     * Operations tail
     * @type {Object}
     */
    this.tail = this.head;

    /**
     * Linked forked states.
     * @type {Object|null}
     */
    this.states = null;

    // When a value is written, the writer calculates its byte length and puts it into a linked
    // list of operations to perform when finish() is called. This both allows us to allocate
    // buffers of the exact required size and reduces the amount of work we have to do compared
    // to first calculating over objects and then encoding over objects. In our case, the encoding
    // part is just a linked list walk calling operations with already prepared values.
}

var create = function create() {
    return util.Buffer
        ? function create_buffer_setup() {
            return (Writer.create = function create_buffer() {
                return new BufferWriter();
            })();
        }
        /* istanbul ignore next */
        : function create_array() {
            return new Writer();
        };
};

/**
 * Creates a new writer.
 * @function
 * @returns {BufferWriter|Writer} A {@link BufferWriter} when Buffers are supported, otherwise a {@link Writer}
 */
Writer.create = create();

/**
 * Allocates a buffer of the specified size.
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */
Writer.alloc = function alloc(size) {
    return new util.Array(size);
};

// Use Uint8Array buffer pool in the browser, just like node does with buffers
/* istanbul ignore else */
if (util.Array !== Array)
    Writer.alloc = util.pool(Writer.alloc, util.Array.prototype.subarray);

/**
 * Pushes a new operation to the queue.
 * @param {function(Uint8Array, number, *)} fn Function to call
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @returns {Writer} `this`
 * @private
 */
Writer.prototype._push = function push(fn, len, val) {
    this.tail = this.tail.next = new Op(fn, len, val);
    this.len += len;
    return this;
};

function writeByte(val, buf, pos) {
    buf[pos] = val & 255;
}

function writeVarint32(val, buf, pos) {
    while (val > 127) {
        buf[pos++] = val & 127 | 128;
        val >>>= 7;
    }
    buf[pos] = val;
}

/**
 * Constructs a new varint writer operation instance.
 * @classdesc Scheduled varint writer operation.
 * @extends Op
 * @constructor
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @ignore
 */
function VarintOp(len, val) {
    this.len = len;
    this.next = undefined;
    this.val = val;
}

VarintOp.prototype = Object.create(Op.prototype);
VarintOp.prototype.fn = writeVarint32;

/**
 * Writes an unsigned 32 bit value as a varint.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.uint32 = function write_uint32(value) {
    // here, the call to this.push has been inlined and a varint specific Op subclass is used.
    // uint32 is by far the most frequently used operation and benefits significantly from this.
    this.len += (this.tail = this.tail.next = new VarintOp(
        (value = value >>> 0)
                < 128       ? 1
        : value < 16384     ? 2
        : value < 2097152   ? 3
        : value < 268435456 ? 4
        :                     5,
    value)).len;
    return this;
};

/**
 * Writes a signed 32 bit value as a varint.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.int32 = function write_int32(value) {
    return value < 0
        ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) // 10 bytes per spec
        : this.uint32(value);
};

/**
 * Writes a 32 bit value as a varint, zig-zag encoded.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.sint32 = function write_sint32(value) {
    return this.uint32((value << 1 ^ value >> 31) >>> 0);
};

function writeVarint64(val, buf, pos) {
    while (val.hi) {
        buf[pos++] = val.lo & 127 | 128;
        val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0;
        val.hi >>>= 7;
    }
    while (val.lo > 127) {
        buf[pos++] = val.lo & 127 | 128;
        val.lo = val.lo >>> 7;
    }
    buf[pos++] = val.lo;
}

/**
 * Writes an unsigned 64 bit value as a varint.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.uint64 = function write_uint64(value) {
    var bits = LongBits.from(value);
    return this._push(writeVarint64, bits.length(), bits);
};

/**
 * Writes a signed 64 bit value as a varint.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.int64 = Writer.prototype.uint64;

/**
 * Writes a signed 64 bit value as a varint, zig-zag encoded.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.sint64 = function write_sint64(value) {
    var bits = LongBits.from(value).zzEncode();
    return this._push(writeVarint64, bits.length(), bits);
};

/**
 * Writes a boolish value as a varint.
 * @param {boolean} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.bool = function write_bool(value) {
    return this._push(writeByte, 1, value ? 1 : 0);
};

function writeFixed32(val, buf, pos) {
    buf[pos    ] =  val         & 255;
    buf[pos + 1] =  val >>> 8   & 255;
    buf[pos + 2] =  val >>> 16  & 255;
    buf[pos + 3] =  val >>> 24;
}

/**
 * Writes an unsigned 32 bit value as fixed 32 bits.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.fixed32 = function write_fixed32(value) {
    return this._push(writeFixed32, 4, value >>> 0);
};

/**
 * Writes a signed 32 bit value as fixed 32 bits.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.sfixed32 = Writer.prototype.fixed32;

/**
 * Writes an unsigned 64 bit value as fixed 64 bits.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.fixed64 = function write_fixed64(value) {
    var bits = LongBits.from(value);
    return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
};

/**
 * Writes a signed 64 bit value as fixed 64 bits.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.sfixed64 = Writer.prototype.fixed64;

/**
 * Writes a float (32 bit).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.float = function write_float(value) {
    return this._push(util.float.writeFloatLE, 4, value);
};

/**
 * Writes a double (64 bit float).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.double = function write_double(value) {
    return this._push(util.float.writeDoubleLE, 8, value);
};

var writeBytes = util.Array.prototype.set
    ? function writeBytes_set(val, buf, pos) {
        buf.set(val, pos); // also works for plain array values
    }
    /* istanbul ignore next */
    : function writeBytes_for(val, buf, pos) {
        for (var i = 0; i < val.length; ++i)
            buf[pos + i] = val[i];
    };

/**
 * Writes a sequence of bytes.
 * @param {Uint8Array|string} value Buffer or base64 encoded string to write
 * @returns {Writer} `this`
 */
Writer.prototype.bytes = function write_bytes(value) {
    var len = value.length >>> 0;
    if (!len)
        return this._push(writeByte, 1, 0);
    if (util.isString(value)) {
        var buf = Writer.alloc(len = base64.length(value));
        base64.decode(value, buf, 0);
        value = buf;
    }
    return this.uint32(len)._push(writeBytes, len, value);
};

/**
 * Writes a string.
 * @param {string} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.string = function write_string(value) {
    var len = utf8.length(value);
    return len
        ? this.uint32(len)._push(utf8.write, len, value)
        : this._push(writeByte, 1, 0);
};

/**
 * Forks this writer's state by pushing it to a stack.
 * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
 * @returns {Writer} `this`
 */
Writer.prototype.fork = function fork() {
    this.states = new State(this);
    this.head = this.tail = new Op(noop, 0, 0);
    this.len = 0;
    return this;
};

/**
 * Resets this instance to the last state.
 * @returns {Writer} `this`
 */
Writer.prototype.reset = function reset() {
    if (this.states) {
        this.head   = this.states.head;
        this.tail   = this.states.tail;
        this.len    = this.states.len;
        this.states = this.states.next;
    } else {
        this.head = this.tail = new Op(noop, 0, 0);
        this.len  = 0;
    }
    return this;
};

/**
 * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
 * @returns {Writer} `this`
 */
Writer.prototype.ldelim = function ldelim() {
    var head = this.head,
        tail = this.tail,
        len  = this.len;
    this.reset().uint32(len);
    if (len) {
        this.tail.next = head.next; // skip noop
        this.tail = tail;
        this.len += len;
    }
    return this;
};

/**
 * Finishes the write operation.
 * @returns {Uint8Array} Finished buffer
 */
Writer.prototype.finish = function finish() {
    var head = this.head.next, // skip noop
        buf  = this.constructor.alloc(this.len),
        pos  = 0;
    while (head) {
        head.fn(head.val, buf, pos);
        pos += head.len;
        head = head.next;
    }
    // this.head = this.tail = null;
    return buf;
};

Writer._configure = function(BufferWriter_) {
    BufferWriter = BufferWriter_;
    Writer.create = create();
    BufferWriter._configure();
};


/***/ }),

/***/ 3155:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

module.exports = BufferWriter;

// extends Writer
var Writer = __webpack_require__(1173);
(BufferWriter.prototype = Object.create(Writer.prototype)).constructor = BufferWriter;

var util = __webpack_require__(9693);

/**
 * Constructs a new buffer writer instance.
 * @classdesc Wire format writer using node buffers.
 * @extends Writer
 * @constructor
 */
function BufferWriter() {
    Writer.call(this);
}

BufferWriter._configure = function () {
    /**
     * Allocates a buffer of the specified size.
     * @function
     * @param {number} size Buffer size
     * @returns {Buffer} Buffer
     */
    BufferWriter.alloc = util._Buffer_allocUnsafe;

    BufferWriter.writeBytesBuffer = util.Buffer && util.Buffer.prototype instanceof Uint8Array && util.Buffer.prototype.set.name === "set"
        ? function writeBytesBuffer_set(val, buf, pos) {
          buf.set(val, pos); // faster than copy (requires node >= 4 where Buffers extend Uint8Array and set is properly inherited)
          // also works for plain array values
        }
        /* istanbul ignore next */
        : function writeBytesBuffer_copy(val, buf, pos) {
          if (val.copy) // Buffer values
            val.copy(buf, pos, 0, val.length);
          else for (var i = 0; i < val.length;) // plain array values
            buf[pos++] = val[i++];
        };
};


/**
 * @override
 */
BufferWriter.prototype.bytes = function write_bytes_buffer(value) {
    if (util.isString(value))
        value = util._Buffer_from(value, "base64");
    var len = value.length >>> 0;
    this.uint32(len);
    if (len)
        this._push(BufferWriter.writeBytesBuffer, len, value);
    return this;
};

function writeStringBuffer(val, buf, pos) {
    if (val.length < 40) // plain js is faster for short strings (probably due to redundant assertions)
        util.utf8.write(val, buf, pos);
    else if (buf.utf8Write)
        buf.utf8Write(val, pos);
    else
        buf.write(val, pos);
}

/**
 * @override
 */
BufferWriter.prototype.string = function write_string_buffer(value) {
    var len = util.Buffer.byteLength(value);
    this.uint32(len);
    if (len)
        this._push(writeStringBuffer, len, value);
    return this;
};


/**
 * Finishes the write operation.
 * @name BufferWriter#finish
 * @function
 * @returns {Buffer} Finished buffer
 */

BufferWriter._configure();


/***/ }),

/***/ 9822:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Contract = void 0;
const Serializer_1 = __webpack_require__(7187);
const utils_1 = __webpack_require__(8593);
/**
 * The contract class contains the contract ID and contract entries
 * definition needed to encode/decode operations during the
 * interaction with the user and the communication with the RPC node.
 *
 * @example
 *
 * ```ts
 * const { Contract, Provider, Signer, utils } = require("koilib");
 * const rpcNodes = ["http://api.koinos.io:8080"];
 * const privateKey = "f186a5de49797bfd52dc42505c33d75a46822ed5b60046e09d7c336242e20200";
 * const provider = new Provider(rpcNodes);
 * const signer = new Signer({ privateKey, provider });
 * const koinContract = new Contract({
 *   id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
 *   abi: utils.tokenAbi,
 *   provider,
 *   signer,
 * });
 * const koin = koinContract.functions;
 *
 * // optional: preformat input/output
 * koinContract.abi.methods.balanceOf.preformatInput = (owner) =>
 *   ({ owner });
 * koinContract.abi.methods.balanceOf.preformatOutput = (res) =>
 *   utils.formatUnits(res.value, 8);
 * koinContract.abi.methods.transfer.preformatInput = (input) => ({
 *   from: signer.getAddress(),
 *   to: input.to,
 *   value: utils.parseUnits(input.value, 8),
 * });
 *
 * async funtion main() {
 *   // Get balance
 *   const { result } = await koin.balanceOf("12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD");
 *   console.log(result)
 *
 *   // Transfer
 *   const { transaction, receipt } = await koin.transfer({
 *     to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
 *     value: "10.0001",
 *   });
 *   console.log(`Transaction id ${transaction.id} submitted. Receipt:`);
 *   console.log(receipt);
 *
 *   if (receipt.logs) {
 *     console.log(`Transfer failed. Logs: ${receipt.logs.join(",")}`);
 *   }
 *
 *   // wait to be mined
 *   const blockNumber = await transaction.wait();
 *   console.log(`Transaction mined. Block number: ${blockNumber}`);
 * }
 *
 * main();
 * ```
 */
class Contract {
    constructor(c) {
        var _a;
        if (c.id)
            this.id = (0, utils_1.decodeBase58)(c.id);
        this.signer = c.signer;
        this.provider = c.provider || ((_a = c.signer) === null || _a === void 0 ? void 0 : _a.provider);
        this.abi = c.abi;
        this.bytecode = c.bytecode;
        if (c.serializer) {
            this.serializer = c.serializer;
        }
        else if (c.abi && c.abi.types) {
            this.serializer = new Serializer_1.Serializer(c.abi.types);
        }
        this.options = {
            signTransaction: true,
            sendTransaction: true,
            sendAbis: true,
            ...c.options,
        };
        this.functions = {};
        if (this.signer &&
            this.provider &&
            this.abi &&
            this.abi.methods &&
            this.serializer) {
            Object.keys(this.abi.methods).forEach((name) => {
                this.functions[name] = async (argu = {}, options) => {
                    if (!this.provider)
                        throw new Error("provider not found");
                    if (!this.abi || !this.abi.methods)
                        throw new Error("Methods are not defined");
                    if (!this.abi.methods[name])
                        throw new Error(`Method ${name} not defined in the ABI`);
                    const opts = {
                        ...this.options,
                        ...options,
                    };
                    const { readOnly, output, defaultOutput, preformatInput, preformatOutput, } = this.abi.methods[name];
                    let args;
                    if (typeof preformatInput === "function") {
                        args = preformatInput(argu);
                    }
                    else {
                        args = argu;
                    }
                    const operation = await this.encodeOperation({ name, args });
                    if (readOnly) {
                        if (!output)
                            throw new Error(`No output defined for ${name}`);
                        // read contract
                        const { result: resultEncoded } = await this.provider.readContract(operation.call_contract);
                        let result = defaultOutput;
                        if (resultEncoded) {
                            result = await this.serializer.deserialize(resultEncoded, output);
                        }
                        if (typeof preformatOutput === "function") {
                            result = preformatOutput(result);
                        }
                        return { operation, result };
                    }
                    // write contract (sign and send)
                    if (!this.signer)
                        throw new Error("signer not found");
                    const tx = await this.signer.prepareTransaction({
                        header: {
                            ...((opts === null || opts === void 0 ? void 0 : opts.chainId) && { chain_id: opts === null || opts === void 0 ? void 0 : opts.chainId }),
                            ...((opts === null || opts === void 0 ? void 0 : opts.rcLimit) && { rc_limit: opts === null || opts === void 0 ? void 0 : opts.rcLimit }),
                            ...((opts === null || opts === void 0 ? void 0 : opts.nonce) && { nonce: opts === null || opts === void 0 ? void 0 : opts.nonce }),
                            ...((opts === null || opts === void 0 ? void 0 : opts.payer) && { payer: opts === null || opts === void 0 ? void 0 : opts.payer }),
                            ...((opts === null || opts === void 0 ? void 0 : opts.payee) && { payee: opts === null || opts === void 0 ? void 0 : opts.payee }),
                        },
                        operations: [operation],
                    });
                    const abis = {};
                    if (opts === null || opts === void 0 ? void 0 : opts.sendAbis) {
                        const contractId = (0, utils_1.encodeBase58)(this.id);
                        abis[contractId] = this.abi;
                    }
                    // return result if the transaction will not be broadcasted
                    if (!(opts === null || opts === void 0 ? void 0 : opts.sendTransaction)) {
                        const noWait = () => {
                            throw new Error("This transaction was not broadcasted");
                        };
                        if (opts.signTransaction)
                            await this.signer.signTransaction(tx, abis);
                        return { operation, transaction: { ...tx, wait: noWait } };
                    }
                    const { transaction, receipt } = await this.signer.sendTransaction(tx, abis);
                    return { operation, transaction, receipt };
                };
            });
        }
    }
    /**
     * Get contract Id
     */
    getId() {
        if (!this.id)
            throw new Error("id is not defined");
        return (0, utils_1.encodeBase58)(this.id);
    }
    /**
     * Function to deploy a new smart contract.
     * The Bytecode must be defined in the constructor of the class
     * @example
     * ```ts
     * const privateKey = "f186a5de49797bfd52dc42505c33d75a46822ed5b60046e09d7c336242e20200";
     * const provider = new Provider(["http://api.koinos.io:8080"]);
     * const signer = new Signer({ privateKey, provider });
     * const bytecode = new Uint8Array([1, 2, 3, 4]);
     * const contract = new Contract({ signer, provider, bytecode });
     * const { transaction, receipt } = await contract.deploy();
     * console.log(receipt);
     * // wait to be mined
     * const blockNumber = await transaction.wait();
     * console.log(`Contract uploaded in block number ${blockNumber}`);
     * ```
     *
     * @example using options
     * ```ts
     * const { transaction, receipt } = await contract.deploy({
     *   // contract options
     *   abi: "CssCChRrb2lub3Mvb3B0aW9ucy5wc...",
     *   authorizesCallContract: true,
     *   authorizesTransactionApplication: true,
     *   authorizesUploadContract: true,
     *
     *   // transaction options
     *   chainId: "EiB-hw5ABo-EXy6fGDd1Iq3gbAenxQ4Qe60pRbEVMVrR9A==",
     *   rcLimit: "100000000",
     *   nonce: "OAI=",
     *   payer: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
     *   payee: "1Gvqdo9if6v6tFomEuTuMWP1D7H7U9yksb",
     *
     *   // sign and broadcast
     *   signTransaction: true,
     *   sendTransaction: true,
     * });
     * console.log(receipt);
     * // wait to be mined
     * const blockNumber = await transaction.wait();
     * console.log(`Contract uploaded in block number ${blockNumber}`);
     * ```
     */
    async deploy(options) {
        if (!this.signer)
            throw new Error("signer not found");
        if (!this.bytecode)
            throw new Error("bytecode not found");
        const opts = {
            ...this.options,
            ...options,
        };
        const operation = {
            upload_contract: {
                contract_id: (0, utils_1.decodeBase58)(this.signer.getAddress()),
                bytecode: this.bytecode,
            },
        };
        const tx = await this.signer.prepareTransaction({
            header: {
                ...((opts === null || opts === void 0 ? void 0 : opts.chainId) && { chain_id: opts === null || opts === void 0 ? void 0 : opts.chainId }),
                ...((opts === null || opts === void 0 ? void 0 : opts.rcLimit) && { rc_limit: opts === null || opts === void 0 ? void 0 : opts.rcLimit }),
                ...((opts === null || opts === void 0 ? void 0 : opts.nonce) && { nonce: opts === null || opts === void 0 ? void 0 : opts.nonce }),
                ...((opts === null || opts === void 0 ? void 0 : opts.payer) && { payer: opts === null || opts === void 0 ? void 0 : opts.payer }),
                ...((opts === null || opts === void 0 ? void 0 : opts.payee) && { payee: opts === null || opts === void 0 ? void 0 : opts.payee }),
            },
            operations: [
                {
                    upload_contract: {
                        contract_id: (0, utils_1.encodeBase58)(operation.upload_contract.contract_id),
                        bytecode: (0, utils_1.encodeBase64url)(this.bytecode),
                        ...((opts === null || opts === void 0 ? void 0 : opts.abi) && { abi: opts === null || opts === void 0 ? void 0 : opts.abi }),
                        ...((opts === null || opts === void 0 ? void 0 : opts.authorizesCallContract) && {
                            authorizes_call_contract: opts === null || opts === void 0 ? void 0 : opts.authorizesCallContract,
                        }),
                        ...((opts === null || opts === void 0 ? void 0 : opts.authorizesTransactionApplication) && {
                            authorizes_transaction_application: opts === null || opts === void 0 ? void 0 : opts.authorizesTransactionApplication,
                        }),
                        ...((opts === null || opts === void 0 ? void 0 : opts.authorizesUploadContract) && {
                            authorizes_upload_contract: opts === null || opts === void 0 ? void 0 : opts.authorizesUploadContract,
                        }),
                    },
                },
            ],
        });
        // return result if the transaction will not be broadcasted
        if (!(opts === null || opts === void 0 ? void 0 : opts.sendTransaction)) {
            const noWait = () => {
                throw new Error("This transaction was not broadcasted");
            };
            if (opts.signTransaction)
                await this.signer.signTransaction(tx);
            return { operation, transaction: { ...tx, wait: noWait } };
        }
        const { transaction, receipt } = await this.signer.sendTransaction(tx);
        return { operation, transaction, receipt };
    }
    /**
     * Encondes a contract operation using Koinos serialization
     * and taking the contract entries as reference to build it
     * @param op - Operation to encode
     * @returns Operation encoded
     * @example
     * ```ts
     * const opEncoded = contract.encodeOperation({
     *   name: "transfer",
     *   args: {
     *     from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
     *     to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
     *     value: "1000",
     *   }
     * });
     *
     * console.log(opEncoded);
     * // {
     * //   call_contract: {
     * //     contract_id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
     * //     entry_point: 670398154,
     * //     args: "ChkAEjl6vrl55V2Oym_rzsnMxIqBoie9PHmMEhkAQgjT1UACatdFY3e5QRkyG7OAzwcCCIylGOgH",
     * //   }
     * // }
     * ```
     */
    async encodeOperation(op) {
        if (!this.abi || !this.abi.methods || !this.abi.methods[op.name])
            throw new Error(`Operation ${op.name} unknown`);
        if (!this.serializer)
            throw new Error("Serializer is not defined");
        if (!this.id)
            throw new Error("Contract id is not defined");
        const method = this.abi.methods[op.name];
        let bufferInputs = new Uint8Array(0);
        if (method.input) {
            if (!op.args)
                throw new Error(`No arguments defined for type '${method.input}'`);
            bufferInputs = await this.serializer.serialize(op.args, method.input);
        }
        return {
            call_contract: {
                contract_id: (0, utils_1.encodeBase58)(this.id),
                entry_point: method.entryPoint,
                args: (0, utils_1.encodeBase64url)(bufferInputs),
            },
        };
    }
    /**
     * Decodes a contract operation to be human readable
     * @example
     * ```ts
     * const opDecoded = contract.decodeOperation({
     *   call_contract: {
     *     contract_id: "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
     *     entry_point: 0x27f576ca,
     *     args: "ChkAEjl6vrl55V2Oym_rzsnMxIqBoie9PHmMEhkAQgjT1UACatdFY3e5QRkyG7OAzwcCCIylGOgH",
     *   }
     * });
     * console.log(opDecoded);
     * // {
     * //   name: "transfer",
     * //   args: {
     * //     from: "12fN2CQnuJM8cMnWZ1hPtM4knjLME8E4PD",
     * //     to: "172AB1FgCsYrRAW5cwQ8KjadgxofvgPFd6",
     * //     value: "1000",
     * //   },
     * // }
     * ```
     */
    async decodeOperation(op) {
        if (!this.id)
            throw new Error("Contract id is not defined");
        if (!this.abi || !this.abi.methods)
            throw new Error("Methods are not defined");
        if (!this.serializer)
            throw new Error("Serializer is not defined");
        if (!op.call_contract)
            throw new Error("Operation is not CallContractOperation");
        if (op.call_contract.contract_id !== (0, utils_1.encodeBase58)(this.id))
            throw new Error(`Invalid contract id. Expected: ${(0, utils_1.encodeBase58)(this.id)}. Received: ${op.call_contract.contract_id}`);
        for (let i = 0; i < Object.keys(this.abi.methods).length; i += 1) {
            const opName = Object.keys(this.abi.methods)[i];
            const method = this.abi.methods[opName];
            if (op.call_contract.entry_point === method.entryPoint) {
                if (!method.input)
                    return { name: opName };
                return {
                    name: opName,
                    args: await this.serializer.deserialize(op.call_contract.args, method.input),
                };
            }
        }
        throw new Error(`Unknown method id ${op.call_contract.entry_point}`);
    }
}
exports.Contract = Contract;
exports["default"] = Contract;


/***/ }),

/***/ 5635:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Provider = void 0;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const protocol_proto_js_1 = __webpack_require__(9104);
const utils_1 = __webpack_require__(8593);
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
/**
 * Class to connect with the RPC node
 */
class Provider {
    /**
     *
     * @param rpcNodes - URL of the rpc node, or array of urls
     * to switch between them when someone is down
     * @example
     * ```ts
     * const provider = new Provider([
     *   "http://45.56.104.152:8080",
     *   "http://159.203.119.0:8080"
     * ]);
     * ```
     */
    constructor(rpcNodes) {
        if (Array.isArray(rpcNodes))
            this.rpcNodes = rpcNodes;
        else
            this.rpcNodes = [rpcNodes];
        this.currentNodeId = 0;
        this.onError = () => true;
    }
    /**
     * Function to make jsonrpc requests to the RPC node
     * @param method - jsonrpc method
     * @param params - jsonrpc params
     * @returns Result of jsonrpc response
     */
    async call(method, params) {
        /* eslint-disable no-await-in-loop */
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                const body = {
                    id: Math.round(Math.random() * 1000),
                    jsonrpc: "2.0",
                    method,
                    params,
                };
                const url = this.rpcNodes[this.currentNodeId];
                const response = await fetch(url, {
                    method: "POST",
                    body: JSON.stringify(body),
                });
                const json = (await response.json());
                if (json.result !== undefined)
                    return json.result;
                if (!json.error)
                    throw new Error("undefined error");
                const { message, data } = json.error;
                if (!data)
                    throw new Error(message);
                let dataJson;
                try {
                    dataJson = JSON.parse(data);
                }
                catch (e) {
                    dataJson = { data };
                }
                throw new Error(JSON.stringify({
                    ...(message && { error: message }),
                    ...dataJson,
                }));
            }
            catch (e) {
                const currentNode = this.rpcNodes[this.currentNodeId];
                this.currentNodeId = (this.currentNodeId + 1) % this.rpcNodes.length;
                const newNode = this.rpcNodes[this.currentNodeId];
                const abort = this.onError(e, currentNode, newNode);
                if (abort)
                    throw e;
            }
        }
    }
    /**
     * Function to call "chain.get_account_nonce" to return the number of
     * transactions for a particular account. This call is used
     * when creating new transactions.
     * @param account - account address
     * @param deserialize - If set true it will deserialize the nonce
     * and return it as number (default). If set false it will return
     * the nonce encoded as received from the RPC.
     * @returns Nonce
     */
    async getNonce(account, deserialize = true) {
        const { nonce: nonceBase64url } = await this.call("chain.get_account_nonce", { account });
        if (!deserialize) {
            return nonceBase64url;
        }
        const valueBuffer = (0, utils_1.decodeBase64url)(nonceBase64url);
        const message = protocol_proto_js_1.koinos.chain.value_type.decode(valueBuffer);
        const object = protocol_proto_js_1.koinos.chain.value_type.toObject(message, {
            longs: String,
            defaults: true,
        });
        // todo: consider the case where nonce is greater than max safe integer
        return Number(object.uint64_value);
    }
    async getAccountRc(account) {
        const { rc } = await this.call("chain.get_account_rc", {
            account,
        });
        if (!rc)
            return "0";
        return rc;
    }
    /**
     * Get transactions by id and their corresponding block ids
     */
    async getTransactionsById(transactionIds) {
        return this.call("transaction_store.get_transactions_by_id", {
            transaction_ids: transactionIds,
        });
    }
    async getBlocksById(blockIds) {
        return this.call("block_store.get_blocks_by_id", {
            block_ids: blockIds,
            return_block: true,
            return_receipt: false,
        });
    }
    /**
     * Function to get info from the head block in the blockchain
     */
    async getHeadInfo() {
        return this.call("chain.get_head_info", {});
    }
    /**
     * Function to get the chain
     */
    async getChainId() {
        const { chain_id: chainId } = await this.call("chain.get_chain_id", {});
        return chainId;
    }
    /**
     * Function to get consecutive blocks in descending order
     * @param height - Starting block height
     * @param numBlocks - Number of blocks to fetch
     * @param idRef - Block ID reference to speed up searching blocks.
     * This ID must be from a greater block height. By default it
     * gets the ID from the block head.
     */
    async getBlocks(height, numBlocks = 1, idRef) {
        let blockIdRef = idRef;
        if (!blockIdRef) {
            const head = await this.getHeadInfo();
            blockIdRef = head.head_topology.id;
        }
        return (await this.call("block_store.get_blocks_by_height", {
            head_block_id: blockIdRef,
            ancestor_start_height: height,
            num_blocks: numBlocks,
            return_block: true,
            return_receipt: false,
        })).block_items;
    }
    /**
     * Function to get a block by its height
     */
    async getBlock(height) {
        return (await this.getBlocks(height, 1))[0];
    }
    /**
     * Function to wait for a transaction to be mined.
     * @param txId - transaction id
     * @param type - Type must be "byBlock" (default) or "byTransactionId".
     * _byBlock_ will query the blockchain to get blocks and search for the
     * transaction there. _byTransactionId_ will query the "transaction store"
     * microservice to search the transaction by its id. If non of them is
     * specified the function will use "byBlock" (as "byTransactionId"
     * requires the transaction store, which is an optional microservice).
     *
     * When _byBlock_ is used it returns the block number.
     *
     * When _byTransactionId_ is used it returns the block id.
     *
     * @param timeout - Timeout in milliseconds. By default it is 60000
     * @example
     * ```ts
     * const blockNumber = await provider.wait(txId);
     * // const blockNumber = await provider.wait(txId, "byBlock", 60000);
     * // const blockId = await provider.wait(txId, "byTransactionId", 60000);
     * console.log("Transaction mined")
     * ```
     */
    async wait(txId, type = "byBlock", timeout = 60000) {
        const iniTime = Date.now();
        if (type === "byTransactionId") {
            while (Date.now() < iniTime + timeout) {
                await sleep(1000);
                const { transactions } = await this.getTransactionsById([txId]);
                if (transactions &&
                    transactions[0] &&
                    transactions[0].containing_blocks)
                    return transactions[0].containing_blocks[0];
            }
            throw new Error(`Transaction not mined after ${timeout} ms`);
        }
        // byBlock
        const findTxInBlocks = async (ini, numBlocks, idRef) => {
            const blocks = await this.getBlocks(ini, numBlocks, idRef);
            let bNum = 0;
            blocks.forEach((block) => {
                if (!block ||
                    !block.block ||
                    !block.block_id ||
                    !block.block.transactions)
                    return;
                const tx = block.block.transactions.find((t) => t.id === txId);
                if (tx)
                    bNum = Number(block.block_height);
            });
            const lastId = blocks[blocks.length - 1].block_id;
            return [bNum, lastId];
        };
        let blockNumber = 0;
        let iniBlock = 0;
        let previousId = "";
        while (Date.now() < iniTime + timeout) {
            await sleep(1000);
            const { head_topology: headTopology } = await this.getHeadInfo();
            if (blockNumber === 0) {
                blockNumber = Number(headTopology.height);
                iniBlock = blockNumber;
            }
            if (Number(headTopology.height) === blockNumber - 1 &&
                previousId &&
                previousId !== headTopology.id) {
                const [bNum, lastId] = await findTxInBlocks(iniBlock, Number(headTopology.height) - iniBlock + 1, headTopology.id);
                if (bNum)
                    return bNum;
                previousId = lastId;
                blockNumber = Number(headTopology.height) + 1;
            }
            // eslint-disable-next-line no-continue
            if (blockNumber > Number(headTopology.height))
                continue;
            const [bNum, lastId] = await findTxInBlocks(blockNumber, 1, headTopology.id);
            if (bNum)
                return bNum;
            if (!previousId)
                previousId = lastId;
            blockNumber += 1;
        }
        throw new Error(`Transaction not mined after ${timeout} ms. Blocks checked from ${iniBlock} to ${blockNumber}`);
    }
    /**
     * Function to call "chain.submit_transaction" to send a signed
     * transaction to the blockchain.
     */
    async sendTransaction(transaction) {
        return this.call("chain.submit_transaction", { transaction });
    }
    /**
     * Function to call "chain.submit_block" to send a signed
     * block to the blockchain.
     */
    async submitBlock(block) {
        return this.call("chain.submit_block", { block });
    }
    /**
     * Function to call "chain.read_contract" to read a contract.
     * This function is used by [[Contract]] class when read methods
     * are invoked.
     */
    async readContract(operation) {
        return this.call("chain.read_contract", operation);
    }
}
exports.Provider = Provider;
exports["default"] = Provider;


/***/ }),

/***/ 7187:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Serializer = void 0;
/* eslint-disable @typescript-eslint/require-await */
const light_1 = __webpack_require__(4492);
const utils_1 = __webpack_require__(8593);
const OP_BYTES_1 = "(btype)";
const OP_BYTES_2 = "(koinos.btype)";
const nativeTypes = [
    "double",
    "float",
    "int32",
    "int64",
    "uint32",
    "uint64",
    "sint32",
    "sint64",
    "fixed32",
    "fixed64",
    "sfixed32",
    "sfixed64",
    "bool",
    "string",
    "bytes",
];
/**
 * The serializer class serialize and deserialize data using
 * protocol buffers.
 *
 * NOTE: This class uses the [protobufjs/light](https://www.npmjs.com/package/protobufjs)
 * library internally, which uses reflection (use of _eval_
 * and _new Function_) for the construction of the types.
 * This could cause issues in environments where _eval_ is not
 * allowed, like in browser extensions. In such cases, this class
 * must be confined in a [sandbox environment](https://developer.chrome.com/docs/apps/app_external/#sandboxing)
 * where _eval_ is allowed. This is the principal reason of
 * having the serializer in a separate class.
 *
 * @example
 *
 * ```ts
 * const descriptorJson = {
 *   nested: {
 *     awesomepackage: {
 *       nested: {
 *         AwesomeMessage: {
 *           fields: {
 *             awesomeField: {
 *               type: "string",
 *               id: 1
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 * const serializer = new Serializer(descriptorJson)
 * ```
 */
class Serializer {
    constructor(types, opts) {
        /**
         * Preformat bytes for base64url, base58 or hex string
         */
        this.bytesConversion = true;
        this.types = types;
        this.root = light_1.Root.fromJSON(this.types);
        if (opts === null || opts === void 0 ? void 0 : opts.defaultTypeName)
            this.defaultType = this.root.lookupType(opts.defaultTypeName);
        if (opts && typeof opts.bytesConversion !== "undefined")
            this.bytesConversion = opts.bytesConversion;
    }
    btypeDecode(valueBtypeEncoded, protobufType) {
        const valueBtypeDecoded = {};
        Object.keys(protobufType.fields).forEach((fieldName) => {
            const { options, name, type, rule } = protobufType.fields[fieldName];
            if (!valueBtypeEncoded[name])
                return;
            const typeField = { type };
            if (options) {
                if (options[OP_BYTES_1])
                    typeField.btype = options[OP_BYTES_1];
                else if (options[OP_BYTES_2])
                    typeField.btype = options[OP_BYTES_2];
            }
            // arrays
            if (rule === "repeated") {
                valueBtypeDecoded[name] = valueBtypeEncoded[name].map((itemEncoded) => {
                    // custom objects
                    if (!nativeTypes.includes(type)) {
                        const protoBuf = this.root.lookupType(type);
                        return this.btypeDecode(itemEncoded, protoBuf);
                    }
                    // native types
                    return (0, utils_1.btypeDecodeValue)(itemEncoded, typeField);
                });
                return;
            }
            // custom objects
            if (!nativeTypes.includes(type)) {
                const protoBuf = this.root.lookupType(type);
                valueBtypeDecoded[name] = this.btypeDecode(valueBtypeEncoded[name], protoBuf);
                return;
            }
            // native types
            valueBtypeDecoded[name] = (0, utils_1.btypeDecodeValue)(valueBtypeEncoded[name], typeField);
        });
        return valueBtypeDecoded;
    }
    btypeEncode(valueBtypeDecoded, protobufType) {
        const valueBtypeEncoded = {};
        Object.keys(protobufType.fields).forEach((fieldName) => {
            const { options, name, type, rule } = protobufType.fields[fieldName];
            if (!valueBtypeDecoded[name])
                return;
            const typeField = { type };
            if (options) {
                if (options[OP_BYTES_1])
                    typeField.btype = options[OP_BYTES_1];
                else if (options[OP_BYTES_2])
                    typeField.btype = options[OP_BYTES_2];
            }
            // arrays
            if (rule === "repeated") {
                valueBtypeEncoded[name] = valueBtypeDecoded[name].map((itemDecoded) => {
                    // custom objects
                    if (!nativeTypes.includes(type)) {
                        const protoBuf = this.root.lookupType(type);
                        return this.btypeEncode(itemDecoded, protoBuf);
                    }
                    // native types
                    return (0, utils_1.btypeEncodeValue)(itemDecoded, typeField);
                });
                return;
            }
            // custom objects
            if (!nativeTypes.includes(type)) {
                const protoBuf = this.root.lookupType(type);
                valueBtypeEncoded[name] = this.btypeEncode(valueBtypeDecoded[name], protoBuf);
                return;
            }
            // native types
            valueBtypeEncoded[name] = (0, utils_1.btypeEncodeValue)(valueBtypeDecoded[name], typeField);
        });
        return valueBtypeEncoded;
    }
    /**
     * Function to encode a type using the protobuffer definitions
     * It also prepares the bytes for special cases (base58, hex string)
     * when bytesConversion param is true.
     */
    async serialize(valueDecoded, typeName, opts) {
        const protobufType = this.defaultType || this.root.lookupType(typeName);
        let object = {};
        const bytesConversion = (opts === null || opts === void 0 ? void 0 : opts.bytesConversion) === undefined
            ? this.bytesConversion
            : opts.bytesConversion;
        if (bytesConversion) {
            object = this.btypeDecode(valueDecoded, protobufType);
        }
        else {
            object = valueDecoded;
        }
        const message = protobufType.create(object);
        const buffer = protobufType.encode(message).finish();
        return buffer;
    }
    /**
     * Function to decode bytes using the protobuffer definitions
     * It also encodes the bytes for special cases (base58, hex string)
     * when bytesConversion param is true.
     */
    async deserialize(valueEncoded, typeName, opts) {
        const valueBuffer = typeof valueEncoded === "string"
            ? (0, utils_1.decodeBase64url)(valueEncoded)
            : valueEncoded;
        const protobufType = this.defaultType || this.root.lookupType(typeName);
        const message = protobufType.decode(valueBuffer);
        const object = protobufType.toObject(message, {
            longs: String,
            defaults: true,
        });
        const bytesConversion = (opts === null || opts === void 0 ? void 0 : opts.bytesConversion) === undefined
            ? this.bytesConversion
            : opts.bytesConversion;
        if (bytesConversion) {
            return this.btypeEncode(object, protobufType);
        }
        return object;
    }
}
exports.Serializer = Serializer;
exports["default"] = Serializer;


/***/ }),

/***/ 6991:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Signer = void 0;
/* eslint-disable no-param-reassign, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
const sha256_1 = __webpack_require__(3061);
const secp = __importStar(__webpack_require__(9656));
const utils_1 = __webpack_require__(8593);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const protocol_proto_js_1 = __webpack_require__(9104);
const btypeBlockHeader = {
    previous: { type: "bytes", btype: "BLOCK_ID" },
    height: { type: "uint64" },
    timestamp: { type: "uint64" },
    previous_state_merkle_root: { type: "bytes" },
    transaction_merkle_root: { type: "bytes" },
    signer: { type: "bytes", btype: "ADDRESS" },
};
const btypeTransactionHeader = {
    chain_id: { type: "bytes" },
    rc_limit: { type: "uint64" },
    nonce: { type: "bytes" },
    operation_merkle_root: { type: "bytes" },
    payer: { type: "bytes", btype: "ADDRESS" },
    payee: { type: "bytes", btype: "ADDRESS" },
};
const btypesOperation = {
    upload_contract: {
        type: "object",
        subtypes: {
            contract_id: { type: "bytes", btype: "CONTRACT_ID" },
            bytecode: { type: "bytes" },
            abi: { type: "string" },
            authorizes_call_contract: { type: "bool" },
            authorizes_transaction_application: { type: "bool" },
            authorizes_upload_contract: { type: "bool" },
        },
    },
    call_contract: {
        type: "object",
        subtypes: {
            contract_id: { type: "bytes", btype: "CONTRACT_ID" },
            entry_point: { type: "uint32" },
            args: { type: "bytes" },
        },
    },
    set_system_call: {
        type: "object",
        subtypes: {
            call_id: { type: "uint32" },
            target: {
                type: "object",
                subtypes: {
                    thunk_id: { type: "uint32" },
                    system_call_bundle: {
                        type: "object",
                        subtypes: {
                            contract_id: { type: "bytes", btype: "CONTRACT_ID" },
                            entry_point: { type: "uint32" },
                        },
                    },
                },
            },
        },
    },
};
/**
 * The Signer Class contains the private key needed to sign transactions.
 * It can be created using the seed, wif, or private key
 *
 * @example
 * using private key as hex string
 * ```ts
 * var privateKey = "ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c";
 * var signer = new Signer({ privateKey });
 * ```
 * <br>
 *
 * using private key as Uint8Array
 * ```ts
 * var buffer = new Uint8Array([
 *   236, 134,   1, 162,  79, 129, 222, 205,
 *    87, 244, 182,  17, 181, 172, 110, 184,
 *     1, 203,  55, 128, 187,   2, 192, 249,
 *   205, 254, 157,   9, 218, 173, 223, 156
 * ]);
 * var signer = new Signer({ privateKey: buffer });
 * ```
 *
 * <br>
 *
 * using private key as bigint
 * ```ts
 * var privateKey = 106982601049961974618234078204952280507266494766432547312316920283818886029212n;
 * var signer = new Signer({ privateKey });
 * ```
 *
 * <br>
 *
 * using the seed
 * ```ts
 * var signer = Signer.fromSeed("my seed");
 * ```
 *
 * <br>
 *
 * using private key in WIF format
 * ```ts
 * var signer = Signer.fromWif("L59UtJcTdNBnrH2QSBA5beSUhRufRu3g6tScDTite6Msuj7U93tM");
 * ```
 *
 * <br>
 *
 * defining a provider
 * ```ts
 * var provider = new Provider(["https://example.com/jsonrpc"]);
 * var privateKey = "ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c";
 * var signer = new Signer({ privateKey, provider });
 * ```
 */
class Signer {
    /**
     * The constructor receives de private key as hexstring, bigint or Uint8Array.
     * See also the functions [[Signer.fromWif]] and [[Signer.fromSeed]]
     * to create the signer from the WIF or Seed respectively.
     *
     * @param privateKey - Private key as hexstring, bigint or Uint8Array
     * @param compressed - compressed format is true by default
     * @param provider - provider to connect with the blockchain
     * @example
     * ```ts
     * const privateKey = "ec8601a24f81decd57f4b611b5ac6eb801cb3780bb02c0f9cdfe9d09daaddf9c";
     * cons signer = new Signer({ privateKey });
     * console.log(signer.getAddress());
     * // 1MbL6mG8ASAvSYdoMnGUfG3ZXkmQ2dpL5b
     * ```
     */
    constructor(c) {
        /**
         * Chain id
         */
        this.chainId = "";
        this.compressed = typeof c.compressed === "undefined" ? true : c.compressed;
        this.privateKey = c.privateKey;
        this.provider = c.provider;
        if (typeof c.privateKey === "string") {
            this.publicKey = secp.getPublicKey(c.privateKey, this.compressed);
            this.address = (0, utils_1.bitcoinAddress)(this.publicKey);
        }
        else {
            this.publicKey = secp.getPublicKey(c.privateKey, this.compressed);
            this.address = (0, utils_1.bitcoinAddress)(this.publicKey);
        }
        if (c.chainId)
            this.chainId = c.chainId;
    }
    /**
     * Function to import a private key from the WIF
     * @param wif  - Private key in WIF format
     * @example
     * ```ts
     * const signer = Signer.fromWif("L59UtJcTdNBnrH2QSBA5beSUhRufRu3g6tScDTite6Msuj7U93tM")
     * console.log(signer.getAddress());
     * // 1MbL6mG8ASAvSYdoMnGUfG3ZXkmQ2dpL5b
     * ```
     * @returns Signer object
     */
    static fromWif(wif, compressed) {
        const comp = compressed === undefined ? wif[0] !== "5" : compressed;
        const privateKey = (0, utils_1.bitcoinDecode)(wif);
        return new Signer({
            privateKey: (0, utils_1.toHexString)(privateKey),
            compressed: comp,
        });
    }
    /**
     * Function to import a private key from the seed
     * @param seed - Seed words
     * @param compressed -
     * @example
     * ```ts
     * const signer = Signer.fromSeed("my seed");
     * console.log(signer.getAddress());
     * // 1BqtgWBcqm9cSZ97avLGZGJdgso7wx6pCA
     * ```
     * @returns Signer object
     */
    static fromSeed(seed, compressed) {
        const privateKey = (0, sha256_1.sha256)(seed);
        return new Signer({ privateKey, compressed });
    }
    /**
     * @param compressed - determines if the address should be
     * derived from the compressed public key (default) or the public key
     * @returns Signer address
     */
    getAddress(compressed = true) {
        if (typeof this.privateKey === "string") {
            const publicKey = secp.getPublicKey(this.privateKey, compressed);
            return (0, utils_1.bitcoinAddress)(publicKey);
        }
        const publicKey = secp.getPublicKey(this.privateKey, compressed);
        return (0, utils_1.bitcoinAddress)(publicKey);
    }
    /**
     * Function to get the private key in hex format or wif format
     * @param format - The format must be "hex" (default) or "wif"
     * @param compressed - Optional arg when using WIF format. By default it
     * uses the compressed value defined in the signer
     * @example
     * ```ts
     * const signer = Signer.fromSeed("one two three four five six");
     * console.log(signer.getPrivateKey());
     * // bab7fd6e5bd624f4ea0c33f7e7219262a6fa93a945a8964d9f110148286b7b37
     *
     * console.log(signer.getPrivateKey("wif"));
     * // L3UfgFJWmbVziGB1uZBjkG1UjKkF7hhpXWY7mbTUdmycmvXCVtiL
     *
     * console.log(signer.getPrivateKey("wif", false));
     * // 5KEX4TMHG66fT7cM9HMZLmdp4hVq4LC4X2Fkg6zeypM5UteWmtd
     * ```
     */
    getPrivateKey(format = "hex", compressed) {
        let stringPrivateKey;
        if (this.privateKey instanceof Uint8Array) {
            stringPrivateKey = (0, utils_1.toHexString)(this.privateKey);
        }
        else if (typeof this.privateKey === "string") {
            stringPrivateKey = this.privateKey;
        }
        else {
            stringPrivateKey = BigInt(this.privateKey).toString(16).padStart(64, "0");
        }
        const comp = compressed === undefined ? this.compressed : compressed;
        switch (format) {
            case "hex":
                return stringPrivateKey;
            case "wif":
                return (0, utils_1.bitcoinEncode)((0, utils_1.toUint8Array)(stringPrivateKey), "private", comp);
            default:
                /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
                throw new Error(`Invalid format ${format}`);
        }
    }
    /**
     * Function to sign a hash value. It returns the bytes signature.
     * The signature is in compact format with the recovery byte
     * @param hash - Hash value. Also known as digest
     */
    async signHash(hash) {
        const [compSignature, recovery] = await secp.sign(hash, this.privateKey, {
            recovered: true,
            canonical: true,
            der: false, // compact signature
        });
        const compactSignature = new Uint8Array(65);
        compactSignature.set([recovery + 31], 0);
        compactSignature.set(compSignature, 1);
        return compactSignature;
    }
    /**
     * Function to sign a transaction. It's important to remark that
     * the transaction parameter is modified inside this function.
     * @param tx - Unsigned transaction
     */
    async signTransaction(tx, _abis) {
        if (!tx.id)
            throw new Error("Missing transaction id");
        // multihash 0x1220. 12: code sha2-256. 20: length (32 bytes)
        // tx id is a stringified multihash, need to extract the hash digest only
        const hash = (0, utils_1.toUint8Array)(tx.id.slice(6));
        const signature = await this.signHash(hash);
        if (!tx.signatures)
            tx.signatures = [];
        tx.signatures.push((0, utils_1.encodeBase64url)(signature));
        return tx;
    }
    /**
     * Function to sign a block for federated consensus. That is,
     * just the ecdsa signature. For other algorithms, like PoW,
     * you have to sign the block and then process the signature
     * to add the extra data (nonce in the case of PoW).
     * @param block - Unsigned block
     */
    async signBlock(block) {
        if (!block.id)
            throw new Error("Missing block id");
        // multihash 0x1220. 12: code sha2-256. 20: length (32 bytes)
        // block id is a stringified multihash, need to extract the hash digest only
        const hash = (0, utils_1.toUint8Array)(block.id.slice(6));
        const signature = await this.signHash(hash);
        block.signature = (0, utils_1.encodeBase64url)(signature);
        return block;
    }
    /**
     * Function to sign and send a transaction. It internally uses
     * [[Provider.sendTransaction]]
     * @param tx - Transaction to send. It will be signed inside this function
     * if it is not signed yet
     * @param _abis - Collection of Abis to parse the operations in the
     * transaction. This parameter is optional.
     * @returns
     */
    async sendTransaction(tx, _abis) {
        var _a;
        if (!tx.signatures || !((_a = tx.signatures) === null || _a === void 0 ? void 0 : _a.length))
            tx = await this.signTransaction(tx);
        if (!this.provider)
            throw new Error("provider is undefined");
        const { receipt } = await this.provider.sendTransaction(tx);
        tx.wait = async (type = "byBlock", timeout = 60000) => {
            if (!this.provider)
                throw new Error("provider is undefined");
            return this.provider.wait(tx.id, type, timeout);
        };
        return { receipt, transaction: tx };
    }
    /**
     * Function to recover the public key from hash and signature
     * @param hash - hash sha256
     * @param signature - compact signature
     * @param compressed - default true
     */
    static recoverPublicKey(hash, signature, compressed = true) {
        const compactSignatureHex = (0, utils_1.toHexString)(signature);
        const recovery = Number(`0x${compactSignatureHex.slice(0, 2)}`) - 31;
        const rHex = compactSignatureHex.slice(2, 66);
        const sHex = compactSignatureHex.slice(66);
        const r = BigInt(`0x${rHex}`);
        const s = BigInt(`0x${sHex}`);
        const sig = new secp.Signature(r, s);
        const publicKey = secp.recoverPublicKey((0, utils_1.toHexString)(hash), sig.toHex(), recovery);
        if (!publicKey)
            throw new Error("Public key cannot be recovered");
        if (!compressed) {
            return (0, utils_1.toHexString)(publicKey);
        }
        else {
            return secp.Point.fromHex(publicKey).toHex(true);
        }
    }
    /**
     * Function to recover the publics keys from a signed
     * transaction or block.
     * The output format can be compressed (default) or uncompressed.
     *
     * @example
     * ```ts
     * const publicKeys = await Signer.recoverPublicKeys(tx);
     * ```
     *
     * If the signature data contains more data, like in the
     * blocks for PoW consensus, use the "transformSignature"
     * function to extract the signature.
     *
     * @example
     * ```ts
     *  const powDescriptorJson = {
     *    nested: {
     *      mypackage: {
     *        nested: {
     *          pow_signature_data: {
     *            fields: {
     *              nonce: {
     *                type: "bytes",
     *                id: 1,
     *              },
     *              recoverable_signature: {
     *                type: "bytes",
     *                id: 2,
     *              },
     *            },
     *          },
     *        },
     *      },
     *    },
     *  };
     *
     *  const serializer = new Serializer(powDescriptorJson, {
     *   defaultTypeName: "pow_signature_data",
     *  });
     *
     *  const publicKeys = await signer.recoverPublicKeys(block, {
     *    transformSignature: async (signatureData) => {
     *      const powSignatureData = await serializer.deserialize(signatureData);
     *      return powSignatureData.recoverable_signature;
     *    },
     *  });
     * ```
     */
    async recoverPublicKeys(txOrBlock, opts) {
        let compressed = true;
        if (opts && opts.compressed !== undefined) {
            compressed = opts.compressed;
        }
        let signatures = [];
        let headerBytes;
        const block = txOrBlock;
        if (block.signature) {
            if (!block.header)
                throw new Error("Missing block header");
            if (!block.signature)
                throw new Error("Missing block signature");
            signatures = [block.signature];
            const headerDecoded = (0, utils_1.btypeDecode)(block.header, btypeBlockHeader);
            const message = protocol_proto_js_1.koinos.protocol.block_header.create(headerDecoded);
            headerBytes = protocol_proto_js_1.koinos.protocol.block_header.encode(message).finish();
        }
        else {
            const transaction = txOrBlock;
            if (!transaction.header)
                throw new Error("Missing transaction header");
            if (!transaction.signatures)
                throw new Error("Missing transaction signatures");
            signatures = transaction.signatures;
            const headerDecoded = (0, utils_1.btypeDecode)(transaction.header, btypeTransactionHeader);
            const message = protocol_proto_js_1.koinos.protocol.transaction_header.create(headerDecoded);
            headerBytes = protocol_proto_js_1.koinos.protocol.transaction_header.encode(message).finish();
        }
        const hash = (0, sha256_1.sha256)(headerBytes);
        return Promise.all(signatures.map(async (signature) => {
            if (opts && typeof opts.transformSignature === "function") {
                signature = await opts.transformSignature(signature);
            }
            return Signer.recoverPublicKey(hash, (0, utils_1.decodeBase64url)(signature), compressed);
        }));
    }
    /**
     * Function to recover the signer addresses from a signed
     * transaction or block.
     * The output format can be compressed (default) or uncompressed.
     * @example
     * ```ts
     * const addresses = await signer.recoverAddress(tx);
     * ```
     *
     * If the signature data contains more data, like in the
     * blocks for PoW consensus, use the "transformSignature"
     * function to extract the signature.
     *
     * @example
     * ```ts
     *  const powDescriptorJson = {
     *    nested: {
     *      mypackage: {
     *        nested: {
     *          pow_signature_data: {
     *            fields: {
     *              nonce: {
     *                type: "bytes",
     *                id: 1,
     *              },
     *              recoverable_signature: {
     *                type: "bytes",
     *                id: 2,
     *              },
     *            },
     *          },
     *        },
     *      },
     *    },
     *  };
     *
     *  const serializer = new Serializer(powDescriptorJson, {
     *   defaultTypeName: "pow_signature_data",
     *  });
     *
     *  const addresses = await signer.recoverAddress(block, {
     *    transformSignature: async (signatureData) => {
     *      const powSignatureData = await serializer.deserialize(signatureData);
     *      return powSignatureData.recoverable_signature;
     *    },
     *  });
     * ```
     */
    async recoverAddresses(txOrBlock, opts) {
        const publicKeys = await this.recoverPublicKeys(txOrBlock, opts);
        return publicKeys.map((publicKey) => (0, utils_1.bitcoinAddress)((0, utils_1.toUint8Array)(publicKey)));
    }
    /**
     * Function to prepare a transaction
     * @param tx - Do not set the nonce to get it from the blockchain
     * using the provider. The rc_limit is 1e8 by default.
     * @returns A prepared transaction. ()
     */
    async prepareTransaction(tx) {
        var _a, _b;
        if (!tx.header) {
            tx.header = {};
        }
        const payer = (_a = tx.header.payer) !== null && _a !== void 0 ? _a : this.address;
        const { payee } = tx.header;
        let nonce;
        if (tx.header.nonce === undefined) {
            if (!this.provider)
                throw new Error("Cannot get the nonce because provider is undefined. To skip this call set a nonce in the transaction header");
            const oldNonce = (await this.provider.getNonce(payee || payer));
            const message = protocol_proto_js_1.koinos.chain.value_type.create({
                // todo: consider using bigint for big nonces
                uint64_value: String(oldNonce + 1),
            });
            const nonceEncoded = protocol_proto_js_1.koinos.chain.value_type
                .encode(message)
                .finish();
            nonce = (0, utils_1.encodeBase64url)(nonceEncoded);
        }
        else {
            nonce = tx.header.nonce;
        }
        let rcLimit;
        if (tx.header.rc_limit === undefined) {
            if (!this.provider)
                throw new Error("Cannot get the rc_limit because provider is undefined. To skip this call set a rc_limit in the transaction header");
            rcLimit = await this.provider.getAccountRc(payer);
        }
        else {
            rcLimit = tx.header.rc_limit;
        }
        let chainId = tx.header.chain_id || this.chainId;
        if (!chainId) {
            if (!this.provider)
                throw new Error("Cannot get the chain_id because provider is undefined. To skip this call set a chain_id in the Signer");
            chainId = await this.provider.getChainId();
            this.chainId = chainId;
        }
        const operationsHashes = [];
        if (tx.operations) {
            for (let index = 0; index < ((_b = tx.operations) === null || _b === void 0 ? void 0 : _b.length); index += 1) {
                const operationDecoded = (0, utils_1.btypeDecode)(tx.operations[index], btypesOperation);
                const message = protocol_proto_js_1.koinos.protocol.operation.create(operationDecoded);
                const operationEncoded = protocol_proto_js_1.koinos.protocol.operation
                    .encode(message)
                    .finish();
                operationsHashes.push((0, sha256_1.sha256)(operationEncoded));
            }
        }
        const operationMerkleRoot = (0, utils_1.encodeBase64url)(new Uint8Array([
            // multihash sha256: 18, 32
            18,
            32,
            ...(0, utils_1.calculateMerkleRoot)(operationsHashes),
        ]));
        tx.header = {
            chain_id: chainId,
            rc_limit: rcLimit,
            nonce,
            operation_merkle_root: operationMerkleRoot,
            payer,
            ...(payee && { payee }),
            // TODO: Option to resolve names (payer, payee)
        };
        const headerDecoded = (0, utils_1.btypeDecode)(tx.header, btypeTransactionHeader);
        const message = protocol_proto_js_1.koinos.protocol.transaction_header.create(headerDecoded);
        const headerBytes = protocol_proto_js_1.koinos.protocol.transaction_header
            .encode(message)
            .finish();
        const hash = (0, sha256_1.sha256)(headerBytes);
        // multihash 0x1220. 12: code sha2-256. 20: length (32 bytes)
        tx.id = `0x1220${(0, utils_1.toHexString)(hash)}`;
        return tx;
    }
    /**
     * Function to prepare a block
     * @param block -
     * @returns A prepared block. ()
     */
    async prepareBlock(block) {
        var _a;
        if (!block.header) {
            block.header = {};
        }
        const hashes = [];
        if (block.transactions) {
            for (let index = 0; index < block.transactions.length; index++) {
                const tx = block.transactions[index];
                const headerDecoded = (0, utils_1.btypeDecode)(tx.header, btypeTransactionHeader);
                const message = protocol_proto_js_1.koinos.protocol.transaction_header.create(headerDecoded);
                const headerBytes = protocol_proto_js_1.koinos.protocol.transaction_header
                    .encode(message)
                    .finish();
                hashes.push((0, sha256_1.sha256)(headerBytes));
                let signaturesBytes = new Uint8Array();
                (_a = tx.signatures) === null || _a === void 0 ? void 0 : _a.forEach((sig) => {
                    signaturesBytes = new Uint8Array([
                        ...signaturesBytes,
                        ...(0, utils_1.decodeBase64url)(sig),
                    ]);
                });
                hashes.push((0, sha256_1.sha256)(signaturesBytes));
            }
        }
        // retrieve head info if not provided
        // eslint-disable-next-line @typescript-eslint/naming-convention
        let { height, previous, previous_state_merkle_root } = block.header;
        if (!height || !previous || !previous_state_merkle_root) {
            if (!this.provider) {
                throw new Error("Cannot get the head info because provider is undefined.");
            }
            const headInfo = await this.provider.getHeadInfo();
            height = height || `${Number(headInfo.head_topology.height) + 1}`;
            previous = previous || headInfo.head_topology.id;
            previous_state_merkle_root =
                previous_state_merkle_root || headInfo.head_state_merkle_root;
        }
        block.header = {
            height,
            previous,
            previous_state_merkle_root,
            timestamp: block.header.timestamp || `${Date.now()}`,
            transaction_merkle_root: (0, utils_1.encodeBase64url)(new Uint8Array([
                // multihash sha256: 18, 32
                18,
                32,
                ...(0, utils_1.calculateMerkleRoot)(hashes),
            ])),
            signer: this.address,
        };
        const headerDecoded = (0, utils_1.btypeDecode)(block.header, btypeBlockHeader);
        const message = protocol_proto_js_1.koinos.protocol.block_header.create(headerDecoded);
        const headerBytes = protocol_proto_js_1.koinos.protocol.block_header
            .encode(message)
            .finish();
        const hash = (0, sha256_1.sha256)(headerBytes);
        // multihash 0x1220. 12: code sha2-256. 20: length (32 bytes)
        block.id = `0x1220${(0, utils_1.toHexString)(hash)}`;
        return block;
    }
}
exports.Signer = Signer;
exports["default"] = Signer;


/***/ }),

/***/ 5738:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/*! koilib - MIT License (c) Julian Gonzalez (joticajulian@gmail.com) */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const utils = __importStar(__webpack_require__(8593));
const Contract_1 = __webpack_require__(9822);
const Signer_1 = __webpack_require__(6991);
const Provider_1 = __webpack_require__(5635);
const Serializer_1 = __webpack_require__(7187);
window.utils = utils;
window.Contract = Contract_1.Contract;
window.Signer = Signer_1.Signer;
window.Provider = Provider_1.Provider;
window.Serializer = Serializer_1.Serializer;


/***/ }),

/***/ 8593:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.tokenAbi = exports.btypeEncode = exports.btypeDecode = exports.btypeEncodeValue = exports.btypeDecodeValue = exports.parseUnits = exports.formatUnits = exports.bitcoinAddress = exports.bitcoinDecode = exports.bitcoinEncode = exports.calculateMerkleRoot = exports.decodeBase64 = exports.multihash = exports.encodeBase64 = exports.decodeBase64url = exports.encodeBase64url = exports.decodeBase58 = exports.encodeBase58 = exports.toHexString = exports.toUint8Array = void 0;
const multibase = __importStar(__webpack_require__(6957));
const sha256_1 = __webpack_require__(3061);
const ripemd160_1 = __webpack_require__(830);
const token_proto_json_1 = __importDefault(__webpack_require__(6567));
/**
 * Converts an hex string to Uint8Array
 */
function toUint8Array(hex) {
    const pairs = hex.match(/[\dA-F]{2}/gi);
    if (!pairs)
        throw new Error("Invalid hex");
    return new Uint8Array(pairs.map((s) => parseInt(s, 16)) // convert to integers
    );
}
exports.toUint8Array = toUint8Array;
/**
 * Converts Uint8Array to hex string
 */
function toHexString(buffer) {
    return Array.from(buffer)
        .map((n) => `0${Number(n).toString(16)}`.slice(-2))
        .join("");
}
exports.toHexString = toHexString;
/**
 * Encodes an Uint8Array in base58
 */
function encodeBase58(buffer) {
    return new TextDecoder().decode(multibase.encode("z", buffer)).slice(1);
}
exports.encodeBase58 = encodeBase58;
/**
 * Decodes a buffer formatted in base58
 */
function decodeBase58(bs58) {
    return multibase.decode(`z${bs58}`);
}
exports.decodeBase58 = decodeBase58;
/**
 * Encodes an Uint8Array in base64url
 */
function encodeBase64url(buffer) {
    return new TextDecoder().decode(multibase.encode("U", buffer)).slice(1);
}
exports.encodeBase64url = encodeBase64url;
/**
 * Decodes a buffer formatted in base64url
 */
function decodeBase64url(bs64url) {
    return multibase.decode(`U${bs64url}`);
}
exports.decodeBase64url = decodeBase64url;
/**
 * Encodes an Uint8Array in base64
 */
function encodeBase64(buffer) {
    return new TextDecoder().decode(multibase.encode("M", buffer)).slice(1);
}
exports.encodeBase64 = encodeBase64;
function multihash(buffer, code = "sha2-256") {
    switch (code) {
        case "sha2-256": {
            return new Uint8Array([18, buffer.length, ...buffer]);
        }
        default:
            throw new Error(`multihash code ${code} not supported`);
    }
}
exports.multihash = multihash;
/**
 * Decodes a buffer formatted in base64
 */
function decodeBase64(bs64) {
    return multibase.decode(`M${bs64}`);
}
exports.decodeBase64 = decodeBase64;
/**
 * Calculates the merkle root of sha256 hashes
 */
function calculateMerkleRoot(hashes) {
    if (!hashes.length)
        return (0, sha256_1.sha256)(new Uint8Array());
    while (hashes.length > 1) {
        for (let i = 0; i < hashes.length; i += 2) {
            if (i + 1 < hashes.length) {
                const leftHash = hashes[i];
                const rightHash = hashes[i + 1];
                const sumHash = (0, sha256_1.sha256)(new Uint8Array([...leftHash, ...rightHash]));
                hashes[i / 2] = new Uint8Array(sumHash);
            }
            else {
                hashes[i / 2] = hashes[i];
            }
        }
        hashes = hashes.slice(0, Math.ceil(hashes.length / 2));
    }
    return hashes[0];
}
exports.calculateMerkleRoot = calculateMerkleRoot;
/**
 * Encodes a public or private key in base58 using
 * the bitcoin format (see [Bitcoin Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
 * and [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format)).
 *
 * For private keys this encode is also known as
 * wallet import format (WIF).
 */
function bitcoinEncode(buffer, type, compressed = false) {
    let bufferCheck;
    let prefixBuffer;
    let offsetChecksum;
    if (type === "public") {
        bufferCheck = new Uint8Array(25);
        prefixBuffer = new Uint8Array(21);
        bufferCheck[0] = 0;
        prefixBuffer[0] = 0;
        offsetChecksum = 21;
    }
    else {
        if (compressed) {
            bufferCheck = new Uint8Array(38);
            prefixBuffer = new Uint8Array(34);
            offsetChecksum = 34;
            bufferCheck[33] = 1;
            prefixBuffer[33] = 1;
        }
        else {
            bufferCheck = new Uint8Array(37);
            prefixBuffer = new Uint8Array(33);
            offsetChecksum = 33;
        }
        bufferCheck[0] = 128;
        prefixBuffer[0] = 128;
    }
    prefixBuffer.set(buffer, 1);
    const firstHash = (0, sha256_1.sha256)(prefixBuffer);
    const doubleHash = (0, sha256_1.sha256)(firstHash);
    const checksum = new Uint8Array(4);
    checksum.set(doubleHash.slice(0, 4));
    bufferCheck.set(buffer, 1);
    bufferCheck.set(checksum, offsetChecksum);
    return encodeBase58(bufferCheck);
}
exports.bitcoinEncode = bitcoinEncode;
/**
 * Decodes a public or private key formatted in base58 using
 * the bitcoin format (see [Bitcoin Base58Check encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)
 * and [Bitcoin WIF](https://en.bitcoin.it/wiki/Wallet_import_format)).
 *
 * For private keys this encode is also known as
 * wallet import format (WIF).
 */
function bitcoinDecode(value) {
    const buffer = decodeBase58(value);
    const privateKey = new Uint8Array(32);
    const checksum = new Uint8Array(4);
    // const prefix = buffer[0];
    privateKey.set(buffer.slice(1, 33));
    if (value[0] !== "5") {
        // compressed
        checksum.set(buffer.slice(34, 38));
    }
    else {
        checksum.set(buffer.slice(33, 37));
    }
    // TODO: verify prefix and checksum
    return privateKey;
}
exports.bitcoinDecode = bitcoinDecode;
/**
 * Computes a bitcoin address, which is the format used in Koinos
 *
 * address = bitcoinEncode( ripemd160 ( sha256 ( publicKey ) ) )
 */
function bitcoinAddress(publicKey) {
    const hash = (0, sha256_1.sha256)(publicKey);
    const hash160 = (0, ripemd160_1.ripemd160)(hash);
    return bitcoinEncode(hash160, "public");
}
exports.bitcoinAddress = bitcoinAddress;
/**
 * Function to format a number in a decimal point number
 * @example
 * ```js
 * const amount = formatUnits("123456", 8);
 * console.log(amount);
 * // '0.00123456'
 * ```
 */
function formatUnits(value, decimals) {
    let v = typeof value === "string" ? value : BigInt(value).toString();
    const sign = v[0] === "-" ? "-" : "";
    v = v.replace("-", "").padStart(decimals + 1, "0");
    const integerPart = v
        .substring(0, v.length - decimals)
        .replace(/^0+(?=\d)/, "");
    const decimalPart = v.substring(v.length - decimals);
    return `${sign}${integerPart}.${decimalPart}`.replace(/(\.0+)?(0+)$/, "");
}
exports.formatUnits = formatUnits;
/**
 * Function to format a decimal point number in an integer
 * @example
 * ```js
 * const amount = parseUnits("0.00123456", 8);
 * console.log(amount);
 * // '123456'
 * ```
 */
function parseUnits(value, decimals) {
    const sign = value[0] === "-" ? "-" : "";
    // eslint-disable-next-line prefer-const
    let [integerPart, decimalPart] = value
        .replace("-", "")
        .replace(",", ".")
        .split(".");
    if (!decimalPart)
        decimalPart = "";
    decimalPart = decimalPart.padEnd(decimals, "0");
    return `${sign}${`${integerPart}${decimalPart}`.replace(/^0+(?=\d)/, "")}`;
}
exports.parseUnits = parseUnits;
/**
 * Makes a copy of a value. The returned value can be modified
 * without altering the original one. Although this is not needed
 * for strings or numbers and only needed for objects and arrays,
 * all these options are covered in a single function
 *
 * It is assumed that the argument is number, string, or contructions
 * of these types inside objects or arrays.
 */
function copyValue(value) {
    if (typeof value === "string" || typeof value === "number") {
        return value;
    }
    return JSON.parse(JSON.stringify(value));
}
function btypeDecodeValue(valueEncoded, typeField) {
    // No byte conversion
    if (typeField.type !== "bytes")
        return copyValue(valueEncoded);
    const value = valueEncoded;
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
exports.btypeDecodeValue = btypeDecodeValue;
function btypeEncodeValue(valueDecoded, typeField) {
    // No byte conversion
    if (typeField.type !== "bytes")
        return copyValue(valueDecoded);
    const value = valueDecoded;
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
exports.btypeEncodeValue = btypeEncodeValue;
function btypeDecode(valueEncoded, fields) {
    if (typeof valueEncoded !== "object")
        return valueEncoded;
    const valueDecoded = {};
    Object.keys(fields).forEach((name) => {
        if (!valueEncoded[name])
            return;
        if (fields[name].rule === "repeated")
            valueDecoded[name] = valueEncoded[name].map((itemEncoded) => {
                if (fields[name].subtypes)
                    return btypeDecode(itemEncoded, fields[name].subtypes);
                return btypeDecodeValue(itemEncoded, fields[name]);
            });
        else if (fields[name].subtypes)
            valueDecoded[name] = btypeDecode(valueEncoded[name], fields[name].subtypes);
        else
            valueDecoded[name] = btypeDecodeValue(valueEncoded[name], fields[name]);
    });
    return valueDecoded;
}
exports.btypeDecode = btypeDecode;
function btypeEncode(valueDecoded, fields) {
    if (typeof valueDecoded !== "object")
        return valueDecoded;
    const valueEncoded = {};
    Object.keys(fields).forEach((name) => {
        if (!valueDecoded[name])
            return;
        if (fields[name].rule === "repeated")
            valueEncoded[name] = valueDecoded[name].map((itemDecoded) => {
                if (fields[name].subtypes)
                    return btypeEncode(itemDecoded, fields[name].subtypes);
                return btypeEncodeValue(itemDecoded, fields[name]);
            });
        else if (fields[name].subtypes)
            valueEncoded[name] = btypeEncode(valueDecoded[name], fields[name].subtypes);
        else
            valueEncoded[name] = btypeEncodeValue(valueDecoded[name], fields[name]);
    });
    return valueEncoded;
}
exports.btypeEncode = btypeEncode;
/**
 * ABI for tokens
 */
exports.tokenAbi = {
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
    types: token_proto_json_1.default,
};
//export const ProtocolTypes = protocolJson;


/***/ }),

/***/ 9104:
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
(function (global, factory) {
  /* global define, require, module */

  /* AMD */ if (true)
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2100)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  /* CommonJS */ else {}
})(this, function ($protobuf) {
  "use strict";

  // Common aliases
  var $Reader = $protobuf.Reader,
    $Writer = $protobuf.Writer,
    $util = $protobuf.util;

  // Exported root namespace
  var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

  $root.koinos = (function () {
    /**
     * Namespace koinos.
     * @exports koinos
     * @namespace
     */
    var koinos = {};

    koinos.protocol = (function () {
      /**
       * Namespace protocol.
       * @memberof koinos
       * @namespace
       */
      var protocol = {};

      protocol.event_data = (function () {
        /**
         * Properties of an event_data.
         * @memberof koinos.protocol
         * @interface Ievent_data
         * @property {number|null} [sequence] event_data sequence
         * @property {Uint8Array|null} [source] event_data source
         * @property {string|null} [name] event_data name
         * @property {Uint8Array|null} [data] event_data data
         * @property {Array.<Uint8Array>|null} [impacted] event_data impacted
         */

        /**
         * Constructs a new event_data.
         * @memberof koinos.protocol
         * @classdesc Represents an event_data.
         * @implements Ievent_data
         * @constructor
         * @param {koinos.protocol.Ievent_data=} [properties] Properties to set
         */
        function event_data(properties) {
          this.impacted = [];
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * event_data sequence.
         * @member {number} sequence
         * @memberof koinos.protocol.event_data
         * @instance
         */
        event_data.prototype.sequence = 0;

        /**
         * event_data source.
         * @member {Uint8Array} source
         * @memberof koinos.protocol.event_data
         * @instance
         */
        event_data.prototype.source = $util.newBuffer([]);

        /**
         * event_data name.
         * @member {string} name
         * @memberof koinos.protocol.event_data
         * @instance
         */
        event_data.prototype.name = "";

        /**
         * event_data data.
         * @member {Uint8Array} data
         * @memberof koinos.protocol.event_data
         * @instance
         */
        event_data.prototype.data = $util.newBuffer([]);

        /**
         * event_data impacted.
         * @member {Array.<Uint8Array>} impacted
         * @memberof koinos.protocol.event_data
         * @instance
         */
        event_data.prototype.impacted = $util.emptyArray;

        /**
         * Creates a new event_data instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.event_data
         * @static
         * @param {koinos.protocol.Ievent_data=} [properties] Properties to set
         * @returns {koinos.protocol.event_data} event_data instance
         */
        event_data.create = function create(properties) {
          return new event_data(properties);
        };

        /**
         * Encodes the specified event_data message. Does not implicitly {@link koinos.protocol.event_data.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.event_data
         * @static
         * @param {koinos.protocol.Ievent_data} message event_data message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        event_data.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (
            message.sequence != null &&
            Object.hasOwnProperty.call(message, "sequence")
          )
            writer.uint32(/* id 1, wireType 0 =*/ 8).uint32(message.sequence);
          if (
            message.source != null &&
            Object.hasOwnProperty.call(message, "source")
          )
            writer.uint32(/* id 2, wireType 2 =*/ 18).bytes(message.source);
          if (
            message.name != null &&
            Object.hasOwnProperty.call(message, "name")
          )
            writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.name);
          if (
            message.data != null &&
            Object.hasOwnProperty.call(message, "data")
          )
            writer.uint32(/* id 4, wireType 2 =*/ 34).bytes(message.data);
          if (message.impacted != null && message.impacted.length)
            for (var i = 0; i < message.impacted.length; ++i)
              writer
                .uint32(/* id 5, wireType 2 =*/ 42)
                .bytes(message.impacted[i]);
          return writer;
        };

        /**
         * Encodes the specified event_data message, length delimited. Does not implicitly {@link koinos.protocol.event_data.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.event_data
         * @static
         * @param {koinos.protocol.Ievent_data} message event_data message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        event_data.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an event_data message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.event_data
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.event_data} event_data
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        event_data.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.event_data();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.sequence = reader.uint32();
                break;
              case 2:
                message.source = reader.bytes();
                break;
              case 3:
                message.name = reader.string();
                break;
              case 4:
                message.data = reader.bytes();
                break;
              case 5:
                if (!(message.impacted && message.impacted.length))
                  message.impacted = [];
                message.impacted.push(reader.bytes());
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes an event_data message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.event_data
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.event_data} event_data
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        event_data.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an event_data message.
         * @function verify
         * @memberof koinos.protocol.event_data
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        event_data.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (message.sequence != null && message.hasOwnProperty("sequence"))
            if (!$util.isInteger(message.sequence))
              return "sequence: integer expected";
          if (message.source != null && message.hasOwnProperty("source"))
            if (
              !(
                (message.source && typeof message.source.length === "number") ||
                $util.isString(message.source)
              )
            )
              return "source: buffer expected";
          if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name)) return "name: string expected";
          if (message.data != null && message.hasOwnProperty("data"))
            if (
              !(
                (message.data && typeof message.data.length === "number") ||
                $util.isString(message.data)
              )
            )
              return "data: buffer expected";
          if (message.impacted != null && message.hasOwnProperty("impacted")) {
            if (!Array.isArray(message.impacted))
              return "impacted: array expected";
            for (var i = 0; i < message.impacted.length; ++i)
              if (
                !(
                  (message.impacted[i] &&
                    typeof message.impacted[i].length === "number") ||
                  $util.isString(message.impacted[i])
                )
              )
                return "impacted: buffer[] expected";
          }
          return null;
        };

        /**
         * Creates an event_data message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.event_data
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.event_data} event_data
         */
        event_data.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.event_data) return object;
          var message = new $root.koinos.protocol.event_data();
          if (object.sequence != null) message.sequence = object.sequence >>> 0;
          if (object.source != null)
            if (typeof object.source === "string")
              $util.base64.decode(
                object.source,
                (message.source = $util.newBuffer(
                  $util.base64.length(object.source)
                )),
                0
              );
            else if (object.source.length) message.source = object.source;
          if (object.name != null) message.name = String(object.name);
          if (object.data != null)
            if (typeof object.data === "string")
              $util.base64.decode(
                object.data,
                (message.data = $util.newBuffer(
                  $util.base64.length(object.data)
                )),
                0
              );
            else if (object.data.length) message.data = object.data;
          if (object.impacted) {
            if (!Array.isArray(object.impacted))
              throw TypeError(
                ".koinos.protocol.event_data.impacted: array expected"
              );
            message.impacted = [];
            for (var i = 0; i < object.impacted.length; ++i)
              if (typeof object.impacted[i] === "string")
                $util.base64.decode(
                  object.impacted[i],
                  (message.impacted[i] = $util.newBuffer(
                    $util.base64.length(object.impacted[i])
                  )),
                  0
                );
              else if (object.impacted[i].length)
                message.impacted[i] = object.impacted[i];
          }
          return message;
        };

        /**
         * Creates a plain object from an event_data message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.event_data
         * @static
         * @param {koinos.protocol.event_data} message event_data
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        event_data.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.arrays || options.defaults) object.impacted = [];
          if (options.defaults) {
            object.sequence = 0;
            if (options.bytes === String) object.source = "";
            else {
              object.source = [];
              if (options.bytes !== Array)
                object.source = $util.newBuffer(object.source);
            }
            object.name = "";
            if (options.bytes === String) object.data = "";
            else {
              object.data = [];
              if (options.bytes !== Array)
                object.data = $util.newBuffer(object.data);
            }
          }
          if (message.sequence != null && message.hasOwnProperty("sequence"))
            object.sequence = message.sequence;
          if (message.source != null && message.hasOwnProperty("source"))
            object.source =
              options.bytes === String
                ? $util.base64.encode(message.source, 0, message.source.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.source)
                : message.source;
          if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
          if (message.data != null && message.hasOwnProperty("data"))
            object.data =
              options.bytes === String
                ? $util.base64.encode(message.data, 0, message.data.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.data)
                : message.data;
          if (message.impacted && message.impacted.length) {
            object.impacted = [];
            for (var j = 0; j < message.impacted.length; ++j)
              object.impacted[j] =
                options.bytes === String
                  ? $util.base64.encode(
                      message.impacted[j],
                      0,
                      message.impacted[j].length
                    )
                  : options.bytes === Array
                  ? Array.prototype.slice.call(message.impacted[j])
                  : message.impacted[j];
          }
          return object;
        };

        /**
         * Converts this event_data to JSON.
         * @function toJSON
         * @memberof koinos.protocol.event_data
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        event_data.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return event_data;
      })();

      protocol.contract_call_bundle = (function () {
        /**
         * Properties of a contract_call_bundle.
         * @memberof koinos.protocol
         * @interface Icontract_call_bundle
         * @property {Uint8Array|null} [contract_id] contract_call_bundle contract_id
         * @property {number|null} [entry_point] contract_call_bundle entry_point
         */

        /**
         * Constructs a new contract_call_bundle.
         * @memberof koinos.protocol
         * @classdesc Represents a contract_call_bundle.
         * @implements Icontract_call_bundle
         * @constructor
         * @param {koinos.protocol.Icontract_call_bundle=} [properties] Properties to set
         */
        function contract_call_bundle(properties) {
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * contract_call_bundle contract_id.
         * @member {Uint8Array} contract_id
         * @memberof koinos.protocol.contract_call_bundle
         * @instance
         */
        contract_call_bundle.prototype.contract_id = $util.newBuffer([]);

        /**
         * contract_call_bundle entry_point.
         * @member {number} entry_point
         * @memberof koinos.protocol.contract_call_bundle
         * @instance
         */
        contract_call_bundle.prototype.entry_point = 0;

        /**
         * Creates a new contract_call_bundle instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.contract_call_bundle
         * @static
         * @param {koinos.protocol.Icontract_call_bundle=} [properties] Properties to set
         * @returns {koinos.protocol.contract_call_bundle} contract_call_bundle instance
         */
        contract_call_bundle.create = function create(properties) {
          return new contract_call_bundle(properties);
        };

        /**
         * Encodes the specified contract_call_bundle message. Does not implicitly {@link koinos.protocol.contract_call_bundle.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.contract_call_bundle
         * @static
         * @param {koinos.protocol.Icontract_call_bundle} message contract_call_bundle message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        contract_call_bundle.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (
            message.contract_id != null &&
            Object.hasOwnProperty.call(message, "contract_id")
          )
            writer
              .uint32(/* id 1, wireType 2 =*/ 10)
              .bytes(message.contract_id);
          if (
            message.entry_point != null &&
            Object.hasOwnProperty.call(message, "entry_point")
          )
            writer
              .uint32(/* id 2, wireType 0 =*/ 16)
              .uint32(message.entry_point);
          return writer;
        };

        /**
         * Encodes the specified contract_call_bundle message, length delimited. Does not implicitly {@link koinos.protocol.contract_call_bundle.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.contract_call_bundle
         * @static
         * @param {koinos.protocol.Icontract_call_bundle} message contract_call_bundle message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        contract_call_bundle.encodeDelimited = function encodeDelimited(
          message,
          writer
        ) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a contract_call_bundle message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.contract_call_bundle
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.contract_call_bundle} contract_call_bundle
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        contract_call_bundle.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.contract_call_bundle();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.contract_id = reader.bytes();
                break;
              case 2:
                message.entry_point = reader.uint32();
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a contract_call_bundle message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.contract_call_bundle
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.contract_call_bundle} contract_call_bundle
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        contract_call_bundle.decodeDelimited = function decodeDelimited(
          reader
        ) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a contract_call_bundle message.
         * @function verify
         * @memberof koinos.protocol.contract_call_bundle
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        contract_call_bundle.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (
            message.contract_id != null &&
            message.hasOwnProperty("contract_id")
          )
            if (
              !(
                (message.contract_id &&
                  typeof message.contract_id.length === "number") ||
                $util.isString(message.contract_id)
              )
            )
              return "contract_id: buffer expected";
          if (
            message.entry_point != null &&
            message.hasOwnProperty("entry_point")
          )
            if (!$util.isInteger(message.entry_point))
              return "entry_point: integer expected";
          return null;
        };

        /**
         * Creates a contract_call_bundle message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.contract_call_bundle
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.contract_call_bundle} contract_call_bundle
         */
        contract_call_bundle.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.contract_call_bundle)
            return object;
          var message = new $root.koinos.protocol.contract_call_bundle();
          if (object.contract_id != null)
            if (typeof object.contract_id === "string")
              $util.base64.decode(
                object.contract_id,
                (message.contract_id = $util.newBuffer(
                  $util.base64.length(object.contract_id)
                )),
                0
              );
            else if (object.contract_id.length)
              message.contract_id = object.contract_id;
          if (object.entry_point != null)
            message.entry_point = object.entry_point >>> 0;
          return message;
        };

        /**
         * Creates a plain object from a contract_call_bundle message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.contract_call_bundle
         * @static
         * @param {koinos.protocol.contract_call_bundle} message contract_call_bundle
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        contract_call_bundle.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.defaults) {
            if (options.bytes === String) object.contract_id = "";
            else {
              object.contract_id = [];
              if (options.bytes !== Array)
                object.contract_id = $util.newBuffer(object.contract_id);
            }
            object.entry_point = 0;
          }
          if (
            message.contract_id != null &&
            message.hasOwnProperty("contract_id")
          )
            object.contract_id =
              options.bytes === String
                ? $util.base64.encode(
                    message.contract_id,
                    0,
                    message.contract_id.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.contract_id)
                : message.contract_id;
          if (
            message.entry_point != null &&
            message.hasOwnProperty("entry_point")
          )
            object.entry_point = message.entry_point;
          return object;
        };

        /**
         * Converts this contract_call_bundle to JSON.
         * @function toJSON
         * @memberof koinos.protocol.contract_call_bundle
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        contract_call_bundle.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return contract_call_bundle;
      })();

      protocol.system_call_target = (function () {
        /**
         * Properties of a system_call_target.
         * @memberof koinos.protocol
         * @interface Isystem_call_target
         * @property {number|null} [thunk_id] system_call_target thunk_id
         * @property {koinos.protocol.Icontract_call_bundle|null} [system_call_bundle] system_call_target system_call_bundle
         */

        /**
         * Constructs a new system_call_target.
         * @memberof koinos.protocol
         * @classdesc Represents a system_call_target.
         * @implements Isystem_call_target
         * @constructor
         * @param {koinos.protocol.Isystem_call_target=} [properties] Properties to set
         */
        function system_call_target(properties) {
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * system_call_target thunk_id.
         * @member {number|null|undefined} thunk_id
         * @memberof koinos.protocol.system_call_target
         * @instance
         */
        system_call_target.prototype.thunk_id = null;

        /**
         * system_call_target system_call_bundle.
         * @member {koinos.protocol.Icontract_call_bundle|null|undefined} system_call_bundle
         * @memberof koinos.protocol.system_call_target
         * @instance
         */
        system_call_target.prototype.system_call_bundle = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * system_call_target target.
         * @member {"thunk_id"|"system_call_bundle"|undefined} target
         * @memberof koinos.protocol.system_call_target
         * @instance
         */
        Object.defineProperty(system_call_target.prototype, "target", {
          get: $util.oneOfGetter(
            ($oneOfFields = ["thunk_id", "system_call_bundle"])
          ),
          set: $util.oneOfSetter($oneOfFields),
        });

        /**
         * Creates a new system_call_target instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.system_call_target
         * @static
         * @param {koinos.protocol.Isystem_call_target=} [properties] Properties to set
         * @returns {koinos.protocol.system_call_target} system_call_target instance
         */
        system_call_target.create = function create(properties) {
          return new system_call_target(properties);
        };

        /**
         * Encodes the specified system_call_target message. Does not implicitly {@link koinos.protocol.system_call_target.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.system_call_target
         * @static
         * @param {koinos.protocol.Isystem_call_target} message system_call_target message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        system_call_target.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (
            message.thunk_id != null &&
            Object.hasOwnProperty.call(message, "thunk_id")
          )
            writer.uint32(/* id 1, wireType 0 =*/ 8).uint32(message.thunk_id);
          if (
            message.system_call_bundle != null &&
            Object.hasOwnProperty.call(message, "system_call_bundle")
          )
            $root.koinos.protocol.contract_call_bundle
              .encode(
                message.system_call_bundle,
                writer.uint32(/* id 2, wireType 2 =*/ 18).fork()
              )
              .ldelim();
          return writer;
        };

        /**
         * Encodes the specified system_call_target message, length delimited. Does not implicitly {@link koinos.protocol.system_call_target.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.system_call_target
         * @static
         * @param {koinos.protocol.Isystem_call_target} message system_call_target message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        system_call_target.encodeDelimited = function encodeDelimited(
          message,
          writer
        ) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a system_call_target message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.system_call_target
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.system_call_target} system_call_target
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        system_call_target.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.system_call_target();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.thunk_id = reader.uint32();
                break;
              case 2:
                message.system_call_bundle =
                  $root.koinos.protocol.contract_call_bundle.decode(
                    reader,
                    reader.uint32()
                  );
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a system_call_target message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.system_call_target
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.system_call_target} system_call_target
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        system_call_target.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a system_call_target message.
         * @function verify
         * @memberof koinos.protocol.system_call_target
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        system_call_target.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          var properties = {};
          if (message.thunk_id != null && message.hasOwnProperty("thunk_id")) {
            properties.target = 1;
            if (!$util.isInteger(message.thunk_id))
              return "thunk_id: integer expected";
          }
          if (
            message.system_call_bundle != null &&
            message.hasOwnProperty("system_call_bundle")
          ) {
            if (properties.target === 1) return "target: multiple values";
            properties.target = 1;
            {
              var error = $root.koinos.protocol.contract_call_bundle.verify(
                message.system_call_bundle
              );
              if (error) return "system_call_bundle." + error;
            }
          }
          return null;
        };

        /**
         * Creates a system_call_target message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.system_call_target
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.system_call_target} system_call_target
         */
        system_call_target.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.system_call_target)
            return object;
          var message = new $root.koinos.protocol.system_call_target();
          if (object.thunk_id != null) message.thunk_id = object.thunk_id >>> 0;
          if (object.system_call_bundle != null) {
            if (typeof object.system_call_bundle !== "object")
              throw TypeError(
                ".koinos.protocol.system_call_target.system_call_bundle: object expected"
              );
            message.system_call_bundle =
              $root.koinos.protocol.contract_call_bundle.fromObject(
                object.system_call_bundle
              );
          }
          return message;
        };

        /**
         * Creates a plain object from a system_call_target message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.system_call_target
         * @static
         * @param {koinos.protocol.system_call_target} message system_call_target
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        system_call_target.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (message.thunk_id != null && message.hasOwnProperty("thunk_id")) {
            object.thunk_id = message.thunk_id;
            if (options.oneofs) object.target = "thunk_id";
          }
          if (
            message.system_call_bundle != null &&
            message.hasOwnProperty("system_call_bundle")
          ) {
            object.system_call_bundle =
              $root.koinos.protocol.contract_call_bundle.toObject(
                message.system_call_bundle,
                options
              );
            if (options.oneofs) object.target = "system_call_bundle";
          }
          return object;
        };

        /**
         * Converts this system_call_target to JSON.
         * @function toJSON
         * @memberof koinos.protocol.system_call_target
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        system_call_target.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return system_call_target;
      })();

      protocol.upload_contract_operation = (function () {
        /**
         * Properties of an upload_contract_operation.
         * @memberof koinos.protocol
         * @interface Iupload_contract_operation
         * @property {Uint8Array|null} [contract_id] upload_contract_operation contract_id
         * @property {Uint8Array|null} [bytecode] upload_contract_operation bytecode
         * @property {string|null} [abi] upload_contract_operation abi
         * @property {boolean|null} [authorizes_call_contract] upload_contract_operation authorizes_call_contract
         * @property {boolean|null} [authorizes_transaction_application] upload_contract_operation authorizes_transaction_application
         * @property {boolean|null} [authorizes_upload_contract] upload_contract_operation authorizes_upload_contract
         */

        /**
         * Constructs a new upload_contract_operation.
         * @memberof koinos.protocol
         * @classdesc Represents an upload_contract_operation.
         * @implements Iupload_contract_operation
         * @constructor
         * @param {koinos.protocol.Iupload_contract_operation=} [properties] Properties to set
         */
        function upload_contract_operation(properties) {
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * upload_contract_operation contract_id.
         * @member {Uint8Array} contract_id
         * @memberof koinos.protocol.upload_contract_operation
         * @instance
         */
        upload_contract_operation.prototype.contract_id = $util.newBuffer([]);

        /**
         * upload_contract_operation bytecode.
         * @member {Uint8Array} bytecode
         * @memberof koinos.protocol.upload_contract_operation
         * @instance
         */
        upload_contract_operation.prototype.bytecode = $util.newBuffer([]);

        /**
         * upload_contract_operation abi.
         * @member {string} abi
         * @memberof koinos.protocol.upload_contract_operation
         * @instance
         */
        upload_contract_operation.prototype.abi = "";

        /**
         * upload_contract_operation authorizes_call_contract.
         * @member {boolean} authorizes_call_contract
         * @memberof koinos.protocol.upload_contract_operation
         * @instance
         */
        upload_contract_operation.prototype.authorizes_call_contract = false;

        /**
         * upload_contract_operation authorizes_transaction_application.
         * @member {boolean} authorizes_transaction_application
         * @memberof koinos.protocol.upload_contract_operation
         * @instance
         */
        upload_contract_operation.prototype.authorizes_transaction_application = false;

        /**
         * upload_contract_operation authorizes_upload_contract.
         * @member {boolean} authorizes_upload_contract
         * @memberof koinos.protocol.upload_contract_operation
         * @instance
         */
        upload_contract_operation.prototype.authorizes_upload_contract = false;

        /**
         * Creates a new upload_contract_operation instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.upload_contract_operation
         * @static
         * @param {koinos.protocol.Iupload_contract_operation=} [properties] Properties to set
         * @returns {koinos.protocol.upload_contract_operation} upload_contract_operation instance
         */
        upload_contract_operation.create = function create(properties) {
          return new upload_contract_operation(properties);
        };

        /**
         * Encodes the specified upload_contract_operation message. Does not implicitly {@link koinos.protocol.upload_contract_operation.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.upload_contract_operation
         * @static
         * @param {koinos.protocol.Iupload_contract_operation} message upload_contract_operation message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        upload_contract_operation.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (
            message.contract_id != null &&
            Object.hasOwnProperty.call(message, "contract_id")
          )
            writer
              .uint32(/* id 1, wireType 2 =*/ 10)
              .bytes(message.contract_id);
          if (
            message.bytecode != null &&
            Object.hasOwnProperty.call(message, "bytecode")
          )
            writer.uint32(/* id 2, wireType 2 =*/ 18).bytes(message.bytecode);
          if (message.abi != null && Object.hasOwnProperty.call(message, "abi"))
            writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.abi);
          if (
            message.authorizes_call_contract != null &&
            Object.hasOwnProperty.call(message, "authorizes_call_contract")
          )
            writer
              .uint32(/* id 4, wireType 0 =*/ 32)
              .bool(message.authorizes_call_contract);
          if (
            message.authorizes_transaction_application != null &&
            Object.hasOwnProperty.call(
              message,
              "authorizes_transaction_application"
            )
          )
            writer
              .uint32(/* id 5, wireType 0 =*/ 40)
              .bool(message.authorizes_transaction_application);
          if (
            message.authorizes_upload_contract != null &&
            Object.hasOwnProperty.call(message, "authorizes_upload_contract")
          )
            writer
              .uint32(/* id 6, wireType 0 =*/ 48)
              .bool(message.authorizes_upload_contract);
          return writer;
        };

        /**
         * Encodes the specified upload_contract_operation message, length delimited. Does not implicitly {@link koinos.protocol.upload_contract_operation.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.upload_contract_operation
         * @static
         * @param {koinos.protocol.Iupload_contract_operation} message upload_contract_operation message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        upload_contract_operation.encodeDelimited = function encodeDelimited(
          message,
          writer
        ) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an upload_contract_operation message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.upload_contract_operation
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.upload_contract_operation} upload_contract_operation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        upload_contract_operation.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.upload_contract_operation();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.contract_id = reader.bytes();
                break;
              case 2:
                message.bytecode = reader.bytes();
                break;
              case 3:
                message.abi = reader.string();
                break;
              case 4:
                message.authorizes_call_contract = reader.bool();
                break;
              case 5:
                message.authorizes_transaction_application = reader.bool();
                break;
              case 6:
                message.authorizes_upload_contract = reader.bool();
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes an upload_contract_operation message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.upload_contract_operation
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.upload_contract_operation} upload_contract_operation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        upload_contract_operation.decodeDelimited = function decodeDelimited(
          reader
        ) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an upload_contract_operation message.
         * @function verify
         * @memberof koinos.protocol.upload_contract_operation
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        upload_contract_operation.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (
            message.contract_id != null &&
            message.hasOwnProperty("contract_id")
          )
            if (
              !(
                (message.contract_id &&
                  typeof message.contract_id.length === "number") ||
                $util.isString(message.contract_id)
              )
            )
              return "contract_id: buffer expected";
          if (message.bytecode != null && message.hasOwnProperty("bytecode"))
            if (
              !(
                (message.bytecode &&
                  typeof message.bytecode.length === "number") ||
                $util.isString(message.bytecode)
              )
            )
              return "bytecode: buffer expected";
          if (message.abi != null && message.hasOwnProperty("abi"))
            if (!$util.isString(message.abi)) return "abi: string expected";
          if (
            message.authorizes_call_contract != null &&
            message.hasOwnProperty("authorizes_call_contract")
          )
            if (typeof message.authorizes_call_contract !== "boolean")
              return "authorizes_call_contract: boolean expected";
          if (
            message.authorizes_transaction_application != null &&
            message.hasOwnProperty("authorizes_transaction_application")
          )
            if (typeof message.authorizes_transaction_application !== "boolean")
              return "authorizes_transaction_application: boolean expected";
          if (
            message.authorizes_upload_contract != null &&
            message.hasOwnProperty("authorizes_upload_contract")
          )
            if (typeof message.authorizes_upload_contract !== "boolean")
              return "authorizes_upload_contract: boolean expected";
          return null;
        };

        /**
         * Creates an upload_contract_operation message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.upload_contract_operation
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.upload_contract_operation} upload_contract_operation
         */
        upload_contract_operation.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.upload_contract_operation)
            return object;
          var message = new $root.koinos.protocol.upload_contract_operation();
          if (object.contract_id != null)
            if (typeof object.contract_id === "string")
              $util.base64.decode(
                object.contract_id,
                (message.contract_id = $util.newBuffer(
                  $util.base64.length(object.contract_id)
                )),
                0
              );
            else if (object.contract_id.length)
              message.contract_id = object.contract_id;
          if (object.bytecode != null)
            if (typeof object.bytecode === "string")
              $util.base64.decode(
                object.bytecode,
                (message.bytecode = $util.newBuffer(
                  $util.base64.length(object.bytecode)
                )),
                0
              );
            else if (object.bytecode.length) message.bytecode = object.bytecode;
          if (object.abi != null) message.abi = String(object.abi);
          if (object.authorizes_call_contract != null)
            message.authorizes_call_contract = Boolean(
              object.authorizes_call_contract
            );
          if (object.authorizes_transaction_application != null)
            message.authorizes_transaction_application = Boolean(
              object.authorizes_transaction_application
            );
          if (object.authorizes_upload_contract != null)
            message.authorizes_upload_contract = Boolean(
              object.authorizes_upload_contract
            );
          return message;
        };

        /**
         * Creates a plain object from an upload_contract_operation message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.upload_contract_operation
         * @static
         * @param {koinos.protocol.upload_contract_operation} message upload_contract_operation
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        upload_contract_operation.toObject = function toObject(
          message,
          options
        ) {
          if (!options) options = {};
          var object = {};
          if (options.defaults) {
            if (options.bytes === String) object.contract_id = "";
            else {
              object.contract_id = [];
              if (options.bytes !== Array)
                object.contract_id = $util.newBuffer(object.contract_id);
            }
            if (options.bytes === String) object.bytecode = "";
            else {
              object.bytecode = [];
              if (options.bytes !== Array)
                object.bytecode = $util.newBuffer(object.bytecode);
            }
            object.abi = "";
            object.authorizes_call_contract = false;
            object.authorizes_transaction_application = false;
            object.authorizes_upload_contract = false;
          }
          if (
            message.contract_id != null &&
            message.hasOwnProperty("contract_id")
          )
            object.contract_id =
              options.bytes === String
                ? $util.base64.encode(
                    message.contract_id,
                    0,
                    message.contract_id.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.contract_id)
                : message.contract_id;
          if (message.bytecode != null && message.hasOwnProperty("bytecode"))
            object.bytecode =
              options.bytes === String
                ? $util.base64.encode(
                    message.bytecode,
                    0,
                    message.bytecode.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.bytecode)
                : message.bytecode;
          if (message.abi != null && message.hasOwnProperty("abi"))
            object.abi = message.abi;
          if (
            message.authorizes_call_contract != null &&
            message.hasOwnProperty("authorizes_call_contract")
          )
            object.authorizes_call_contract = message.authorizes_call_contract;
          if (
            message.authorizes_transaction_application != null &&
            message.hasOwnProperty("authorizes_transaction_application")
          )
            object.authorizes_transaction_application =
              message.authorizes_transaction_application;
          if (
            message.authorizes_upload_contract != null &&
            message.hasOwnProperty("authorizes_upload_contract")
          )
            object.authorizes_upload_contract =
              message.authorizes_upload_contract;
          return object;
        };

        /**
         * Converts this upload_contract_operation to JSON.
         * @function toJSON
         * @memberof koinos.protocol.upload_contract_operation
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        upload_contract_operation.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return upload_contract_operation;
      })();

      protocol.call_contract_operation = (function () {
        /**
         * Properties of a call_contract_operation.
         * @memberof koinos.protocol
         * @interface Icall_contract_operation
         * @property {Uint8Array|null} [contract_id] call_contract_operation contract_id
         * @property {number|null} [entry_point] call_contract_operation entry_point
         * @property {Uint8Array|null} [args] call_contract_operation args
         */

        /**
         * Constructs a new call_contract_operation.
         * @memberof koinos.protocol
         * @classdesc Represents a call_contract_operation.
         * @implements Icall_contract_operation
         * @constructor
         * @param {koinos.protocol.Icall_contract_operation=} [properties] Properties to set
         */
        function call_contract_operation(properties) {
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * call_contract_operation contract_id.
         * @member {Uint8Array} contract_id
         * @memberof koinos.protocol.call_contract_operation
         * @instance
         */
        call_contract_operation.prototype.contract_id = $util.newBuffer([]);

        /**
         * call_contract_operation entry_point.
         * @member {number} entry_point
         * @memberof koinos.protocol.call_contract_operation
         * @instance
         */
        call_contract_operation.prototype.entry_point = 0;

        /**
         * call_contract_operation args.
         * @member {Uint8Array} args
         * @memberof koinos.protocol.call_contract_operation
         * @instance
         */
        call_contract_operation.prototype.args = $util.newBuffer([]);

        /**
         * Creates a new call_contract_operation instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.call_contract_operation
         * @static
         * @param {koinos.protocol.Icall_contract_operation=} [properties] Properties to set
         * @returns {koinos.protocol.call_contract_operation} call_contract_operation instance
         */
        call_contract_operation.create = function create(properties) {
          return new call_contract_operation(properties);
        };

        /**
         * Encodes the specified call_contract_operation message. Does not implicitly {@link koinos.protocol.call_contract_operation.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.call_contract_operation
         * @static
         * @param {koinos.protocol.Icall_contract_operation} message call_contract_operation message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        call_contract_operation.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (
            message.contract_id != null &&
            Object.hasOwnProperty.call(message, "contract_id")
          )
            writer
              .uint32(/* id 1, wireType 2 =*/ 10)
              .bytes(message.contract_id);
          if (
            message.entry_point != null &&
            Object.hasOwnProperty.call(message, "entry_point")
          )
            writer
              .uint32(/* id 2, wireType 0 =*/ 16)
              .uint32(message.entry_point);
          if (
            message.args != null &&
            Object.hasOwnProperty.call(message, "args")
          )
            writer.uint32(/* id 3, wireType 2 =*/ 26).bytes(message.args);
          return writer;
        };

        /**
         * Encodes the specified call_contract_operation message, length delimited. Does not implicitly {@link koinos.protocol.call_contract_operation.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.call_contract_operation
         * @static
         * @param {koinos.protocol.Icall_contract_operation} message call_contract_operation message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        call_contract_operation.encodeDelimited = function encodeDelimited(
          message,
          writer
        ) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a call_contract_operation message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.call_contract_operation
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.call_contract_operation} call_contract_operation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        call_contract_operation.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.call_contract_operation();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.contract_id = reader.bytes();
                break;
              case 2:
                message.entry_point = reader.uint32();
                break;
              case 3:
                message.args = reader.bytes();
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a call_contract_operation message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.call_contract_operation
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.call_contract_operation} call_contract_operation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        call_contract_operation.decodeDelimited = function decodeDelimited(
          reader
        ) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a call_contract_operation message.
         * @function verify
         * @memberof koinos.protocol.call_contract_operation
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        call_contract_operation.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (
            message.contract_id != null &&
            message.hasOwnProperty("contract_id")
          )
            if (
              !(
                (message.contract_id &&
                  typeof message.contract_id.length === "number") ||
                $util.isString(message.contract_id)
              )
            )
              return "contract_id: buffer expected";
          if (
            message.entry_point != null &&
            message.hasOwnProperty("entry_point")
          )
            if (!$util.isInteger(message.entry_point))
              return "entry_point: integer expected";
          if (message.args != null && message.hasOwnProperty("args"))
            if (
              !(
                (message.args && typeof message.args.length === "number") ||
                $util.isString(message.args)
              )
            )
              return "args: buffer expected";
          return null;
        };

        /**
         * Creates a call_contract_operation message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.call_contract_operation
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.call_contract_operation} call_contract_operation
         */
        call_contract_operation.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.call_contract_operation)
            return object;
          var message = new $root.koinos.protocol.call_contract_operation();
          if (object.contract_id != null)
            if (typeof object.contract_id === "string")
              $util.base64.decode(
                object.contract_id,
                (message.contract_id = $util.newBuffer(
                  $util.base64.length(object.contract_id)
                )),
                0
              );
            else if (object.contract_id.length)
              message.contract_id = object.contract_id;
          if (object.entry_point != null)
            message.entry_point = object.entry_point >>> 0;
          if (object.args != null)
            if (typeof object.args === "string")
              $util.base64.decode(
                object.args,
                (message.args = $util.newBuffer(
                  $util.base64.length(object.args)
                )),
                0
              );
            else if (object.args.length) message.args = object.args;
          return message;
        };

        /**
         * Creates a plain object from a call_contract_operation message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.call_contract_operation
         * @static
         * @param {koinos.protocol.call_contract_operation} message call_contract_operation
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        call_contract_operation.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.defaults) {
            if (options.bytes === String) object.contract_id = "";
            else {
              object.contract_id = [];
              if (options.bytes !== Array)
                object.contract_id = $util.newBuffer(object.contract_id);
            }
            object.entry_point = 0;
            if (options.bytes === String) object.args = "";
            else {
              object.args = [];
              if (options.bytes !== Array)
                object.args = $util.newBuffer(object.args);
            }
          }
          if (
            message.contract_id != null &&
            message.hasOwnProperty("contract_id")
          )
            object.contract_id =
              options.bytes === String
                ? $util.base64.encode(
                    message.contract_id,
                    0,
                    message.contract_id.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.contract_id)
                : message.contract_id;
          if (
            message.entry_point != null &&
            message.hasOwnProperty("entry_point")
          )
            object.entry_point = message.entry_point;
          if (message.args != null && message.hasOwnProperty("args"))
            object.args =
              options.bytes === String
                ? $util.base64.encode(message.args, 0, message.args.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.args)
                : message.args;
          return object;
        };

        /**
         * Converts this call_contract_operation to JSON.
         * @function toJSON
         * @memberof koinos.protocol.call_contract_operation
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        call_contract_operation.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return call_contract_operation;
      })();

      protocol.set_system_call_operation = (function () {
        /**
         * Properties of a set_system_call_operation.
         * @memberof koinos.protocol
         * @interface Iset_system_call_operation
         * @property {number|null} [call_id] set_system_call_operation call_id
         * @property {koinos.protocol.Isystem_call_target|null} [target] set_system_call_operation target
         */

        /**
         * Constructs a new set_system_call_operation.
         * @memberof koinos.protocol
         * @classdesc Represents a set_system_call_operation.
         * @implements Iset_system_call_operation
         * @constructor
         * @param {koinos.protocol.Iset_system_call_operation=} [properties] Properties to set
         */
        function set_system_call_operation(properties) {
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * set_system_call_operation call_id.
         * @member {number} call_id
         * @memberof koinos.protocol.set_system_call_operation
         * @instance
         */
        set_system_call_operation.prototype.call_id = 0;

        /**
         * set_system_call_operation target.
         * @member {koinos.protocol.Isystem_call_target|null|undefined} target
         * @memberof koinos.protocol.set_system_call_operation
         * @instance
         */
        set_system_call_operation.prototype.target = null;

        /**
         * Creates a new set_system_call_operation instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.set_system_call_operation
         * @static
         * @param {koinos.protocol.Iset_system_call_operation=} [properties] Properties to set
         * @returns {koinos.protocol.set_system_call_operation} set_system_call_operation instance
         */
        set_system_call_operation.create = function create(properties) {
          return new set_system_call_operation(properties);
        };

        /**
         * Encodes the specified set_system_call_operation message. Does not implicitly {@link koinos.protocol.set_system_call_operation.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.set_system_call_operation
         * @static
         * @param {koinos.protocol.Iset_system_call_operation} message set_system_call_operation message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        set_system_call_operation.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (
            message.call_id != null &&
            Object.hasOwnProperty.call(message, "call_id")
          )
            writer.uint32(/* id 1, wireType 0 =*/ 8).uint32(message.call_id);
          if (
            message.target != null &&
            Object.hasOwnProperty.call(message, "target")
          )
            $root.koinos.protocol.system_call_target
              .encode(
                message.target,
                writer.uint32(/* id 2, wireType 2 =*/ 18).fork()
              )
              .ldelim();
          return writer;
        };

        /**
         * Encodes the specified set_system_call_operation message, length delimited. Does not implicitly {@link koinos.protocol.set_system_call_operation.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.set_system_call_operation
         * @static
         * @param {koinos.protocol.Iset_system_call_operation} message set_system_call_operation message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        set_system_call_operation.encodeDelimited = function encodeDelimited(
          message,
          writer
        ) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a set_system_call_operation message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.set_system_call_operation
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.set_system_call_operation} set_system_call_operation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        set_system_call_operation.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.set_system_call_operation();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.call_id = reader.uint32();
                break;
              case 2:
                message.target =
                  $root.koinos.protocol.system_call_target.decode(
                    reader,
                    reader.uint32()
                  );
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a set_system_call_operation message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.set_system_call_operation
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.set_system_call_operation} set_system_call_operation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        set_system_call_operation.decodeDelimited = function decodeDelimited(
          reader
        ) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a set_system_call_operation message.
         * @function verify
         * @memberof koinos.protocol.set_system_call_operation
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        set_system_call_operation.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (message.call_id != null && message.hasOwnProperty("call_id"))
            if (!$util.isInteger(message.call_id))
              return "call_id: integer expected";
          if (message.target != null && message.hasOwnProperty("target")) {
            var error = $root.koinos.protocol.system_call_target.verify(
              message.target
            );
            if (error) return "target." + error;
          }
          return null;
        };

        /**
         * Creates a set_system_call_operation message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.set_system_call_operation
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.set_system_call_operation} set_system_call_operation
         */
        set_system_call_operation.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.set_system_call_operation)
            return object;
          var message = new $root.koinos.protocol.set_system_call_operation();
          if (object.call_id != null) message.call_id = object.call_id >>> 0;
          if (object.target != null) {
            if (typeof object.target !== "object")
              throw TypeError(
                ".koinos.protocol.set_system_call_operation.target: object expected"
              );
            message.target =
              $root.koinos.protocol.system_call_target.fromObject(
                object.target
              );
          }
          return message;
        };

        /**
         * Creates a plain object from a set_system_call_operation message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.set_system_call_operation
         * @static
         * @param {koinos.protocol.set_system_call_operation} message set_system_call_operation
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        set_system_call_operation.toObject = function toObject(
          message,
          options
        ) {
          if (!options) options = {};
          var object = {};
          if (options.defaults) {
            object.call_id = 0;
            object.target = null;
          }
          if (message.call_id != null && message.hasOwnProperty("call_id"))
            object.call_id = message.call_id;
          if (message.target != null && message.hasOwnProperty("target"))
            object.target = $root.koinos.protocol.system_call_target.toObject(
              message.target,
              options
            );
          return object;
        };

        /**
         * Converts this set_system_call_operation to JSON.
         * @function toJSON
         * @memberof koinos.protocol.set_system_call_operation
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        set_system_call_operation.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return set_system_call_operation;
      })();

      protocol.set_system_contract_operation = (function () {
        /**
         * Properties of a set_system_contract_operation.
         * @memberof koinos.protocol
         * @interface Iset_system_contract_operation
         * @property {Uint8Array|null} [contract_id] set_system_contract_operation contract_id
         * @property {boolean|null} [system_contract] set_system_contract_operation system_contract
         */

        /**
         * Constructs a new set_system_contract_operation.
         * @memberof koinos.protocol
         * @classdesc Represents a set_system_contract_operation.
         * @implements Iset_system_contract_operation
         * @constructor
         * @param {koinos.protocol.Iset_system_contract_operation=} [properties] Properties to set
         */
        function set_system_contract_operation(properties) {
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * set_system_contract_operation contract_id.
         * @member {Uint8Array} contract_id
         * @memberof koinos.protocol.set_system_contract_operation
         * @instance
         */
        set_system_contract_operation.prototype.contract_id = $util.newBuffer(
          []
        );

        /**
         * set_system_contract_operation system_contract.
         * @member {boolean} system_contract
         * @memberof koinos.protocol.set_system_contract_operation
         * @instance
         */
        set_system_contract_operation.prototype.system_contract = false;

        /**
         * Creates a new set_system_contract_operation instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.set_system_contract_operation
         * @static
         * @param {koinos.protocol.Iset_system_contract_operation=} [properties] Properties to set
         * @returns {koinos.protocol.set_system_contract_operation} set_system_contract_operation instance
         */
        set_system_contract_operation.create = function create(properties) {
          return new set_system_contract_operation(properties);
        };

        /**
         * Encodes the specified set_system_contract_operation message. Does not implicitly {@link koinos.protocol.set_system_contract_operation.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.set_system_contract_operation
         * @static
         * @param {koinos.protocol.Iset_system_contract_operation} message set_system_contract_operation message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        set_system_contract_operation.encode = function encode(
          message,
          writer
        ) {
          if (!writer) writer = $Writer.create();
          if (
            message.contract_id != null &&
            Object.hasOwnProperty.call(message, "contract_id")
          )
            writer
              .uint32(/* id 1, wireType 2 =*/ 10)
              .bytes(message.contract_id);
          if (
            message.system_contract != null &&
            Object.hasOwnProperty.call(message, "system_contract")
          )
            writer
              .uint32(/* id 2, wireType 0 =*/ 16)
              .bool(message.system_contract);
          return writer;
        };

        /**
         * Encodes the specified set_system_contract_operation message, length delimited. Does not implicitly {@link koinos.protocol.set_system_contract_operation.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.set_system_contract_operation
         * @static
         * @param {koinos.protocol.Iset_system_contract_operation} message set_system_contract_operation message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        set_system_contract_operation.encodeDelimited =
          function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
          };

        /**
         * Decodes a set_system_contract_operation message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.set_system_contract_operation
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.set_system_contract_operation} set_system_contract_operation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        set_system_contract_operation.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.set_system_contract_operation();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.contract_id = reader.bytes();
                break;
              case 2:
                message.system_contract = reader.bool();
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a set_system_contract_operation message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.set_system_contract_operation
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.set_system_contract_operation} set_system_contract_operation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        set_system_contract_operation.decodeDelimited =
          function decodeDelimited(reader) {
            if (!(reader instanceof $Reader)) reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
          };

        /**
         * Verifies a set_system_contract_operation message.
         * @function verify
         * @memberof koinos.protocol.set_system_contract_operation
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        set_system_contract_operation.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (
            message.contract_id != null &&
            message.hasOwnProperty("contract_id")
          )
            if (
              !(
                (message.contract_id &&
                  typeof message.contract_id.length === "number") ||
                $util.isString(message.contract_id)
              )
            )
              return "contract_id: buffer expected";
          if (
            message.system_contract != null &&
            message.hasOwnProperty("system_contract")
          )
            if (typeof message.system_contract !== "boolean")
              return "system_contract: boolean expected";
          return null;
        };

        /**
         * Creates a set_system_contract_operation message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.set_system_contract_operation
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.set_system_contract_operation} set_system_contract_operation
         */
        set_system_contract_operation.fromObject = function fromObject(object) {
          if (
            object instanceof
            $root.koinos.protocol.set_system_contract_operation
          )
            return object;
          var message =
            new $root.koinos.protocol.set_system_contract_operation();
          if (object.contract_id != null)
            if (typeof object.contract_id === "string")
              $util.base64.decode(
                object.contract_id,
                (message.contract_id = $util.newBuffer(
                  $util.base64.length(object.contract_id)
                )),
                0
              );
            else if (object.contract_id.length)
              message.contract_id = object.contract_id;
          if (object.system_contract != null)
            message.system_contract = Boolean(object.system_contract);
          return message;
        };

        /**
         * Creates a plain object from a set_system_contract_operation message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.set_system_contract_operation
         * @static
         * @param {koinos.protocol.set_system_contract_operation} message set_system_contract_operation
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        set_system_contract_operation.toObject = function toObject(
          message,
          options
        ) {
          if (!options) options = {};
          var object = {};
          if (options.defaults) {
            if (options.bytes === String) object.contract_id = "";
            else {
              object.contract_id = [];
              if (options.bytes !== Array)
                object.contract_id = $util.newBuffer(object.contract_id);
            }
            object.system_contract = false;
          }
          if (
            message.contract_id != null &&
            message.hasOwnProperty("contract_id")
          )
            object.contract_id =
              options.bytes === String
                ? $util.base64.encode(
                    message.contract_id,
                    0,
                    message.contract_id.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.contract_id)
                : message.contract_id;
          if (
            message.system_contract != null &&
            message.hasOwnProperty("system_contract")
          )
            object.system_contract = message.system_contract;
          return object;
        };

        /**
         * Converts this set_system_contract_operation to JSON.
         * @function toJSON
         * @memberof koinos.protocol.set_system_contract_operation
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        set_system_contract_operation.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return set_system_contract_operation;
      })();

      protocol.operation = (function () {
        /**
         * Properties of an operation.
         * @memberof koinos.protocol
         * @interface Ioperation
         * @property {koinos.protocol.Iupload_contract_operation|null} [upload_contract] operation upload_contract
         * @property {koinos.protocol.Icall_contract_operation|null} [call_contract] operation call_contract
         * @property {koinos.protocol.Iset_system_call_operation|null} [set_system_call] operation set_system_call
         * @property {koinos.protocol.Iset_system_contract_operation|null} [set_system_contract] operation set_system_contract
         */

        /**
         * Constructs a new operation.
         * @memberof koinos.protocol
         * @classdesc Represents an operation.
         * @implements Ioperation
         * @constructor
         * @param {koinos.protocol.Ioperation=} [properties] Properties to set
         */
        function operation(properties) {
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * operation upload_contract.
         * @member {koinos.protocol.Iupload_contract_operation|null|undefined} upload_contract
         * @memberof koinos.protocol.operation
         * @instance
         */
        operation.prototype.upload_contract = null;

        /**
         * operation call_contract.
         * @member {koinos.protocol.Icall_contract_operation|null|undefined} call_contract
         * @memberof koinos.protocol.operation
         * @instance
         */
        operation.prototype.call_contract = null;

        /**
         * operation set_system_call.
         * @member {koinos.protocol.Iset_system_call_operation|null|undefined} set_system_call
         * @memberof koinos.protocol.operation
         * @instance
         */
        operation.prototype.set_system_call = null;

        /**
         * operation set_system_contract.
         * @member {koinos.protocol.Iset_system_contract_operation|null|undefined} set_system_contract
         * @memberof koinos.protocol.operation
         * @instance
         */
        operation.prototype.set_system_contract = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * operation op.
         * @member {"upload_contract"|"call_contract"|"set_system_call"|"set_system_contract"|undefined} op
         * @memberof koinos.protocol.operation
         * @instance
         */
        Object.defineProperty(operation.prototype, "op", {
          get: $util.oneOfGetter(
            ($oneOfFields = [
              "upload_contract",
              "call_contract",
              "set_system_call",
              "set_system_contract",
            ])
          ),
          set: $util.oneOfSetter($oneOfFields),
        });

        /**
         * Creates a new operation instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.operation
         * @static
         * @param {koinos.protocol.Ioperation=} [properties] Properties to set
         * @returns {koinos.protocol.operation} operation instance
         */
        operation.create = function create(properties) {
          return new operation(properties);
        };

        /**
         * Encodes the specified operation message. Does not implicitly {@link koinos.protocol.operation.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.operation
         * @static
         * @param {koinos.protocol.Ioperation} message operation message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        operation.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (
            message.upload_contract != null &&
            Object.hasOwnProperty.call(message, "upload_contract")
          )
            $root.koinos.protocol.upload_contract_operation
              .encode(
                message.upload_contract,
                writer.uint32(/* id 1, wireType 2 =*/ 10).fork()
              )
              .ldelim();
          if (
            message.call_contract != null &&
            Object.hasOwnProperty.call(message, "call_contract")
          )
            $root.koinos.protocol.call_contract_operation
              .encode(
                message.call_contract,
                writer.uint32(/* id 2, wireType 2 =*/ 18).fork()
              )
              .ldelim();
          if (
            message.set_system_call != null &&
            Object.hasOwnProperty.call(message, "set_system_call")
          )
            $root.koinos.protocol.set_system_call_operation
              .encode(
                message.set_system_call,
                writer.uint32(/* id 3, wireType 2 =*/ 26).fork()
              )
              .ldelim();
          if (
            message.set_system_contract != null &&
            Object.hasOwnProperty.call(message, "set_system_contract")
          )
            $root.koinos.protocol.set_system_contract_operation
              .encode(
                message.set_system_contract,
                writer.uint32(/* id 4, wireType 2 =*/ 34).fork()
              )
              .ldelim();
          return writer;
        };

        /**
         * Encodes the specified operation message, length delimited. Does not implicitly {@link koinos.protocol.operation.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.operation
         * @static
         * @param {koinos.protocol.Ioperation} message operation message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        operation.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an operation message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.operation
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.operation} operation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        operation.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.operation();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.upload_contract =
                  $root.koinos.protocol.upload_contract_operation.decode(
                    reader,
                    reader.uint32()
                  );
                break;
              case 2:
                message.call_contract =
                  $root.koinos.protocol.call_contract_operation.decode(
                    reader,
                    reader.uint32()
                  );
                break;
              case 3:
                message.set_system_call =
                  $root.koinos.protocol.set_system_call_operation.decode(
                    reader,
                    reader.uint32()
                  );
                break;
              case 4:
                message.set_system_contract =
                  $root.koinos.protocol.set_system_contract_operation.decode(
                    reader,
                    reader.uint32()
                  );
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes an operation message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.operation
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.operation} operation
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        operation.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an operation message.
         * @function verify
         * @memberof koinos.protocol.operation
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        operation.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          var properties = {};
          if (
            message.upload_contract != null &&
            message.hasOwnProperty("upload_contract")
          ) {
            properties.op = 1;
            {
              var error =
                $root.koinos.protocol.upload_contract_operation.verify(
                  message.upload_contract
                );
              if (error) return "upload_contract." + error;
            }
          }
          if (
            message.call_contract != null &&
            message.hasOwnProperty("call_contract")
          ) {
            if (properties.op === 1) return "op: multiple values";
            properties.op = 1;
            {
              var error = $root.koinos.protocol.call_contract_operation.verify(
                message.call_contract
              );
              if (error) return "call_contract." + error;
            }
          }
          if (
            message.set_system_call != null &&
            message.hasOwnProperty("set_system_call")
          ) {
            if (properties.op === 1) return "op: multiple values";
            properties.op = 1;
            {
              var error =
                $root.koinos.protocol.set_system_call_operation.verify(
                  message.set_system_call
                );
              if (error) return "set_system_call." + error;
            }
          }
          if (
            message.set_system_contract != null &&
            message.hasOwnProperty("set_system_contract")
          ) {
            if (properties.op === 1) return "op: multiple values";
            properties.op = 1;
            {
              var error =
                $root.koinos.protocol.set_system_contract_operation.verify(
                  message.set_system_contract
                );
              if (error) return "set_system_contract." + error;
            }
          }
          return null;
        };

        /**
         * Creates an operation message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.operation
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.operation} operation
         */
        operation.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.operation) return object;
          var message = new $root.koinos.protocol.operation();
          if (object.upload_contract != null) {
            if (typeof object.upload_contract !== "object")
              throw TypeError(
                ".koinos.protocol.operation.upload_contract: object expected"
              );
            message.upload_contract =
              $root.koinos.protocol.upload_contract_operation.fromObject(
                object.upload_contract
              );
          }
          if (object.call_contract != null) {
            if (typeof object.call_contract !== "object")
              throw TypeError(
                ".koinos.protocol.operation.call_contract: object expected"
              );
            message.call_contract =
              $root.koinos.protocol.call_contract_operation.fromObject(
                object.call_contract
              );
          }
          if (object.set_system_call != null) {
            if (typeof object.set_system_call !== "object")
              throw TypeError(
                ".koinos.protocol.operation.set_system_call: object expected"
              );
            message.set_system_call =
              $root.koinos.protocol.set_system_call_operation.fromObject(
                object.set_system_call
              );
          }
          if (object.set_system_contract != null) {
            if (typeof object.set_system_contract !== "object")
              throw TypeError(
                ".koinos.protocol.operation.set_system_contract: object expected"
              );
            message.set_system_contract =
              $root.koinos.protocol.set_system_contract_operation.fromObject(
                object.set_system_contract
              );
          }
          return message;
        };

        /**
         * Creates a plain object from an operation message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.operation
         * @static
         * @param {koinos.protocol.operation} message operation
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        operation.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (
            message.upload_contract != null &&
            message.hasOwnProperty("upload_contract")
          ) {
            object.upload_contract =
              $root.koinos.protocol.upload_contract_operation.toObject(
                message.upload_contract,
                options
              );
            if (options.oneofs) object.op = "upload_contract";
          }
          if (
            message.call_contract != null &&
            message.hasOwnProperty("call_contract")
          ) {
            object.call_contract =
              $root.koinos.protocol.call_contract_operation.toObject(
                message.call_contract,
                options
              );
            if (options.oneofs) object.op = "call_contract";
          }
          if (
            message.set_system_call != null &&
            message.hasOwnProperty("set_system_call")
          ) {
            object.set_system_call =
              $root.koinos.protocol.set_system_call_operation.toObject(
                message.set_system_call,
                options
              );
            if (options.oneofs) object.op = "set_system_call";
          }
          if (
            message.set_system_contract != null &&
            message.hasOwnProperty("set_system_contract")
          ) {
            object.set_system_contract =
              $root.koinos.protocol.set_system_contract_operation.toObject(
                message.set_system_contract,
                options
              );
            if (options.oneofs) object.op = "set_system_contract";
          }
          return object;
        };

        /**
         * Converts this operation to JSON.
         * @function toJSON
         * @memberof koinos.protocol.operation
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        operation.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return operation;
      })();

      protocol.transaction_header = (function () {
        /**
         * Properties of a transaction_header.
         * @memberof koinos.protocol
         * @interface Itransaction_header
         * @property {Uint8Array|null} [chain_id] transaction_header chain_id
         * @property {number|Long|null} [rc_limit] transaction_header rc_limit
         * @property {Uint8Array|null} [nonce] transaction_header nonce
         * @property {Uint8Array|null} [operation_merkle_root] transaction_header operation_merkle_root
         * @property {Uint8Array|null} [payer] transaction_header payer
         * @property {Uint8Array|null} [payee] transaction_header payee
         */

        /**
         * Constructs a new transaction_header.
         * @memberof koinos.protocol
         * @classdesc Represents a transaction_header.
         * @implements Itransaction_header
         * @constructor
         * @param {koinos.protocol.Itransaction_header=} [properties] Properties to set
         */
        function transaction_header(properties) {
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * transaction_header chain_id.
         * @member {Uint8Array} chain_id
         * @memberof koinos.protocol.transaction_header
         * @instance
         */
        transaction_header.prototype.chain_id = $util.newBuffer([]);

        /**
         * transaction_header rc_limit.
         * @member {number|Long} rc_limit
         * @memberof koinos.protocol.transaction_header
         * @instance
         */
        transaction_header.prototype.rc_limit = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * transaction_header nonce.
         * @member {Uint8Array} nonce
         * @memberof koinos.protocol.transaction_header
         * @instance
         */
        transaction_header.prototype.nonce = $util.newBuffer([]);

        /**
         * transaction_header operation_merkle_root.
         * @member {Uint8Array} operation_merkle_root
         * @memberof koinos.protocol.transaction_header
         * @instance
         */
        transaction_header.prototype.operation_merkle_root = $util.newBuffer(
          []
        );

        /**
         * transaction_header payer.
         * @member {Uint8Array} payer
         * @memberof koinos.protocol.transaction_header
         * @instance
         */
        transaction_header.prototype.payer = $util.newBuffer([]);

        /**
         * transaction_header payee.
         * @member {Uint8Array} payee
         * @memberof koinos.protocol.transaction_header
         * @instance
         */
        transaction_header.prototype.payee = $util.newBuffer([]);

        /**
         * Creates a new transaction_header instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.transaction_header
         * @static
         * @param {koinos.protocol.Itransaction_header=} [properties] Properties to set
         * @returns {koinos.protocol.transaction_header} transaction_header instance
         */
        transaction_header.create = function create(properties) {
          return new transaction_header(properties);
        };

        /**
         * Encodes the specified transaction_header message. Does not implicitly {@link koinos.protocol.transaction_header.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.transaction_header
         * @static
         * @param {koinos.protocol.Itransaction_header} message transaction_header message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        transaction_header.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (
            message.chain_id != null &&
            Object.hasOwnProperty.call(message, "chain_id")
          )
            writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.chain_id);
          if (
            message.rc_limit != null &&
            Object.hasOwnProperty.call(message, "rc_limit")
          )
            writer.uint32(/* id 2, wireType 0 =*/ 16).uint64(message.rc_limit);
          if (
            message.nonce != null &&
            Object.hasOwnProperty.call(message, "nonce")
          )
            writer.uint32(/* id 3, wireType 2 =*/ 26).bytes(message.nonce);
          if (
            message.operation_merkle_root != null &&
            Object.hasOwnProperty.call(message, "operation_merkle_root")
          )
            writer
              .uint32(/* id 4, wireType 2 =*/ 34)
              .bytes(message.operation_merkle_root);
          if (
            message.payer != null &&
            Object.hasOwnProperty.call(message, "payer")
          )
            writer.uint32(/* id 5, wireType 2 =*/ 42).bytes(message.payer);
          if (
            message.payee != null &&
            Object.hasOwnProperty.call(message, "payee")
          )
            writer.uint32(/* id 6, wireType 2 =*/ 50).bytes(message.payee);
          return writer;
        };

        /**
         * Encodes the specified transaction_header message, length delimited. Does not implicitly {@link koinos.protocol.transaction_header.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.transaction_header
         * @static
         * @param {koinos.protocol.Itransaction_header} message transaction_header message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        transaction_header.encodeDelimited = function encodeDelimited(
          message,
          writer
        ) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a transaction_header message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.transaction_header
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.transaction_header} transaction_header
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        transaction_header.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.transaction_header();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.chain_id = reader.bytes();
                break;
              case 2:
                message.rc_limit = reader.uint64();
                break;
              case 3:
                message.nonce = reader.bytes();
                break;
              case 4:
                message.operation_merkle_root = reader.bytes();
                break;
              case 5:
                message.payer = reader.bytes();
                break;
              case 6:
                message.payee = reader.bytes();
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a transaction_header message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.transaction_header
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.transaction_header} transaction_header
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        transaction_header.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a transaction_header message.
         * @function verify
         * @memberof koinos.protocol.transaction_header
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        transaction_header.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (message.chain_id != null && message.hasOwnProperty("chain_id"))
            if (
              !(
                (message.chain_id &&
                  typeof message.chain_id.length === "number") ||
                $util.isString(message.chain_id)
              )
            )
              return "chain_id: buffer expected";
          if (message.rc_limit != null && message.hasOwnProperty("rc_limit"))
            if (
              !$util.isInteger(message.rc_limit) &&
              !(
                message.rc_limit &&
                $util.isInteger(message.rc_limit.low) &&
                $util.isInteger(message.rc_limit.high)
              )
            )
              return "rc_limit: integer|Long expected";
          if (message.nonce != null && message.hasOwnProperty("nonce"))
            if (
              !(
                (message.nonce && typeof message.nonce.length === "number") ||
                $util.isString(message.nonce)
              )
            )
              return "nonce: buffer expected";
          if (
            message.operation_merkle_root != null &&
            message.hasOwnProperty("operation_merkle_root")
          )
            if (
              !(
                (message.operation_merkle_root &&
                  typeof message.operation_merkle_root.length === "number") ||
                $util.isString(message.operation_merkle_root)
              )
            )
              return "operation_merkle_root: buffer expected";
          if (message.payer != null && message.hasOwnProperty("payer"))
            if (
              !(
                (message.payer && typeof message.payer.length === "number") ||
                $util.isString(message.payer)
              )
            )
              return "payer: buffer expected";
          if (message.payee != null && message.hasOwnProperty("payee"))
            if (
              !(
                (message.payee && typeof message.payee.length === "number") ||
                $util.isString(message.payee)
              )
            )
              return "payee: buffer expected";
          return null;
        };

        /**
         * Creates a transaction_header message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.transaction_header
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.transaction_header} transaction_header
         */
        transaction_header.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.transaction_header)
            return object;
          var message = new $root.koinos.protocol.transaction_header();
          if (object.chain_id != null)
            if (typeof object.chain_id === "string")
              $util.base64.decode(
                object.chain_id,
                (message.chain_id = $util.newBuffer(
                  $util.base64.length(object.chain_id)
                )),
                0
              );
            else if (object.chain_id.length) message.chain_id = object.chain_id;
          if (object.rc_limit != null)
            if ($util.Long)
              (message.rc_limit = $util.Long.fromValue(
                object.rc_limit
              )).unsigned = true;
            else if (typeof object.rc_limit === "string")
              message.rc_limit = parseInt(object.rc_limit, 10);
            else if (typeof object.rc_limit === "number")
              message.rc_limit = object.rc_limit;
            else if (typeof object.rc_limit === "object")
              message.rc_limit = new $util.LongBits(
                object.rc_limit.low >>> 0,
                object.rc_limit.high >>> 0
              ).toNumber(true);
          if (object.nonce != null)
            if (typeof object.nonce === "string")
              $util.base64.decode(
                object.nonce,
                (message.nonce = $util.newBuffer(
                  $util.base64.length(object.nonce)
                )),
                0
              );
            else if (object.nonce.length) message.nonce = object.nonce;
          if (object.operation_merkle_root != null)
            if (typeof object.operation_merkle_root === "string")
              $util.base64.decode(
                object.operation_merkle_root,
                (message.operation_merkle_root = $util.newBuffer(
                  $util.base64.length(object.operation_merkle_root)
                )),
                0
              );
            else if (object.operation_merkle_root.length)
              message.operation_merkle_root = object.operation_merkle_root;
          if (object.payer != null)
            if (typeof object.payer === "string")
              $util.base64.decode(
                object.payer,
                (message.payer = $util.newBuffer(
                  $util.base64.length(object.payer)
                )),
                0
              );
            else if (object.payer.length) message.payer = object.payer;
          if (object.payee != null)
            if (typeof object.payee === "string")
              $util.base64.decode(
                object.payee,
                (message.payee = $util.newBuffer(
                  $util.base64.length(object.payee)
                )),
                0
              );
            else if (object.payee.length) message.payee = object.payee;
          return message;
        };

        /**
         * Creates a plain object from a transaction_header message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.transaction_header
         * @static
         * @param {koinos.protocol.transaction_header} message transaction_header
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        transaction_header.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.defaults) {
            if (options.bytes === String) object.chain_id = "";
            else {
              object.chain_id = [];
              if (options.bytes !== Array)
                object.chain_id = $util.newBuffer(object.chain_id);
            }
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.rc_limit =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else object.rc_limit = options.longs === String ? "0" : 0;
            if (options.bytes === String) object.nonce = "";
            else {
              object.nonce = [];
              if (options.bytes !== Array)
                object.nonce = $util.newBuffer(object.nonce);
            }
            if (options.bytes === String) object.operation_merkle_root = "";
            else {
              object.operation_merkle_root = [];
              if (options.bytes !== Array)
                object.operation_merkle_root = $util.newBuffer(
                  object.operation_merkle_root
                );
            }
            if (options.bytes === String) object.payer = "";
            else {
              object.payer = [];
              if (options.bytes !== Array)
                object.payer = $util.newBuffer(object.payer);
            }
            if (options.bytes === String) object.payee = "";
            else {
              object.payee = [];
              if (options.bytes !== Array)
                object.payee = $util.newBuffer(object.payee);
            }
          }
          if (message.chain_id != null && message.hasOwnProperty("chain_id"))
            object.chain_id =
              options.bytes === String
                ? $util.base64.encode(
                    message.chain_id,
                    0,
                    message.chain_id.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.chain_id)
                : message.chain_id;
          if (message.rc_limit != null && message.hasOwnProperty("rc_limit"))
            if (typeof message.rc_limit === "number")
              object.rc_limit =
                options.longs === String
                  ? String(message.rc_limit)
                  : message.rc_limit;
            else
              object.rc_limit =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.rc_limit)
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.rc_limit.low >>> 0,
                      message.rc_limit.high >>> 0
                    ).toNumber(true)
                  : message.rc_limit;
          if (message.nonce != null && message.hasOwnProperty("nonce"))
            object.nonce =
              options.bytes === String
                ? $util.base64.encode(message.nonce, 0, message.nonce.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.nonce)
                : message.nonce;
          if (
            message.operation_merkle_root != null &&
            message.hasOwnProperty("operation_merkle_root")
          )
            object.operation_merkle_root =
              options.bytes === String
                ? $util.base64.encode(
                    message.operation_merkle_root,
                    0,
                    message.operation_merkle_root.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.operation_merkle_root)
                : message.operation_merkle_root;
          if (message.payer != null && message.hasOwnProperty("payer"))
            object.payer =
              options.bytes === String
                ? $util.base64.encode(message.payer, 0, message.payer.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.payer)
                : message.payer;
          if (message.payee != null && message.hasOwnProperty("payee"))
            object.payee =
              options.bytes === String
                ? $util.base64.encode(message.payee, 0, message.payee.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.payee)
                : message.payee;
          return object;
        };

        /**
         * Converts this transaction_header to JSON.
         * @function toJSON
         * @memberof koinos.protocol.transaction_header
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        transaction_header.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return transaction_header;
      })();

      protocol.transaction = (function () {
        /**
         * Properties of a transaction.
         * @memberof koinos.protocol
         * @interface Itransaction
         * @property {Uint8Array|null} [id] transaction id
         * @property {koinos.protocol.Itransaction_header|null} [header] transaction header
         * @property {Array.<koinos.protocol.Ioperation>|null} [operations] transaction operations
         * @property {Array.<Uint8Array>|null} [signatures] transaction signatures
         */

        /**
         * Constructs a new transaction.
         * @memberof koinos.protocol
         * @classdesc Represents a transaction.
         * @implements Itransaction
         * @constructor
         * @param {koinos.protocol.Itransaction=} [properties] Properties to set
         */
        function transaction(properties) {
          this.operations = [];
          this.signatures = [];
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * transaction id.
         * @member {Uint8Array} id
         * @memberof koinos.protocol.transaction
         * @instance
         */
        transaction.prototype.id = $util.newBuffer([]);

        /**
         * transaction header.
         * @member {koinos.protocol.Itransaction_header|null|undefined} header
         * @memberof koinos.protocol.transaction
         * @instance
         */
        transaction.prototype.header = null;

        /**
         * transaction operations.
         * @member {Array.<koinos.protocol.Ioperation>} operations
         * @memberof koinos.protocol.transaction
         * @instance
         */
        transaction.prototype.operations = $util.emptyArray;

        /**
         * transaction signatures.
         * @member {Array.<Uint8Array>} signatures
         * @memberof koinos.protocol.transaction
         * @instance
         */
        transaction.prototype.signatures = $util.emptyArray;

        /**
         * Creates a new transaction instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.transaction
         * @static
         * @param {koinos.protocol.Itransaction=} [properties] Properties to set
         * @returns {koinos.protocol.transaction} transaction instance
         */
        transaction.create = function create(properties) {
          return new transaction(properties);
        };

        /**
         * Encodes the specified transaction message. Does not implicitly {@link koinos.protocol.transaction.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.transaction
         * @static
         * @param {koinos.protocol.Itransaction} message transaction message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        transaction.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.id);
          if (
            message.header != null &&
            Object.hasOwnProperty.call(message, "header")
          )
            $root.koinos.protocol.transaction_header
              .encode(
                message.header,
                writer.uint32(/* id 2, wireType 2 =*/ 18).fork()
              )
              .ldelim();
          if (message.operations != null && message.operations.length)
            for (var i = 0; i < message.operations.length; ++i)
              $root.koinos.protocol.operation
                .encode(
                  message.operations[i],
                  writer.uint32(/* id 3, wireType 2 =*/ 26).fork()
                )
                .ldelim();
          if (message.signatures != null && message.signatures.length)
            for (var i = 0; i < message.signatures.length; ++i)
              writer
                .uint32(/* id 4, wireType 2 =*/ 34)
                .bytes(message.signatures[i]);
          return writer;
        };

        /**
         * Encodes the specified transaction message, length delimited. Does not implicitly {@link koinos.protocol.transaction.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.transaction
         * @static
         * @param {koinos.protocol.Itransaction} message transaction message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        transaction.encodeDelimited = function encodeDelimited(
          message,
          writer
        ) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a transaction message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.transaction
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.transaction} transaction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        transaction.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.transaction();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.id = reader.bytes();
                break;
              case 2:
                message.header =
                  $root.koinos.protocol.transaction_header.decode(
                    reader,
                    reader.uint32()
                  );
                break;
              case 3:
                if (!(message.operations && message.operations.length))
                  message.operations = [];
                message.operations.push(
                  $root.koinos.protocol.operation.decode(
                    reader,
                    reader.uint32()
                  )
                );
                break;
              case 4:
                if (!(message.signatures && message.signatures.length))
                  message.signatures = [];
                message.signatures.push(reader.bytes());
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a transaction message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.transaction
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.transaction} transaction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        transaction.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a transaction message.
         * @function verify
         * @memberof koinos.protocol.transaction
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        transaction.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (message.id != null && message.hasOwnProperty("id"))
            if (
              !(
                (message.id && typeof message.id.length === "number") ||
                $util.isString(message.id)
              )
            )
              return "id: buffer expected";
          if (message.header != null && message.hasOwnProperty("header")) {
            var error = $root.koinos.protocol.transaction_header.verify(
              message.header
            );
            if (error) return "header." + error;
          }
          if (
            message.operations != null &&
            message.hasOwnProperty("operations")
          ) {
            if (!Array.isArray(message.operations))
              return "operations: array expected";
            for (var i = 0; i < message.operations.length; ++i) {
              var error = $root.koinos.protocol.operation.verify(
                message.operations[i]
              );
              if (error) return "operations." + error;
            }
          }
          if (
            message.signatures != null &&
            message.hasOwnProperty("signatures")
          ) {
            if (!Array.isArray(message.signatures))
              return "signatures: array expected";
            for (var i = 0; i < message.signatures.length; ++i)
              if (
                !(
                  (message.signatures[i] &&
                    typeof message.signatures[i].length === "number") ||
                  $util.isString(message.signatures[i])
                )
              )
                return "signatures: buffer[] expected";
          }
          return null;
        };

        /**
         * Creates a transaction message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.transaction
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.transaction} transaction
         */
        transaction.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.transaction)
            return object;
          var message = new $root.koinos.protocol.transaction();
          if (object.id != null)
            if (typeof object.id === "string")
              $util.base64.decode(
                object.id,
                (message.id = $util.newBuffer($util.base64.length(object.id))),
                0
              );
            else if (object.id.length) message.id = object.id;
          if (object.header != null) {
            if (typeof object.header !== "object")
              throw TypeError(
                ".koinos.protocol.transaction.header: object expected"
              );
            message.header =
              $root.koinos.protocol.transaction_header.fromObject(
                object.header
              );
          }
          if (object.operations) {
            if (!Array.isArray(object.operations))
              throw TypeError(
                ".koinos.protocol.transaction.operations: array expected"
              );
            message.operations = [];
            for (var i = 0; i < object.operations.length; ++i) {
              if (typeof object.operations[i] !== "object")
                throw TypeError(
                  ".koinos.protocol.transaction.operations: object expected"
                );
              message.operations[i] =
                $root.koinos.protocol.operation.fromObject(
                  object.operations[i]
                );
            }
          }
          if (object.signatures) {
            if (!Array.isArray(object.signatures))
              throw TypeError(
                ".koinos.protocol.transaction.signatures: array expected"
              );
            message.signatures = [];
            for (var i = 0; i < object.signatures.length; ++i)
              if (typeof object.signatures[i] === "string")
                $util.base64.decode(
                  object.signatures[i],
                  (message.signatures[i] = $util.newBuffer(
                    $util.base64.length(object.signatures[i])
                  )),
                  0
                );
              else if (object.signatures[i].length)
                message.signatures[i] = object.signatures[i];
          }
          return message;
        };

        /**
         * Creates a plain object from a transaction message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.transaction
         * @static
         * @param {koinos.protocol.transaction} message transaction
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        transaction.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.arrays || options.defaults) {
            object.operations = [];
            object.signatures = [];
          }
          if (options.defaults) {
            if (options.bytes === String) object.id = "";
            else {
              object.id = [];
              if (options.bytes !== Array)
                object.id = $util.newBuffer(object.id);
            }
            object.header = null;
          }
          if (message.id != null && message.hasOwnProperty("id"))
            object.id =
              options.bytes === String
                ? $util.base64.encode(message.id, 0, message.id.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.id)
                : message.id;
          if (message.header != null && message.hasOwnProperty("header"))
            object.header = $root.koinos.protocol.transaction_header.toObject(
              message.header,
              options
            );
          if (message.operations && message.operations.length) {
            object.operations = [];
            for (var j = 0; j < message.operations.length; ++j)
              object.operations[j] = $root.koinos.protocol.operation.toObject(
                message.operations[j],
                options
              );
          }
          if (message.signatures && message.signatures.length) {
            object.signatures = [];
            for (var j = 0; j < message.signatures.length; ++j)
              object.signatures[j] =
                options.bytes === String
                  ? $util.base64.encode(
                      message.signatures[j],
                      0,
                      message.signatures[j].length
                    )
                  : options.bytes === Array
                  ? Array.prototype.slice.call(message.signatures[j])
                  : message.signatures[j];
          }
          return object;
        };

        /**
         * Converts this transaction to JSON.
         * @function toJSON
         * @memberof koinos.protocol.transaction
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        transaction.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return transaction;
      })();

      protocol.transaction_receipt = (function () {
        /**
         * Properties of a transaction_receipt.
         * @memberof koinos.protocol
         * @interface Itransaction_receipt
         * @property {Uint8Array|null} [id] transaction_receipt id
         * @property {Uint8Array|null} [payer] transaction_receipt payer
         * @property {number|Long|null} [max_payer_rc] transaction_receipt max_payer_rc
         * @property {number|Long|null} [rc_limit] transaction_receipt rc_limit
         * @property {number|Long|null} [rc_used] transaction_receipt rc_used
         * @property {number|Long|null} [disk_storage_used] transaction_receipt disk_storage_used
         * @property {number|Long|null} [network_bandwidth_used] transaction_receipt network_bandwidth_used
         * @property {number|Long|null} [compute_bandwidth_used] transaction_receipt compute_bandwidth_used
         * @property {boolean|null} [reverted] transaction_receipt reverted
         * @property {Array.<koinos.protocol.Ievent_data>|null} [events] transaction_receipt events
         * @property {Array.<string>|null} [logs] transaction_receipt logs
         */

        /**
         * Constructs a new transaction_receipt.
         * @memberof koinos.protocol
         * @classdesc Represents a transaction_receipt.
         * @implements Itransaction_receipt
         * @constructor
         * @param {koinos.protocol.Itransaction_receipt=} [properties] Properties to set
         */
        function transaction_receipt(properties) {
          this.events = [];
          this.logs = [];
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * transaction_receipt id.
         * @member {Uint8Array} id
         * @memberof koinos.protocol.transaction_receipt
         * @instance
         */
        transaction_receipt.prototype.id = $util.newBuffer([]);

        /**
         * transaction_receipt payer.
         * @member {Uint8Array} payer
         * @memberof koinos.protocol.transaction_receipt
         * @instance
         */
        transaction_receipt.prototype.payer = $util.newBuffer([]);

        /**
         * transaction_receipt max_payer_rc.
         * @member {number|Long} max_payer_rc
         * @memberof koinos.protocol.transaction_receipt
         * @instance
         */
        transaction_receipt.prototype.max_payer_rc = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * transaction_receipt rc_limit.
         * @member {number|Long} rc_limit
         * @memberof koinos.protocol.transaction_receipt
         * @instance
         */
        transaction_receipt.prototype.rc_limit = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * transaction_receipt rc_used.
         * @member {number|Long} rc_used
         * @memberof koinos.protocol.transaction_receipt
         * @instance
         */
        transaction_receipt.prototype.rc_used = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * transaction_receipt disk_storage_used.
         * @member {number|Long} disk_storage_used
         * @memberof koinos.protocol.transaction_receipt
         * @instance
         */
        transaction_receipt.prototype.disk_storage_used = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * transaction_receipt network_bandwidth_used.
         * @member {number|Long} network_bandwidth_used
         * @memberof koinos.protocol.transaction_receipt
         * @instance
         */
        transaction_receipt.prototype.network_bandwidth_used = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * transaction_receipt compute_bandwidth_used.
         * @member {number|Long} compute_bandwidth_used
         * @memberof koinos.protocol.transaction_receipt
         * @instance
         */
        transaction_receipt.prototype.compute_bandwidth_used = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * transaction_receipt reverted.
         * @member {boolean} reverted
         * @memberof koinos.protocol.transaction_receipt
         * @instance
         */
        transaction_receipt.prototype.reverted = false;

        /**
         * transaction_receipt events.
         * @member {Array.<koinos.protocol.Ievent_data>} events
         * @memberof koinos.protocol.transaction_receipt
         * @instance
         */
        transaction_receipt.prototype.events = $util.emptyArray;

        /**
         * transaction_receipt logs.
         * @member {Array.<string>} logs
         * @memberof koinos.protocol.transaction_receipt
         * @instance
         */
        transaction_receipt.prototype.logs = $util.emptyArray;

        /**
         * Creates a new transaction_receipt instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.transaction_receipt
         * @static
         * @param {koinos.protocol.Itransaction_receipt=} [properties] Properties to set
         * @returns {koinos.protocol.transaction_receipt} transaction_receipt instance
         */
        transaction_receipt.create = function create(properties) {
          return new transaction_receipt(properties);
        };

        /**
         * Encodes the specified transaction_receipt message. Does not implicitly {@link koinos.protocol.transaction_receipt.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.transaction_receipt
         * @static
         * @param {koinos.protocol.Itransaction_receipt} message transaction_receipt message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        transaction_receipt.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.id);
          if (
            message.payer != null &&
            Object.hasOwnProperty.call(message, "payer")
          )
            writer.uint32(/* id 2, wireType 2 =*/ 18).bytes(message.payer);
          if (
            message.max_payer_rc != null &&
            Object.hasOwnProperty.call(message, "max_payer_rc")
          )
            writer
              .uint32(/* id 3, wireType 0 =*/ 24)
              .uint64(message.max_payer_rc);
          if (
            message.rc_limit != null &&
            Object.hasOwnProperty.call(message, "rc_limit")
          )
            writer.uint32(/* id 4, wireType 0 =*/ 32).uint64(message.rc_limit);
          if (
            message.rc_used != null &&
            Object.hasOwnProperty.call(message, "rc_used")
          )
            writer.uint32(/* id 5, wireType 0 =*/ 40).uint64(message.rc_used);
          if (
            message.disk_storage_used != null &&
            Object.hasOwnProperty.call(message, "disk_storage_used")
          )
            writer
              .uint32(/* id 6, wireType 0 =*/ 48)
              .uint64(message.disk_storage_used);
          if (
            message.network_bandwidth_used != null &&
            Object.hasOwnProperty.call(message, "network_bandwidth_used")
          )
            writer
              .uint32(/* id 7, wireType 0 =*/ 56)
              .uint64(message.network_bandwidth_used);
          if (
            message.compute_bandwidth_used != null &&
            Object.hasOwnProperty.call(message, "compute_bandwidth_used")
          )
            writer
              .uint32(/* id 8, wireType 0 =*/ 64)
              .uint64(message.compute_bandwidth_used);
          if (
            message.reverted != null &&
            Object.hasOwnProperty.call(message, "reverted")
          )
            writer.uint32(/* id 9, wireType 0 =*/ 72).bool(message.reverted);
          if (message.events != null && message.events.length)
            for (var i = 0; i < message.events.length; ++i)
              $root.koinos.protocol.event_data
                .encode(
                  message.events[i],
                  writer.uint32(/* id 10, wireType 2 =*/ 82).fork()
                )
                .ldelim();
          if (message.logs != null && message.logs.length)
            for (var i = 0; i < message.logs.length; ++i)
              writer
                .uint32(/* id 11, wireType 2 =*/ 90)
                .string(message.logs[i]);
          return writer;
        };

        /**
         * Encodes the specified transaction_receipt message, length delimited. Does not implicitly {@link koinos.protocol.transaction_receipt.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.transaction_receipt
         * @static
         * @param {koinos.protocol.Itransaction_receipt} message transaction_receipt message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        transaction_receipt.encodeDelimited = function encodeDelimited(
          message,
          writer
        ) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a transaction_receipt message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.transaction_receipt
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.transaction_receipt} transaction_receipt
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        transaction_receipt.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.transaction_receipt();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.id = reader.bytes();
                break;
              case 2:
                message.payer = reader.bytes();
                break;
              case 3:
                message.max_payer_rc = reader.uint64();
                break;
              case 4:
                message.rc_limit = reader.uint64();
                break;
              case 5:
                message.rc_used = reader.uint64();
                break;
              case 6:
                message.disk_storage_used = reader.uint64();
                break;
              case 7:
                message.network_bandwidth_used = reader.uint64();
                break;
              case 8:
                message.compute_bandwidth_used = reader.uint64();
                break;
              case 9:
                message.reverted = reader.bool();
                break;
              case 10:
                if (!(message.events && message.events.length))
                  message.events = [];
                message.events.push(
                  $root.koinos.protocol.event_data.decode(
                    reader,
                    reader.uint32()
                  )
                );
                break;
              case 11:
                if (!(message.logs && message.logs.length)) message.logs = [];
                message.logs.push(reader.string());
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a transaction_receipt message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.transaction_receipt
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.transaction_receipt} transaction_receipt
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        transaction_receipt.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a transaction_receipt message.
         * @function verify
         * @memberof koinos.protocol.transaction_receipt
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        transaction_receipt.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (message.id != null && message.hasOwnProperty("id"))
            if (
              !(
                (message.id && typeof message.id.length === "number") ||
                $util.isString(message.id)
              )
            )
              return "id: buffer expected";
          if (message.payer != null && message.hasOwnProperty("payer"))
            if (
              !(
                (message.payer && typeof message.payer.length === "number") ||
                $util.isString(message.payer)
              )
            )
              return "payer: buffer expected";
          if (
            message.max_payer_rc != null &&
            message.hasOwnProperty("max_payer_rc")
          )
            if (
              !$util.isInteger(message.max_payer_rc) &&
              !(
                message.max_payer_rc &&
                $util.isInteger(message.max_payer_rc.low) &&
                $util.isInteger(message.max_payer_rc.high)
              )
            )
              return "max_payer_rc: integer|Long expected";
          if (message.rc_limit != null && message.hasOwnProperty("rc_limit"))
            if (
              !$util.isInteger(message.rc_limit) &&
              !(
                message.rc_limit &&
                $util.isInteger(message.rc_limit.low) &&
                $util.isInteger(message.rc_limit.high)
              )
            )
              return "rc_limit: integer|Long expected";
          if (message.rc_used != null && message.hasOwnProperty("rc_used"))
            if (
              !$util.isInteger(message.rc_used) &&
              !(
                message.rc_used &&
                $util.isInteger(message.rc_used.low) &&
                $util.isInteger(message.rc_used.high)
              )
            )
              return "rc_used: integer|Long expected";
          if (
            message.disk_storage_used != null &&
            message.hasOwnProperty("disk_storage_used")
          )
            if (
              !$util.isInteger(message.disk_storage_used) &&
              !(
                message.disk_storage_used &&
                $util.isInteger(message.disk_storage_used.low) &&
                $util.isInteger(message.disk_storage_used.high)
              )
            )
              return "disk_storage_used: integer|Long expected";
          if (
            message.network_bandwidth_used != null &&
            message.hasOwnProperty("network_bandwidth_used")
          )
            if (
              !$util.isInteger(message.network_bandwidth_used) &&
              !(
                message.network_bandwidth_used &&
                $util.isInteger(message.network_bandwidth_used.low) &&
                $util.isInteger(message.network_bandwidth_used.high)
              )
            )
              return "network_bandwidth_used: integer|Long expected";
          if (
            message.compute_bandwidth_used != null &&
            message.hasOwnProperty("compute_bandwidth_used")
          )
            if (
              !$util.isInteger(message.compute_bandwidth_used) &&
              !(
                message.compute_bandwidth_used &&
                $util.isInteger(message.compute_bandwidth_used.low) &&
                $util.isInteger(message.compute_bandwidth_used.high)
              )
            )
              return "compute_bandwidth_used: integer|Long expected";
          if (message.reverted != null && message.hasOwnProperty("reverted"))
            if (typeof message.reverted !== "boolean")
              return "reverted: boolean expected";
          if (message.events != null && message.hasOwnProperty("events")) {
            if (!Array.isArray(message.events)) return "events: array expected";
            for (var i = 0; i < message.events.length; ++i) {
              var error = $root.koinos.protocol.event_data.verify(
                message.events[i]
              );
              if (error) return "events." + error;
            }
          }
          if (message.logs != null && message.hasOwnProperty("logs")) {
            if (!Array.isArray(message.logs)) return "logs: array expected";
            for (var i = 0; i < message.logs.length; ++i)
              if (!$util.isString(message.logs[i]))
                return "logs: string[] expected";
          }
          return null;
        };

        /**
         * Creates a transaction_receipt message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.transaction_receipt
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.transaction_receipt} transaction_receipt
         */
        transaction_receipt.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.transaction_receipt)
            return object;
          var message = new $root.koinos.protocol.transaction_receipt();
          if (object.id != null)
            if (typeof object.id === "string")
              $util.base64.decode(
                object.id,
                (message.id = $util.newBuffer($util.base64.length(object.id))),
                0
              );
            else if (object.id.length) message.id = object.id;
          if (object.payer != null)
            if (typeof object.payer === "string")
              $util.base64.decode(
                object.payer,
                (message.payer = $util.newBuffer(
                  $util.base64.length(object.payer)
                )),
                0
              );
            else if (object.payer.length) message.payer = object.payer;
          if (object.max_payer_rc != null)
            if ($util.Long)
              (message.max_payer_rc = $util.Long.fromValue(
                object.max_payer_rc
              )).unsigned = true;
            else if (typeof object.max_payer_rc === "string")
              message.max_payer_rc = parseInt(object.max_payer_rc, 10);
            else if (typeof object.max_payer_rc === "number")
              message.max_payer_rc = object.max_payer_rc;
            else if (typeof object.max_payer_rc === "object")
              message.max_payer_rc = new $util.LongBits(
                object.max_payer_rc.low >>> 0,
                object.max_payer_rc.high >>> 0
              ).toNumber(true);
          if (object.rc_limit != null)
            if ($util.Long)
              (message.rc_limit = $util.Long.fromValue(
                object.rc_limit
              )).unsigned = true;
            else if (typeof object.rc_limit === "string")
              message.rc_limit = parseInt(object.rc_limit, 10);
            else if (typeof object.rc_limit === "number")
              message.rc_limit = object.rc_limit;
            else if (typeof object.rc_limit === "object")
              message.rc_limit = new $util.LongBits(
                object.rc_limit.low >>> 0,
                object.rc_limit.high >>> 0
              ).toNumber(true);
          if (object.rc_used != null)
            if ($util.Long)
              (message.rc_used = $util.Long.fromValue(
                object.rc_used
              )).unsigned = true;
            else if (typeof object.rc_used === "string")
              message.rc_used = parseInt(object.rc_used, 10);
            else if (typeof object.rc_used === "number")
              message.rc_used = object.rc_used;
            else if (typeof object.rc_used === "object")
              message.rc_used = new $util.LongBits(
                object.rc_used.low >>> 0,
                object.rc_used.high >>> 0
              ).toNumber(true);
          if (object.disk_storage_used != null)
            if ($util.Long)
              (message.disk_storage_used = $util.Long.fromValue(
                object.disk_storage_used
              )).unsigned = true;
            else if (typeof object.disk_storage_used === "string")
              message.disk_storage_used = parseInt(
                object.disk_storage_used,
                10
              );
            else if (typeof object.disk_storage_used === "number")
              message.disk_storage_used = object.disk_storage_used;
            else if (typeof object.disk_storage_used === "object")
              message.disk_storage_used = new $util.LongBits(
                object.disk_storage_used.low >>> 0,
                object.disk_storage_used.high >>> 0
              ).toNumber(true);
          if (object.network_bandwidth_used != null)
            if ($util.Long)
              (message.network_bandwidth_used = $util.Long.fromValue(
                object.network_bandwidth_used
              )).unsigned = true;
            else if (typeof object.network_bandwidth_used === "string")
              message.network_bandwidth_used = parseInt(
                object.network_bandwidth_used,
                10
              );
            else if (typeof object.network_bandwidth_used === "number")
              message.network_bandwidth_used = object.network_bandwidth_used;
            else if (typeof object.network_bandwidth_used === "object")
              message.network_bandwidth_used = new $util.LongBits(
                object.network_bandwidth_used.low >>> 0,
                object.network_bandwidth_used.high >>> 0
              ).toNumber(true);
          if (object.compute_bandwidth_used != null)
            if ($util.Long)
              (message.compute_bandwidth_used = $util.Long.fromValue(
                object.compute_bandwidth_used
              )).unsigned = true;
            else if (typeof object.compute_bandwidth_used === "string")
              message.compute_bandwidth_used = parseInt(
                object.compute_bandwidth_used,
                10
              );
            else if (typeof object.compute_bandwidth_used === "number")
              message.compute_bandwidth_used = object.compute_bandwidth_used;
            else if (typeof object.compute_bandwidth_used === "object")
              message.compute_bandwidth_used = new $util.LongBits(
                object.compute_bandwidth_used.low >>> 0,
                object.compute_bandwidth_used.high >>> 0
              ).toNumber(true);
          if (object.reverted != null)
            message.reverted = Boolean(object.reverted);
          if (object.events) {
            if (!Array.isArray(object.events))
              throw TypeError(
                ".koinos.protocol.transaction_receipt.events: array expected"
              );
            message.events = [];
            for (var i = 0; i < object.events.length; ++i) {
              if (typeof object.events[i] !== "object")
                throw TypeError(
                  ".koinos.protocol.transaction_receipt.events: object expected"
                );
              message.events[i] = $root.koinos.protocol.event_data.fromObject(
                object.events[i]
              );
            }
          }
          if (object.logs) {
            if (!Array.isArray(object.logs))
              throw TypeError(
                ".koinos.protocol.transaction_receipt.logs: array expected"
              );
            message.logs = [];
            for (var i = 0; i < object.logs.length; ++i)
              message.logs[i] = String(object.logs[i]);
          }
          return message;
        };

        /**
         * Creates a plain object from a transaction_receipt message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.transaction_receipt
         * @static
         * @param {koinos.protocol.transaction_receipt} message transaction_receipt
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        transaction_receipt.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.arrays || options.defaults) {
            object.events = [];
            object.logs = [];
          }
          if (options.defaults) {
            if (options.bytes === String) object.id = "";
            else {
              object.id = [];
              if (options.bytes !== Array)
                object.id = $util.newBuffer(object.id);
            }
            if (options.bytes === String) object.payer = "";
            else {
              object.payer = [];
              if (options.bytes !== Array)
                object.payer = $util.newBuffer(object.payer);
            }
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.max_payer_rc =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else object.max_payer_rc = options.longs === String ? "0" : 0;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.rc_limit =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else object.rc_limit = options.longs === String ? "0" : 0;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.rc_used =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else object.rc_used = options.longs === String ? "0" : 0;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.disk_storage_used =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else
              object.disk_storage_used = options.longs === String ? "0" : 0;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.network_bandwidth_used =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else
              object.network_bandwidth_used =
                options.longs === String ? "0" : 0;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.compute_bandwidth_used =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else
              object.compute_bandwidth_used =
                options.longs === String ? "0" : 0;
            object.reverted = false;
          }
          if (message.id != null && message.hasOwnProperty("id"))
            object.id =
              options.bytes === String
                ? $util.base64.encode(message.id, 0, message.id.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.id)
                : message.id;
          if (message.payer != null && message.hasOwnProperty("payer"))
            object.payer =
              options.bytes === String
                ? $util.base64.encode(message.payer, 0, message.payer.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.payer)
                : message.payer;
          if (
            message.max_payer_rc != null &&
            message.hasOwnProperty("max_payer_rc")
          )
            if (typeof message.max_payer_rc === "number")
              object.max_payer_rc =
                options.longs === String
                  ? String(message.max_payer_rc)
                  : message.max_payer_rc;
            else
              object.max_payer_rc =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.max_payer_rc)
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.max_payer_rc.low >>> 0,
                      message.max_payer_rc.high >>> 0
                    ).toNumber(true)
                  : message.max_payer_rc;
          if (message.rc_limit != null && message.hasOwnProperty("rc_limit"))
            if (typeof message.rc_limit === "number")
              object.rc_limit =
                options.longs === String
                  ? String(message.rc_limit)
                  : message.rc_limit;
            else
              object.rc_limit =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.rc_limit)
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.rc_limit.low >>> 0,
                      message.rc_limit.high >>> 0
                    ).toNumber(true)
                  : message.rc_limit;
          if (message.rc_used != null && message.hasOwnProperty("rc_used"))
            if (typeof message.rc_used === "number")
              object.rc_used =
                options.longs === String
                  ? String(message.rc_used)
                  : message.rc_used;
            else
              object.rc_used =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.rc_used)
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.rc_used.low >>> 0,
                      message.rc_used.high >>> 0
                    ).toNumber(true)
                  : message.rc_used;
          if (
            message.disk_storage_used != null &&
            message.hasOwnProperty("disk_storage_used")
          )
            if (typeof message.disk_storage_used === "number")
              object.disk_storage_used =
                options.longs === String
                  ? String(message.disk_storage_used)
                  : message.disk_storage_used;
            else
              object.disk_storage_used =
                options.longs === String
                  ? $util.Long.prototype.toString.call(
                      message.disk_storage_used
                    )
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.disk_storage_used.low >>> 0,
                      message.disk_storage_used.high >>> 0
                    ).toNumber(true)
                  : message.disk_storage_used;
          if (
            message.network_bandwidth_used != null &&
            message.hasOwnProperty("network_bandwidth_used")
          )
            if (typeof message.network_bandwidth_used === "number")
              object.network_bandwidth_used =
                options.longs === String
                  ? String(message.network_bandwidth_used)
                  : message.network_bandwidth_used;
            else
              object.network_bandwidth_used =
                options.longs === String
                  ? $util.Long.prototype.toString.call(
                      message.network_bandwidth_used
                    )
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.network_bandwidth_used.low >>> 0,
                      message.network_bandwidth_used.high >>> 0
                    ).toNumber(true)
                  : message.network_bandwidth_used;
          if (
            message.compute_bandwidth_used != null &&
            message.hasOwnProperty("compute_bandwidth_used")
          )
            if (typeof message.compute_bandwidth_used === "number")
              object.compute_bandwidth_used =
                options.longs === String
                  ? String(message.compute_bandwidth_used)
                  : message.compute_bandwidth_used;
            else
              object.compute_bandwidth_used =
                options.longs === String
                  ? $util.Long.prototype.toString.call(
                      message.compute_bandwidth_used
                    )
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.compute_bandwidth_used.low >>> 0,
                      message.compute_bandwidth_used.high >>> 0
                    ).toNumber(true)
                  : message.compute_bandwidth_used;
          if (message.reverted != null && message.hasOwnProperty("reverted"))
            object.reverted = message.reverted;
          if (message.events && message.events.length) {
            object.events = [];
            for (var j = 0; j < message.events.length; ++j)
              object.events[j] = $root.koinos.protocol.event_data.toObject(
                message.events[j],
                options
              );
          }
          if (message.logs && message.logs.length) {
            object.logs = [];
            for (var j = 0; j < message.logs.length; ++j)
              object.logs[j] = message.logs[j];
          }
          return object;
        };

        /**
         * Converts this transaction_receipt to JSON.
         * @function toJSON
         * @memberof koinos.protocol.transaction_receipt
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        transaction_receipt.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return transaction_receipt;
      })();

      protocol.block_header = (function () {
        /**
         * Properties of a block_header.
         * @memberof koinos.protocol
         * @interface Iblock_header
         * @property {Uint8Array|null} [previous] block_header previous
         * @property {number|Long|null} [height] block_header height
         * @property {number|Long|null} [timestamp] block_header timestamp
         * @property {Uint8Array|null} [previous_state_merkle_root] block_header previous_state_merkle_root
         * @property {Uint8Array|null} [transaction_merkle_root] block_header transaction_merkle_root
         * @property {Uint8Array|null} [signer] block_header signer
         */

        /**
         * Constructs a new block_header.
         * @memberof koinos.protocol
         * @classdesc Represents a block_header.
         * @implements Iblock_header
         * @constructor
         * @param {koinos.protocol.Iblock_header=} [properties] Properties to set
         */
        function block_header(properties) {
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * block_header previous.
         * @member {Uint8Array} previous
         * @memberof koinos.protocol.block_header
         * @instance
         */
        block_header.prototype.previous = $util.newBuffer([]);

        /**
         * block_header height.
         * @member {number|Long} height
         * @memberof koinos.protocol.block_header
         * @instance
         */
        block_header.prototype.height = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * block_header timestamp.
         * @member {number|Long} timestamp
         * @memberof koinos.protocol.block_header
         * @instance
         */
        block_header.prototype.timestamp = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * block_header previous_state_merkle_root.
         * @member {Uint8Array} previous_state_merkle_root
         * @memberof koinos.protocol.block_header
         * @instance
         */
        block_header.prototype.previous_state_merkle_root = $util.newBuffer([]);

        /**
         * block_header transaction_merkle_root.
         * @member {Uint8Array} transaction_merkle_root
         * @memberof koinos.protocol.block_header
         * @instance
         */
        block_header.prototype.transaction_merkle_root = $util.newBuffer([]);

        /**
         * block_header signer.
         * @member {Uint8Array} signer
         * @memberof koinos.protocol.block_header
         * @instance
         */
        block_header.prototype.signer = $util.newBuffer([]);

        /**
         * Creates a new block_header instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.block_header
         * @static
         * @param {koinos.protocol.Iblock_header=} [properties] Properties to set
         * @returns {koinos.protocol.block_header} block_header instance
         */
        block_header.create = function create(properties) {
          return new block_header(properties);
        };

        /**
         * Encodes the specified block_header message. Does not implicitly {@link koinos.protocol.block_header.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.block_header
         * @static
         * @param {koinos.protocol.Iblock_header} message block_header message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        block_header.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (
            message.previous != null &&
            Object.hasOwnProperty.call(message, "previous")
          )
            writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.previous);
          if (
            message.height != null &&
            Object.hasOwnProperty.call(message, "height")
          )
            writer.uint32(/* id 2, wireType 0 =*/ 16).uint64(message.height);
          if (
            message.timestamp != null &&
            Object.hasOwnProperty.call(message, "timestamp")
          )
            writer.uint32(/* id 3, wireType 0 =*/ 24).uint64(message.timestamp);
          if (
            message.previous_state_merkle_root != null &&
            Object.hasOwnProperty.call(message, "previous_state_merkle_root")
          )
            writer
              .uint32(/* id 4, wireType 2 =*/ 34)
              .bytes(message.previous_state_merkle_root);
          if (
            message.transaction_merkle_root != null &&
            Object.hasOwnProperty.call(message, "transaction_merkle_root")
          )
            writer
              .uint32(/* id 5, wireType 2 =*/ 42)
              .bytes(message.transaction_merkle_root);
          if (
            message.signer != null &&
            Object.hasOwnProperty.call(message, "signer")
          )
            writer.uint32(/* id 6, wireType 2 =*/ 50).bytes(message.signer);
          return writer;
        };

        /**
         * Encodes the specified block_header message, length delimited. Does not implicitly {@link koinos.protocol.block_header.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.block_header
         * @static
         * @param {koinos.protocol.Iblock_header} message block_header message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        block_header.encodeDelimited = function encodeDelimited(
          message,
          writer
        ) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a block_header message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.block_header
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.block_header} block_header
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        block_header.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.block_header();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.previous = reader.bytes();
                break;
              case 2:
                message.height = reader.uint64();
                break;
              case 3:
                message.timestamp = reader.uint64();
                break;
              case 4:
                message.previous_state_merkle_root = reader.bytes();
                break;
              case 5:
                message.transaction_merkle_root = reader.bytes();
                break;
              case 6:
                message.signer = reader.bytes();
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a block_header message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.block_header
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.block_header} block_header
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        block_header.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a block_header message.
         * @function verify
         * @memberof koinos.protocol.block_header
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        block_header.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (message.previous != null && message.hasOwnProperty("previous"))
            if (
              !(
                (message.previous &&
                  typeof message.previous.length === "number") ||
                $util.isString(message.previous)
              )
            )
              return "previous: buffer expected";
          if (message.height != null && message.hasOwnProperty("height"))
            if (
              !$util.isInteger(message.height) &&
              !(
                message.height &&
                $util.isInteger(message.height.low) &&
                $util.isInteger(message.height.high)
              )
            )
              return "height: integer|Long expected";
          if (message.timestamp != null && message.hasOwnProperty("timestamp"))
            if (
              !$util.isInteger(message.timestamp) &&
              !(
                message.timestamp &&
                $util.isInteger(message.timestamp.low) &&
                $util.isInteger(message.timestamp.high)
              )
            )
              return "timestamp: integer|Long expected";
          if (
            message.previous_state_merkle_root != null &&
            message.hasOwnProperty("previous_state_merkle_root")
          )
            if (
              !(
                (message.previous_state_merkle_root &&
                  typeof message.previous_state_merkle_root.length ===
                    "number") ||
                $util.isString(message.previous_state_merkle_root)
              )
            )
              return "previous_state_merkle_root: buffer expected";
          if (
            message.transaction_merkle_root != null &&
            message.hasOwnProperty("transaction_merkle_root")
          )
            if (
              !(
                (message.transaction_merkle_root &&
                  typeof message.transaction_merkle_root.length === "number") ||
                $util.isString(message.transaction_merkle_root)
              )
            )
              return "transaction_merkle_root: buffer expected";
          if (message.signer != null && message.hasOwnProperty("signer"))
            if (
              !(
                (message.signer && typeof message.signer.length === "number") ||
                $util.isString(message.signer)
              )
            )
              return "signer: buffer expected";
          return null;
        };

        /**
         * Creates a block_header message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.block_header
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.block_header} block_header
         */
        block_header.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.block_header)
            return object;
          var message = new $root.koinos.protocol.block_header();
          if (object.previous != null)
            if (typeof object.previous === "string")
              $util.base64.decode(
                object.previous,
                (message.previous = $util.newBuffer(
                  $util.base64.length(object.previous)
                )),
                0
              );
            else if (object.previous.length) message.previous = object.previous;
          if (object.height != null)
            if ($util.Long)
              (message.height = $util.Long.fromValue(
                object.height
              )).unsigned = true;
            else if (typeof object.height === "string")
              message.height = parseInt(object.height, 10);
            else if (typeof object.height === "number")
              message.height = object.height;
            else if (typeof object.height === "object")
              message.height = new $util.LongBits(
                object.height.low >>> 0,
                object.height.high >>> 0
              ).toNumber(true);
          if (object.timestamp != null)
            if ($util.Long)
              (message.timestamp = $util.Long.fromValue(
                object.timestamp
              )).unsigned = true;
            else if (typeof object.timestamp === "string")
              message.timestamp = parseInt(object.timestamp, 10);
            else if (typeof object.timestamp === "number")
              message.timestamp = object.timestamp;
            else if (typeof object.timestamp === "object")
              message.timestamp = new $util.LongBits(
                object.timestamp.low >>> 0,
                object.timestamp.high >>> 0
              ).toNumber(true);
          if (object.previous_state_merkle_root != null)
            if (typeof object.previous_state_merkle_root === "string")
              $util.base64.decode(
                object.previous_state_merkle_root,
                (message.previous_state_merkle_root = $util.newBuffer(
                  $util.base64.length(object.previous_state_merkle_root)
                )),
                0
              );
            else if (object.previous_state_merkle_root.length)
              message.previous_state_merkle_root =
                object.previous_state_merkle_root;
          if (object.transaction_merkle_root != null)
            if (typeof object.transaction_merkle_root === "string")
              $util.base64.decode(
                object.transaction_merkle_root,
                (message.transaction_merkle_root = $util.newBuffer(
                  $util.base64.length(object.transaction_merkle_root)
                )),
                0
              );
            else if (object.transaction_merkle_root.length)
              message.transaction_merkle_root = object.transaction_merkle_root;
          if (object.signer != null)
            if (typeof object.signer === "string")
              $util.base64.decode(
                object.signer,
                (message.signer = $util.newBuffer(
                  $util.base64.length(object.signer)
                )),
                0
              );
            else if (object.signer.length) message.signer = object.signer;
          return message;
        };

        /**
         * Creates a plain object from a block_header message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.block_header
         * @static
         * @param {koinos.protocol.block_header} message block_header
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        block_header.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.defaults) {
            if (options.bytes === String) object.previous = "";
            else {
              object.previous = [];
              if (options.bytes !== Array)
                object.previous = $util.newBuffer(object.previous);
            }
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.height =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else object.height = options.longs === String ? "0" : 0;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.timestamp =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else object.timestamp = options.longs === String ? "0" : 0;
            if (options.bytes === String)
              object.previous_state_merkle_root = "";
            else {
              object.previous_state_merkle_root = [];
              if (options.bytes !== Array)
                object.previous_state_merkle_root = $util.newBuffer(
                  object.previous_state_merkle_root
                );
            }
            if (options.bytes === String) object.transaction_merkle_root = "";
            else {
              object.transaction_merkle_root = [];
              if (options.bytes !== Array)
                object.transaction_merkle_root = $util.newBuffer(
                  object.transaction_merkle_root
                );
            }
            if (options.bytes === String) object.signer = "";
            else {
              object.signer = [];
              if (options.bytes !== Array)
                object.signer = $util.newBuffer(object.signer);
            }
          }
          if (message.previous != null && message.hasOwnProperty("previous"))
            object.previous =
              options.bytes === String
                ? $util.base64.encode(
                    message.previous,
                    0,
                    message.previous.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.previous)
                : message.previous;
          if (message.height != null && message.hasOwnProperty("height"))
            if (typeof message.height === "number")
              object.height =
                options.longs === String
                  ? String(message.height)
                  : message.height;
            else
              object.height =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.height)
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.height.low >>> 0,
                      message.height.high >>> 0
                    ).toNumber(true)
                  : message.height;
          if (message.timestamp != null && message.hasOwnProperty("timestamp"))
            if (typeof message.timestamp === "number")
              object.timestamp =
                options.longs === String
                  ? String(message.timestamp)
                  : message.timestamp;
            else
              object.timestamp =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.timestamp)
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.timestamp.low >>> 0,
                      message.timestamp.high >>> 0
                    ).toNumber(true)
                  : message.timestamp;
          if (
            message.previous_state_merkle_root != null &&
            message.hasOwnProperty("previous_state_merkle_root")
          )
            object.previous_state_merkle_root =
              options.bytes === String
                ? $util.base64.encode(
                    message.previous_state_merkle_root,
                    0,
                    message.previous_state_merkle_root.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.previous_state_merkle_root)
                : message.previous_state_merkle_root;
          if (
            message.transaction_merkle_root != null &&
            message.hasOwnProperty("transaction_merkle_root")
          )
            object.transaction_merkle_root =
              options.bytes === String
                ? $util.base64.encode(
                    message.transaction_merkle_root,
                    0,
                    message.transaction_merkle_root.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.transaction_merkle_root)
                : message.transaction_merkle_root;
          if (message.signer != null && message.hasOwnProperty("signer"))
            object.signer =
              options.bytes === String
                ? $util.base64.encode(message.signer, 0, message.signer.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.signer)
                : message.signer;
          return object;
        };

        /**
         * Converts this block_header to JSON.
         * @function toJSON
         * @memberof koinos.protocol.block_header
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        block_header.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return block_header;
      })();

      protocol.block = (function () {
        /**
         * Properties of a block.
         * @memberof koinos.protocol
         * @interface Iblock
         * @property {Uint8Array|null} [id] block id
         * @property {koinos.protocol.Iblock_header|null} [header] block header
         * @property {Array.<koinos.protocol.Itransaction>|null} [transactions] block transactions
         * @property {Uint8Array|null} [signature] block signature
         */

        /**
         * Constructs a new block.
         * @memberof koinos.protocol
         * @classdesc Represents a block.
         * @implements Iblock
         * @constructor
         * @param {koinos.protocol.Iblock=} [properties] Properties to set
         */
        function block(properties) {
          this.transactions = [];
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * block id.
         * @member {Uint8Array} id
         * @memberof koinos.protocol.block
         * @instance
         */
        block.prototype.id = $util.newBuffer([]);

        /**
         * block header.
         * @member {koinos.protocol.Iblock_header|null|undefined} header
         * @memberof koinos.protocol.block
         * @instance
         */
        block.prototype.header = null;

        /**
         * block transactions.
         * @member {Array.<koinos.protocol.Itransaction>} transactions
         * @memberof koinos.protocol.block
         * @instance
         */
        block.prototype.transactions = $util.emptyArray;

        /**
         * block signature.
         * @member {Uint8Array} signature
         * @memberof koinos.protocol.block
         * @instance
         */
        block.prototype.signature = $util.newBuffer([]);

        /**
         * Creates a new block instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.block
         * @static
         * @param {koinos.protocol.Iblock=} [properties] Properties to set
         * @returns {koinos.protocol.block} block instance
         */
        block.create = function create(properties) {
          return new block(properties);
        };

        /**
         * Encodes the specified block message. Does not implicitly {@link koinos.protocol.block.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.block
         * @static
         * @param {koinos.protocol.Iblock} message block message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        block.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.id);
          if (
            message.header != null &&
            Object.hasOwnProperty.call(message, "header")
          )
            $root.koinos.protocol.block_header
              .encode(
                message.header,
                writer.uint32(/* id 2, wireType 2 =*/ 18).fork()
              )
              .ldelim();
          if (message.transactions != null && message.transactions.length)
            for (var i = 0; i < message.transactions.length; ++i)
              $root.koinos.protocol.transaction
                .encode(
                  message.transactions[i],
                  writer.uint32(/* id 3, wireType 2 =*/ 26).fork()
                )
                .ldelim();
          if (
            message.signature != null &&
            Object.hasOwnProperty.call(message, "signature")
          )
            writer.uint32(/* id 4, wireType 2 =*/ 34).bytes(message.signature);
          return writer;
        };

        /**
         * Encodes the specified block message, length delimited. Does not implicitly {@link koinos.protocol.block.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.block
         * @static
         * @param {koinos.protocol.Iblock} message block message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        block.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a block message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.block
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.block} block
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        block.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.block();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.id = reader.bytes();
                break;
              case 2:
                message.header = $root.koinos.protocol.block_header.decode(
                  reader,
                  reader.uint32()
                );
                break;
              case 3:
                if (!(message.transactions && message.transactions.length))
                  message.transactions = [];
                message.transactions.push(
                  $root.koinos.protocol.transaction.decode(
                    reader,
                    reader.uint32()
                  )
                );
                break;
              case 4:
                message.signature = reader.bytes();
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a block message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.block
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.block} block
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        block.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a block message.
         * @function verify
         * @memberof koinos.protocol.block
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        block.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (message.id != null && message.hasOwnProperty("id"))
            if (
              !(
                (message.id && typeof message.id.length === "number") ||
                $util.isString(message.id)
              )
            )
              return "id: buffer expected";
          if (message.header != null && message.hasOwnProperty("header")) {
            var error = $root.koinos.protocol.block_header.verify(
              message.header
            );
            if (error) return "header." + error;
          }
          if (
            message.transactions != null &&
            message.hasOwnProperty("transactions")
          ) {
            if (!Array.isArray(message.transactions))
              return "transactions: array expected";
            for (var i = 0; i < message.transactions.length; ++i) {
              var error = $root.koinos.protocol.transaction.verify(
                message.transactions[i]
              );
              if (error) return "transactions." + error;
            }
          }
          if (message.signature != null && message.hasOwnProperty("signature"))
            if (
              !(
                (message.signature &&
                  typeof message.signature.length === "number") ||
                $util.isString(message.signature)
              )
            )
              return "signature: buffer expected";
          return null;
        };

        /**
         * Creates a block message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.block
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.block} block
         */
        block.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.block) return object;
          var message = new $root.koinos.protocol.block();
          if (object.id != null)
            if (typeof object.id === "string")
              $util.base64.decode(
                object.id,
                (message.id = $util.newBuffer($util.base64.length(object.id))),
                0
              );
            else if (object.id.length) message.id = object.id;
          if (object.header != null) {
            if (typeof object.header !== "object")
              throw TypeError(".koinos.protocol.block.header: object expected");
            message.header = $root.koinos.protocol.block_header.fromObject(
              object.header
            );
          }
          if (object.transactions) {
            if (!Array.isArray(object.transactions))
              throw TypeError(
                ".koinos.protocol.block.transactions: array expected"
              );
            message.transactions = [];
            for (var i = 0; i < object.transactions.length; ++i) {
              if (typeof object.transactions[i] !== "object")
                throw TypeError(
                  ".koinos.protocol.block.transactions: object expected"
                );
              message.transactions[i] =
                $root.koinos.protocol.transaction.fromObject(
                  object.transactions[i]
                );
            }
          }
          if (object.signature != null)
            if (typeof object.signature === "string")
              $util.base64.decode(
                object.signature,
                (message.signature = $util.newBuffer(
                  $util.base64.length(object.signature)
                )),
                0
              );
            else if (object.signature.length)
              message.signature = object.signature;
          return message;
        };

        /**
         * Creates a plain object from a block message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.block
         * @static
         * @param {koinos.protocol.block} message block
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        block.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.arrays || options.defaults) object.transactions = [];
          if (options.defaults) {
            if (options.bytes === String) object.id = "";
            else {
              object.id = [];
              if (options.bytes !== Array)
                object.id = $util.newBuffer(object.id);
            }
            object.header = null;
            if (options.bytes === String) object.signature = "";
            else {
              object.signature = [];
              if (options.bytes !== Array)
                object.signature = $util.newBuffer(object.signature);
            }
          }
          if (message.id != null && message.hasOwnProperty("id"))
            object.id =
              options.bytes === String
                ? $util.base64.encode(message.id, 0, message.id.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.id)
                : message.id;
          if (message.header != null && message.hasOwnProperty("header"))
            object.header = $root.koinos.protocol.block_header.toObject(
              message.header,
              options
            );
          if (message.transactions && message.transactions.length) {
            object.transactions = [];
            for (var j = 0; j < message.transactions.length; ++j)
              object.transactions[j] =
                $root.koinos.protocol.transaction.toObject(
                  message.transactions[j],
                  options
                );
          }
          if (message.signature != null && message.hasOwnProperty("signature"))
            object.signature =
              options.bytes === String
                ? $util.base64.encode(
                    message.signature,
                    0,
                    message.signature.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.signature)
                : message.signature;
          return object;
        };

        /**
         * Converts this block to JSON.
         * @function toJSON
         * @memberof koinos.protocol.block
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        block.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return block;
      })();

      protocol.block_receipt = (function () {
        /**
         * Properties of a block_receipt.
         * @memberof koinos.protocol
         * @interface Iblock_receipt
         * @property {Uint8Array|null} [id] block_receipt id
         * @property {number|Long|null} [height] block_receipt height
         * @property {number|Long|null} [disk_storage_used] block_receipt disk_storage_used
         * @property {number|Long|null} [network_bandwidth_used] block_receipt network_bandwidth_used
         * @property {number|Long|null} [compute_bandwidth_used] block_receipt compute_bandwidth_used
         * @property {Uint8Array|null} [state_merkle_root] block_receipt state_merkle_root
         * @property {Array.<koinos.protocol.Ievent_data>|null} [events] block_receipt events
         * @property {Array.<koinos.protocol.Itransaction_receipt>|null} [transaction_receipts] block_receipt transaction_receipts
         * @property {Array.<string>|null} [logs] block_receipt logs
         */

        /**
         * Constructs a new block_receipt.
         * @memberof koinos.protocol
         * @classdesc Represents a block_receipt.
         * @implements Iblock_receipt
         * @constructor
         * @param {koinos.protocol.Iblock_receipt=} [properties] Properties to set
         */
        function block_receipt(properties) {
          this.events = [];
          this.transaction_receipts = [];
          this.logs = [];
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * block_receipt id.
         * @member {Uint8Array} id
         * @memberof koinos.protocol.block_receipt
         * @instance
         */
        block_receipt.prototype.id = $util.newBuffer([]);

        /**
         * block_receipt height.
         * @member {number|Long} height
         * @memberof koinos.protocol.block_receipt
         * @instance
         */
        block_receipt.prototype.height = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * block_receipt disk_storage_used.
         * @member {number|Long} disk_storage_used
         * @memberof koinos.protocol.block_receipt
         * @instance
         */
        block_receipt.prototype.disk_storage_used = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * block_receipt network_bandwidth_used.
         * @member {number|Long} network_bandwidth_used
         * @memberof koinos.protocol.block_receipt
         * @instance
         */
        block_receipt.prototype.network_bandwidth_used = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * block_receipt compute_bandwidth_used.
         * @member {number|Long} compute_bandwidth_used
         * @memberof koinos.protocol.block_receipt
         * @instance
         */
        block_receipt.prototype.compute_bandwidth_used = $util.Long
          ? $util.Long.fromBits(0, 0, true)
          : 0;

        /**
         * block_receipt state_merkle_root.
         * @member {Uint8Array} state_merkle_root
         * @memberof koinos.protocol.block_receipt
         * @instance
         */
        block_receipt.prototype.state_merkle_root = $util.newBuffer([]);

        /**
         * block_receipt events.
         * @member {Array.<koinos.protocol.Ievent_data>} events
         * @memberof koinos.protocol.block_receipt
         * @instance
         */
        block_receipt.prototype.events = $util.emptyArray;

        /**
         * block_receipt transaction_receipts.
         * @member {Array.<koinos.protocol.Itransaction_receipt>} transaction_receipts
         * @memberof koinos.protocol.block_receipt
         * @instance
         */
        block_receipt.prototype.transaction_receipts = $util.emptyArray;

        /**
         * block_receipt logs.
         * @member {Array.<string>} logs
         * @memberof koinos.protocol.block_receipt
         * @instance
         */
        block_receipt.prototype.logs = $util.emptyArray;

        /**
         * Creates a new block_receipt instance using the specified properties.
         * @function create
         * @memberof koinos.protocol.block_receipt
         * @static
         * @param {koinos.protocol.Iblock_receipt=} [properties] Properties to set
         * @returns {koinos.protocol.block_receipt} block_receipt instance
         */
        block_receipt.create = function create(properties) {
          return new block_receipt(properties);
        };

        /**
         * Encodes the specified block_receipt message. Does not implicitly {@link koinos.protocol.block_receipt.verify|verify} messages.
         * @function encode
         * @memberof koinos.protocol.block_receipt
         * @static
         * @param {koinos.protocol.Iblock_receipt} message block_receipt message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        block_receipt.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.id);
          if (
            message.height != null &&
            Object.hasOwnProperty.call(message, "height")
          )
            writer.uint32(/* id 2, wireType 0 =*/ 16).uint64(message.height);
          if (
            message.disk_storage_used != null &&
            Object.hasOwnProperty.call(message, "disk_storage_used")
          )
            writer
              .uint32(/* id 3, wireType 0 =*/ 24)
              .uint64(message.disk_storage_used);
          if (
            message.network_bandwidth_used != null &&
            Object.hasOwnProperty.call(message, "network_bandwidth_used")
          )
            writer
              .uint32(/* id 4, wireType 0 =*/ 32)
              .uint64(message.network_bandwidth_used);
          if (
            message.compute_bandwidth_used != null &&
            Object.hasOwnProperty.call(message, "compute_bandwidth_used")
          )
            writer
              .uint32(/* id 5, wireType 0 =*/ 40)
              .uint64(message.compute_bandwidth_used);
          if (
            message.state_merkle_root != null &&
            Object.hasOwnProperty.call(message, "state_merkle_root")
          )
            writer
              .uint32(/* id 6, wireType 2 =*/ 50)
              .bytes(message.state_merkle_root);
          if (message.events != null && message.events.length)
            for (var i = 0; i < message.events.length; ++i)
              $root.koinos.protocol.event_data
                .encode(
                  message.events[i],
                  writer.uint32(/* id 7, wireType 2 =*/ 58).fork()
                )
                .ldelim();
          if (
            message.transaction_receipts != null &&
            message.transaction_receipts.length
          )
            for (var i = 0; i < message.transaction_receipts.length; ++i)
              $root.koinos.protocol.transaction_receipt
                .encode(
                  message.transaction_receipts[i],
                  writer.uint32(/* id 8, wireType 2 =*/ 66).fork()
                )
                .ldelim();
          if (message.logs != null && message.logs.length)
            for (var i = 0; i < message.logs.length; ++i)
              writer.uint32(/* id 9, wireType 2 =*/ 74).string(message.logs[i]);
          return writer;
        };

        /**
         * Encodes the specified block_receipt message, length delimited. Does not implicitly {@link koinos.protocol.block_receipt.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.protocol.block_receipt
         * @static
         * @param {koinos.protocol.Iblock_receipt} message block_receipt message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        block_receipt.encodeDelimited = function encodeDelimited(
          message,
          writer
        ) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a block_receipt message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.protocol.block_receipt
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.protocol.block_receipt} block_receipt
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        block_receipt.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.protocol.block_receipt();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.id = reader.bytes();
                break;
              case 2:
                message.height = reader.uint64();
                break;
              case 3:
                message.disk_storage_used = reader.uint64();
                break;
              case 4:
                message.network_bandwidth_used = reader.uint64();
                break;
              case 5:
                message.compute_bandwidth_used = reader.uint64();
                break;
              case 6:
                message.state_merkle_root = reader.bytes();
                break;
              case 7:
                if (!(message.events && message.events.length))
                  message.events = [];
                message.events.push(
                  $root.koinos.protocol.event_data.decode(
                    reader,
                    reader.uint32()
                  )
                );
                break;
              case 8:
                if (
                  !(
                    message.transaction_receipts &&
                    message.transaction_receipts.length
                  )
                )
                  message.transaction_receipts = [];
                message.transaction_receipts.push(
                  $root.koinos.protocol.transaction_receipt.decode(
                    reader,
                    reader.uint32()
                  )
                );
                break;
              case 9:
                if (!(message.logs && message.logs.length)) message.logs = [];
                message.logs.push(reader.string());
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a block_receipt message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.protocol.block_receipt
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.protocol.block_receipt} block_receipt
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        block_receipt.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a block_receipt message.
         * @function verify
         * @memberof koinos.protocol.block_receipt
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        block_receipt.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (message.id != null && message.hasOwnProperty("id"))
            if (
              !(
                (message.id && typeof message.id.length === "number") ||
                $util.isString(message.id)
              )
            )
              return "id: buffer expected";
          if (message.height != null && message.hasOwnProperty("height"))
            if (
              !$util.isInteger(message.height) &&
              !(
                message.height &&
                $util.isInteger(message.height.low) &&
                $util.isInteger(message.height.high)
              )
            )
              return "height: integer|Long expected";
          if (
            message.disk_storage_used != null &&
            message.hasOwnProperty("disk_storage_used")
          )
            if (
              !$util.isInteger(message.disk_storage_used) &&
              !(
                message.disk_storage_used &&
                $util.isInteger(message.disk_storage_used.low) &&
                $util.isInteger(message.disk_storage_used.high)
              )
            )
              return "disk_storage_used: integer|Long expected";
          if (
            message.network_bandwidth_used != null &&
            message.hasOwnProperty("network_bandwidth_used")
          )
            if (
              !$util.isInteger(message.network_bandwidth_used) &&
              !(
                message.network_bandwidth_used &&
                $util.isInteger(message.network_bandwidth_used.low) &&
                $util.isInteger(message.network_bandwidth_used.high)
              )
            )
              return "network_bandwidth_used: integer|Long expected";
          if (
            message.compute_bandwidth_used != null &&
            message.hasOwnProperty("compute_bandwidth_used")
          )
            if (
              !$util.isInteger(message.compute_bandwidth_used) &&
              !(
                message.compute_bandwidth_used &&
                $util.isInteger(message.compute_bandwidth_used.low) &&
                $util.isInteger(message.compute_bandwidth_used.high)
              )
            )
              return "compute_bandwidth_used: integer|Long expected";
          if (
            message.state_merkle_root != null &&
            message.hasOwnProperty("state_merkle_root")
          )
            if (
              !(
                (message.state_merkle_root &&
                  typeof message.state_merkle_root.length === "number") ||
                $util.isString(message.state_merkle_root)
              )
            )
              return "state_merkle_root: buffer expected";
          if (message.events != null && message.hasOwnProperty("events")) {
            if (!Array.isArray(message.events)) return "events: array expected";
            for (var i = 0; i < message.events.length; ++i) {
              var error = $root.koinos.protocol.event_data.verify(
                message.events[i]
              );
              if (error) return "events." + error;
            }
          }
          if (
            message.transaction_receipts != null &&
            message.hasOwnProperty("transaction_receipts")
          ) {
            if (!Array.isArray(message.transaction_receipts))
              return "transaction_receipts: array expected";
            for (var i = 0; i < message.transaction_receipts.length; ++i) {
              var error = $root.koinos.protocol.transaction_receipt.verify(
                message.transaction_receipts[i]
              );
              if (error) return "transaction_receipts." + error;
            }
          }
          if (message.logs != null && message.hasOwnProperty("logs")) {
            if (!Array.isArray(message.logs)) return "logs: array expected";
            for (var i = 0; i < message.logs.length; ++i)
              if (!$util.isString(message.logs[i]))
                return "logs: string[] expected";
          }
          return null;
        };

        /**
         * Creates a block_receipt message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.protocol.block_receipt
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.protocol.block_receipt} block_receipt
         */
        block_receipt.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.protocol.block_receipt)
            return object;
          var message = new $root.koinos.protocol.block_receipt();
          if (object.id != null)
            if (typeof object.id === "string")
              $util.base64.decode(
                object.id,
                (message.id = $util.newBuffer($util.base64.length(object.id))),
                0
              );
            else if (object.id.length) message.id = object.id;
          if (object.height != null)
            if ($util.Long)
              (message.height = $util.Long.fromValue(
                object.height
              )).unsigned = true;
            else if (typeof object.height === "string")
              message.height = parseInt(object.height, 10);
            else if (typeof object.height === "number")
              message.height = object.height;
            else if (typeof object.height === "object")
              message.height = new $util.LongBits(
                object.height.low >>> 0,
                object.height.high >>> 0
              ).toNumber(true);
          if (object.disk_storage_used != null)
            if ($util.Long)
              (message.disk_storage_used = $util.Long.fromValue(
                object.disk_storage_used
              )).unsigned = true;
            else if (typeof object.disk_storage_used === "string")
              message.disk_storage_used = parseInt(
                object.disk_storage_used,
                10
              );
            else if (typeof object.disk_storage_used === "number")
              message.disk_storage_used = object.disk_storage_used;
            else if (typeof object.disk_storage_used === "object")
              message.disk_storage_used = new $util.LongBits(
                object.disk_storage_used.low >>> 0,
                object.disk_storage_used.high >>> 0
              ).toNumber(true);
          if (object.network_bandwidth_used != null)
            if ($util.Long)
              (message.network_bandwidth_used = $util.Long.fromValue(
                object.network_bandwidth_used
              )).unsigned = true;
            else if (typeof object.network_bandwidth_used === "string")
              message.network_bandwidth_used = parseInt(
                object.network_bandwidth_used,
                10
              );
            else if (typeof object.network_bandwidth_used === "number")
              message.network_bandwidth_used = object.network_bandwidth_used;
            else if (typeof object.network_bandwidth_used === "object")
              message.network_bandwidth_used = new $util.LongBits(
                object.network_bandwidth_used.low >>> 0,
                object.network_bandwidth_used.high >>> 0
              ).toNumber(true);
          if (object.compute_bandwidth_used != null)
            if ($util.Long)
              (message.compute_bandwidth_used = $util.Long.fromValue(
                object.compute_bandwidth_used
              )).unsigned = true;
            else if (typeof object.compute_bandwidth_used === "string")
              message.compute_bandwidth_used = parseInt(
                object.compute_bandwidth_used,
                10
              );
            else if (typeof object.compute_bandwidth_used === "number")
              message.compute_bandwidth_used = object.compute_bandwidth_used;
            else if (typeof object.compute_bandwidth_used === "object")
              message.compute_bandwidth_used = new $util.LongBits(
                object.compute_bandwidth_used.low >>> 0,
                object.compute_bandwidth_used.high >>> 0
              ).toNumber(true);
          if (object.state_merkle_root != null)
            if (typeof object.state_merkle_root === "string")
              $util.base64.decode(
                object.state_merkle_root,
                (message.state_merkle_root = $util.newBuffer(
                  $util.base64.length(object.state_merkle_root)
                )),
                0
              );
            else if (object.state_merkle_root.length)
              message.state_merkle_root = object.state_merkle_root;
          if (object.events) {
            if (!Array.isArray(object.events))
              throw TypeError(
                ".koinos.protocol.block_receipt.events: array expected"
              );
            message.events = [];
            for (var i = 0; i < object.events.length; ++i) {
              if (typeof object.events[i] !== "object")
                throw TypeError(
                  ".koinos.protocol.block_receipt.events: object expected"
                );
              message.events[i] = $root.koinos.protocol.event_data.fromObject(
                object.events[i]
              );
            }
          }
          if (object.transaction_receipts) {
            if (!Array.isArray(object.transaction_receipts))
              throw TypeError(
                ".koinos.protocol.block_receipt.transaction_receipts: array expected"
              );
            message.transaction_receipts = [];
            for (var i = 0; i < object.transaction_receipts.length; ++i) {
              if (typeof object.transaction_receipts[i] !== "object")
                throw TypeError(
                  ".koinos.protocol.block_receipt.transaction_receipts: object expected"
                );
              message.transaction_receipts[i] =
                $root.koinos.protocol.transaction_receipt.fromObject(
                  object.transaction_receipts[i]
                );
            }
          }
          if (object.logs) {
            if (!Array.isArray(object.logs))
              throw TypeError(
                ".koinos.protocol.block_receipt.logs: array expected"
              );
            message.logs = [];
            for (var i = 0; i < object.logs.length; ++i)
              message.logs[i] = String(object.logs[i]);
          }
          return message;
        };

        /**
         * Creates a plain object from a block_receipt message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.protocol.block_receipt
         * @static
         * @param {koinos.protocol.block_receipt} message block_receipt
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        block_receipt.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.arrays || options.defaults) {
            object.events = [];
            object.transaction_receipts = [];
            object.logs = [];
          }
          if (options.defaults) {
            if (options.bytes === String) object.id = "";
            else {
              object.id = [];
              if (options.bytes !== Array)
                object.id = $util.newBuffer(object.id);
            }
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.height =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else object.height = options.longs === String ? "0" : 0;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.disk_storage_used =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else
              object.disk_storage_used = options.longs === String ? "0" : 0;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.network_bandwidth_used =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else
              object.network_bandwidth_used =
                options.longs === String ? "0" : 0;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.compute_bandwidth_used =
                options.longs === String
                  ? long.toString()
                  : options.longs === Number
                  ? long.toNumber()
                  : long;
            } else
              object.compute_bandwidth_used =
                options.longs === String ? "0" : 0;
            if (options.bytes === String) object.state_merkle_root = "";
            else {
              object.state_merkle_root = [];
              if (options.bytes !== Array)
                object.state_merkle_root = $util.newBuffer(
                  object.state_merkle_root
                );
            }
          }
          if (message.id != null && message.hasOwnProperty("id"))
            object.id =
              options.bytes === String
                ? $util.base64.encode(message.id, 0, message.id.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.id)
                : message.id;
          if (message.height != null && message.hasOwnProperty("height"))
            if (typeof message.height === "number")
              object.height =
                options.longs === String
                  ? String(message.height)
                  : message.height;
            else
              object.height =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.height)
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.height.low >>> 0,
                      message.height.high >>> 0
                    ).toNumber(true)
                  : message.height;
          if (
            message.disk_storage_used != null &&
            message.hasOwnProperty("disk_storage_used")
          )
            if (typeof message.disk_storage_used === "number")
              object.disk_storage_used =
                options.longs === String
                  ? String(message.disk_storage_used)
                  : message.disk_storage_used;
            else
              object.disk_storage_used =
                options.longs === String
                  ? $util.Long.prototype.toString.call(
                      message.disk_storage_used
                    )
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.disk_storage_used.low >>> 0,
                      message.disk_storage_used.high >>> 0
                    ).toNumber(true)
                  : message.disk_storage_used;
          if (
            message.network_bandwidth_used != null &&
            message.hasOwnProperty("network_bandwidth_used")
          )
            if (typeof message.network_bandwidth_used === "number")
              object.network_bandwidth_used =
                options.longs === String
                  ? String(message.network_bandwidth_used)
                  : message.network_bandwidth_used;
            else
              object.network_bandwidth_used =
                options.longs === String
                  ? $util.Long.prototype.toString.call(
                      message.network_bandwidth_used
                    )
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.network_bandwidth_used.low >>> 0,
                      message.network_bandwidth_used.high >>> 0
                    ).toNumber(true)
                  : message.network_bandwidth_used;
          if (
            message.compute_bandwidth_used != null &&
            message.hasOwnProperty("compute_bandwidth_used")
          )
            if (typeof message.compute_bandwidth_used === "number")
              object.compute_bandwidth_used =
                options.longs === String
                  ? String(message.compute_bandwidth_used)
                  : message.compute_bandwidth_used;
            else
              object.compute_bandwidth_used =
                options.longs === String
                  ? $util.Long.prototype.toString.call(
                      message.compute_bandwidth_used
                    )
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.compute_bandwidth_used.low >>> 0,
                      message.compute_bandwidth_used.high >>> 0
                    ).toNumber(true)
                  : message.compute_bandwidth_used;
          if (
            message.state_merkle_root != null &&
            message.hasOwnProperty("state_merkle_root")
          )
            object.state_merkle_root =
              options.bytes === String
                ? $util.base64.encode(
                    message.state_merkle_root,
                    0,
                    message.state_merkle_root.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.state_merkle_root)
                : message.state_merkle_root;
          if (message.events && message.events.length) {
            object.events = [];
            for (var j = 0; j < message.events.length; ++j)
              object.events[j] = $root.koinos.protocol.event_data.toObject(
                message.events[j],
                options
              );
          }
          if (
            message.transaction_receipts &&
            message.transaction_receipts.length
          ) {
            object.transaction_receipts = [];
            for (var j = 0; j < message.transaction_receipts.length; ++j)
              object.transaction_receipts[j] =
                $root.koinos.protocol.transaction_receipt.toObject(
                  message.transaction_receipts[j],
                  options
                );
          }
          if (message.logs && message.logs.length) {
            object.logs = [];
            for (var j = 0; j < message.logs.length; ++j)
              object.logs[j] = message.logs[j];
          }
          return object;
        };

        /**
         * Converts this block_receipt to JSON.
         * @function toJSON
         * @memberof koinos.protocol.block_receipt
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        block_receipt.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return block_receipt;
      })();

      return protocol;
    })();

    koinos.chain = (function () {
      /**
       * Namespace chain.
       * @memberof koinos
       * @namespace
       */
      var chain = {};

      chain.value_type = (function () {
        /**
         * Properties of a value_type.
         * @memberof koinos.chain
         * @interface Ivalue_type
         * @property {google.protobuf.IAny|null} [message_value] value_type message_value
         * @property {number|null} [double_value] value_type double_value
         * @property {number|null} [float_value] value_type float_value
         * @property {number|null} [int32_value] value_type int32_value
         * @property {number|Long|null} [int64_value] value_type int64_value
         * @property {number|null} [uint32_value] value_type uint32_value
         * @property {number|Long|null} [uint64_value] value_type uint64_value
         * @property {number|null} [sint32_value] value_type sint32_value
         * @property {number|Long|null} [sint64_value] value_type sint64_value
         * @property {number|null} [fixed32_value] value_type fixed32_value
         * @property {number|Long|null} [fixed64_value] value_type fixed64_value
         * @property {number|null} [sfixed32_value] value_type sfixed32_value
         * @property {number|Long|null} [sfixed64_value] value_type sfixed64_value
         * @property {boolean|null} [bool_value] value_type bool_value
         * @property {string|null} [string_value] value_type string_value
         * @property {Uint8Array|null} [bytes_value] value_type bytes_value
         */

        /**
         * Constructs a new value_type.
         * @memberof koinos.chain
         * @classdesc Represents a value_type.
         * @implements Ivalue_type
         * @constructor
         * @param {koinos.chain.Ivalue_type=} [properties] Properties to set
         */
        function value_type(properties) {
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * value_type message_value.
         * @member {google.protobuf.IAny|null|undefined} message_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.message_value = null;

        /**
         * value_type double_value.
         * @member {number|null|undefined} double_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.double_value = null;

        /**
         * value_type float_value.
         * @member {number|null|undefined} float_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.float_value = null;

        /**
         * value_type int32_value.
         * @member {number|null|undefined} int32_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.int32_value = null;

        /**
         * value_type int64_value.
         * @member {number|Long|null|undefined} int64_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.int64_value = null;

        /**
         * value_type uint32_value.
         * @member {number|null|undefined} uint32_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.uint32_value = null;

        /**
         * value_type uint64_value.
         * @member {number|Long|null|undefined} uint64_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.uint64_value = null;

        /**
         * value_type sint32_value.
         * @member {number|null|undefined} sint32_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.sint32_value = null;

        /**
         * value_type sint64_value.
         * @member {number|Long|null|undefined} sint64_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.sint64_value = null;

        /**
         * value_type fixed32_value.
         * @member {number|null|undefined} fixed32_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.fixed32_value = null;

        /**
         * value_type fixed64_value.
         * @member {number|Long|null|undefined} fixed64_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.fixed64_value = null;

        /**
         * value_type sfixed32_value.
         * @member {number|null|undefined} sfixed32_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.sfixed32_value = null;

        /**
         * value_type sfixed64_value.
         * @member {number|Long|null|undefined} sfixed64_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.sfixed64_value = null;

        /**
         * value_type bool_value.
         * @member {boolean|null|undefined} bool_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.bool_value = null;

        /**
         * value_type string_value.
         * @member {string|null|undefined} string_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.string_value = null;

        /**
         * value_type bytes_value.
         * @member {Uint8Array|null|undefined} bytes_value
         * @memberof koinos.chain.value_type
         * @instance
         */
        value_type.prototype.bytes_value = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * value_type kind.
         * @member {"message_value"|"double_value"|"float_value"|"int32_value"|"int64_value"|"uint32_value"|"uint64_value"|"sint32_value"|"sint64_value"|"fixed32_value"|"fixed64_value"|"sfixed32_value"|"sfixed64_value"|"bool_value"|"string_value"|"bytes_value"|undefined} kind
         * @memberof koinos.chain.value_type
         * @instance
         */
        Object.defineProperty(value_type.prototype, "kind", {
          get: $util.oneOfGetter(
            ($oneOfFields = [
              "message_value",
              "double_value",
              "float_value",
              "int32_value",
              "int64_value",
              "uint32_value",
              "uint64_value",
              "sint32_value",
              "sint64_value",
              "fixed32_value",
              "fixed64_value",
              "sfixed32_value",
              "sfixed64_value",
              "bool_value",
              "string_value",
              "bytes_value",
            ])
          ),
          set: $util.oneOfSetter($oneOfFields),
        });

        /**
         * Creates a new value_type instance using the specified properties.
         * @function create
         * @memberof koinos.chain.value_type
         * @static
         * @param {koinos.chain.Ivalue_type=} [properties] Properties to set
         * @returns {koinos.chain.value_type} value_type instance
         */
        value_type.create = function create(properties) {
          return new value_type(properties);
        };

        /**
         * Encodes the specified value_type message. Does not implicitly {@link koinos.chain.value_type.verify|verify} messages.
         * @function encode
         * @memberof koinos.chain.value_type
         * @static
         * @param {koinos.chain.Ivalue_type} message value_type message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        value_type.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (
            message.message_value != null &&
            Object.hasOwnProperty.call(message, "message_value")
          )
            $root.google.protobuf.Any.encode(
              message.message_value,
              writer.uint32(/* id 1, wireType 2 =*/ 10).fork()
            ).ldelim();
          if (
            message.double_value != null &&
            Object.hasOwnProperty.call(message, "double_value")
          )
            writer
              .uint32(/* id 2, wireType 1 =*/ 17)
              .double(message.double_value);
          if (
            message.float_value != null &&
            Object.hasOwnProperty.call(message, "float_value")
          )
            writer
              .uint32(/* id 3, wireType 5 =*/ 29)
              .float(message.float_value);
          if (
            message.int32_value != null &&
            Object.hasOwnProperty.call(message, "int32_value")
          )
            writer
              .uint32(/* id 4, wireType 0 =*/ 32)
              .int32(message.int32_value);
          if (
            message.int64_value != null &&
            Object.hasOwnProperty.call(message, "int64_value")
          )
            writer
              .uint32(/* id 5, wireType 0 =*/ 40)
              .int64(message.int64_value);
          if (
            message.uint32_value != null &&
            Object.hasOwnProperty.call(message, "uint32_value")
          )
            writer
              .uint32(/* id 6, wireType 0 =*/ 48)
              .uint32(message.uint32_value);
          if (
            message.uint64_value != null &&
            Object.hasOwnProperty.call(message, "uint64_value")
          )
            writer
              .uint32(/* id 7, wireType 0 =*/ 56)
              .uint64(message.uint64_value);
          if (
            message.sint32_value != null &&
            Object.hasOwnProperty.call(message, "sint32_value")
          )
            writer
              .uint32(/* id 8, wireType 0 =*/ 64)
              .sint32(message.sint32_value);
          if (
            message.sint64_value != null &&
            Object.hasOwnProperty.call(message, "sint64_value")
          )
            writer
              .uint32(/* id 9, wireType 0 =*/ 72)
              .sint64(message.sint64_value);
          if (
            message.fixed32_value != null &&
            Object.hasOwnProperty.call(message, "fixed32_value")
          )
            writer
              .uint32(/* id 10, wireType 5 =*/ 85)
              .fixed32(message.fixed32_value);
          if (
            message.fixed64_value != null &&
            Object.hasOwnProperty.call(message, "fixed64_value")
          )
            writer
              .uint32(/* id 11, wireType 1 =*/ 89)
              .fixed64(message.fixed64_value);
          if (
            message.sfixed32_value != null &&
            Object.hasOwnProperty.call(message, "sfixed32_value")
          )
            writer
              .uint32(/* id 12, wireType 5 =*/ 101)
              .sfixed32(message.sfixed32_value);
          if (
            message.sfixed64_value != null &&
            Object.hasOwnProperty.call(message, "sfixed64_value")
          )
            writer
              .uint32(/* id 13, wireType 1 =*/ 105)
              .sfixed64(message.sfixed64_value);
          if (
            message.bool_value != null &&
            Object.hasOwnProperty.call(message, "bool_value")
          )
            writer
              .uint32(/* id 14, wireType 0 =*/ 112)
              .bool(message.bool_value);
          if (
            message.string_value != null &&
            Object.hasOwnProperty.call(message, "string_value")
          )
            writer
              .uint32(/* id 15, wireType 2 =*/ 122)
              .string(message.string_value);
          if (
            message.bytes_value != null &&
            Object.hasOwnProperty.call(message, "bytes_value")
          )
            writer
              .uint32(/* id 16, wireType 2 =*/ 130)
              .bytes(message.bytes_value);
          return writer;
        };

        /**
         * Encodes the specified value_type message, length delimited. Does not implicitly {@link koinos.chain.value_type.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.chain.value_type
         * @static
         * @param {koinos.chain.Ivalue_type} message value_type message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        value_type.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a value_type message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.chain.value_type
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.chain.value_type} value_type
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        value_type.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.chain.value_type();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.message_value = $root.google.protobuf.Any.decode(
                  reader,
                  reader.uint32()
                );
                break;
              case 2:
                message.double_value = reader.double();
                break;
              case 3:
                message.float_value = reader.float();
                break;
              case 4:
                message.int32_value = reader.int32();
                break;
              case 5:
                message.int64_value = reader.int64();
                break;
              case 6:
                message.uint32_value = reader.uint32();
                break;
              case 7:
                message.uint64_value = reader.uint64();
                break;
              case 8:
                message.sint32_value = reader.sint32();
                break;
              case 9:
                message.sint64_value = reader.sint64();
                break;
              case 10:
                message.fixed32_value = reader.fixed32();
                break;
              case 11:
                message.fixed64_value = reader.fixed64();
                break;
              case 12:
                message.sfixed32_value = reader.sfixed32();
                break;
              case 13:
                message.sfixed64_value = reader.sfixed64();
                break;
              case 14:
                message.bool_value = reader.bool();
                break;
              case 15:
                message.string_value = reader.string();
                break;
              case 16:
                message.bytes_value = reader.bytes();
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a value_type message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.chain.value_type
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.chain.value_type} value_type
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        value_type.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a value_type message.
         * @function verify
         * @memberof koinos.chain.value_type
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        value_type.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          var properties = {};
          if (
            message.message_value != null &&
            message.hasOwnProperty("message_value")
          ) {
            properties.kind = 1;
            {
              var error = $root.google.protobuf.Any.verify(
                message.message_value
              );
              if (error) return "message_value." + error;
            }
          }
          if (
            message.double_value != null &&
            message.hasOwnProperty("double_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (typeof message.double_value !== "number")
              return "double_value: number expected";
          }
          if (
            message.float_value != null &&
            message.hasOwnProperty("float_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (typeof message.float_value !== "number")
              return "float_value: number expected";
          }
          if (
            message.int32_value != null &&
            message.hasOwnProperty("int32_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (!$util.isInteger(message.int32_value))
              return "int32_value: integer expected";
          }
          if (
            message.int64_value != null &&
            message.hasOwnProperty("int64_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (
              !$util.isInteger(message.int64_value) &&
              !(
                message.int64_value &&
                $util.isInteger(message.int64_value.low) &&
                $util.isInteger(message.int64_value.high)
              )
            )
              return "int64_value: integer|Long expected";
          }
          if (
            message.uint32_value != null &&
            message.hasOwnProperty("uint32_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (!$util.isInteger(message.uint32_value))
              return "uint32_value: integer expected";
          }
          if (
            message.uint64_value != null &&
            message.hasOwnProperty("uint64_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (
              !$util.isInteger(message.uint64_value) &&
              !(
                message.uint64_value &&
                $util.isInteger(message.uint64_value.low) &&
                $util.isInteger(message.uint64_value.high)
              )
            )
              return "uint64_value: integer|Long expected";
          }
          if (
            message.sint32_value != null &&
            message.hasOwnProperty("sint32_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (!$util.isInteger(message.sint32_value))
              return "sint32_value: integer expected";
          }
          if (
            message.sint64_value != null &&
            message.hasOwnProperty("sint64_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (
              !$util.isInteger(message.sint64_value) &&
              !(
                message.sint64_value &&
                $util.isInteger(message.sint64_value.low) &&
                $util.isInteger(message.sint64_value.high)
              )
            )
              return "sint64_value: integer|Long expected";
          }
          if (
            message.fixed32_value != null &&
            message.hasOwnProperty("fixed32_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (!$util.isInteger(message.fixed32_value))
              return "fixed32_value: integer expected";
          }
          if (
            message.fixed64_value != null &&
            message.hasOwnProperty("fixed64_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (
              !$util.isInteger(message.fixed64_value) &&
              !(
                message.fixed64_value &&
                $util.isInteger(message.fixed64_value.low) &&
                $util.isInteger(message.fixed64_value.high)
              )
            )
              return "fixed64_value: integer|Long expected";
          }
          if (
            message.sfixed32_value != null &&
            message.hasOwnProperty("sfixed32_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (!$util.isInteger(message.sfixed32_value))
              return "sfixed32_value: integer expected";
          }
          if (
            message.sfixed64_value != null &&
            message.hasOwnProperty("sfixed64_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (
              !$util.isInteger(message.sfixed64_value) &&
              !(
                message.sfixed64_value &&
                $util.isInteger(message.sfixed64_value.low) &&
                $util.isInteger(message.sfixed64_value.high)
              )
            )
              return "sfixed64_value: integer|Long expected";
          }
          if (
            message.bool_value != null &&
            message.hasOwnProperty("bool_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (typeof message.bool_value !== "boolean")
              return "bool_value: boolean expected";
          }
          if (
            message.string_value != null &&
            message.hasOwnProperty("string_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (!$util.isString(message.string_value))
              return "string_value: string expected";
          }
          if (
            message.bytes_value != null &&
            message.hasOwnProperty("bytes_value")
          ) {
            if (properties.kind === 1) return "kind: multiple values";
            properties.kind = 1;
            if (
              !(
                (message.bytes_value &&
                  typeof message.bytes_value.length === "number") ||
                $util.isString(message.bytes_value)
              )
            )
              return "bytes_value: buffer expected";
          }
          return null;
        };

        /**
         * Creates a value_type message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.chain.value_type
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.chain.value_type} value_type
         */
        value_type.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.chain.value_type) return object;
          var message = new $root.koinos.chain.value_type();
          if (object.message_value != null) {
            if (typeof object.message_value !== "object")
              throw TypeError(
                ".koinos.chain.value_type.message_value: object expected"
              );
            message.message_value = $root.google.protobuf.Any.fromObject(
              object.message_value
            );
          }
          if (object.double_value != null)
            message.double_value = Number(object.double_value);
          if (object.float_value != null)
            message.float_value = Number(object.float_value);
          if (object.int32_value != null)
            message.int32_value = object.int32_value | 0;
          if (object.int64_value != null)
            if ($util.Long)
              (message.int64_value = $util.Long.fromValue(
                object.int64_value
              )).unsigned = false;
            else if (typeof object.int64_value === "string")
              message.int64_value = parseInt(object.int64_value, 10);
            else if (typeof object.int64_value === "number")
              message.int64_value = object.int64_value;
            else if (typeof object.int64_value === "object")
              message.int64_value = new $util.LongBits(
                object.int64_value.low >>> 0,
                object.int64_value.high >>> 0
              ).toNumber();
          if (object.uint32_value != null)
            message.uint32_value = object.uint32_value >>> 0;
          if (object.uint64_value != null)
            if ($util.Long)
              (message.uint64_value = $util.Long.fromValue(
                object.uint64_value
              )).unsigned = true;
            else if (typeof object.uint64_value === "string")
              message.uint64_value = parseInt(object.uint64_value, 10);
            else if (typeof object.uint64_value === "number")
              message.uint64_value = object.uint64_value;
            else if (typeof object.uint64_value === "object")
              message.uint64_value = new $util.LongBits(
                object.uint64_value.low >>> 0,
                object.uint64_value.high >>> 0
              ).toNumber(true);
          if (object.sint32_value != null)
            message.sint32_value = object.sint32_value | 0;
          if (object.sint64_value != null)
            if ($util.Long)
              (message.sint64_value = $util.Long.fromValue(
                object.sint64_value
              )).unsigned = false;
            else if (typeof object.sint64_value === "string")
              message.sint64_value = parseInt(object.sint64_value, 10);
            else if (typeof object.sint64_value === "number")
              message.sint64_value = object.sint64_value;
            else if (typeof object.sint64_value === "object")
              message.sint64_value = new $util.LongBits(
                object.sint64_value.low >>> 0,
                object.sint64_value.high >>> 0
              ).toNumber();
          if (object.fixed32_value != null)
            message.fixed32_value = object.fixed32_value >>> 0;
          if (object.fixed64_value != null)
            if ($util.Long)
              (message.fixed64_value = $util.Long.fromValue(
                object.fixed64_value
              )).unsigned = false;
            else if (typeof object.fixed64_value === "string")
              message.fixed64_value = parseInt(object.fixed64_value, 10);
            else if (typeof object.fixed64_value === "number")
              message.fixed64_value = object.fixed64_value;
            else if (typeof object.fixed64_value === "object")
              message.fixed64_value = new $util.LongBits(
                object.fixed64_value.low >>> 0,
                object.fixed64_value.high >>> 0
              ).toNumber();
          if (object.sfixed32_value != null)
            message.sfixed32_value = object.sfixed32_value | 0;
          if (object.sfixed64_value != null)
            if ($util.Long)
              (message.sfixed64_value = $util.Long.fromValue(
                object.sfixed64_value
              )).unsigned = false;
            else if (typeof object.sfixed64_value === "string")
              message.sfixed64_value = parseInt(object.sfixed64_value, 10);
            else if (typeof object.sfixed64_value === "number")
              message.sfixed64_value = object.sfixed64_value;
            else if (typeof object.sfixed64_value === "object")
              message.sfixed64_value = new $util.LongBits(
                object.sfixed64_value.low >>> 0,
                object.sfixed64_value.high >>> 0
              ).toNumber();
          if (object.bool_value != null)
            message.bool_value = Boolean(object.bool_value);
          if (object.string_value != null)
            message.string_value = String(object.string_value);
          if (object.bytes_value != null)
            if (typeof object.bytes_value === "string")
              $util.base64.decode(
                object.bytes_value,
                (message.bytes_value = $util.newBuffer(
                  $util.base64.length(object.bytes_value)
                )),
                0
              );
            else if (object.bytes_value.length)
              message.bytes_value = object.bytes_value;
          return message;
        };

        /**
         * Creates a plain object from a value_type message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.chain.value_type
         * @static
         * @param {koinos.chain.value_type} message value_type
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        value_type.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (
            message.message_value != null &&
            message.hasOwnProperty("message_value")
          ) {
            object.message_value = $root.google.protobuf.Any.toObject(
              message.message_value,
              options
            );
            if (options.oneofs) object.kind = "message_value";
          }
          if (
            message.double_value != null &&
            message.hasOwnProperty("double_value")
          ) {
            object.double_value =
              options.json && !isFinite(message.double_value)
                ? String(message.double_value)
                : message.double_value;
            if (options.oneofs) object.kind = "double_value";
          }
          if (
            message.float_value != null &&
            message.hasOwnProperty("float_value")
          ) {
            object.float_value =
              options.json && !isFinite(message.float_value)
                ? String(message.float_value)
                : message.float_value;
            if (options.oneofs) object.kind = "float_value";
          }
          if (
            message.int32_value != null &&
            message.hasOwnProperty("int32_value")
          ) {
            object.int32_value = message.int32_value;
            if (options.oneofs) object.kind = "int32_value";
          }
          if (
            message.int64_value != null &&
            message.hasOwnProperty("int64_value")
          ) {
            if (typeof message.int64_value === "number")
              object.int64_value =
                options.longs === String
                  ? String(message.int64_value)
                  : message.int64_value;
            else
              object.int64_value =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.int64_value)
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.int64_value.low >>> 0,
                      message.int64_value.high >>> 0
                    ).toNumber()
                  : message.int64_value;
            if (options.oneofs) object.kind = "int64_value";
          }
          if (
            message.uint32_value != null &&
            message.hasOwnProperty("uint32_value")
          ) {
            object.uint32_value = message.uint32_value;
            if (options.oneofs) object.kind = "uint32_value";
          }
          if (
            message.uint64_value != null &&
            message.hasOwnProperty("uint64_value")
          ) {
            if (typeof message.uint64_value === "number")
              object.uint64_value =
                options.longs === String
                  ? String(message.uint64_value)
                  : message.uint64_value;
            else
              object.uint64_value =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.uint64_value)
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.uint64_value.low >>> 0,
                      message.uint64_value.high >>> 0
                    ).toNumber(true)
                  : message.uint64_value;
            if (options.oneofs) object.kind = "uint64_value";
          }
          if (
            message.sint32_value != null &&
            message.hasOwnProperty("sint32_value")
          ) {
            object.sint32_value = message.sint32_value;
            if (options.oneofs) object.kind = "sint32_value";
          }
          if (
            message.sint64_value != null &&
            message.hasOwnProperty("sint64_value")
          ) {
            if (typeof message.sint64_value === "number")
              object.sint64_value =
                options.longs === String
                  ? String(message.sint64_value)
                  : message.sint64_value;
            else
              object.sint64_value =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.sint64_value)
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.sint64_value.low >>> 0,
                      message.sint64_value.high >>> 0
                    ).toNumber()
                  : message.sint64_value;
            if (options.oneofs) object.kind = "sint64_value";
          }
          if (
            message.fixed32_value != null &&
            message.hasOwnProperty("fixed32_value")
          ) {
            object.fixed32_value = message.fixed32_value;
            if (options.oneofs) object.kind = "fixed32_value";
          }
          if (
            message.fixed64_value != null &&
            message.hasOwnProperty("fixed64_value")
          ) {
            if (typeof message.fixed64_value === "number")
              object.fixed64_value =
                options.longs === String
                  ? String(message.fixed64_value)
                  : message.fixed64_value;
            else
              object.fixed64_value =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.fixed64_value)
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.fixed64_value.low >>> 0,
                      message.fixed64_value.high >>> 0
                    ).toNumber()
                  : message.fixed64_value;
            if (options.oneofs) object.kind = "fixed64_value";
          }
          if (
            message.sfixed32_value != null &&
            message.hasOwnProperty("sfixed32_value")
          ) {
            object.sfixed32_value = message.sfixed32_value;
            if (options.oneofs) object.kind = "sfixed32_value";
          }
          if (
            message.sfixed64_value != null &&
            message.hasOwnProperty("sfixed64_value")
          ) {
            if (typeof message.sfixed64_value === "number")
              object.sfixed64_value =
                options.longs === String
                  ? String(message.sfixed64_value)
                  : message.sfixed64_value;
            else
              object.sfixed64_value =
                options.longs === String
                  ? $util.Long.prototype.toString.call(message.sfixed64_value)
                  : options.longs === Number
                  ? new $util.LongBits(
                      message.sfixed64_value.low >>> 0,
                      message.sfixed64_value.high >>> 0
                    ).toNumber()
                  : message.sfixed64_value;
            if (options.oneofs) object.kind = "sfixed64_value";
          }
          if (
            message.bool_value != null &&
            message.hasOwnProperty("bool_value")
          ) {
            object.bool_value = message.bool_value;
            if (options.oneofs) object.kind = "bool_value";
          }
          if (
            message.string_value != null &&
            message.hasOwnProperty("string_value")
          ) {
            object.string_value = message.string_value;
            if (options.oneofs) object.kind = "string_value";
          }
          if (
            message.bytes_value != null &&
            message.hasOwnProperty("bytes_value")
          ) {
            object.bytes_value =
              options.bytes === String
                ? $util.base64.encode(
                    message.bytes_value,
                    0,
                    message.bytes_value.length
                  )
                : options.bytes === Array
                ? Array.prototype.slice.call(message.bytes_value)
                : message.bytes_value;
            if (options.oneofs) object.kind = "bytes_value";
          }
          return object;
        };

        /**
         * Converts this value_type to JSON.
         * @function toJSON
         * @memberof koinos.chain.value_type
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        value_type.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return value_type;
      })();

      chain.enum_type = (function () {
        /**
         * Properties of an enum_type.
         * @memberof koinos.chain
         * @interface Ienum_type
         * @property {string|null} [name] enum_type name
         * @property {number|null} [number] enum_type number
         */

        /**
         * Constructs a new enum_type.
         * @memberof koinos.chain
         * @classdesc Represents an enum_type.
         * @implements Ienum_type
         * @constructor
         * @param {koinos.chain.Ienum_type=} [properties] Properties to set
         */
        function enum_type(properties) {
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * enum_type name.
         * @member {string} name
         * @memberof koinos.chain.enum_type
         * @instance
         */
        enum_type.prototype.name = "";

        /**
         * enum_type number.
         * @member {number} number
         * @memberof koinos.chain.enum_type
         * @instance
         */
        enum_type.prototype.number = 0;

        /**
         * Creates a new enum_type instance using the specified properties.
         * @function create
         * @memberof koinos.chain.enum_type
         * @static
         * @param {koinos.chain.Ienum_type=} [properties] Properties to set
         * @returns {koinos.chain.enum_type} enum_type instance
         */
        enum_type.create = function create(properties) {
          return new enum_type(properties);
        };

        /**
         * Encodes the specified enum_type message. Does not implicitly {@link koinos.chain.enum_type.verify|verify} messages.
         * @function encode
         * @memberof koinos.chain.enum_type
         * @static
         * @param {koinos.chain.Ienum_type} message enum_type message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        enum_type.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (
            message.name != null &&
            Object.hasOwnProperty.call(message, "name")
          )
            writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.name);
          if (
            message.number != null &&
            Object.hasOwnProperty.call(message, "number")
          )
            writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.number);
          return writer;
        };

        /**
         * Encodes the specified enum_type message, length delimited. Does not implicitly {@link koinos.chain.enum_type.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.chain.enum_type
         * @static
         * @param {koinos.chain.Ienum_type} message enum_type message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        enum_type.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an enum_type message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.chain.enum_type
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.chain.enum_type} enum_type
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        enum_type.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.chain.enum_type();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.name = reader.string();
                break;
              case 2:
                message.number = reader.int32();
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes an enum_type message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.chain.enum_type
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.chain.enum_type} enum_type
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        enum_type.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an enum_type message.
         * @function verify
         * @memberof koinos.chain.enum_type
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        enum_type.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name)) return "name: string expected";
          if (message.number != null && message.hasOwnProperty("number"))
            if (!$util.isInteger(message.number))
              return "number: integer expected";
          return null;
        };

        /**
         * Creates an enum_type message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.chain.enum_type
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.chain.enum_type} enum_type
         */
        enum_type.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.chain.enum_type) return object;
          var message = new $root.koinos.chain.enum_type();
          if (object.name != null) message.name = String(object.name);
          if (object.number != null) message.number = object.number | 0;
          return message;
        };

        /**
         * Creates a plain object from an enum_type message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.chain.enum_type
         * @static
         * @param {koinos.chain.enum_type} message enum_type
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        enum_type.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.defaults) {
            object.name = "";
            object.number = 0;
          }
          if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
          if (message.number != null && message.hasOwnProperty("number"))
            object.number = message.number;
          return object;
        };

        /**
         * Converts this enum_type to JSON.
         * @function toJSON
         * @memberof koinos.chain.enum_type
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        enum_type.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return enum_type;
      })();

      chain.list_type = (function () {
        /**
         * Properties of a list_type.
         * @memberof koinos.chain
         * @interface Ilist_type
         * @property {Array.<koinos.chain.Ivalue_type>|null} [values] list_type values
         */

        /**
         * Constructs a new list_type.
         * @memberof koinos.chain
         * @classdesc Represents a list_type.
         * @implements Ilist_type
         * @constructor
         * @param {koinos.chain.Ilist_type=} [properties] Properties to set
         */
        function list_type(properties) {
          this.values = [];
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * list_type values.
         * @member {Array.<koinos.chain.Ivalue_type>} values
         * @memberof koinos.chain.list_type
         * @instance
         */
        list_type.prototype.values = $util.emptyArray;

        /**
         * Creates a new list_type instance using the specified properties.
         * @function create
         * @memberof koinos.chain.list_type
         * @static
         * @param {koinos.chain.Ilist_type=} [properties] Properties to set
         * @returns {koinos.chain.list_type} list_type instance
         */
        list_type.create = function create(properties) {
          return new list_type(properties);
        };

        /**
         * Encodes the specified list_type message. Does not implicitly {@link koinos.chain.list_type.verify|verify} messages.
         * @function encode
         * @memberof koinos.chain.list_type
         * @static
         * @param {koinos.chain.Ilist_type} message list_type message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        list_type.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (message.values != null && message.values.length)
            for (var i = 0; i < message.values.length; ++i)
              $root.koinos.chain.value_type
                .encode(
                  message.values[i],
                  writer.uint32(/* id 1, wireType 2 =*/ 10).fork()
                )
                .ldelim();
          return writer;
        };

        /**
         * Encodes the specified list_type message, length delimited. Does not implicitly {@link koinos.chain.list_type.verify|verify} messages.
         * @function encodeDelimited
         * @memberof koinos.chain.list_type
         * @static
         * @param {koinos.chain.Ilist_type} message list_type message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        list_type.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a list_type message from the specified reader or buffer.
         * @function decode
         * @memberof koinos.chain.list_type
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {koinos.chain.list_type} list_type
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        list_type.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.koinos.chain.list_type();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                if (!(message.values && message.values.length))
                  message.values = [];
                message.values.push(
                  $root.koinos.chain.value_type.decode(reader, reader.uint32())
                );
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes a list_type message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof koinos.chain.list_type
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {koinos.chain.list_type} list_type
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        list_type.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a list_type message.
         * @function verify
         * @memberof koinos.chain.list_type
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        list_type.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (message.values != null && message.hasOwnProperty("values")) {
            if (!Array.isArray(message.values)) return "values: array expected";
            for (var i = 0; i < message.values.length; ++i) {
              var error = $root.koinos.chain.value_type.verify(
                message.values[i]
              );
              if (error) return "values." + error;
            }
          }
          return null;
        };

        /**
         * Creates a list_type message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof koinos.chain.list_type
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {koinos.chain.list_type} list_type
         */
        list_type.fromObject = function fromObject(object) {
          if (object instanceof $root.koinos.chain.list_type) return object;
          var message = new $root.koinos.chain.list_type();
          if (object.values) {
            if (!Array.isArray(object.values))
              throw TypeError(".koinos.chain.list_type.values: array expected");
            message.values = [];
            for (var i = 0; i < object.values.length; ++i) {
              if (typeof object.values[i] !== "object")
                throw TypeError(
                  ".koinos.chain.list_type.values: object expected"
                );
              message.values[i] = $root.koinos.chain.value_type.fromObject(
                object.values[i]
              );
            }
          }
          return message;
        };

        /**
         * Creates a plain object from a list_type message. Also converts values to other types if specified.
         * @function toObject
         * @memberof koinos.chain.list_type
         * @static
         * @param {koinos.chain.list_type} message list_type
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        list_type.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.arrays || options.defaults) object.values = [];
          if (message.values && message.values.length) {
            object.values = [];
            for (var j = 0; j < message.values.length; ++j)
              object.values[j] = $root.koinos.chain.value_type.toObject(
                message.values[j],
                options
              );
          }
          return object;
        };

        /**
         * Converts this list_type to JSON.
         * @function toJSON
         * @memberof koinos.chain.list_type
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        list_type.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return list_type;
      })();

      return chain;
    })();

    return koinos;
  })();

  $root.google = (function () {
    /**
     * Namespace google.
     * @exports google
     * @namespace
     */
    var google = {};

    google.protobuf = (function () {
      /**
       * Namespace protobuf.
       * @memberof google
       * @namespace
       */
      var protobuf = {};

      protobuf.Any = (function () {
        /**
         * Properties of an Any.
         * @memberof google.protobuf
         * @interface IAny
         * @property {string|null} [type_url] Any type_url
         * @property {Uint8Array|null} [value] Any value
         */

        /**
         * Constructs a new Any.
         * @memberof google.protobuf
         * @classdesc Represents an Any.
         * @implements IAny
         * @constructor
         * @param {google.protobuf.IAny=} [properties] Properties to set
         */
        function Any(properties) {
          if (properties)
            for (
              var keys = Object.keys(properties), i = 0;
              i < keys.length;
              ++i
            )
              if (properties[keys[i]] != null)
                this[keys[i]] = properties[keys[i]];
        }

        /**
         * Any type_url.
         * @member {string} type_url
         * @memberof google.protobuf.Any
         * @instance
         */
        Any.prototype.type_url = "";

        /**
         * Any value.
         * @member {Uint8Array} value
         * @memberof google.protobuf.Any
         * @instance
         */
        Any.prototype.value = $util.newBuffer([]);

        /**
         * Creates a new Any instance using the specified properties.
         * @function create
         * @memberof google.protobuf.Any
         * @static
         * @param {google.protobuf.IAny=} [properties] Properties to set
         * @returns {google.protobuf.Any} Any instance
         */
        Any.create = function create(properties) {
          return new Any(properties);
        };

        /**
         * Encodes the specified Any message. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
         * @function encode
         * @memberof google.protobuf.Any
         * @static
         * @param {google.protobuf.IAny} message Any message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Any.encode = function encode(message, writer) {
          if (!writer) writer = $Writer.create();
          if (
            message.type_url != null &&
            Object.hasOwnProperty.call(message, "type_url")
          )
            writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.type_url);
          if (
            message.value != null &&
            Object.hasOwnProperty.call(message, "value")
          )
            writer.uint32(/* id 2, wireType 2 =*/ 18).bytes(message.value);
          return writer;
        };

        /**
         * Encodes the specified Any message, length delimited. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
         * @function encodeDelimited
         * @memberof google.protobuf.Any
         * @static
         * @param {google.protobuf.IAny} message Any message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Any.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an Any message from the specified reader or buffer.
         * @function decode
         * @memberof google.protobuf.Any
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {google.protobuf.Any} Any
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Any.decode = function decode(reader, length) {
          if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
          var end = length === undefined ? reader.len : reader.pos + length,
            message = new $root.google.protobuf.Any();
          while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                message.type_url = reader.string();
                break;
              case 2:
                message.value = reader.bytes();
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return message;
        };

        /**
         * Decodes an Any message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof google.protobuf.Any
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {google.protobuf.Any} Any
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Any.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader)) reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Any message.
         * @function verify
         * @memberof google.protobuf.Any
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Any.verify = function verify(message) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (message.type_url != null && message.hasOwnProperty("type_url"))
            if (!$util.isString(message.type_url))
              return "type_url: string expected";
          if (message.value != null && message.hasOwnProperty("value"))
            if (
              !(
                (message.value && typeof message.value.length === "number") ||
                $util.isString(message.value)
              )
            )
              return "value: buffer expected";
          return null;
        };

        /**
         * Creates an Any message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof google.protobuf.Any
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {google.protobuf.Any} Any
         */
        Any.fromObject = function fromObject(object) {
          if (object instanceof $root.google.protobuf.Any) return object;
          var message = new $root.google.protobuf.Any();
          if (object.type_url != null)
            message.type_url = String(object.type_url);
          if (object.value != null)
            if (typeof object.value === "string")
              $util.base64.decode(
                object.value,
                (message.value = $util.newBuffer(
                  $util.base64.length(object.value)
                )),
                0
              );
            else if (object.value.length) message.value = object.value;
          return message;
        };

        /**
         * Creates a plain object from an Any message. Also converts values to other types if specified.
         * @function toObject
         * @memberof google.protobuf.Any
         * @static
         * @param {google.protobuf.Any} message Any
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Any.toObject = function toObject(message, options) {
          if (!options) options = {};
          var object = {};
          if (options.defaults) {
            object.type_url = "";
            if (options.bytes === String) object.value = "";
            else {
              object.value = [];
              if (options.bytes !== Array)
                object.value = $util.newBuffer(object.value);
            }
          }
          if (message.type_url != null && message.hasOwnProperty("type_url"))
            object.type_url = message.type_url;
          if (message.value != null && message.hasOwnProperty("value"))
            object.value =
              options.bytes === String
                ? $util.base64.encode(message.value, 0, message.value.length)
                : options.bytes === Array
                ? Array.prototype.slice.call(message.value)
                : message.value;
          return object;
        };

        /**
         * Converts this Any to JSON.
         * @function toJSON
         * @memberof google.protobuf.Any
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Any.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Any;
      })();

      return protobuf;
    })();

    return google;
  })();

  return $root;
});


/***/ }),

/***/ 9159:
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ 6567:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"nested":{"koinos":{"nested":{"contracts":{"nested":{"token":{"options":{"go_package":"github.com/koinos/koinos-proto-golang/koinos/contracts/token"},"nested":{"name_arguments":{"fields":{}},"name_result":{"fields":{"value":{"type":"string","id":1}}},"symbol_arguments":{"fields":{}},"symbol_result":{"fields":{"value":{"type":"string","id":1}}},"decimals_arguments":{"fields":{}},"decimals_result":{"fields":{"value":{"type":"uint32","id":1}}},"total_supply_arguments":{"fields":{}},"total_supply_result":{"fields":{"value":{"type":"uint64","id":1,"options":{"jstype":"JS_STRING"}}}},"balance_of_arguments":{"fields":{"owner":{"type":"bytes","id":1,"options":{"(btype)":"ADDRESS"}}}},"balance_of_result":{"fields":{"value":{"type":"uint64","id":1,"options":{"jstype":"JS_STRING"}}}},"transfer_arguments":{"fields":{"from":{"type":"bytes","id":1,"options":{"(btype)":"ADDRESS"}},"to":{"type":"bytes","id":2,"options":{"(btype)":"ADDRESS"}},"value":{"type":"uint64","id":3,"options":{"jstype":"JS_STRING"}}}},"transfer_result":{"fields":{"value":{"type":"bool","id":1}}},"mint_arguments":{"fields":{"to":{"type":"bytes","id":1,"options":{"(btype)":"ADDRESS"}},"value":{"type":"uint64","id":2,"options":{"jstype":"JS_STRING"}}}},"mint_result":{"fields":{"value":{"type":"bool","id":1}}},"balance_object":{"fields":{"value":{"type":"uint64","id":1,"options":{"jstype":"JS_STRING"}}}},"mana_balance_object":{"fields":{"balance":{"type":"uint64","id":1,"options":{"jstype":"JS_STRING"}},"mana":{"type":"uint64","id":2,"options":{"jstype":"JS_STRING"}},"last_mana_update":{"type":"uint64","id":3,"options":{"jstype":"JS_STRING"}}}},"mint_event":{"fields":{"to":{"type":"bytes","id":1,"options":{"(btype)":"ADDRESS"}},"value":{"type":"uint64","id":2,"options":{"jstype":"JS_STRING"}}}},"transfer_event":{"fields":{"from":{"type":"bytes","id":1,"options":{"(btype)":"ADDRESS"}},"to":{"type":"bytes","id":2,"options":{"(btype)":"ADDRESS"}},"value":{"type":"uint64","id":3,"options":{"jstype":"JS_STRING"}}}}}}}}}}}}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(5738);
/******/ 	
/******/ })()
;