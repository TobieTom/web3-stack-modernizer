import { useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction, WagmiConfig, createClient } from 'wagmi'
import { mainnet, polygon } from 'wagmi/chains'
import { injectedConnector } from 'wagmi/connectors/injected'

const config = createClient({
  autoConnect: true,
  connectors: [injectedConnector],
})

function App() {
  return (
    <WagmiConfig config={config}>
      <DeFiApp />
    </WagmiConfig>
  )
}

function DeFiApp() {
  const { data } = useContractRead({
    address: '0xToken',
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
  })

  const { write } = useContractWrite({
    address: '0xToken',
    abi: TOKEN_ABI,
    functionName: 'transfer',
  })

  const { config: prepConfig } = usePrepareContractWrite({
    address: '0xToken',
    abi: TOKEN_ABI,
    functionName: 'approve',
  })

  const { isLoading } = useWaitForTransaction({ hash: txHash })

  return <div>{String(data)}</div>
}
