# Berachain Experiments

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

## Continuous swap price monitoring

Monitor and log swap price of a pair.

```sh
deno run --allow-all bera-price-monitor.ts   --from-token 0x0E4aaF1351de4c0264C5c7056Ef3777b41BD8e03   --to-token 0x05D0dD5135E3eF3aDE32a9eF9Cb06e8D37A6795D   --amount 1   --interval 10   --log-file honey_usdt_quotes.csv
```

## Vault Router Redeem

Use the Vault contract to redeem an asset (e.g. USDT) from HONEY.

```sh
deno run --allow-all bera-redeem.ts \
--token 0x05D0dD5135E3eF3aDE32a9eF9Cb06e8D37A6795D \
--amount 1.5
```
