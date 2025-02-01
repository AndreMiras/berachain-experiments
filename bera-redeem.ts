/**
 * CLI tool for redeeming HONEY tokens through Berachain's VaultRouter contract.
 * Takes an amount of HONEY and redeems it for a specified token (defaults to USDT).
 * Private key should be provided via PRIVATE_KEY environment variable.
 */
import {
  Account,
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  parseUnits,
} from "viem";
import { berachainTestnetbArtio } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import "jsr:@std/dotenv/load";
import { Command } from "npm:commander";
import vaultRouterAbi from "./abi/VaultRouter.json" with { type: "json" };
import { floorToDigits, getTokenBalance, handleMainError } from "./utils.ts";

// Contract addresses
const usdtTokenAddress = "0x05D0dD5135E3eF3aDE32a9eF9Cb06e8D37A6795D";
const VAULT_ROUTER = "0xAd1782b2a7020631249031618fB1Bd09CD926b31";
const HONEY = "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03";
const DEFAULT_TOKEN = usdtTokenAddress;

// Initialize clients
const publicClient = createPublicClient({
  chain: berachainTestnetbArtio,
  transport: http(),
});

const redeemHoney = async (
  account: Account,
  toToken: string,
  honeyAmount: number,
) => {
  const walletClient = createWalletClient({
    account,
    chain: berachainTestnetbArtio,
    transport: http(),
  });

  const amountBigInt = parseUnits(honeyAmount.toString(), 18);

  // Execute the redeem transaction
  const hash = await walletClient.writeContract({
    address: VAULT_ROUTER,
    abi: vaultRouterAbi,
    functionName: "redeem",
    args: [toToken, amountBigInt, account.address],
  });

  console.log("Redemption transaction sent:", hash);

  // Wait for transaction to be mined
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Transaction confirmed:", receipt);

  return receipt;
};

const createProgram = () => {
  const program = new Command();

  program
    .name("bera-redeem")
    .description("Redeem HONEY for other tokens on Berachain")
    .option(
      "-t, --token <address>",
      "Token address to redeem",
      DEFAULT_TOKEN,
    )
    .option("-a, --amount <number>", "Amount of HONEY to redeem", "1")
    .option("-m, --max", "Redeem maximum available HONEY balance")
    .addHelpText(
      "after",
      `
Examples:
  # Redeem specific amount
  PRIVATE_KEY=your_key deno run script.ts --token 0x1234... --amount 2.5

  # Redeem max amount
  PRIVATE_KEY=your_key deno run script.ts --token 0x1234... --max`,
    )
    .action(async (options) => {
      // Validate token address
      if (!isAddress(options.token)) {
        throw new Error("Invalid token address");
      }

      // Get private key from environment
      const privateKey = Deno.env.get("PRIVATE_KEY");
      if (!privateKey) {
        throw new Error("PRIVATE_KEY environment variable not set");
      }

      const account = privateKeyToAccount(privateKey);

      let amountToRedeem: number;
      if (options.max) {
        const { balanceNumber, symbol } = await getTokenBalance(
          publicClient,
          HONEY,
          account.address,
        );
        console.log(`Available balance: ${balanceNumber} ${symbol}`);
        amountToRedeem = floorToDigits(balanceNumber, 2);
      } else {
        amountToRedeem = Number(options.amount);
        if (isNaN(amountToRedeem) || amountToRedeem <= 0) {
          throw new Error("Invalid amount");
        }
      }

      await redeemHoney(account, options.token, amountToRedeem);
    });

  return program;
};

const main = async () => {
  const program = createProgram();
  await program.parseAsync();
};

import.meta.main && main().catch(handleMainError);
