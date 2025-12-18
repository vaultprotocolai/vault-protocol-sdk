import { type Address } from 'viem';
import { CrossChainMessage } from '../types';
import { VaultClient, canWrite } from '../client';
import { SUPPORTED_CHAIN_IDS, isSupportedChain as checkSupportedChain } from '../config';

/**
 * Cross-chain message status
 */
export interface MessageStatus {
  sent: boolean;
  received: boolean;
  processed: boolean;
  timestamp?: number;
  error?: string;
}

/**
 * CrossChainClient - Cross-chain coordination via LayerZero
 * Supports multiple chains: Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, Avalanche, opBNB
 * Primary deployment: opBNB Layer 2 (testnet: 5611, mainnet: 204)
 *
 * Note: Cross-chain functionality requires LayerZero contracts to be deployed.
 * Currently, the SDK provides infrastructure for when cross-chain is enabled.
 *
 * @example
 * const client = createVaultClient({ chainId: 97, privateKey: '0x...' });
 * const crossChain = new CrossChainClient(client);
 *
 * // Check if a chain is supported
 * if (crossChain.isSupportedChain(137)) {
 *   // Sync vault to Polygon
 *   await crossChain.syncVault(vaultId, 137);
 * }
 */
export class CrossChainClient {
  private client: VaultClient | null;
  private contractAddress: string;

  // Supported chain IDs for cross-chain operations
  private supportedChains = [
    1,      // Ethereum Mainnet
    56,     // BSC Mainnet
    97,     // BSC Testnet
    137,    // Polygon Mainnet
    204,    // opBNB Mainnet
    5611,   // opBNB Testnet
    42161,  // Arbitrum One
    10,     // Optimism
    8453,   // Base
    43114,  // Avalanche
  ];

  // LayerZero chain IDs mapping (different from EVM chain IDs)
  private layerZeroChainIds: Record<number, number> = {
    1: 101,     // Ethereum
    56: 102,    // BSC
    137: 109,   // Polygon
    42161: 110, // Arbitrum
    10: 111,    // Optimism
    8453: 184,  // Base
    43114: 106, // Avalanche
    204: 202,   // opBNB
  };

  // Pending messages (tracked locally until cross-chain contracts are deployed)
  private pendingMessages: Map<string, { message: CrossChainMessage; status: MessageStatus }> = new Map();

  /**
   * Create a CrossChainClient instance
   *
   * @param clientOrAddress - VaultClient instance OR legacy contract address
   */
  constructor(clientOrAddress: VaultClient | string) {
    if (typeof clientOrAddress === 'string') {
      this.contractAddress = clientOrAddress;
      this.client = null;
      console.warn(
        'CrossChainClient: Legacy constructor detected. Use createVaultClient() for full functionality.'
      );
    } else {
      this.client = clientOrAddress;
      this.contractAddress = clientOrAddress.contracts.CrossChainBridge || '';
    }
  }

  /**
   * Ensure client is available
   */
  private ensureClient(): VaultClient {
    if (!this.client) {
      throw new Error(
        'VaultClient required for blockchain operations. Use createVaultClient() to create a client.'
      );
    }
    return this.client;
  }

