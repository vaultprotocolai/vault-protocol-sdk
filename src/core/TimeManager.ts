import { type Address } from 'viem';
import { TimeManagerConfig, ReleaseType } from '../types';
import { VaultClient, canWrite } from '../client';
import { TimeManagerABI, ReleaseTypeContract, VaultFactoryABI } from '../config';

/**
 * TimeManager - Time-lock configuration and deadman switches
 * Handles SCHEDULED, DEADMAN, and HYBRID release types
 *
 * @example
 * const client = createVaultClient({ chainId: 97, privateKey: '0x...' });
 * const timeManager = new TimeManager(client);
 *
 * // Check in to reset deadman timer
 * await timeManager.checkIn(vaultAddress);
 *
 * // Get time until unlock
 * const timeRemaining = await timeManager.getTimeUntilUnlock(vaultAddress);
 */
export class TimeManager {
  private client: VaultClient;
  private contractAddress: string;

  /**
   * Create a TimeManager instance
   *
   * @param clientOrAddress - VaultClient instance OR legacy contract address
   */
  constructor(clientOrAddress: VaultClient | string) {
    if (typeof clientOrAddress === 'string') {
      // Legacy mode
      this.contractAddress = clientOrAddress;
      this.client = null as any;
      console.warn(
        'TimeManager: Legacy constructor detected. Please use createVaultClient() for blockchain operations.'
      );
    } else {
      this.client = clientOrAddress;
      this.contractAddress = clientOrAddress.contracts.VaultTimeManager;
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
   * Get vault address from vault ID
   */
  private async getVaultAddress(vaultId: string): Promise<Address> {
    const client = this.ensureClient();

    // If vaultId is already an address (0x...), return it
    if (vaultId.startsWith('0x') && vaultId.length === 42) {
      return vaultId as Address;
    }

    // Otherwise, look up the vault address from the ID
    const vaultData = await client.publicClient.readContract({
      address: client.contracts.VaultManager,
      abi: VaultFactoryABI,
      functionName: 'vaults',
      args: [BigInt(vaultId)],
    }) as [bigint, Address, Address, string, string, bigint, boolean];

    return vaultData[1];
  }

  /**
   * Configure time-based release (SCHEDULED)
   *
   * @param vaultId - Vault ID or vault address
   * @param unlockTime - Unix timestamp (milliseconds) when vault should unlock
   */
  async configureScheduledRelease(vaultId: string, unlockTime: number): Promise<void> {
    const client = this.ensureClient();

    if (!canWrite(client)) {
      throw new Error('Write operations require a wallet.');
    }

    const vaultAddress = await this.getVaultAddress(vaultId);
    const scheduledTimeSeconds = BigInt(Math.floor(unlockTime / 1000));

    await client.walletClient!.writeContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'configureTime',
      args: [vaultAddress, ReleaseTypeContract.SCHEDULED, scheduledTimeSeconds, 0n],
      account: client.account!,
      chain: client.chain,
    });
  }

