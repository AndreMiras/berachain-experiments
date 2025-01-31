import { handleHttpError } from "./utils.ts";

/**
 * Fetches optimal swap route from the Berachain Router API.
 * Makes a GET request to determine the best path for swapping tokens.
 *
 * @param fromToken - Address of the token to swap from
 * @param toToken - Address of the token to swap to
 * @param fromAmountRaw - Amount to swap in raw units (with decimals)
 * @returns Array of swap steps with pool indices and token directions
 * @throws {Error} If the API request fails or returns invalid data
 *
 * @example
 * const steps = await getRouterSteps(
 *   "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8",
 *   "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
 *   parseUnits("1.5", 18)
 * );
 */
export const getRouterSteps = async (
  fromToken: string,
  toToken: string,
  fromAmountRaw: bigint,
): Promise<
  Array<{ poolIdx: number; base: string; quote: string; isBuy: boolean }>
> => {
  const response = await fetch(
    `https://bartio-bex-router.berachain.com/dex/route?` +
      `fromAsset=${fromToken}&` +
      `toAsset=${toToken}&` +
      `amount=${fromAmountRaw.toString()}`,
  );
  handleHttpError(response);
  const data = await response.json();
  return data.steps.map((step: any) => ({
    poolIdx: parseInt(step.poolIdx),
    base: step.base.toLowerCase(),
    quote: step.quote.toLowerCase(),
    isBuy: step.isBuy,
  }));
};
