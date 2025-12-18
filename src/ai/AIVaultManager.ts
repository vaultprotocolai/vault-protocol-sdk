import { type Address, getContract } from 'viem';
import { AIMonitoringConfig } from '../types';
import { VaultClient, canWrite } from '../client';
import { AIVaultManagerABI } from '../config/abis';

/**
 * Vault AI state as returned from contract
 */
export interface VaultAIState {
  livenessScore: number; // 0-100 (percentage)
  riskScore: number; // 0-100 (percentage)
  lastAIPrediction: number; // Unix timestamp
  aiCheckCount: number;
  aiVerificationEnabled: boolean;
  isPausedByAI: boolean;
  lastAIReason: string;
}

/**
 * AI recommendation types
 */
export interface AIRecommendation {
  type: 'security' | 'activity' | 'configuration' | 'risk';
  priority: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
}

/**
 * AIVaultManager - AI-powered monitoring and predictions
 * Multi-agent consensus with liveness and risk scoring
 *
 * Note: The AIVaultManager contract needs to be deployed and its address
 * added to the contracts configuration. Currently, it may not be deployed
 * on all networks.
 *
 * @example
 * const client = createVaultClient({ chainId: 97, privateKey: '0x...' });
 * const aiManager = new AIVaultManager(client);
 *
 * // Enable AI monitoring for a vault
 * await aiManager.enableMonitoring(vaultAddress, {
 *   enabled: true,
 *   livenessThreshold: 50,
 *   riskThreshold: 70,
 * });
 *
 * // Get liveness score
 * const score = await aiManager.getLivenessScore(vaultAddress);
 */
export class AIVaultManager {
  private client: VaultClient | null;
  private contractAddress: Address;

  /**
   * Create an AIVaultManager instance
   *
   * @param clientOrAddress - VaultClient instance OR legacy contract address
   */
  constructor(clientOrAddress: VaultClient | string) {
    if (typeof clientOrAddress === 'string') {
      this.contractAddress = clientOrAddress as Address;
      this.client = null;
      console.warn(
        'AIVaultManager: Legacy constructor detected. Use createVaultClient() for full functionality.'
      );
    } else {
      this.client = clientOrAddress;
      this.contractAddress = clientOrAddress.contracts.AIVaultManager || ('0x0000000000000000000000000000000000000000' as Address);
    }
  }

  /**
   * Ensure client is available for read operations
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
   * Ensure client has write capability
   */
  private ensureWriteClient(): VaultClient {
    const client = this.ensureClient();
    if (!canWrite(client)) {
      throw new Error(
        'Write operations require a wallet. Provide privateKey or walletClient when creating the client.'
      );
    }
    return client;
  }

  /**
   * Check if AIVaultManager contract is available
   */
  private ensureContractAvailable(): void {
    if (!this.contractAddress || this.contractAddress === ('0x0000000000000000000000000000000000000000' as Address)) {
      throw new Error(
        'AIVaultManager contract not deployed on this network. AI features are not yet available.'
      );
    }
  }

  /**
   * Get contract instance
   */
  private getContract(client: VaultClient) {
    return getContract({
      address: this.contractAddress,
      abi: AIVaultManagerABI,
      client: client.publicClient,
    });
  }

  /**
   * Enable AI monitoring for vault
   *
   * @param vaultAddress - Vault contract address
   * @param config - AI monitoring configuration (optional, for future use)
   * @returns true if monitoring was enabled
   *
   * @example
   * await aiManager.enableMonitoring(vaultAddress, {
   *   enabled: true,
   *   livenessThreshold: 50,
   *   riskThreshold: 70,
   * });
   */
  async enableMonitoring(vaultAddress: string, config?: AIMonitoringConfig): Promise<boolean> {
    this.ensureContractAvailable();
    const client = this.ensureWriteClient();

    try {
      const hash = await client.walletClient!.writeContract({
        address: this.contractAddress,
        abi: AIVaultManagerABI,
        functionName: 'enableAIVerification',
        args: [vaultAddress as Address],
        account: client.account!,
        chain: client.chain,
      });

      // Wait for transaction confirmation
      const receipt = await client.publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        console.log(`AI monitoring enabled for vault ${vaultAddress}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to enable AI monitoring:', error);
      throw error;
    }
  }

  /**
   * Disable AI monitoring for vault
   *
   * @param vaultAddress - Vault contract address
   * @returns true if monitoring was disabled
   */
  async disableMonitoring(vaultAddress: string): Promise<boolean> {
    this.ensureContractAvailable();
    const client = this.ensureWriteClient();

    try {
      const hash = await client.walletClient!.writeContract({
        address: this.contractAddress,
        abi: AIVaultManagerABI,
        functionName: 'disableAIVerification',
        args: [vaultAddress as Address],
        account: client.account!,
        chain: client.chain,
      });

      const receipt = await client.publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        console.log(`AI monitoring disabled for vault ${vaultAddress}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to disable AI monitoring:', error);
      throw error;
    }
  }

  /**
   * Get the full AI state for a vault
   *
   * @param vaultAddress - Vault contract address
   * @returns VaultAIState with all AI-related data
   */
  async getVaultAIState(vaultAddress: string): Promise<VaultAIState> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);

