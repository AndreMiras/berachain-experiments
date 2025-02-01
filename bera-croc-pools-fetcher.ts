import { gql, GraphQLClient } from "graphql-request";
import { handleMainError } from "./utils.ts";

const POOLS_QUERY = Deno.readTextFileSync(
  new URL("queries/pool-list.graphql", import.meta.url),
);

interface RawPool {
  id: string;
  poolIdx: string;
  base: string;
  quote: string;
  baseAmount: string;
  quoteAmount: string;
  template: {
    feeRate: number;
  };
  baseInfo: {
    address: string;
    symbol: string;
    decimals: number;
    usdValue: string;
  };
  quoteInfo: {
    address: string;
    symbol: string;
    decimals: number;
    usdValue: string;
  };
}

export interface FormattedPool {
  id: string;
  poolIdx: number;
  base: string;
  quote: string;
  baseAmount: bigint;
  quoteAmount: bigint;
  fee: number;
}

export class PoolFetcher {
  private client: GraphQLClient;

  constructor() {
    this.client = new GraphQLClient(
      "https://api.goldsky.com/api/public/project_clq1h5ct0g4a201x18tfte5iv/subgraphs/bgt-subgraph/v1000000/gn",
    );
  }

  async fetchPools(pageSize: number = 100): Promise<FormattedPool[]> {
    const variables = {
      keyword: "",
      skip: 0,
      first: pageSize,
      order: "tvlUsd",
      orderDirection: "desc",
    };

    const data = await this.client.request<{ pools: RawPool[] }>(
      POOLS_QUERY,
      variables,
    );
    return this.formatPools(data.pools);
  }

  private formatPools(rawPools: RawPool[]): FormattedPool[] {
    return rawPools.map((pool) => ({
      id: pool.id,
      poolIdx: Number(pool.poolIdx),
      base: pool.base,
      quote: pool.quote.toLowerCase(),
      baseAmount: this.parseAmount(pool.baseAmount, pool.baseInfo.decimals),
      quoteAmount: this.parseAmount(pool.quoteAmount, pool.quoteInfo.decimals),
      fee: pool.template.feeRate / 10000, // Convert basis points to percentage (e.g., 3000 -> 0.3)
    }));
  }

  private parseAmount(amount: string, decimals: number): bigint {
    // Convert string amount to BigInt, considering decimals
    const [whole, fraction = ""] = amount.split(".");
    const paddedFraction = fraction.padEnd(decimals, "0");
    return BigInt(whole + paddedFraction);
  }
}

// Usage example:
const main = async () => {
  const fetcher = new PoolFetcher();
  try {
    const pools = await fetcher.fetchPools();
    console.log("Fetched pools:", pools);
  } catch (error) {
    console.error("Failed to fetch pools:", error);
  }
};

import.meta.main && main().catch(handleMainError);
