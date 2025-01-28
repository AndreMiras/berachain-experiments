/**
 * Script to decode a BeraCroc swap given the raw data.
 * The script takes a transaction's data as a command-line argument and decodes it
 * using the `BeraCrocMultiSwap` ABI.
 * It outputs the decoded information in a readable format.
 * Contract address:
 * https://bartio.beratrail.io/address/0x21e2C0AFd058A89FCf7caf3aEA3cB84Ae977B73D
 * Usage example (https://bartio.beratrail.io/tx/0xbab148c1b496138a59b01e8613b2df906ee9aa78bee3361224d95c2ccbe06a63):
 * deno run bera-croc-decoder.ts 0x0b2f6f3f000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000006f05b59d3b20000000000000000000000000000000000000000000000000000306c8987006434d300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000008ca00000000000000000000000000e4aaf1351de4c0264c5c7056ef3777b41bd8e0300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
 * Output:
 * {
 *   functionName: "multiSwap",
 *   args: [
 *     [
 *       {
 *         poolIdx: 36000n,
 *         base: "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
 *         quote: "0x0000000000000000000000000000000000000000",
 *         isBuy: false
 *       }
 *     ],
 *     500000000000000000n,
 *     3489315024225449171n
 *   ]
 * }
 */
import { decodeFunctionData } from "viem";
import BeraCrocMultiSwapAbi from "./abi/BeraCrocMultiSwap.json" with {
  type: "json",
};

const main = async (): Promise<void> => {
  // Get command-line arguments
  const args = Deno.args;
  if (args.length < 1) {
    console.error("Usage: deno run <script> <txData>");
    Deno.exit(1);
  }
  const txData = args[0];
  // Decode the data
  const decodedData = decodeFunctionData({
    abi: BeraCrocMultiSwapAbi,
    data: txData,
  });
  console.log(decodedData);
};

import.meta.main && main().catch(console.error);
