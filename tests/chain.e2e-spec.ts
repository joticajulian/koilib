/* eslint-disable no-console */
import * as dotenv from "dotenv";
import { Provider } from "../src";

dotenv.config();

jest.setTimeout(300000);

if (!process.env.RPC_NODES)
  throw new Error("env variable RPC_NODES not defined");

const rpcNodes = process.env.RPC_NODES.split(",");
const provider = new Provider(rpcNodes);

const formatDelay = (delay: number): string => {
  if (delay < 60 * 1000) return `${Number(delay / 1000).toFixed(1)}s`;
  if (delay < 3600 * 1000) return `${Number(delay / 60000).toFixed(1)}min`;
  if (delay < 24 * 3600 * 1000)
    return `${Number(delay / 3600000).toFixed(1)}hours`;
  return `${Number(delay / 3600000 / 24).toFixed(1)}days`;
};

describe("Blockchain", () => {
  let currentHeight: number;

  it("should get head info", async () => {
    expect.assertions(1);
    const headInfo = await provider.getHeadInfo();
    expect(headInfo).toStrictEqual({
      head_topology: {
        id: expect.stringContaining("0x1220") as string,
        height: expect.any(String) as string,
        previous: expect.stringContaining("0x1220") as string,
      },
      last_irreversible_block: expect.any(String) as string,
    });
    currentHeight = Number(headInfo.head_topology.height);
    console.log(`current height ${currentHeight}`);
  });

  it("should get blocks by height", async () => {
    expect.assertions(2);
    const blocksResponse = await provider.getBlocks(currentHeight - 9, 10);
    expect(blocksResponse).toStrictEqual(expect.arrayContaining([]));
    expect(blocksResponse.length).toBe(10);

    const periods = blocksResponse
      .map((b, i) => {
        const timestamp = Number(b.block!.header!.timestamp);
        const blockPeriod =
          i > 0
            ? timestamp - Number(blocksResponse[i - 1].block!.header!.timestamp)
            : 0;
        return formatDelay(blockPeriod);
      })
      .slice(1);

    const currentTimestamp = Number(
      blocksResponse[blocksResponse.length - 1].block!.header!.timestamp
    );
    const timeAgo = formatDelay(Date.now() - currentTimestamp);
    console.log(`Block period last blocks: ${periods.join(", ")}
Last block mined ${timeAgo} ago (${new Date(currentTimestamp).toISOString()})`);
  });
});
