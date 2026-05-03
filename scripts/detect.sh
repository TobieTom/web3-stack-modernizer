#!/usr/bin/env bash
set -e

PKG_JSON="${CODEMOD_TARGET}/package.json"
ENV_DIR="${CODEMOD_PATH}/scripts"
ENV_FILE="${ENV_DIR}/migration.env"

MIGRATE_WAGMI=false
MIGRATE_ETHERS=false
MIGRATE_RAINBOWKIT=false

if [ ! -f "$PKG_JSON" ]; then
  echo "⚠  $PKG_JSON not found — enabling all migrations as safe default"
  MIGRATE_WAGMI=true
  MIGRATE_ETHERS=true
  MIGRATE_RAINBOWKIT=true
else
  WAGMI_VER=$(node -e "
    try {
      const d = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
      const deps = { ...(d.dependencies || {}), ...(d.devDependencies || {}) };
      console.log(deps['wagmi'] || '');
    } catch(e) { console.log(''); }
  " "$PKG_JSON" 2>/dev/null || true)

  ETHERS_VER=$(node -e "
    try {
      const d = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
      const deps = { ...(d.dependencies || {}), ...(d.devDependencies || {}) };
      console.log(deps['ethers'] || '');
    } catch(e) { console.log(''); }
  " "$PKG_JSON" 2>/dev/null || true)

  RK_VER=$(node -e "
    try {
      const d = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
      const deps = { ...(d.dependencies || {}), ...(d.devDependencies || {}) };
      console.log(deps['@rainbow-me/rainbowkit'] || '');
    } catch(e) { console.log(''); }
  " "$PKG_JSON" 2>/dev/null || true)

  if [[ "$WAGMI_VER" =~ ^[\^~]?1\. ]]; then
    MIGRATE_WAGMI=true
  fi
  if [[ "$ETHERS_VER" =~ ^[\^~]?5\. ]]; then
    MIGRATE_ETHERS=true
  fi
  if [[ "$RK_VER" =~ ^[\^~]?1\. ]]; then
    MIGRATE_RAINBOWKIT=true
  fi
fi

mkdir -p "$ENV_DIR"
cat > "$ENV_FILE" <<EOF
MIGRATE_WAGMI=$MIGRATE_WAGMI
MIGRATE_ETHERS=$MIGRATE_ETHERS
MIGRATE_RAINBOWKIT=$MIGRATE_RAINBOWKIT
EOF

echo "=== web3-stack-modernizer migration plan ==="
echo "wagmi v1 → v2:                    $MIGRATE_WAGMI"
echo "ethers v5 → v6:                   $MIGRATE_ETHERS"
echo "@rainbow-me/rainbowkit v1 → v2:   $MIGRATE_RAINBOWKIT"
