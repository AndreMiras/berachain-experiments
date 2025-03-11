export interface Pool {
  token0: string;
  token1: string;
  reserve0: bigint;
  reserve1: bigint;
  fee: number; // e.g., 0.003 for 0.3%
}

export interface Route {
  pools: Pool[];
  path: string[];
  outputAmount: bigint;
}

export class Router {
  private pools: Map<string, Pool[]>;

  constructor(pools: Pool[]) {
    // Initialize pools map for quick lookup
    this.pools = new Map();
    for (const pool of pools) {
      const key0 = `${pool.token0}-${pool.token1}`;
      const key1 = `${pool.token1}-${pool.token0}`;

      if (!this.pools.has(key0)) this.pools.set(key0, []);
      if (!this.pools.has(key1)) this.pools.set(key1, []);

      this.pools.get(key0)!.push(pool);
      this.pools.get(key1)!.push(pool);
    }
  }

  findBestRoute(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    maxHops: number = 3,
  ): Route | null {
    const visited = new Set<string>();
    let bestRoute: Route | null = null;

    const findRoutes = (
      currentToken: string,
      targetToken: string,
      currentAmount: bigint,
      path: string[],
      usedPools: Pool[],
      depth: number,
    ) => {
      // Check depth before exploring new paths
      if (depth >= maxHops && currentToken !== targetToken) return;
      visited.add(currentToken);

      // Find all pools containing the current token
      for (const [key, pools] of this.pools.entries()) {
        if (!key.includes(currentToken)) continue;

        for (const pool of pools) {
          const otherToken = pool.token0 === currentToken
            ? pool.token1
            : pool.token0;
          if (visited.has(otherToken)) continue;

          // Calculate output amount
          const outputAmount = this.calculateOutputAmount(
            currentAmount,
            pool,
            currentToken === pool.token0,
          );

          const newPath = [...path, otherToken];
          const newPools = [...usedPools, pool];

          if (otherToken === targetToken) {
            // Found a complete path
            if (!bestRoute || outputAmount > bestRoute.outputAmount) {
              bestRoute = {
                pools: newPools,
                path: newPath,
                outputAmount,
              };
            }
          } else {
            // Continue searching
            findRoutes(
              otherToken,
              targetToken,
              outputAmount,
              newPath,
              newPools,
              depth + 1,
            );
          }
        }
      }
      visited.delete(currentToken);
    };

    findRoutes(tokenIn, tokenOut, amountIn, [tokenIn], [], 0);
    return bestRoute;
  }

  private calculateOutputAmount(
    amountIn: bigint,
    pool: Pool,
    isToken0In: boolean,
  ): bigint {
    const reserveIn = isToken0In ? pool.reserve0 : pool.reserve1;
    const reserveOut = isToken0In ? pool.reserve1 : pool.reserve0;

    // Apply fee
    const amountInWithFee = amountIn *
      BigInt(Math.floor((1 - pool.fee) * 1000)) / 1000n;

    // Use constant product formula: x * y = k
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn + amountInWithFee;

    return numerator / denominator;
  }

  // Optional: Implement split routing
  findBestSplitRoute(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    maxSplits: number = 2,
  ): Route[] {
    // Implementation would try different split percentages
    // and compare total output amounts
    // This is more complex and would need optimization strategies
    throw new Error("Not implemented");
  }
}

// Example usage:
const main = () => {
  const pools = [
    {
      token0: "USDC",
      token1: "ETH",
      reserve0: BigInt(1000000) * BigInt(1e6), // 1M USDC
      reserve1: BigInt(500) * BigInt(1e18), // 500 ETH
      fee: 0.003,
    },
    {
      token0: "ETH",
      token1: "WBTC",
      reserve0: BigInt(1000) * BigInt(1e18), // 1000 ETH
      reserve1: BigInt(50) * BigInt(1e8), // 50 WBTC
      fee: 0.003,
    },
  ];

  const router = new Router(pools);
  const bestRoute = router.findBestRoute(
    "USDC",
    "WBTC",
    BigInt(10000) * BigInt(1e6), // 10,000 USDC
  );
  console.log({ bestRoute });
};

import.meta.main && main();
