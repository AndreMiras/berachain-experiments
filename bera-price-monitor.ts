/**
 * Monitor and log token swap prices from Berachain CrocSwap.
 * Continuously fetches quotes and logs results to CSV.
 */

import { Command } from "npm:commander";
import { handleMainError } from "./utils.ts";
import { previewSwap } from "./bera-croc-preview-multi-swap.ts";
import { isAddress } from "viem";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatLogEntry = (result: any) => {
  const timestamp = new Date().toISOString();
  return `${timestamp},${result.quantityOutDecimal},${result.predictedQuantityOutDecimal}\n`;
};

const CSV_HEADER = "timestamp,quantityOut,predictedQuantityOut\n";

const ensureLogFile = async (logFile: string) => {
  try {
    // Try to read the first few bytes to check if file exists and has content
    const file = await Deno.open(logFile, { read: true });
    const buffer = new Uint8Array(CSV_HEADER.length);
    const bytesRead = await file.read(buffer);
    file.close();

    if (bytesRead === null || bytesRead === 0) {
      // File exists but is empty, write header
      await Deno.writeTextFile(logFile, CSV_HEADER);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // File doesn't exist, create it with header
      await Deno.writeTextFile(logFile, CSV_HEADER);
    } else {
      throw error; // Re-throw other errors
    }
  }
};

const monitorPrices = async (
  fromToken: string,
  toToken: string,
  amount: number,
  intervalSeconds: number,
  logFile: string,
) => {
  await ensureLogFile(logFile);

  console.log(`Starting price monitoring. Logging to ${logFile}`);
  console.log(`Interval: ${intervalSeconds} seconds`);

  while (true) {
    try {
      const result = await previewSwap(fromToken, toToken, amount);
      const logEntry = formatLogEntry(result);

      // Append to log file
      await Deno.writeTextFile(logFile, logEntry, { append: true });

      // Also log to console
      console.log(new Date().toISOString(), result);
    } catch (error) {
      console.error("Error getting quote:", error);
    }

    await delay(intervalSeconds * 1000);
  }
};

const createProgram = () => {
  const program = new Command();
  program
    .name("bera-price-monitor")
    .description("Monitor and log Berachain swap prices")
    .version("1.0.0")
    .requiredOption("-f, --from-token <address>", "Token to swap from")
    .requiredOption("-t, --to-token <address>", "Token to swap to")
    .option("-a, --amount <number>", "Amount to swap", "1")
    .option("-i, --interval <seconds>", "Monitoring interval in seconds", "10")
    .option("-l, --log-file <path>", "Log file path", "swap_quotes.csv")
    .action(async (options) => {
      // Validate addresses
      if (!isAddress(options.fromToken) || !isAddress(options.toToken)) {
        throw new Error("Invalid token address provided");
      }

      const amount = Number(options.amount);
      const interval = Number(options.interval);

      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount provided");
      }
      if (isNaN(interval) || interval <= 0) {
        throw new Error("Invalid interval provided");
      }

      await monitorPrices(
        options.fromToken,
        options.toToken,
        amount,
        interval,
        options.logFile,
      );
    });
  return program;
};

const main = async () => {
  const program = createProgram();
  await program.parseAsync();
};

import.meta.main && main().catch(handleMainError);
