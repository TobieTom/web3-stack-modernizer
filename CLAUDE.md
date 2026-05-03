# web3-stack-modernizer

## Project Purpose
Multi-library codemod that modernizes an entire Web3 frontend stack in one command.
Migrates wagmi v1→v2, ethers v5→v6, and RainbowKit v1→v2 simultaneously.
Submitted to the Boring AI hackathon on DoraHacks.

## What Makes This Unique
No other submission migrates multiple interdependent Web3 libraries as one orchestrated workflow.
The orchestrator detects which libraries are present via package.json and runs only what's needed.

## Tech Stack
- Engine: jssg (codemod:ast-grep) — NOT jscodeshift
- CLI: codemod CLI v1.9.1
- Language target: TypeScript/TSX
- Workflow: workflow.yaml orchestrates all steps

## Project Structure
- scripts/detect.sh — reads package.json, sets env vars for which migrations to run
- scripts/codemod.ts — master jssg transform (all three libraries)
- rules/config.yml — YAML ast-grep placeholder
- tests/ — input/expected fixture pairs per library
- agents/skill/ — AI skill for edge cases
- workflow.yaml — orchestration with conditional steps

## Migration Patterns

### Ethers v5 → v6 (deterministic)
- ethers.providers.Web3Provider → ethers.BrowserProvider
- ethers.providers.JsonRpcProvider → ethers.JsonRpcProvider
- ethers.providers.StaticJsonRpcProvider → ethers.JsonRpcProvider
- ethers.utils.parseEther → ethers.parseEther
- ethers.utils.formatEther → ethers.formatEther
- ethers.utils.parseUnits → ethers.parseUnits
- ethers.utils.formatUnits → ethers.formatUnits
- ethers.utils.keccak256 → ethers.keccak256
- ethers.utils.arrayify → ethers.getBytes
- ethers.utils.hexZeroPad → ethers.zeroPadValue
- ethers.utils.solidityKeccak256 → ethers.solidityPackedKeccak256
- ethers.utils.solidityPack → ethers.solidityPacked
- ethers.utils.defaultAbiCoder → ethers.AbiCoder.defaultAbiCoder()
- BigNumber.from(x) → BigInt(x)
- contract.address → contract.target
- .callStatic.method() → .method.staticCall()
- provider.getSigner() → await provider.getSigner()

### RainbowKit v1 → v2 (deterministic)
- <RainbowKitProvider chains={chains}> → <RainbowKitProvider>
- getDefaultWallets({ chains, appName, projectId }) → getDefaultWallets({ appName, projectId })
- configureChains removed — chains go into createConfig directly

### Wagmi v1 → v2 (already proven — replicate patterns here)
- useContractRead → useReadContract
- useContractWrite → useWriteContract
- usePrepareContractWrite → useSimulateContract
- useWaitForTransaction → useWaitForTransactionReceipt
- WagmiConfig → WagmiProvider
- createClient → createConfig

## Detection Logic
scripts/detect.sh reads package.json dependencies and sets:
- MIGRATE_WAGMI=true if wagmi version is ^1
- MIGRATE_ETHERS=true if ethers version is ^5
- MIGRATE_RAINBOWKIT=true if @rainbow-me/rainbowkit version is ^1

## Testing
- Each library has its own fixture folder: tests/wagmi/, tests/ethers/, tests/rainbowkit/
- Run: codemod jssg test -l tsx ./scripts/codemod.ts
- Zero false positives is the hard requirement

## DO NOT
- Use jscodeshift
- Use ts-morph
- Install codemod:ast-grep as an npm package
- Run all migrations unconditionally — always detect first