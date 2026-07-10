#!/usr/bin/env node
/**
 * Reproduce the block 32,789,377 state-delta merkle root anomaly against
 * PUBLIC mainnet data, using koilib for the RPC calls.
 *
 * It fetches the stored receipt of block 32,789,377 (12 state delta entries)
 * and the header of block 32,789,378 from a public Koinos API, then computes
 * the delta merkle root two ways:
 *
 *   - over all 12 entries  (the honest delta, as neighbouring blocks prove)
 *   - over 11 entries      (dropping the entry-8 remove tombstone)
 *
 * and compares both against block 32,789,378's previous_state_merkle_root —
 * the consensus-signed fingerprint of block 32,789,377's delta.
 *
 * Expected output: the 11-entry root matches the header, the 12-entry root
 * does not — confirming the header stored the tombstone-drop-bugged root
 * during the January 2026 halt recovery.
 *
 * The merkle computation mirrors koinos-state-db-cpp state_delta.cpp:
 *   leaf pairs (sha256(serialized chain.database_key), sha256(value or ""))
 *   sorted by serialized database_key, tree nodes sha256(left||right),
 *   odd node promoted, root prefixed with multihash 0x1220.
 *
 * Usage: node verify-block-32789377-root.js [rpc-url]
 *   default rpc-url: https://api.koinos.io
 */

const crypto = require("crypto");
const { Provider, Serializer, utils } = require("koilib");

const RPC = process.argv[2] || "https://api.koinos.io";

const BLOCK_377_ID =
  "0x1220a97d7b0567ad55e3b04446a2bef447335cfd676668b069544b04a4719146d586";
const BLOCK_378_ID =
  "0x122086d9090d82fceb9900293bd3f870c4d2ac769682a85f997fd847f4f716a96344";
const PHANTOM_KEY = "02076430234253060999996"; // ASCII key of the entry-8 remove

const sha256 = (b) => crypto.createHash("sha256").update(b).digest();
const chainSerializer = new Serializer(utils.ChainTypes);

// ---- the delta merkle root, exactly as state_delta::merkle_root() ----

async function deltaMerkleRoot(entries) {
  const genesisData = await utils.encodeGenesisData(
    {
      entries: entries.map((e) => ({
        space: e.object_space || {},
        key: e.key,
        value: e.value,
      })),
    }
  );

  const pairs = await Promise.all(
    genesisData.entries.map(async (e, i) => ({
      dbKey: await chainSerializer.serialize(e, "database_key"),
      value:
        "value" in entries[i]
          ? utils.decodeBase64url(entries[i].value)
          : new Uint8Array(),
    }))
  );

  const nodes = [];
  for (const { dbKey, value } of pairs) {
    nodes.push(sha256(dbKey));
    nodes.push(sha256(value));
  }

  return `0x${utils.toHexString(utils.multihash(utils.calculateMerkleRoot(nodes)))}`;
}

// ---- main ----

async function main() {
  const provider = new Provider([RPC]);

  console.log(`RPC: ${RPC}\n`);

  const res = await provider.getBlocksById([BLOCK_377_ID, BLOCK_378_ID], {
    return_block: true,
    return_receipt: true,
  });

  const items = res.block_items || [];
  if (items.length !== 2)
    throw new Error(`expected 2 blocks, got ${items.length}`);

  const [b377, b378] = items;

  const entries = b377.receipt?.state_delta_entries || [];
  console.log(`block 32,789,377 stored receipt entries: ${entries.length}`);
  const signedRoot = b378.block.header.previous_state_merkle_root;
  const signedHex = `0x${utils.toHexString(utils.decodeBase64url(signedRoot))}`;

  const root12 = await deltaMerkleRoot(entries);
  const entries11 = entries.filter(
    (e) =>
      !(
        !("value" in e) &&
        Buffer.from(utils.decodeBase64url(e.key)).toString() === PHANTOM_KEY
      )
  );
  if (entries11.length !== entries.length - 1)
    throw new Error("phantom entry not found in receipt");
  const root11 = await deltaMerkleRoot(entries11);

  console.log(`\nsigned root in block 32,789,378 header: ${signedHex}`);
  console.log(`root over all 12 entries:               ${root12}  ${root12 === signedHex ? "MATCH" : "no match"}`);
  console.log(`root over 11 (drop phantom remove):     ${root11}  ${root11 === signedHex ? "MATCH" : "no match"}`);

  console.log("");
  if (root11 === signedHex && root12 !== signedHex) {
    console.log(
      "CONFIRMED: block 32,789,378's header stores the 11-entry (tombstone-dropped)\n" +
      "root, while the honest delta of 32,789,377 has 12 entries. The consensus\n" +
      "anchor for this block is the bugged root baked in during the January 2026\n" +
      "halt recovery..."
    );
  } else if (root12 === signedHex) {
    console.log("UNEXPECTED: the 12-entry root matches — anomaly not reproduced on this API.");
  } else {
    console.log("UNEXPECTED: neither root matches — check the entry decoding against this API.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});