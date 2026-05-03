# Contributing to web3-stack-modernizer

## How the codemod works

The migration runs in five stages, orchestrated by `workflow.yaml`:

```
1. setup.sh → detect.sh
      Reads package.json, writes scripts/migration.env with
      MIGRATE_WAGMI / MIGRATE_ETHERS / MIGRATE_RAINBOWKIT flags.

2. transform.sh
      Placeholder shell step (runs before the AST pass).

3. rules/config.yml  (no-op placeholder)
      YAML ast-grep rules. Currently a placeholder; reserved for
      future pattern additions that are simpler to express in YAML.

4. scripts/codemod.ts  ← main logic
      jssg (JS ast-grep) transform. Loads migration.env, then runs
      each library's rename patterns. Collects all edits, commits once.

5. cleanup.sh
      Placeholder shell step (runs after the AST pass).

6. install-package-skill
      Installs agents/skill/web3-stack-modernizer/SKILL.md so an AI
      agent can handle the edge cases the deterministic pass leaves behind.
```

The deterministic pass (`codemod.ts`) handles everything that can be expressed as a pure text/AST rename with zero false-positive risk. Anything requiring type inference, control-flow analysis, or multi-file awareness goes in the AI skill (`SKILL.md`).

## How to add a new transform pattern

### 1. Identify the AST shape

Use the codemod MCP `dump_ast` tool or `ast-grep` directly to confirm the tree shape before writing a pattern:

```bash
# Quick inline AST dump
node -e "
const { parse } = require('@ast-grep/napi');
const sg = parse('tsx', 'ethers.utils.parseEther(\"1\")');
console.log(JSON.stringify(sg.root().children(), null, 2));
"
```

### 2. Add the pattern to `scripts/codemod.ts`

Open `scripts/codemod.ts` and find the appropriate section (`if (flags.ethers)`, `if (flags.wagmi)`, or `if (flags.rainbowkit)`).

**For simple identifier renames** (covers imports + call sites + JSX tags in one pass):
```ts
identifierRenames.push(['oldName', 'newName'])
```

**For member-expression renames** (e.g. `ethers.utils.foo` → `ethers.foo`):
```ts
memberRenames.push(['ethers.utils.foo', 'ethers.foo'])
```

**For structural transforms** (pattern captures variables):
```ts
for (const node of rootNode.findAll({ rule: { pattern: '$OBJ.oldMethod($$$ARGS)' } })) {
  const obj  = node.getMatch('OBJ')?.text() ?? '';
  const args = node.getMultipleMatches('ARGS')
    .filter((n: any) => n.text().trim() !== ',')  // always filter separator tokens
    .map((n: any) => n.text())
    .join(', ');
  edits.push(node.replace(`${obj}.newMethod(${args})`));
}
```

> **Important**: `getMultipleMatches` returns both AST nodes and the comma separator tokens between them. Always filter with `.filter(n => n.text().trim() !== ',')` before mapping to text.

### 3. Write test fixtures

Add or update `tests/<library>/input.tsx` and `tests/<library>/expected.tsx`.

The expected file must match the codemod's output **exactly** (byte-for-byte). The safest way to produce it:

1. Add your pattern to `input.tsx`.
2. Run the test in "probe" mode to see actual output:
   ```bash
   # Run the MCP test against input with input as expected — diff shows actual output
   codemod jssg test -l tsx ./scripts/codemod.ts
   ```
3. Copy the actual output into `expected.tsx`.

### 4. Run tests

```bash
codemod jssg test -l tsx ./scripts/codemod.ts
```

All tests must pass before opening a PR. The test runner performs exact string comparison.

### 5. Check for false positives

Run the codemod against a real-world repo (dry-run mode) to confirm no unintended changes:

```bash
# Against a local checkout of a wagmi v1 project
CODEMOD_TARGET=/path/to/target-repo codemod run -w workflow.yaml --dry-run
```

Review the diff carefully. Any change to code that does not use wagmi/ethers/rainbowkit is a false positive and must be fixed before merging.

## How to run tests locally

```bash
# From the web3-stack-modernizer/ directory
codemod jssg test -l tsx ./scripts/codemod.ts
```

Expected output when all tests pass:

```
running 4 tests
test ethers     ... ok
test fixtures   ... ok
test rainbowkit ... ok
test wagmi      ... ok

test result: ok. 4 passed; 0 failed; ...
```

## How to run against a real repo

```bash
# 1. Point CODEMOD_TARGET at the target project's root
export CODEMOD_TARGET=/path/to/your-dapp

# 2. Run detection to see which migrations apply
bash scripts/detect.sh

# 3. Run the full workflow (modifies files in place)
codemod run -w workflow.yaml

# 4. Review the diff
cd $CODEMOD_TARGET && git diff
```

To test without modifying files:

```bash
codemod run -w workflow.yaml --dry-run
```

## Project layout

```
scripts/
  detect.sh        — reads package.json, writes migration.env
  setup.sh         — called by workflow; invokes detect.sh
  codemod.ts       — jssg transform (all three libraries)
  cleanup.sh       — post-transform hook (placeholder)
  transform.sh     — pre-AST hook (placeholder)

tests/
  ethers/          — input.tsx + expected.tsx for ethers transforms
  wagmi/           — input.tsx + expected.tsx for wagmi transforms
  rainbowkit/      — input.tsx + expected.tsx for rainbowkit transforms
  fixtures/        — no-op fixture (zero false positive check)

rules/
  config.yml       — YAML ast-grep rules (placeholder)

agents/skill/
  web3-stack-modernizer/SKILL.md  — AI edge-case instructions

workflow.yaml      — orchestration definition
codemod.yaml       — package metadata
```
