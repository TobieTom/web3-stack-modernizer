import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createClient, WagmiConfig } from 'wagmi'
import { mainnet, arbitrum } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

const { chains, provider } = configureChains([mainnet, arbitrum], [publicProvider()])

const { connectors } = getDefaultWallets({ appName: 'My DeFi App', projectId: 'YOUR_PROJECT_ID', chains })

const wagmiConfig = createClient({
  autoConnect: true,
  connectors,
  provider,
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
