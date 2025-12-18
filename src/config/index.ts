/**
 * Configuration exports for Vault Protocol SDK
 */

// Chain configurations
export {
  bscTestnet,
  bscMainnet,
  opBNBMainnet,
  opBNBTestnet,
  polygon,
  arbitrum,
  ethereum,
  CHAINS,
  SUPPORTED_CHAIN_IDS,
  getChain,
  isSupportedChain,
  getDefaultRpcUrl,
  type SupportedChainId,
} from './chains';

// Contract addresses
export {
  BSC_TESTNET_CONTRACTS,
  OPBNB_MAINNET_CONTRACTS,
  OPBNB_TESTNET_CONTRACTS,
  CONTRACTS_BY_CHAIN,
  getContractAddresses,
  getVaultManagerAddress,
  getVaultTimeManagerAddress,
  hasDeployedContracts,
  ZERO_ADDRESS,
  type ContractAddresses,
} from './contracts';

// Contract ABIs
export {
  VaultFactoryABI,
  TimeManagerABI,
  ReleaseTypeContract,
  AIVaultManagerABI,
  AttestationHubABI,
} from './abis';
