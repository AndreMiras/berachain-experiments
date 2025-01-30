import { erc20Abi, formatUnits, PublicClient } from "viem";

export interface TokenBalance {
  balance: bigint;
  // Full precision string
  balanceDecimal: string;
  // For convenience in calculations
  balanceNumber: number;
  symbol: string;
  decimals: number;
}

export const handleMainError = (error: unknown) => {
  console.log(error);
  Deno.exit(1);
};

export const getTokenBalance = async (
  client: PublicClient,
  tokenAddress: string,
  accountAddress: string,
): Promise<TokenBalance> => {
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
  const balanceDecimal = formatUnits(balance, decimals);
  return {
    balance,
    balanceDecimal,
    balanceNumber: Number(balanceDecimal),
    symbol,
    decimals,
  };
};

export const floorToDigits = (value: number, digits: number): number => {
  const factor = Math.pow(10, digits);
  return Math.floor(value * factor) / factor;
};
