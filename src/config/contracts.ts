/**
 * Contract addresses for Vault Protocol SDK
 *
 * Contains deployed contract addresses per chain
 */

import { type Address } from 'viem';

/**
 * Contract addresses per chain
 */
export interface ContractAddresses {
  VaultManager: Address;
  VaultTimeManager: Address;
  AccessControl: Address;
  NotificationOracle: Address;
  AIConsensus?: Address;
  CrossChainBridge?: Address;
  AIVaultManager?: Address;
  AttestationHub?: Address;
}

/**
 * BSC Testnet contract addresses (Chain ID: 97)
 * Currently deployed and active for testing
 */
export const BSC_TESTNET_CONTRACTS: ContractAddresses = {
  VaultManager: '0x116865F62E1714D9B512Fd9E4f35e6fDb53D019C' as Address,
  VaultTimeManager: '0x68e41639B0c5C56F6E6b0f0Cf9612acac089ff4D' as Address,
  AccessControl: '0x0000000000000000000000000000000000000000' as Address, // Not yet deployed
  NotificationOracle: '0x0000000000000000000000000000000000000000' as Address, // Not yet deployed
};

/**
 * opBNB Mainnet contract addresses (Chain ID: 204)
 * Production environment - addresses to be added after mainnet deployment
 */
export const OPBNB_MAINNET_CONTRACTS: ContractAddresses = {
  VaultManager: '0x0000000000000000000000000000000000000000' as Address, // TODO: Deploy to mainnet
  VaultTimeManager: '0x0000000000000000000000000000000000000000' as Address, // TODO: Deploy to mainnet
  AccessControl: '0x0000000000000000000000000000000000000000' as Address,
  NotificationOracle: '0x0000000000000000000000000000000000000000' as Address,
};

/**
 * opBNB Testnet contract addresses (Chain ID: 5611)
 */
export const OPBNB_TESTNET_CONTRACTS: ContractAddresses = {
  VaultManager: '0x0000000000000000000000000000000000000000' as Address, // TODO: Deploy
  VaultTimeManager: '0x0000000000000000000000000000000000000000' as Address, // TODO: Deploy
  AccessControl: '0x0000000000000000000000000000000000000000' as Address,
  NotificationOracle: '0x0000000000000000000000000000000000000000' as Address,
};

/**
 * All contract addresses by chain ID
 */
export const CONTRACTS_BY_CHAIN: Record<number, ContractAddresses> = {
  97: BSC_TESTNET_CONTRACTS,
  204: OPBNB_MAINNET_CONTRACTS,
  5611: OPBNB_TESTNET_CONTRACTS,
};

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number): ContractAddresses | undefined {
  return CONTRACTS_BY_CHAIN[chainId];
}

/**
 * Get VaultManager address for a chain
 */
export function getVaultManagerAddress(chainId: number): Address | undefined {
  return CONTRACTS_BY_CHAIN[chainId]?.VaultManager;
}

/**
 * Get VaultTimeManager address for a chain
 */
export function getVaultTimeManagerAddress(chainId: number): Address | undefined {
  return CONTRACTS_BY_CHAIN[chainId]?.VaultTimeManager;
}

/**
 * Check if contracts are deployed on a chain
 */
export function hasDeployedContracts(chainId: number): boolean {
  const contracts = CONTRACTS_BY_CHAIN[chainId];
  if (!contracts) return false;

  // Check if VaultManager is deployed (not zero address)
  return contracts.VaultManager !== '0x0000000000000000000000000000000000000000';
}

/**
 * Zero address constant
 */
export const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000' as Address;
