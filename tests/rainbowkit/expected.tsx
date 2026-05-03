import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig, WagmiProvider } from 'wagmi'
import { mainnet, arbitrum } from 'viem/chains'
import { publicProvider } from 'wagmi/providers/public'

const { chains, provider } = /* TODO: remove configureChains, move chains to createConfig */ configureChains([mainnet, arbitrum], [publicProvider()])

const { connectors } = getDefaultWallets({ appName: 'My DeFi App', projectId: 'YOUR_PROJECT_ID' })

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  provider,
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  )
}
