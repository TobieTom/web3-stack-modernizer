# web3-stack-modernizer

Migrate your entire Web3 frontend stack in one command. This codemod simultaneously upgrades wagmi v1→v2, ethers v5→v6, and RainbowKit v1→v2 — the three most interdependent libraries in a typical Ethereum frontend — without breaking the connections between them.

## The Problem

Upgrading wagmi, ethers, and RainbowKit independently is error-prone. These libraries share types, provider patterns, and configuration objects that change in lockstep. Running three separate migrations in sequence leaves the codebase in a broken intermediate state on every pass. This codemod treats the full stack as a single atomic migration.

## Supported Migrations

| Library | From | To | Status |
|---|---|---|---|
| wagmi | v1 | v2 | Deterministic |
| ethers | v5 | v6 | Deterministic |
| @rainbow-me/rainbowkit | v1 | v2 | Deterministic + AI cleanup |

The codemod reads your `package.json` and runs only the migrations that apply to your project. If you only have wagmi and ethers (no RainbowKit), only those two transforms run.

## Quickstart

```bash
npx codemod@latest @TobieTom/web3-stack-modernizer
```

Run this from the root of your project. The codemod will detect your stack, apply all safe transforms, and flag the remaining edge cases with `TODO` comments for the AI skill to handle.

## What Gets Automated

### wagmi v1 → v2
- `useContractRead` → `useReadContract`
- `useContractWrite` → `useWriteContract`
- `usePrepareContractWrite` → `useSimulateContract`
- `useWaitForTransaction` → `useWaitForTransactionReceipt`
- `useContractEvent` → `useWatchContractEvent`
- `useContractInfiniteReads` → `useInfiniteReadContracts`
- `WagmiConfig` → `WagmiProvider` (imports + JSX open/close tags)
- `createClient` → `createConfig`
- Import path `wagmi/chains` → `viem/chains`
- Import path `wagmi/connectors/*` → `wagmi/connectors`

### ethers v5 → v6
- `ethers.providers.Web3Provider` → `ethers.BrowserProvider`
- `ethers.providers.JsonRpcProvider` → `ethers.JsonRpcProvider`
- `ethers.providers.StaticJsonRpcProvider` → `ethers.JsonRpcProvider`
- `ethers.utils.parseEther/formatEther/parseUnits/formatUnits` → top-level equivalents
- `ethers.utils.keccak256` → `ethers.keccak256`
- `ethers.utils.arrayify` → `ethers.getBytes`
- `ethers.utils.hexZeroPad` → `ethers.zeroPadValue`
- `ethers.utils.solidityKeccak256` → `ethers.solidityPackedKeccak256`
- `ethers.utils.solidityPack` → `ethers.solidityPacked`
- `ethers.BigNumber.from(x)` → `BigInt(x)`
- `.callStatic.method(args)` → `.method.staticCall(args)`

### RainbowKit v1 → v2
- `<RainbowKitProvider chains={chains}>` → `<RainbowKitProvider>` (chains prop removed)
- `getDefaultWallets({ chains, ...rest })` → `getDefaultWallets({ ...rest })` (chains removed)
- `configureChains(...)` flagged with `TODO` comment for manual removal

## What Needs AI Cleanup

After the deterministic pass, the installed AI skill handles:

1. **`provider.getSigner()` is now async** — adds `await` and makes containing functions `async`
2. **Nested `.callStatic` patterns** — `.connect(signer).callStatic.method()` and stored-callStatic forms
3. **BigNumber arithmetic chains** — `.add().mul().div()` chains → native `bigint` operators
4. **`configureChains` removal** — restructures chains, transports, and connectors into `createConfig`
5. **`QueryClientProvider` wrapping** — wraps the provider tree with TanStack Query (required by wagmi v2)
6. **`contract.address` → `contract.target`** — applied only when the variable is a confirmed `Contract` instance
7. **TypeScript type annotations** — `ethers.providers.Provider` → `ethers.Provider`, `ethers.ContractInterface` → `ethers.InterfaceAbi`, `ethers.BigNumber` → `bigint`, and others

## Detection

The codemod reads your project's `package.json` at runtime and checks the installed versions:

| Variable | Condition |
|---|---|
| `MIGRATE_WAGMI=true` | wagmi version starts with `1.` or `^1` |
| `MIGRATE_ETHERS=true` | ethers version starts with `5.` or `^5` |
| `MIGRATE_RAINBOWKIT=true` | @rainbow-me/rainbowkit version starts with `1.` or `^1` |

If `package.json` is not found, all three migrations run (safe default).

## DoraHacks

This codemod was submitted to the Boring AI hackathon. View the submission at [dorahacks.io](https://dorahacks.io).

## License

MIT — see [LICENSE](LICENSE) for details.
