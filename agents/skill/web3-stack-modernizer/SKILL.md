---
name: "web3-stack-modernizer"
description: "AI edge-case handler for the web3-stack-modernizer codemod. Covers async getSigner, nested callStatic, BigNumber arithmetic chains, configureChains restructuring, QueryClientProvider wrapping, contract.address→target, and TypeScript type annotation updates."
allowed-tools:
  - Bash(codemod *)
---

# web3-stack-modernizer

codemod-compatibility: skill-package-v1
codemod-skill-version: 0.1.0

Use `references/index.md` as the primary instruction index for this package.

## When to invoke this skill

Run the deterministic codemod first:

```bash
npx codemod@latest @TobieTom/web3-stack-modernizer
```

Then invoke this skill for any pattern the codemod flagged with a `TODO` comment, or any pattern it could not safely transform automatically. Search for outstanding items with:

```bash
grep -rn "TODO: remove configureChains" src/
grep -rn "\.getSigner()" src/ --include="*.ts" --include="*.tsx"
grep -rn "BigNumber\|\.add(\|\.mul(\|\.div(" src/ --include="*.ts" --include="*.tsx"
grep -rn "\.address" src/ --include="*.ts" --include="*.tsx"
grep -rn "ethers\.providers\." src/ --include="*.ts" --include="*.tsx"
```

---

## 1. `provider.getSigner()` is now async

ethers v6 changed `getSigner()` to return `Promise<JsonRpcSigner>`. Every call site must gain `await`.

### Rules
- Add `await` before every `.getSigner()` call.
- If the containing function is not `async`, make it `async`.
- If the call is inside a `.then()` chain, convert the entire chain to `async/await`.
- Update variable type annotations from `ethers.providers.JsonRpcSigner` → `ethers.JsonRpcSigner`.

### Examples

**Synchronous usage → async/await**
```tsx
// Before
function getContract() {
  const signer = provider.getSigner()
  return new ethers.Contract(ADDRESS, ABI, signer)
}

// After
async function getContract() {
  const signer = await provider.getSigner()
  return new ethers.Contract(ADDRESS, ABI, signer)
}
```

**Promise chain → async/await**
```tsx
// Before
provider.getSigner()
  .then(signer => signer.sendTransaction(txData))
  .then(tx => tx.wait())

// After
const signer = await provider.getSigner()
const tx = await signer.sendTransaction(txData)
await tx.wait()
```

**Account index form**
```tsx
// Before
const signer = provider.getSigner(1)   // second account

// After
const signer = await provider.getSigner(1)
```

---

## 2. Nested `.callStatic` patterns the codemod may have missed

The deterministic codemod handles the common form `contract.callStatic.method(args)`. These variants require manual attention.

### `.connect(signer).callStatic`
```tsx
// Before
const result = await contract.connect(signer).callStatic.transfer(to, amount)

// After
const result = await contract.connect(signer).transfer.staticCall(to, amount)
```

### `callStatic` stored in a variable
```tsx
// Before
const cs = contract.callStatic
const result = await cs.balanceOf(address)

// After — callStatic namespace removed in ethers v6
const result = await contract.balanceOf.staticCall(address)
```

### `.callStatic` inside a `.then()` chain
Convert the chain to async/await first, then apply the rename.

```tsx
// Before
contract.callStatic.approve(spender, amount)
  .then(result => console.log(result))

// After
const result = await contract.approve.staticCall(spender, amount)
console.log(result)
```

---

## 3. BigNumber arithmetic chains → native bigint operators

The codemod converts `ethers.BigNumber.from(x)` → `BigInt(x)`. Chained method calls on BigNumber instances must be converted to native bigint operators.

### Method mapping

