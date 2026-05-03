import type { Codemod } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import { readFileSync } from "fs";
import path from "path";

interface MigrationFlags {
  ethers: boolean;
  wagmi: boolean;
  rainbowkit: boolean;
}

function loadFlags(): MigrationFlags {
  // Try reading migration.env written by detect.sh
  const codemodPath = (process as any).env?.CODEMOD_PATH as string | undefined;
  if (codemodPath) {
    const envFile = path.join(codemodPath, "scripts", "migration.env");
    try {
      const content = readFileSync(envFile, "utf8");
      const parsed: Record<string, string> = {};
      for (const line of content.split("\n")) {
        const m = line.trim().match(/^([A-Z_]+)=(.+)$/);
        if (m) parsed[m[1]] = m[2];
      }
      if (parsed.MIGRATE_ETHERS !== undefined) {
        return {
          ethers: parsed.MIGRATE_ETHERS === "true",
          wagmi: parsed.MIGRATE_WAGMI === "true",
          rainbowkit: parsed.MIGRATE_RAINBOWKIT === "true",
        };
      }
    } catch {
      // env file not found — fall through to defaults
    }
  }

  // Fall back to direct env vars, defaulting all to true when unset
  const env = (process as any).env as Record<string, string | undefined>;
  const anySet =
    env.MIGRATE_ETHERS !== undefined ||
    env.MIGRATE_WAGMI !== undefined ||
    env.MIGRATE_RAINBOWKIT !== undefined;

  if (anySet) {
    return {
      ethers: env.MIGRATE_ETHERS !== "false",
      wagmi: env.MIGRATE_WAGMI !== "false",
      rainbowkit: env.MIGRATE_RAINBOWKIT !== "false",
    };
  }

  return { ethers: true, wagmi: true, rainbowkit: true };
}

const codemod: Codemod<TSX> = async (root) => {
  const flags = loadFlags();
  const rootNode = root.root();
  const edits: any[] = [];

  // ── Ethers v5 → v6 ───────────────────────────────────────────────────────
  if (flags.ethers) {
    const memberRenames: [string, string][] = [
      ["ethers.providers.Web3Provider", "ethers.BrowserProvider"],
      ["ethers.providers.JsonRpcProvider", "ethers.JsonRpcProvider"],
      ["ethers.providers.StaticJsonRpcProvider", "ethers.JsonRpcProvider"],
      ["ethers.utils.parseEther", "ethers.parseEther"],
      ["ethers.utils.formatEther", "ethers.formatEther"],
      ["ethers.utils.parseUnits", "ethers.parseUnits"],
      ["ethers.utils.formatUnits", "ethers.formatUnits"],
      ["ethers.utils.keccak256", "ethers.keccak256"],
      ["ethers.utils.arrayify", "ethers.getBytes"],
      ["ethers.utils.hexZeroPad", "ethers.zeroPadValue"],
      ["ethers.utils.solidityKeccak256", "ethers.solidityPackedKeccak256"],
      ["ethers.utils.solidityPack", "ethers.solidityPacked"],
    ];

    for (const [from, to] of memberRenames) {
      for (const node of rootNode.findAll({ rule: { pattern: from } })) {
        edits.push(node.replace(to));
      }
    }

    // ethers.BigNumber.from(x) → BigInt(x)
    for (const node of rootNode.findAll({
      rule: { pattern: "ethers.BigNumber.from($X)" },
    })) {
      const x = node.getMatch("X")?.text() ?? "";
      edits.push(node.replace(`BigInt(${x})`));
    }

    // contract.callStatic.method(args) → contract.method.staticCall(args)
    for (const node of rootNode.findAll({
      rule: { pattern: "$OBJ.callStatic.$METHOD($$$ARGS)" },
    })) {
      const obj = node.getMatch("OBJ")?.text() ?? "";
      const method = node.getMatch("METHOD")?.text() ?? "";
      const args = node
        .getMultipleMatches("ARGS")
        .filter((n: any) => n.text().trim() !== ",")
        .map((n: any) => n.text())
        .join(", ");
      edits.push(node.replace(`${obj}.${method}.staticCall(${args})`));
    }
  }

  // ── Wagmi v1 → v2 ────────────────────────────────────────────────────────
  if (flags.wagmi) {
    // Hook and component identifier renames (covers imports + call sites + JSX tags)
    const identifierRenames: [string, string][] = [
      ["useContractRead", "useReadContract"],
      ["useContractWrite", "useWriteContract"],
      ["usePrepareContractWrite", "useSimulateContract"],
      ["useWaitForTransaction", "useWaitForTransactionReceipt"],
      ["useContractEvent", "useWatchContractEvent"],
      ["useContractInfiniteReads", "useInfiniteReadContracts"],
      ["WagmiConfig", "WagmiProvider"],
      ["createClient", "createConfig"],
    ];

    for (const [from, to] of identifierRenames) {
      for (const node of rootNode.findAll({
        rule: { kind: "identifier", regex: `^${from}$` },
      })) {
        edits.push(node.replace(to));
      }
    }

    // wagmi/chains → viem/chains
    for (const node of rootNode.findAll({
      rule: {
        kind: "string",
        regex: "wagmi/chains",
        inside: { kind: "import_statement" },
      },
    })) {
      const q = node.text().startsWith('"') ? '"' : "'";
      edits.push(node.replace(`${q}viem/chains${q}`));
    }

    // wagmi/connectors/* → wagmi/connectors
    for (const node of rootNode.findAll({
      rule: {
        kind: "string",
        regex: "wagmi/connectors/",
        inside: { kind: "import_statement" },
      },
    })) {
      const q = node.text().startsWith('"') ? '"' : "'";
      edits.push(node.replace(`${q}wagmi/connectors${q}`));
    }
  }

  // ── RainbowKit v1 → v2 ───────────────────────────────────────────────────
  if (flags.rainbowkit) {
    // Remove chains={...} prop when it is the only attribute
    for (const node of rootNode.findAll({
      rule: { pattern: "<RainbowKitProvider chains={$CHAINS}>" },
    })) {
      edits.push(node.replace("<RainbowKitProvider>"));
    }

    // Remove chains prop from getDefaultWallets — chains is last
    for (const node of rootNode.findAll({
      rule: { pattern: "getDefaultWallets({ $$$REST, chains })" },
    })) {
      const rest = node
        .getMultipleMatches("REST")
        .filter((n: any) => n.text().trim() !== ",")
        .map((n: any) => n.text())
        .join(", ");
      edits.push(node.replace(`getDefaultWallets({ ${rest} })`));
    }

    // Remove chains prop from getDefaultWallets — chains is first
    for (const node of rootNode.findAll({
      rule: { pattern: "getDefaultWallets({ chains, $$$REST })" },
    })) {
      const rest = node
        .getMultipleMatches("REST")
        .filter((n: any) => n.text().trim() !== ",")
        .map((n: any) => n.text())
        .join(", ");
      edits.push(node.replace(`getDefaultWallets({ ${rest} })`));
    }

    // Flag configureChains calls for manual removal
    for (const node of rootNode.findAll({
      rule: { pattern: "configureChains($$$ARGS)" },
    })) {
      const args = node
        .getMultipleMatches("ARGS")
        .filter((n: any) => n.text().trim() !== ",")
        .map((n: any) => n.text())
        .join(", ");
      edits.push(
        node.replace(
          `/* TODO: remove configureChains, move chains to createConfig */ configureChains(${args})`
        )
      );
    }
  }

  if (edits.length === 0) return null;
  return rootNode.commitEdits(edits);
};

export default codemod;