  /**
   * Configure deadman switch (DEADMAN)
   *
   * @param vaultId - Vault ID or vault address
   * @param checkInPeriod - Period in seconds between required check-ins
   * @param gracePeriod - Additional grace period in seconds (not used in current contract)
   */
  async configureDeadmanSwitch(vaultId: string, checkInPeriod: number, gracePeriod: number = 0): Promise<void> {
    const client = this.ensureClient();

    if (!canWrite(client)) {
      throw new Error('Write operations require a wallet.');
    }

    const vaultAddress = await this.getVaultAddress(vaultId);

    // Contract requires minimum 24 hours (86400 seconds) for deadman duration
    const duration = Math.max(checkInPeriod, 86400);

    await client.walletClient!.writeContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'configureTime',
      args: [vaultAddress, ReleaseTypeContract.DEADMAN, 0n, BigInt(duration)],
      account: client.account!,
      chain: client.chain,
    });
  }

  /**
   * Configure hybrid release (HYBRID - both scheduled and deadman)
   *
   * @param vaultId - Vault ID or vault address
   * @param config - Configuration with scheduledTime and deadmanDuration
   */
  async configureHybridRelease(vaultId: string, config: TimeManagerConfig): Promise<void> {
    const client = this.ensureClient();

    if (!canWrite(client)) {
      throw new Error('Write operations require a wallet.');
    }

    const vaultAddress = await this.getVaultAddress(vaultId);

    const scheduledTime = config.scheduledTime
      ? BigInt(Math.floor(config.scheduledTime / 1000))
      : 0n;
    const deadmanDuration = config.deadmanDuration
      ? BigInt(config.deadmanDuration)
      : 0n;

    await client.walletClient!.writeContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'configureTime',
      args: [vaultAddress, ReleaseTypeContract.HYBRID, scheduledTime, deadmanDuration],
      account: client.account!,
      chain: client.chain,
    });
  }

  /**
   * Owner check-in (for DEADMAN/HYBRID)
   * Resets the deadman timer
   *
   * @param vaultId - Vault ID or vault address
   * @returns True if check-in was successful
   */
  async checkIn(vaultId: string): Promise<boolean> {
    const client = this.ensureClient();

    if (!canWrite(client)) {
      throw new Error('Write operations require a wallet.');
    }

    const vaultAddress = await this.getVaultAddress(vaultId);

    try {
      await client.walletClient!.writeContract({
        address: client.contracts.VaultTimeManager,
        abi: TimeManagerABI,
        functionName: 'recordCheckIn',
        args: [vaultAddress],
        account: client.account!,
        chain: client.chain,
      });
      return true;
    } catch (error) {
      console.error('Check-in failed:', error);
      return false;
    }
  }

  /**
   * Get time until unlock
   * Returns time remaining in seconds, or 0 if already unlocked
   *
   * @param vaultId - Vault ID or vault address
   * @returns Time remaining in seconds
   */
  async getTimeUntilUnlock(vaultId: string): Promise<number> {
    const client = this.ensureClient();
    const vaultAddress = await this.getVaultAddress(vaultId);

    // Get vault config
    const config = await client.publicClient.readContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'vaultConfigs',
      args: [vaultAddress],
    }) as [number, bigint, bigint, bigint, boolean];

    const releaseType = config[0];
    const scheduledTime = config[1];
    const deadmanDuration = config[2];
    const lastCheckIn = config[3];

    // For SCHEDULED or HYBRID
    if (releaseType === ReleaseTypeContract.SCHEDULED || releaseType === ReleaseTypeContract.HYBRID) {
      const scheduledRemaining = await client.publicClient.readContract({
        address: client.contracts.VaultTimeManager,
        abi: TimeManagerABI,
        functionName: 'getTimeUntilScheduledRelease',
        args: [vaultAddress],
      }) as bigint;

      if (releaseType === ReleaseTypeContract.SCHEDULED) {
        return Number(scheduledRemaining);
      }
    }

    // For DEADMAN or HYBRID
    if (releaseType === ReleaseTypeContract.DEADMAN || releaseType === ReleaseTypeContract.HYBRID) {
      const deadmanRemaining = await client.publicClient.readContract({
        address: client.contracts.VaultTimeManager,
        abi: TimeManagerABI,
        functionName: 'getTimeUntilDeadmanRelease',
        args: [vaultAddress],
      }) as bigint;

      if (releaseType === ReleaseTypeContract.DEADMAN) {
        return Number(deadmanRemaining);
      }

      // HYBRID: return minimum of both
      const scheduledRemaining = await client.publicClient.readContract({
        address: client.contracts.VaultTimeManager,
        abi: TimeManagerABI,
        functionName: 'getTimeUntilScheduledRelease',
        args: [vaultAddress],
      }) as bigint;

      return Math.min(Number(scheduledRemaining), Number(deadmanRemaining));
    }

    return 0;
  }

  /**
   * Check if deadman switch triggered
   * Returns true if the deadman period has elapsed since last check-in
   *
   * @param vaultId - Vault ID or vault address
   * @returns True if deadman is triggered
   */
  async isDeadmanTriggered(vaultId: string): Promise<boolean> {
    const client = this.ensureClient();
    const vaultAddress = await this.getVaultAddress(vaultId);

    // Check release condition
    const [shouldRelease, reason] = await client.publicClient.readContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'checkReleaseCondition',
      args: [vaultAddress],
    }) as [boolean, string];

    // Check if the reason is deadman-related
    if (shouldRelease && reason.toLowerCase().includes('deadman')) {
      return true;
    }

    // Also check time until deadman release
    const deadmanRemaining = await client.publicClient.readContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'getTimeUntilDeadmanRelease',
      args: [vaultAddress],
    }) as bigint;

    return Number(deadmanRemaining) === 0;
  }

  /**
   * Set unlock time for vault (alias for configureScheduledRelease)
   *
   * @param vaultId - Vault ID or vault address
   * @param time - Unix timestamp in milliseconds
   */
  async setUnlockTime(vaultId: string, time: number): Promise<void> {
    return this.configureScheduledRelease(vaultId, time);
  }

  /**
   * Get last check-in timestamp
   *
   * @param vaultId - Vault ID or vault address
   * @returns Last check-in timestamp in milliseconds, or 0 if never checked in
   */
  async getLastCheckIn(vaultId: string): Promise<number> {
    const client = this.ensureClient();
    const vaultAddress = await this.getVaultAddress(vaultId);

    const config = await client.publicClient.readContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'vaultConfigs',
      args: [vaultAddress],
    }) as [number, bigint, bigint, bigint, boolean];

    // lastCheckIn is at index 3, convert to milliseconds
    return Number(config[3]) * 1000;
  }

  /**
   * Get full time configuration for a vault
   *
   * @param vaultId - Vault ID or vault address
   * @returns Time configuration
   */
  async getTimeConfig(vaultId: string): Promise<{
    releaseType: ReleaseType;
    scheduledTime: number;
    deadmanDuration: number;
    lastCheckIn: number;
    isActive: boolean;
  }> {
    const client = this.ensureClient();
    const vaultAddress = await this.getVaultAddress(vaultId);

    const config = await client.publicClient.readContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'vaultConfigs',
      args: [vaultAddress],
    }) as [number, bigint, bigint, bigint, boolean];

    // Map contract enum to SDK enum
    let releaseType: ReleaseType;
    switch (config[0]) {
      case ReleaseTypeContract.SCHEDULED:
        releaseType = ReleaseType.SCHEDULED;
        break;
      case ReleaseTypeContract.DEADMAN:
        releaseType = ReleaseType.DEADMAN;
        break;
      case ReleaseTypeContract.HYBRID:
        releaseType = ReleaseType.HYBRID;
        break;
      default:
        releaseType = ReleaseType.SCHEDULED;
    }

    return {
      releaseType,
      scheduledTime: Number(config[1]) * 1000, // Convert to milliseconds
      deadmanDuration: Number(config[2]),
      lastCheckIn: Number(config[3]) * 1000,
      isActive: config[4],
    };
  }

  /**
   * Check if release conditions are met
   *
   * @param vaultId - Vault ID or vault address
   * @returns Object with shouldRelease flag and reason
   */
  async checkReleaseCondition(vaultId: string): Promise<{ shouldRelease: boolean; reason: string }> {
    const client = this.ensureClient();
    const vaultAddress = await this.getVaultAddress(vaultId);

    const [shouldRelease, reason] = await client.publicClient.readContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'checkReleaseCondition',
      args: [vaultAddress],
    }) as [boolean, string];

    return { shouldRelease, reason };
  }

  /**
   * Trigger vault release (if conditions are met)
   *
   * @param vaultId - Vault ID or vault address
   * @returns True if release was triggered
   */
  async triggerRelease(vaultId: string): Promise<boolean> {
    const client = this.ensureClient();

    if (!canWrite(client)) {
      throw new Error('Write operations require a wallet.');
    }

    const vaultAddress = await this.getVaultAddress(vaultId);

    // First check if release conditions are met
    const { shouldRelease, reason } = await this.checkReleaseCondition(vaultId);
    if (!shouldRelease) {
      console.log(`Cannot trigger release: ${reason}`);
      return false;
    }

    try {
      await client.walletClient!.writeContract({
        address: client.contracts.VaultTimeManager,
        abi: TimeManagerABI,
        functionName: 'triggerRelease',
        args: [vaultAddress],
        account: client.account!,
        chain: client.chain,
      });
      return true;
    } catch (error) {
      console.error('Trigger release failed:', error);
      return false;
    }
  }

  /**
   * Deactivate time configuration for a vault
   *
   * @param vaultId - Vault ID or vault address
   */
  async deactivate(vaultId: string): Promise<void> {
    const client = this.ensureClient();

    if (!canWrite(client)) {
      throw new Error('Write operations require a wallet.');
    }

    const vaultAddress = await this.getVaultAddress(vaultId);

    await client.walletClient!.writeContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'deactivate',
      args: [vaultAddress],
      account: client.account!,
      chain: client.chain,
    });
  }
}
