/**
 * CLI tool to quote token swap prices on Berachain by calling previewMultiSwap.
 * Gets expected output amount when swapping a specified amount of one token
 * to another through CrocSwap.
 */
import {
  createPublicClient,
  decodeFunctionResult,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  http,
  isAddress,
  parseUnits,
} from "viem";
import { berachainTestnetbArtio } from "viem/chains";
import { Command } from "npm:commander";
import BeraCrocAbi from "./abi/BeraCrocMultiSwap.json" with { type: "json" };
import { handleMainError } from "./utils.ts";
import { getRouterSteps } from "./bartio-bex-router.ts";

const client = createPublicClient({
  chain: berachainTestnetbArtio,
  transport: http(berachainTestnetbArtio.rpcUrls.default.http[0]),
});

const contractAddress = "0x21e2C0AFd058A89FCf7caf3aEA3cB84Ae977B73D";
const wBeraTokenAddress = "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8";
const honeyTokenAddress = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
const defaultFromToken = wBeraTokenAddress;
const defaultToToken = honeyTokenAddress;

export const previewSwap = async (
  fromToken: string,
  toToken: string,
  fromAmountDecimal: number,
) => {
  // Get token symbols for better output
  const [fromTokenSymbol, toTokenSymbol] = await Promise.all([
    client.readContract({
      address: fromToken,
      abi: erc20Abi,
      functionName: "symbol",
    }),
    client.readContract({
      address: toToken,
      abi: erc20Abi,
      functionName: "symbol",
    }),
  ]);
  const fromTokenDecimals = await client.readContract({
    address: fromToken,
    abi: erc20Abi,
    functionName: "decimals",
  });
  const fromAmountRaw = parseUnits(
    fromAmountDecimal.toString(),
    fromTokenDecimals,
  );
  const steps = await getRouterSteps(fromToken, toToken, fromAmountRaw);
  const [quantityOutRaw, predictedQuantityOutRaw] = await client.readContract({
    address: contractAddress,
    abi: BeraCrocAbi,
    functionName: "previewMultiSwap",
    args: [steps, fromAmountRaw],
  });
  const toTokenDecimals = await client.readContract({
    address: toToken,
    abi: erc20Abi,
    functionName: "decimals",
  });
  const quantityOutDecimal = formatUnits(quantityOutRaw, toTokenDecimals);
  const predictedQuantityOutDecimal = formatUnits(
    predictedQuantityOutRaw,
    toTokenDecimals,
  );
  return {
    fromToken: `${fromTokenSymbol} (${fromToken})`,
    toToken: `${toTokenSymbol} (${toToken})`,
    amountIn: fromAmountDecimal,
    quantityOutDecimal,
    predictedQuantityOutDecimal,
  };
};

const createProgram = () => {
  const program = new Command();
  program
    .name("bera-swap-preview")
    .description("Preview a swap on Berachain")
    .version("1.0.0")
    .option(
      "-f, --from-token <address>",
      "Token to swap from",
      defaultFromToken,
    )
    .option("-t, --to-token <address>", "Token to swap to", defaultToToken)
    .option("-a, --amount <number>", "Amount to swap", "1")
    .addHelpText(
      "after",
      `
Example:
  deno run script.ts --from-token 0x7507c1dc16935B82698e4C63f2746A2fCf994dF8 --to-token 0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03 --amount 0.5`,
    )
    .action(async (options) => {
      // Validate addresses
      if (!isAddress(options.fromToken) || !isAddress(options.toToken)) {
        console.error("Invalid token address provided");
        program.help();
      }
      // Validate amount
      const amount = Number(options.amount);
      if (isNaN(amount) || amount <= 0) {
        console.error("Invalid amount provided");
        program.help();
      }
      const result = await previewSwap(
        options.fromToken,
        options.toToken,
        amount,
      );
      console.log(result);
    });
  return program;
};

const main = async () => {
  const program = createProgram();
  await program.parseAsync();
};

import.meta.main && main().catch(handleMainError);
