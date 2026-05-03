import { ethers } from 'ethers'

async function DeFiComponent() {
  const provider = new ethers.BrowserProvider(window.ethereum)
  const jsonRpc = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/KEY')
  const staticRpc = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/KEY')

  const amount = ethers.parseEther('1.5')
  const formatted = ethers.formatEther(amount)
  const units = ethers.parseUnits('1.5', 18)
  const formattedUnits = ethers.formatUnits(units, 18)
  const hash = ethers.keccak256(ethers.getBytes('0xabcd'))
  const padded = ethers.zeroPadValue('0x1', 32)
  const solidityHash = ethers.solidityPackedKeccak256(['uint256'], [1])
  const packed = ethers.solidityPacked(['uint256'], [1])

  const bn = BigInt('1000000000000000000')

  const result = await tokenContract.balanceOf.staticCall(userAddress)
  const result2 = await nft.mint.staticCall(to, tokenId)

  return null
}