| BigNumber v5 method | bigint equivalent |
|---|---|
| `.add(x)` | `+ BigInt(x)` |
| `.sub(x)` | `- BigInt(x)` |
| `.mul(x)` | `* BigInt(x)` |
| `.div(x)` | `/ BigInt(x)` |
| `.mod(x)` | `% BigInt(x)` |
| `.pow(x)` | `** BigInt(x)` |
| `.abs()` | `value < 0n ? -value : value` |
| `.gt(x)` | `> BigInt(x)` |
| `.gte(x)` | `>= BigInt(x)` |
| `.lt(x)` | `< BigInt(x)` |
| `.lte(x)` | `<= BigInt(x)` |
| `.eq(x)` | `=== BigInt(x)` |
| `.isZero()` | `=== 0n` |
| `.isNegative()` | `< 0n` |
| `.toString()` | `.toString()` (bigint has this natively) |
| `.toNumber()` | `Number(value)` — only safe for small values |
| `.toHexString()` | `'0x' + value.toString(16)` |
| `.toBigInt()` | remove — already bigint |
| `BigNumber.from(x)` | `BigInt(x)` |

### Rules
- Every variable in a bigint expression must be `bigint`. Mixing `number` and `bigint` is a TypeError at runtime.
- Use `0n`, `1n`, etc. for literal bigints rather than `BigInt(0)`.
- For `.toNumber()`, add a comment if the value could exceed `Number.MAX_SAFE_INTEGER`.

### Example
```tsx
// Before
const fee = gasPrice.mul(gasLimit).add(tip)
const isAffordable = fee.lte(balance)
const half = total.div(2)

// After
const fee = gasPrice * gasLimit + tip   // all must be bigint
const isAffordable = fee <= balance
const half = total / 2n
```

```tsx
// Before
const formatted = ethers.utils.formatEther(value.mul(2))

// After
const formatted = ethers.formatEther(value * 2n)
```

---

## 4. Removing `configureChains` and restructuring into `createConfig`

The codemod flags `configureChains(...)` calls with a `TODO` comment. The full restructuring must be done manually because the chains, transports, and connectors all need to move into `createConfig`.

### Complete before/after

**Before (wagmi v1 + RainbowKit v1)**
```tsx
import { configureChains, createClient } from 'wagmi'
import { mainnet, polygon } from 'wagmi/chains'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import { getDefaultWallets } from '@rainbow-me/rainbowkit'

const { chains, provider, webSocketProvider } = configureChains(
  [mainnet, polygon],
  [alchemyProvider({ apiKey: ALCHEMY_KEY }), publicProvider()]
)

const { connectors } = getDefaultWallets({ appName: 'My App', projectId: 'abc', chains })

const client = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
})
```

**After (wagmi v2 + RainbowKit v2)**
```tsx
import { createConfig, http } from 'wagmi'
import { mainnet, polygon } from 'viem/chains'
import { getDefaultWallets } from '@rainbow-me/rainbowkit'

const { connectors } = getDefaultWallets({ appName: 'My App', projectId: 'abc' })

const config = createConfig({
  chains: [mainnet, polygon],
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    [polygon.id]: http('https://polygon-rpc.com'),
  },
  connectors,
})
```

### Steps
1. Remove the `configureChains` import and call.
2. Remove `provider` and `webSocketProvider` variables — they are replaced by `transports`.
3. Move the chain array directly into `createConfig({ chains: [...] })`.
4. Add a `transports` map: one `http(rpcUrl)` entry per chain, using `viem`'s `http` helper.
5. Remove `autoConnect: true` — wagmi v2 uses `storage` for reconnection automatically.
6. Remove `webSocketProvider` — use `webSocket()` from `viem` in `transports` if needed.
7. The `chains` variable used in JSX (`<RainbowKitProvider chains={chains}>`) is removed by the codemod; the `RainbowKitProvider` in v2 reads chains from the wagmi config automatically.

---

## 5. `QueryClientProvider` wrapping

wagmi v2 uses TanStack Query internally. The provider tree must include `QueryClientProvider` between `WagmiProvider` and any child providers.

### Install the dependency
```bash
npm install @tanstack/react-query
# or
pnpm add @tanstack/react-query
```

