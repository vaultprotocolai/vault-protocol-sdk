// Vault Protocol SDK
// Shared TypeScript SDK for all Vault Protocol applications

// Client factory - main entry point for blockchain operations
export {
  createVaultClient,
  createReadOnlyClient,
  createPrivateKeyClient,
  createWalletClientWrapper,
  canWrite,
  getAccountOrThrow,
  type VaultClient,
  type VaultClientConfig,
} from './client';

// Configuration
export {
  // Chains
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
  // Contracts
  BSC_TESTNET_CONTRACTS,
  OPBNB_MAINNET_CONTRACTS,
  CONTRACTS_BY_CHAIN,
  getContractAddresses,
  getVaultManagerAddress,
  getVaultTimeManagerAddress,
  hasDeployedContracts,
  ZERO_ADDRESS,
  type ContractAddresses,
  // ABIs
  VaultFactoryABI,
  TimeManagerABI,
  ReleaseTypeContract,
  AIVaultManagerABI,
  AttestationHubABI,
} from './config';

// Core modules
export * from './core/VaultManager';
export * from './core/TimeManager';
export * from './core/CrossChainClient';

// AI modules
export * from './ai/AIVaultManager';
export * from './ai/FHEVault';

// Attestation module
export * from './attestation';

// Storage module
export * from './storage';

// Utilities
export * from './utils/encryption';
// Note: StorageClient is now exported from ./storage module
export * from './utils/events';

// Types
export * from './types';
