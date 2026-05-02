# web3-stack-modernizer

Modernize your entire Web3 frontend stack in one command. Automatically migrates wagmi v1→v2, ethers v5→v6, and RainbowKit v1→v2 with zero false positives

## Installation

```bash
# Install from registry
codemod run web3-stack-modernizer

# Or run locally
codemod run -w workflow.yaml
```

## Usage

Document the exact migration this codemod performs before publishing. At minimum, cover:

- The concrete syntax or API patterns it rewrites
- The file types or paths it targets
- Important preserve/no-op cases and exclusions

## Development

```bash
# Test the transformation
npm test

# Validate the workflow
codemod workflow validate -w workflow.yaml

# Publish to registry
codemod login
codemod publish
```

## License

MIT

## Skill Installation

```bash
npx codemod@latest web3-stack-modernizer
```