  /**
   * Send cross-chain message via LayerZero
   *
   * @param message - Cross-chain message details
   * @returns Message ID for tracking
   *
   * Note: Full implementation requires LayerZero contracts.
   * Current implementation stores message locally and returns tracking ID.
   */
  async sendMessage(message: CrossChainMessage): Promise<string> {
    // Validate chains
    if (!this.isSupportedChain(message.sourceChain)) {
      throw new Error(`Source chain ${message.sourceChain} is not supported`);
    }
    if (!this.isSupportedChain(message.destChain)) {
      throw new Error(`Destination chain ${message.destChain} is not supported`);
    }

    // Generate message ID
    const messageId = `lz-${message.sourceChain}-${message.destChain}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // When LayerZero contracts are deployed, this will call the contract
    // For now, track the message locally
    const status: MessageStatus = {
      sent: true,
      received: false,
      processed: false,
      timestamp: Date.now(),
    };

    this.pendingMessages.set(messageId, { message, status });

    // Log for development
    console.log(`Cross-chain message queued: ${messageId}`);
    console.log(`  Source: Chain ${message.sourceChain}`);
    console.log(`  Dest: Chain ${message.destChain}`);
    console.log(`  Operation: ${message.operation}`);
    console.log(`  Vault: ${message.vaultId}`);

    // In production, this would call LayerZero endpoint:
    // const client = this.ensureClient();
    // const lzChainId = this.layerZeroChainIds[message.destChain];
    // await client.walletClient.writeContract({
    //   address: layerZeroEndpoint,
    //   abi: LayerZeroABI,
    //   functionName: 'send',
    //   args: [lzChainId, payload, ...],
    // });

    return messageId;
  }

  /**
   * Get cross-chain message status
   *
   * @param messageId - Message ID returned from sendMessage
   * @returns Message status
   */
  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    // Check local pending messages
    const pending = this.pendingMessages.get(messageId);
    if (pending) {
      return pending.status;
    }

    // When LayerZero is integrated, query the contract/relayer
    // For now, return not found status
    return {
      sent: false,
      received: false,
      processed: false,
      error: 'Message not found',
    };
  }

  /**
   * Sync vault state across chains
   *
   * @param vaultId - Vault ID to sync
   * @param targetChain - Target chain ID to sync to
   * @returns True if sync was initiated
   */
  async syncVault(vaultId: string, targetChain: number): Promise<boolean> {
    if (!this.isSupportedChain(targetChain)) {
      throw new Error(`Target chain ${targetChain} is not supported`);
    }

    const client = this.client;
    if (!client) {
      console.warn('VaultClient not available. Vault sync queued for manual processing.');
      return false;
    }

    // Create sync message
    const message: CrossChainMessage = {
      sourceChain: client.chainId,
      destChain: targetChain,
      vaultId,
      operation: 'sync',
      data: {
        timestamp: Date.now(),
        syncType: 'full',
      },
    };

    try {
      const messageId = await this.sendMessage(message);
      console.log(`Vault sync initiated: ${messageId}`);
      return true;
    } catch (error) {
      console.error('Vault sync failed:', error);
      return false;
    }
  }

  /**
   * Check if a chain is supported for cross-chain operations
   *
   * @param chainId - EVM chain ID to check
   * @returns True if chain is supported
   */
  isSupportedChain(chainId: number): boolean {
    return this.supportedChains.includes(chainId);
  }

  /**
   * Get all supported chain IDs
   *
   * @returns Array of supported chain IDs
   */
  getSupportedChains(): number[] {
    return [...this.supportedChains];
  }

  /**
   * Get LayerZero chain ID for an EVM chain
   *
   * @param evmChainId - EVM chain ID
   * @returns LayerZero chain ID or undefined if not mapped
   */
  getLayerZeroChainId(evmChainId: number): number | undefined {
    return this.layerZeroChainIds[evmChainId];
  }

  /**
   * Estimate cross-chain message fee
   *
   * @param destChain - Destination chain ID
   * @param payloadSize - Size of payload in bytes
   * @returns Estimated fee in native token (wei)
   *
   * Note: Placeholder until LayerZero integration
   */
  async estimateFee(destChain: number, payloadSize: number = 100): Promise<bigint> {
    // Placeholder fee estimation
    // In production, this would query LayerZero endpoint
    const baseFee = 0.001; // Base fee in native token
    const perByteFee = 0.00001;

    const totalFee = baseFee + (perByteFee * payloadSize);
    return BigInt(Math.floor(totalFee * 1e18));
  }

  /**
   * Get pending cross-chain messages
   *
   * @returns Array of pending message IDs
   */
  getPendingMessages(): string[] {
    return Array.from(this.pendingMessages.keys());
  }

  /**
   * Clear a pending message (for testing/development)
   *
   * @param messageId - Message ID to clear
   */
  clearPendingMessage(messageId: string): void {
    this.pendingMessages.delete(messageId);
  }
}
