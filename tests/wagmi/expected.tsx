import { useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt, WagmiProvider, createConfig } from 'wagmi'
import { mainnet, polygon } from 'viem/chains'
import { injectedConnector } from 'wagmi/connectors'

const config = createConfig({
  autoConnect: true,
  connectors: [injectedConnector],
})

function App() {
  return (
    <WagmiProvider config={config}>
      <DeFiApp />
    </WagmiProvider>
  )
}

function DeFiApp() {
  const { data } = useReadContract({
    address: '0xToken',
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
  })

  const { write } = useWriteContract({
    address: '0xToken',
    abi: TOKEN_ABI,
    functionName: 'transfer',
  })

  const { config: prepConfig } = useSimulateContract({
    address: '0xToken',
    abi: TOKEN_ABI,
    functionName: 'approve',
  })

  const { isLoading } = useWaitForTransactionReceipt({ hash: txHash })

  return <div>{String(data)}</div>
}
