/**
 * CLI tool to execute token swaps on Berachain through CrocSwap.
 * Performs token approvals and executes swaps between specified tokens.
 * Requires PRIVATE_KEY environment variable.
 */
import {
  Account,
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  http,
  isAddress,
  parseUnits,
} from "viem";
import { berachainTestnetbArtio } from "viem/chains";
import { Command } from "npm:commander";
import { privateKeyToAccount } from "viem/accounts";
import BeraCrocAbi from "./abi/BeraCrocMultiSwap.json" with { type: "json" };
import { floorToDigits, getTokenBalance, handleMainError } from "./utils.ts";
import "jsr:@std/dotenv/load";

const client = createPublicClient({
  chain: berachainTestnetbArtio,
  transport: http(berachainTestnetbArtio.rpcUrls.default.http[0]),
});

const contractAddress = "0x21e2C0AFd058A89FCf7caf3aEA3cB84Ae977B73D";
const wBeraTokenAddress = "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8";
const honeyTokenAddress = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
const defaultFromToken = wBeraTokenAddress;
const defaultToToken = honeyTokenAddress;

const getMaxAmount = async (tokenAddress: string, accountAddress: string) => {
  const [balance, decimals, symbol] = await Promise.all([
    client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [accountAddress],
    }),
    client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals",
    }),
    client.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "symbol",
    }),
  ]);

  const balanceDecimal = Number(formatUnits(balance, decimals));
  console.log(`Available balance: ${balanceDecimal} ${symbol}`);
  return balanceDecimal;
};

const executeSwap = async (
  account: Account,
  fromToken: string,
  toToken: string,
  fromAmountDecimal: number,
) => {
  const walletClient = createWalletClient({
    account,
    chain: berachainTestnetbArtio,
    transport: http(),
  });

  const fromTokenDecimals = await client.readContract({
    address: fromToken,
    abi: erc20Abi,
    functionName: "decimals",
  });
  const fromAmountRaw = parseUnits(
    fromAmountDecimal.toString(),
    fromTokenDecimals,
  );

  // Check and set approval if needed
  const currentAllowance = await client.readContract({
    address: fromToken,
    abi: erc20Abi,
    functionName: "allowance",
    args: [account.address, contractAddress],
  });

  if (currentAllowance < fromAmountRaw) {
    console.log("Approving tokens...");
    const approvalHash = await walletClient.writeContract({
      address: fromToken,
      abi: erc20Abi,
      functionName: "approve",
      args: [contractAddress, fromAmountRaw],
    });
    await client.waitForTransactionReceipt({ hash: approvalHash });
    console.log("Approval confirmed");
  }

  // Execute the swap
  console.log("Executing swap...");
  const poolIdx = 36000;
  const steps = [
    {
      poolIdx,
      quote: fromToken,
      base: toToken,
      isBuy: false,
    },
  ];

  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: BeraCrocAbi,
    functionName: "multiSwap",
    args: [steps, fromAmountRaw, 0], // Using 0 as minOut for now, could be made configurable
  });

  console.log("Swap transaction sent:", hash);
  const receipt = await client.waitForTransactionReceipt({ hash });
  console.log("Swap confirmed:", receipt);

  return receipt;
};

const createProgram = () => {
  const program = new Command();
  program
    .name("bera-swap")
    .description("Execute a swap on Berachain")
    .version("1.0.0")
    .option(
      "-f, --from-token <address>",
      "Token to swap from",
      defaultFromToken,
    )
    .option("-t, --to-token <address>", "Token to swap to", defaultToToken)
    .option("-a, --amount <number>", "Amount to swap", "1")
    .option("-m, --max", "Use maximum available balance")
    .addHelpText(
      "after",
      `
Examples:
  # Swap specific amount
  PRIVATE_KEY=your_key deno run script.ts --from-token 0x7507c1dc16935B82698e4C63f2746A2fCf994dF8 --to-token 0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03 --amount 0.5

  # Swap max amount
  PRIVATE_KEY=your_key deno run script.ts --from-token 0x7507... --to-token 0x0E4a... --max`,
    )
    .action(async (options) => {
      // Validate addresses
      if (!isAddress(options.fromToken) || !isAddress(options.toToken)) {
        throw new Error("Invalid token address provided");
      }

      // Get private key from environment
      const privateKey = Deno.env.get("PRIVATE_KEY");
      if (!privateKey) {
        throw new Error("PRIVATE_KEY environment variable not set");
      }

      const account = privateKeyToAccount(privateKey);

      let amountToSwap: number;
      if (options.max) {
        const { balanceNumber, symbol } = await getTokenBalance(
          client,
          options.fromToken,
          account.address,
        );
        console.log(`Available balance: ${balanceNumber} ${symbol}`);
        amountToSwap = floorToDigits(balanceNumber, 2);
      } else {
        amountToSwap = Number(options.amount);
        if (isNaN(amountToSwap) || amountToSwap <= 0) {
          throw new Error("Invalid amount provided");
        }
      }

      await executeSwap(
        account,
        options.fromToken,
        options.toToken,
        amountToSwap,
      );
    });
  return program;
};

const main = async () => {
  const program = createProgram();
  await program.parseAsync();
};

import.meta.main && main().catch(handleMainError);
