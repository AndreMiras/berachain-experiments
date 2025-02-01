/**
 * Adapter module to convert between Croc DEX pool format and Router pool format.
 * Provides functions to transform pool data while preserving necessary metadata.
 * Maintains lowercase consistency for token addresses and handles fee conversions.
 */
import type { Address } from "abitype";
import type { FormattedPool as CrocPool } from "./bera-croc-pools-fetcher.ts";
import type { Pool as RouterPool } from "./basic-router.ts";
import { Router } from "./basic-router.ts";
import { PoolFetcher } from "./bera-croc-pools-fetcher.ts";
import { getAddress } from "viem";

export interface RouterStep {
  poolIdx: number;
  pool: Address;
  base: Address; // tokenIn
  quote: Address; // tokenOut
  fee: number; // In basis points (e.g., 3000 for 0.3%)
}

interface PoolMetadata {
  id: string;
  poolIdx: number;
}

export interface EnhancedRouterPool extends RouterPool, PoolMetadata {}

/** Creates base router pool format from Croc pool format */
const createBaseRouterPool = (crocPool: CrocPool): RouterPool => ({
  token0: crocPool.base.toLowerCase(),
  token1: crocPool.quote.toLowerCase(),
  reserve0: crocPool.baseAmount,
  reserve1: crocPool.quoteAmount,
  fee: crocPool.fee,
});

/** Converts array of Croc pools to basic router pool format */
export const adaptCrocPoolsToRouterFormat = (
  crocPools: CrocPool[],
): RouterPool[] => crocPools.map(createBaseRouterPool);

/** Converts array of Croc pools to router format with metadata */
export const adaptCrocPoolsWithMetadata = (
  crocPools: CrocPool[],
): EnhancedRouterPool[] =>
  crocPools.map((crocPool) => ({
    ...createBaseRouterPool(crocPool),
    id: crocPool.id,
    poolIdx: crocPool.poolIdx,
  }));

/**
 * Gets optimal route steps for swapping tokenIn to tokenOut
 * Fetches pools, finds best path and formats steps for contract
 */
export const getCustomRouterSteps = async (
  tokenIn: Address,
  tokenOut: Address,
  amountIn: bigint,
): Promise<RouterStep[]> => {
  const poolFetcher = new PoolFetcher();
  const crocPools = await poolFetcher.fetchPools();
  const routerPools = adaptCrocPoolsWithMetadata(crocPools);
  const router = new Router(routerPools);

  const maxHops = 3;
  const route = router.findBestRoute(
    tokenIn.toLowerCase(),
    tokenOut.toLowerCase(),
    amountIn,
    maxHops,
  );
  if (!route) {
    throw new Error(`No route found from ${tokenIn} to ${tokenOut}`);
  }
  const steps = route.pools.map((pool, i) => ({
    poolIdx: (pool as EnhancedRouterPool).poolIdx,
    pool: getAddress(
      pool.token0 === route.path[i].toLowerCase() ? pool.token0 : pool.token1,
    ),
    base: getAddress(pool.token0),
    quote: getAddress(pool.token1),
    fee: Math.floor(pool.fee * 10000),
  }));
  return steps;
};
