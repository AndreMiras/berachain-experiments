# Berachain Experiments

## Token addresses

- BERA 0x7507c1dc16935B82698e4C63f2746A2fCf994dF8
- HONEY 0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03
- USDT 0x05D0dD5135E3eF3aDE32a9eF9Cb06e8D37A6795D
- STGUSDC 0xd6D83aF58a19Cd14eF3CF6fe848C9A4d21e5727c

## Useful links

- Faucet
  - https://bartio.faucet.berachain.com/
  - https://faucet.quicknode.com/berachain/bartio/
- DEX
  - https://bartio.bex.berachain.com/swap
  - https://bartio.honey.berachain.com/
- Governance BGT
  - https://bartio.station.berachain.com/gauge

## Decode a BeraCroc (BEX) transaction

```sh
deno run bera-croc-decoder.ts 0x0b2f6f3f000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000006f05b59d3b20000000000000000000000000000000000000000000000000000306c8987006434d300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000008ca00000000000000000000000000e4aaf1351de4c0264c5c7056ef3777b41bd8e0300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
```

Output:

```js
{
  functionName: "multiSwap",
  args: [
    [
      {
        poolIdx: 36000n,
        base: "0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03",
        quote: "0x0000000000000000000000000000000000000000",
        isBuy: false
      }
    ],
    500000000000000000n,
    3489315024225449171n
  ]
}
```

## Preview swap price

Quote token swap prices on BeraCroc (BEX) by calling previewMultiSwap.

```sh
deno run --allow-all bera-croc-preview-multi-swap.ts \
--from-token 0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03 \
--to-token 0x05D0dD5135E3eF3aDE32a9eF9Cb06e8D37A6795D \
--amount 1
```

## Swap

Swap STGUSDC for HONEY on BeraCroc MultiSwap (`PRIVATE_KEY` environment variable
required).

```sh
deno run --allow-all bera-croc-multi-swap.ts \
--from-token 0xd6D83aF58a19Cd14eF3CF6fe848C9A4d21e5727c \
--to-token 0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03 \
--amount 2
```

## Continuous swap price monitoring

Monitor and log swap price of a pair.

```sh
deno run --allow-all bera-price-monitor.ts \
--from-token 0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03 \
--to-token 0x05D0dD5135E3eF3aDE32a9eF9Cb06e8D37A6795D \
--amount 1 \
--interval 10 \
--log-file honey_usdt_quotes.csv
```

## Vault Router Redeem

Use the Vault contract to redeem an asset (e.g. USDT) from HONEY (`PRIVATE_KEY`
environment variable required).

```sh
deno run --allow-all bera-redeem.ts \
--token 0x05D0dD5135E3eF3aDE32a9eF9Cb06e8D37A6795D \
--amount 1.5
```

## Farm strategies

### HONEY-STGUSDC

It's currently possible to farm HONEY-STGUSDC taking profit of STGUSDC being
slightly overvalued vs HONEY while swapping it on BeraCroc (BEX) and then
redeeming HONEY -> STGUSDC at 1:1 ratio (minus fees).

```sh
for i in {1..1000}; do
  echo i: $i
  deno run --allow-all bera-croc-multi-swap.ts --from-token 0xd6D83aF58a19Cd14eF3CF6fe848C9A4d21e5727c --to-token 0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03 --max
  deno run --allow-all bera-redeem.ts --token 0xd6D83aF58a19Cd14eF3CF6fe848C9A4d21e5727c --max
  echo i: $i
done
```

### HONEY-USDT

In the same fashion as HONEY-STGUSDC, it's possible to farm HONEY-USDT. However
the Bera Vault Router is often low on USDT making difficult to redeem.
