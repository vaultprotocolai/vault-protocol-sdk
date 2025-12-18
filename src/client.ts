/**
 * Vault Protocol Client Factory
 *
 * Creates viem clients for interacting with Vault Protocol smart contracts.
 * Supports both private key mode and external wallet (WalletClient) mode.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Account,
  type Transport,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  getChain,
  getContractAddresses,
  hasDeployedContracts,
  type ContractAddresses,
} from './config';

/**
 * Client configuration options
 */
export interface VaultClientConfig {
  /** Chain ID to connect to */
  chainId: number;
  /** Optional custom RPC URL (uses default if not provided) */
  rpcUrl?: string;
  /** Private key for signing transactions (Option 1) */
  privateKey?: Hex;
  /** External wallet client for signing (Option 2 - e.g., MetaMask, WalletConnect) */
  walletClient?: WalletClient;
  /** Account address when using external wallet */
  account?: Address;
}

/**
 * Vault Protocol Client
 *
 * Provides access to public and wallet clients for contract interactions
 */
export interface VaultClient {
  /** Chain ID */
  chainId: number;
  /** Chain configuration */
  chain: Chain;
  /** Contract addresses for this chain */
  contracts: ContractAddresses;
  /** Public client for read operations */
  publicClient: PublicClient;
  /** Wallet client for write operations (may be undefined for read-only mode) */
  walletClient?: WalletClient;
  /** Account address */
  account?: Address;
  /** Check if client can write (has wallet) */
  canWrite: boolean;
}

/**
 * Create a Vault Protocol client
 *
 * @example
 * // Option 1: Private key mode (for backend/scripts)
 * const client = createVaultClient({
 *   chainId: 97,
 *   privateKey: '0x...'
 * });
 *
 * @example
 * // Option 2: External wallet mode (for frontend with MetaMask/WalletConnect)
 * const client = createVaultClient({
 *   chainId: 97,
 *   walletClient: existingWalletClient,
 *   account: '0x...'
 * });
 *
 * @example
 * // Option 3: Read-only mode (no signing capability)
 * const client = createVaultClient({
 *   chainId: 97
 * });
 */
export function createVaultClient(config: VaultClientConfig): VaultClient {
  const { chainId, rpcUrl, privateKey, walletClient: externalWallet, account: externalAccount } = config;

  // Get chain configuration
  const chain = getChain(chainId);
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: 1, 56, 97, 137, 204, 5611, 42161`);
  }

  // Get contract addresses
  const contracts = getContractAddresses(chainId);
  if (!contracts) {
    throw new Error(`No contract addresses configured for chain ID: ${chainId}`);
  }

  // Check if contracts are deployed
  if (!hasDeployedContracts(chainId)) {
    console.warn(`Warning: Contracts not yet deployed on chain ${chainId}. Some operations will fail.`);
  }

  // Determine RPC URL
  const rpc = rpcUrl || chain.rpcUrls.default.http[0];
  if (!rpc) {
    throw new Error(`No RPC URL available for chain ${chainId}`);
  }

  // Create public client for read operations
  const publicClient = createPublicClient({
    chain,
    transport: http(rpc),
  });

  // Create wallet client based on mode
  let walletClient: WalletClient | undefined;
  let account: Address | undefined;

  if (privateKey) {
    // Mode 1: Private key mode
    const pkAccount = privateKeyToAccount(privateKey);
    walletClient = createWalletClient({
      account: pkAccount,
      chain,
      transport: http(rpc),
    });
    account = pkAccount.address;
  } else if (externalWallet) {
    // Mode 2: External wallet mode
    walletClient = externalWallet;
    account = externalAccount;
  }
  // Mode 3: Read-only mode (no wallet client)

  return {
    chainId,
    chain,
    contracts,
    publicClient,
    walletClient,
    account,
    canWrite: !!walletClient,
  };
}

/**
 * Create a read-only client (no signing capability)
 */
export function createReadOnlyClient(chainId: number, rpcUrl?: string): VaultClient {
  return createVaultClient({ chainId, rpcUrl });
}

/**
 * Create a client with private key (for backend/scripts)
 */
export function createPrivateKeyClient(
  chainId: number,
  privateKey: Hex,
  rpcUrl?: string
): VaultClient {
  return createVaultClient({ chainId, privateKey, rpcUrl });
}

/**
 * Create a client with external wallet (for frontend)
 */
export function createWalletClientWrapper(
  chainId: number,
  walletClient: WalletClient,
  account: Address,
  rpcUrl?: string
): VaultClient {
  return createVaultClient({ chainId, walletClient, account, rpcUrl });
}

/**
 * Type guard to check if client can perform write operations
 */
export function canWrite(client: VaultClient): client is VaultClient & { walletClient: WalletClient; account: Address } {
  return client.canWrite && !!client.walletClient && !!client.account;
}

/**
 * Get account address from client, throws if not available
 */
export function getAccountOrThrow(client: VaultClient): Address {
  if (!client.account) {
    throw new Error('No account available. Initialize client with privateKey or walletClient.');
  }
  return client.account;
}
