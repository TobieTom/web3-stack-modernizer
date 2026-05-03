import { ethers } from 'ethers'

async function DeFiComponent() {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const jsonRpc = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/KEY')
  const staticRpc = new ethers.providers.StaticJsonRpcProvider('https://mainnet.infura.io/v3/KEY')

  const amount = ethers.utils.parseEther('1.5')
  const formatted = ethers.utils.formatEther(amount)
  const units = ethers.utils.parseUnits('1.5', 18)
  const formattedUnits = ethers.utils.formatUnits(units, 18)
  const hash = ethers.utils.keccak256(ethers.utils.arrayify('0xabcd'))
  const padded = ethers.utils.hexZeroPad('0x1', 32)
  const solidityHash = ethers.utils.solidityKeccak256(['uint256'], [1])
  const packed = ethers.utils.solidityPack(['uint256'], [1])

  const bn = ethers.BigNumber.from('1000000000000000000')

  const result = await tokenContract.callStatic.balanceOf(userAddress)
  const result2 = await nft.callStatic.mint(to, tokenId)

  return null
}