### Before
```tsx
import { WagmiProvider } from 'wagmi'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  )
}
```

### After
```tsx
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

### With RainbowKit (required nesting order)
```tsx
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

### Rules
- `QueryClientProvider` must be inside `WagmiProvider` and outside `RainbowKitProvider`.
- Create `queryClient` outside the component to avoid re-creating it on each render.
- If using Next.js App Router, move `queryClient` into a `useState` with the `'use client'` directive.

---

## 6. `contract.address` → `contract.target`

The codemod skips this rename because `.address` is used on wallets, signers, and plain objects too. Apply it only when the variable is a confirmed `ethers.Contract` instance.

### Safe rename criteria — ALL must be true
1. The variable was created with `new ethers.Contract(...)`, `new ethers.BaseContract(...)`, or returned from a typed contract factory (e.g. `MyToken__factory.connect(...)`).
2. The access is not on a wallet (`ethers.Wallet`), signer (`JsonRpcSigner`), or provider — those still expose `.address` in ethers v6.
3. The access is not on a plain TypeScript object that happens to have an `address` field.

### Detection
```bash
grep -rn "\.address" src/ --include="*.ts" --include="*.tsx"
```

Cross-reference each result with where the variable was initialized to confirm it is a `Contract`.

### Example
```tsx
// Before
const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer)
console.log(token.address)   // ← safe to rename

// After
console.log(token.target)
```

### Do NOT rename
```tsx
const wallet = new ethers.Wallet(privateKey)
wallet.address   // Wallet.address is still valid in v6

const signer = await provider.getSigner()
signer.address   // JsonRpcSigner.address is still valid

const user = { address: '0x...', name: 'Alice' }
user.address     // plain object — do not rename
```

---

## 7. TypeScript type annotation updates

The deterministic codemod does not touch type annotations. Update them manually.

### Mapping

| ethers v5 type | ethers v6 type |
|---|---|
| `ethers.providers.Provider` | `ethers.Provider` |
| `ethers.providers.Web3Provider` | `ethers.BrowserProvider` |
| `ethers.providers.JsonRpcProvider` | `ethers.JsonRpcProvider` |
| `ethers.providers.JsonRpcSigner` | `ethers.JsonRpcSigner` |
| `ethers.providers.TransactionResponse` | `ethers.TransactionResponse` |
| `ethers.providers.TransactionReceipt` | `ethers.TransactionReceipt` |
| `ethers.providers.Block` | `ethers.Block` |
| `ethers.providers.Log` | `ethers.Log` |
| `ethers.ContractInterface` | `ethers.InterfaceAbi` |
| `ethers.BigNumber` | `bigint` |
| `ethers.Overrides` | `ethers.Overrides` (unchanged) |
| `ethers.Signer` | `ethers.Signer` (unchanged — abstract base) |
| `ethers.CallOverrides` | `ethers.Overrides` |

### Detection
```bash
grep -rn "ethers\.providers\." src/ --include="*.ts" --include="*.tsx"
grep -rn "ethers\.BigNumber\b" src/ --include="*.ts" --include="*.tsx"
grep -rn "ethers\.ContractInterface" src/ --include="*.ts" --include="*.tsx"
```

### Example
```tsx
// Before
function connectWallet(provider: ethers.providers.Web3Provider): ethers.providers.JsonRpcSigner {
  return provider.getSigner()
}

function encodeData(abi: ethers.ContractInterface, data: ethers.BigNumber): void { ... }

// After
async function connectWallet(provider: ethers.BrowserProvider): Promise<ethers.JsonRpcSigner> {
  return await provider.getSigner()
}

function encodeData(abi: ethers.InterfaceAbi, data: bigint): void { ... }
```

### Note on `ethers.providers.Provider`
In ethers v6, `ethers.Provider` is an interface. If your code instantiates a provider, use the concrete type (`ethers.BrowserProvider`, `ethers.JsonRpcProvider`). If it accepts any provider as a parameter, use `ethers.Provider`.
