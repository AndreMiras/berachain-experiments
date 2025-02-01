import { assertEquals } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";
import {
  adaptCrocPoolsToRouterFormat,
  adaptCrocPoolsWithMetadata,
} from "./pool-adapter.ts";

describe("Pool Adapter", () => {
  const sampleCrocPool = {
    id: "0x123",
    poolIdx: 36000,
    base: "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
    quote: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
    baseAmount: BigInt("1000000000000000000"),
    quoteAmount: BigInt("2000000000000000000"),
    fee: 0.003,
  };

  describe("adaptCrocPoolsToRouterFormat", () => {
    it("should convert a single pool correctly", () => {
      const result = adaptCrocPoolsToRouterFormat([sampleCrocPool]);
      assertEquals(result.length, 1);
      assertEquals(result[0], {
        token0: sampleCrocPool.base.toLowerCase(),
        token1: sampleCrocPool.quote.toLowerCase(),
        reserve0: sampleCrocPool.baseAmount,
        reserve1: sampleCrocPool.quoteAmount,
        fee: sampleCrocPool.fee,
      });
    });

    it("should handle empty array", () => {
      const result = adaptCrocPoolsToRouterFormat([]);
      assertEquals(result.length, 0);
    });

    it("should handle multiple pools", () => {
      const pools = [sampleCrocPool, { ...sampleCrocPool, id: "0x456" }];
      const result = adaptCrocPoolsToRouterFormat(pools);
      assertEquals(result.length, 2);
    });

    it("should convert addresses to lowercase", () => {
      const mixedCasePool = {
        ...sampleCrocPool,
        base: "0xAaAA0000AaAa",
        quote: "0xBBBb1111bBBb",
      };
      const result = adaptCrocPoolsToRouterFormat([mixedCasePool]);
      assertEquals(result[0].token0, mixedCasePool.base.toLowerCase());
      assertEquals(result[0].token1, mixedCasePool.quote.toLowerCase());
    });
  });

  describe("adaptCrocPoolsWithMetadata", () => {
    it("should preserve metadata while converting pool format", () => {
      const result = adaptCrocPoolsWithMetadata([sampleCrocPool]);
      assertEquals(result.length, 1);
      assertEquals(result[0], {
        token0: sampleCrocPool.base.toLowerCase(),
        token1: sampleCrocPool.quote.toLowerCase(),
        reserve0: sampleCrocPool.baseAmount,
        reserve1: sampleCrocPool.quoteAmount,
        fee: sampleCrocPool.fee,
        id: sampleCrocPool.id,
        poolIdx: sampleCrocPool.poolIdx,
      });
    });

    it("should handle empty array with metadata", () => {
      const result = adaptCrocPoolsWithMetadata([]);
      assertEquals(result.length, 0);
    });

    it("should preserve metadata for multiple pools", () => {
      const pools = [
        sampleCrocPool,
        { ...sampleCrocPool, id: "0x789", poolIdx: 36001 },
      ];
      const result = adaptCrocPoolsWithMetadata(pools);

      assertEquals(result.length, 2);
      assertEquals(result[0].id, "0x123");
      assertEquals(result[0].poolIdx, 36000);
      assertEquals(result[1].id, "0x789");
      assertEquals(result[1].poolIdx, 36001);
    });

    it("should handle bigint values correctly", () => {
      const pool = {
        ...sampleCrocPool,
        baseAmount: BigInt("123456789000000000000"),
        quoteAmount: BigInt("987654321000000000000"),
      };
      const result = adaptCrocPoolsWithMetadata([pool]);
      assertEquals(result[0].reserve0, pool.baseAmount);
      assertEquals(result[0].reserve1, pool.quoteAmount);
    });
  });
});