    const state = await contract.read.getVaultAIState([vaultAddress as Address]);

    return {
      // Contract stores scores as 0-10000 (basis points), convert to 0-100 percentage
      livenessScore: Number(state.livenessScore) / 100,
      riskScore: Number(state.riskScore) / 100,
      lastAIPrediction: Number(state.lastAIPrediction),
      aiCheckCount: Number(state.aiCheckCount),
      aiVerificationEnabled: state.aiVerificationEnabled,
      isPausedByAI: state.isPausedByAI,
      lastAIReason: state.lastAIReason,
    };
  }

  /**
   * Get liveness score (0-100)
   *
   * @param vaultAddress - Vault contract address (or vault ID for legacy compatibility)
   * @returns Liveness score as percentage (0-100)
   *
   * @example
   * const score = await aiManager.getLivenessScore(vaultAddress);
   * console.log(`Liveness: ${score}%`);
   */
  async getLivenessScore(vaultAddress: string): Promise<number> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    // If it looks like a vault ID (numeric), we need the vault address
    // For now, assume it's already an address
    const address = vaultAddress as Address;

    const contract = this.getContract(client);
    const state = await contract.read.getVaultAIState([address]);

    // Convert from basis points (0-10000) to percentage (0-100)
    return Number(state.livenessScore) / 100;
  }

  /**
   * Get risk score (0-100)
   *
   * @param vaultAddress - Vault contract address
   * @returns Risk score as percentage (0-100)
   *
   * @example
   * const risk = await aiManager.getRiskScore(vaultAddress);
   * if (risk > 70) console.log('High risk detected!');
   */
  async getRiskScore(vaultAddress: string): Promise<number> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    const state = await contract.read.getVaultAIState([vaultAddress as Address]);

    // Convert from basis points (0-10000) to percentage (0-100)
    return Number(state.riskScore) / 100;
  }

  /**
   * Predict unlock time based on patterns
   *
   * @param vaultAddress - Vault contract address
   * @returns Predicted unlock timestamp (Unix seconds)
   *
   * Note: This is derived from AI state analysis. Full prediction
   * requires the Chainlink AI Oracle to be integrated.
   */
  async predictUnlockTime(vaultAddress: string): Promise<number> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    const state = await contract.read.getVaultAIState([vaultAddress as Address]);

    // Use liveness score to estimate unlock time
    // Higher liveness = further unlock time
    // Lower liveness = closer unlock time
    const livenessScore = Number(state.livenessScore);
    const lastPrediction = Number(state.lastAIPrediction);

    if (lastPrediction === 0) {
      // No AI predictions yet, return far future
      return Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year
    }

    // Estimate based on liveness:
    // 100% liveness = 1 year out
    // 0% liveness = imminent
    const livenessPercent = livenessScore / 10000;
    const baseTime = 365 * 24 * 60 * 60; // 1 year in seconds
    const estimatedTime = Math.floor(baseTime * livenessPercent);

    return Math.floor(Date.now() / 1000) + estimatedTime;
  }

  /**
   * Get AI recommendations
   *
   * @param vaultAddress - Vault contract address
   * @returns Array of AI recommendations
   *
   * @example
   * const recommendations = await aiManager.getRecommendations(vaultAddress);
   * for (const rec of recommendations) {
   *   console.log(`[${rec.priority}] ${rec.message}`);
   * }
   */
  async getRecommendations(vaultAddress: string): Promise<string[]> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    const state = await contract.read.getVaultAIState([vaultAddress as Address]);

    const recommendations: string[] = [];

    const livenessScore = Number(state.livenessScore) / 100; // 0-100
    const riskScore = Number(state.riskScore) / 100; // 0-100

    // Generate recommendations based on AI state
    if (!state.aiVerificationEnabled) {
      recommendations.push('Enable AI verification for enhanced security monitoring');
    }

    if (livenessScore < 50) {
      recommendations.push(
        `Low liveness score (${livenessScore.toFixed(1)}%) - Consider performing a check-in to reset dead-man switch`
      );
    }

    if (riskScore > 70) {
      recommendations.push(
        `High risk score (${riskScore.toFixed(1)}%) - Review vault security and access patterns`
      );
    }

    if (riskScore > 90) {
      recommendations.push('Critical risk level - Vault may be auto-paused for security');
    }

    if (state.isPausedByAI) {
      recommendations.push(`Vault is paused by AI: ${state.lastAIReason}`);
      recommendations.push('Contact support or review security settings to resume');
    }

    if (Number(state.aiCheckCount) === 0) {
      recommendations.push('No AI checks performed yet - AI agents will begin monitoring soon');
    }

    if (recommendations.length === 0) {
      recommendations.push('Vault is in good standing - no immediate actions required');
    }

    return recommendations;
  }

  /**
   * Check if AI would prevent vault release
   *
   * @param vaultAddress - Vault contract address
   * @returns Object with prevention status and reason
   */
  async shouldPreventRelease(
    vaultAddress: string
  ): Promise<{ shouldPrevent: boolean; reason: string }> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    const result = await contract.read.shouldPreventRelease([vaultAddress as Address]);

    return {
      shouldPrevent: result[0],
      reason: result[1],
    };
  }

  /**
   * Check if vault should be released (AI safety check)
   *
   * @param vaultAddress - Vault contract address
   * @returns true if vault can be safely released
   */
  async shouldReleaseVault(vaultAddress: string): Promise<boolean> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    return await contract.read.shouldReleaseVault([vaultAddress as Address]);
  }

  /**
   * Resume a vault that was paused by AI
   *
   * @param vaultAddress - Vault contract address
   * @returns true if vault was resumed
   */
  async resumeVault(vaultAddress: string): Promise<boolean> {
    this.ensureContractAvailable();
    const client = this.ensureWriteClient();

    try {
      const hash = await client.walletClient!.writeContract({
        address: this.contractAddress,
        abi: AIVaultManagerABI,
        functionName: 'resumeVault',
        args: [vaultAddress as Address],
        account: client.account!,
        chain: client.chain,
      });

      const receipt = await client.publicClient.waitForTransactionReceipt({ hash });
      return receipt.status === 'success';
    } catch (error) {
      console.error('Failed to resume vault:', error);
      throw error;
    }
  }

  /**
   * Get AI thresholds from contract
   *
   * @returns Object with liveness and risk thresholds
   */
  async getThresholds(): Promise<{
    livenessThreshold: number;
    riskThreshold: number;
    consensusThreshold: number;
  }> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);

    const [liveness, risk, consensus] = await Promise.all([
      contract.read.livenessThreshold(),
      contract.read.riskThreshold(),
      contract.read.consensusThreshold(),
    ]);

    return {
      livenessThreshold: Number(liveness) / 100, // Convert from basis points
      riskThreshold: Number(risk) / 100,
      consensusThreshold: Number(consensus) / 100,
    };
  }

  /**
   * Get the number of authorized AI agents
   *
   * @returns Number of authorized agents
   */
  async getAuthorizedAgentCount(): Promise<number> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    const count = await contract.read.getAuthorizedAgentCount();
    return Number(count);
  }

  /**
   * Check if an address is an authorized AI agent
   *
   * @param agentAddress - Address to check
   * @returns true if address is an authorized agent
   */
  async isAuthorizedAgent(agentAddress: string): Promise<boolean> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    return await contract.read.authorizedAgents([agentAddress as Address]);
  }
}
