import { describe, it } from "jsr:@std/testing/bdd";
import { assert, assertEquals } from "jsr:@std/assert";
import { Router } from "./basic-router.ts";

describe("DEX Router", () => {
  // Test setup helper
  const setupBasicPools = () => [
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
    {
      token0: "USDC",
      token1: "WBTC",
      reserve0: BigInt(2000000) * BigInt(1e6), // 2M USDC
      reserve1: BigInt(40) * BigInt(1e8), // 40 WBTC
      fee: 0.003,
    },
  ];

  describe("Router construction", () => {
    it("should initialize with empty pools", () => {
      const router = new Router([]);
      assert(router);
    });

    it("should initialize with valid pools", () => {
      const pools = setupBasicPools();
      const router = new Router(pools);
      assert(router);
    });
  });

  describe("Route finding", () => {
    it("should find most efficient route", () => {
      const pools = setupBasicPools();
      const router = new Router(pools);
      const amountIn = BigInt(10000) * BigInt(1e6); // 10,000 USDC

      const route = router.findBestRoute("USDC", "WBTC", amountIn);

      assert(route !== null);
      assertEquals(route.path[0], "USDC");
      assertEquals(route.path[route.path.length - 1], "WBTC");

      // Let's calculate both direct and indirect path outputs to verify we found the best one
      const directPool = pools[2]; // USDC-WBTC pool
      assertEquals([directPool.token0, directPool.token1], ["USDC", "WBTC"]);
      const amountInWithFee = amountIn * BigInt(997) / BigInt(1000);
      const directOutput = (amountInWithFee * directPool.reserve1) /
        (directPool.reserve0 + amountInWithFee);

      assert(
        route.outputAmount >= directOutput,
        "Router should find path with output at least as good as direct route",
      );
    });

    it("should find indirect route through intermediate token", () => {
      const pools = setupBasicPools().slice(0, 2); // Only USDC-ETH and ETH-WBTC pools
      const router = new Router(pools);
      const amountIn = BigInt(10000) * BigInt(1e6); // 10,000 USDC

      const route = router.findBestRoute("USDC", "WBTC", amountIn);

      assert(route !== null);
      assertEquals(route.pools.length, 2);
      assertEquals(route.path.length, 3);
      assertEquals(route.path[0], "USDC");
      assertEquals(route.path[1], "ETH");
      assertEquals(route.path[2], "WBTC");
    });

    it("should return null for impossible routes", () => {
      const pools = setupBasicPools();
      const router = new Router(pools);
      const amountIn = BigInt(10000) * BigInt(1e6);

      const route = router.findBestRoute("USDC", "NONEXISTENT", amountIn);
      assertEquals(route, null);
    });

    it("should respect maxHops parameter", () => {
      const pools = setupBasicPools();
      const router = new Router(pools);
      const amountIn = BigInt(10000) * BigInt(1e6);

      const route = router.findBestRoute("USDC", "WBTC", amountIn, 1);

      assert(route !== null);
      assert(route.pools.length <= 1);
      assert(route.path.length <= 2);
    });
  });

  describe("Output calculation", () => {
    it("should calculate correct output amount for simple swap", () => {
      const pools = setupBasicPools();
      const router = new Router(pools);
      const amountIn = BigInt(1000) * BigInt(1e6); // 1000 USDC

      const route = router.findBestRoute("USDC", "ETH", amountIn);

      assert(route !== null);
      assert(route.outputAmount > BigInt(0));

      // Calculate expected output manually using constant product formula
      // (accounting for 0.3% fee)
      const pool = pools[0];
      const amountInWithFee = amountIn * BigInt(997) / BigInt(1000);
      const expectedOutput = (amountInWithFee * pool.reserve1) /
        (pool.reserve0 + amountInWithFee);

      assertEquals(route.outputAmount, expectedOutput);
    });

    it("should handle zero input amount", () => {
      const pools = setupBasicPools();
      const router = new Router(pools);
      const amountIn = BigInt(0);

      const route = router.findBestRoute("USDC", "ETH", amountIn);

      assert(route !== null);
      assertEquals(route.outputAmount, BigInt(0));
    });
  });

  describe("Edge cases", () => {
    it("should handle same token input and output", () => {
      const pools = setupBasicPools();
      const router = new Router(pools);
      const amountIn = BigInt(1000) * BigInt(1e6);

      const route = router.findBestRoute("USDC", "USDC", amountIn);
      assertEquals(route, null);
    });

    it("should handle empty pools", () => {
      const pools = [
        {
          token0: "USDC",
          token1: "ETH",
          reserve0: BigInt(0),
          reserve1: BigInt(0),
          fee: 0.003,
        },
      ];
      const router = new Router(pools);
      const amountIn = BigInt(1000) * BigInt(1e6);

      const route = router.findBestRoute("USDC", "ETH", amountIn);
      assert(route !== null);
      assertEquals(route.outputAmount, BigInt(0));
    });
  });
});
