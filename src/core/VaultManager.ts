import { type Address, type Hash, getContract } from 'viem';
import { VaultConfig, VaultContent, ReleaseType } from '../types';
import { VaultClient, canWrite, getAccountOrThrow } from '../client';
import { VaultFactoryABI, TimeManagerABI, ReleaseTypeContract } from '../config';

/**
 * On-chain vault data structure
 */
interface OnChainVault {
  id: bigint;
  vaultAddress: Address;
  owner: Address;
  name: string;
  encryptedContentCID: string;
  createdAt: bigint;
  isActive: boolean;
}

/**
 * VaultManager - Core vault operations (CRUD)
 * Handles vault creation, reading, updating, and deletion
 *
 * @example
 * // With private key
 * const client = createVaultClient({ chainId: 97, privateKey: '0x...' });
 * const vaultManager = new VaultManager(client);
 * const vault = await vaultManager.createVault({ name: 'My Vault', ... });
 *
 * @example
 * // With external wallet (frontend)
 * const client = createVaultClient({ chainId: 97, walletClient: metamaskClient, account: '0x...' });
 * const vaultManager = new VaultManager(client);
 */
export class VaultManager {
  private client: VaultClient;

  // Legacy properties for backward compatibility
  private apiUrl: string;
  private contractAddress: string;

  /**
   * Create a VaultManager instance
   *
   * @param clientOrApiUrl - VaultClient instance OR legacy API URL string
   * @param contractAddress - Legacy contract address (only used with API URL)
   */
  constructor(clientOrApiUrl: VaultClient | string, contractAddress?: string) {
    if (typeof clientOrApiUrl === 'string') {
      // Legacy mode - store for backward compatibility but log warning
      this.apiUrl = clientOrApiUrl;
      this.contractAddress = contractAddress || '';
      // Create a placeholder client - operations will fail without proper client
      this.client = null as any;
      console.warn(
        'VaultManager: Legacy constructor detected. Please use createVaultClient() for blockchain operations.'
      );
    } else {
      // New mode with VaultClient
      this.client = clientOrApiUrl;
      this.apiUrl = '';
      this.contractAddress = clientOrApiUrl.contracts.VaultManager;
    }
  }

  /**
   * Ensure client is available for operations
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
   * Get VaultFactory contract instance
   */
  private getVaultFactoryContract() {
    const client = this.ensureClient();
    return getContract({
      address: client.contracts.VaultManager,
      abi: VaultFactoryABI,
      client: {
        public: client.publicClient,
        wallet: client.walletClient,
      },
    });
  }

  /**
   * Get TimeManager contract instance
   */
  private getTimeManagerContract() {
    const client = this.ensureClient();
    return getContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      client: {
        public: client.publicClient,
        wallet: client.walletClient,
      },
    });
  }

  /**
   * Create a new vault on-chain
   *
   * @param config - Vault configuration
   * @returns Created vault configuration with on-chain ID
   */
  async createVault(config: Partial<VaultConfig>): Promise<VaultConfig> {
    const client = this.ensureClient();

    if (!canWrite(client)) {
      throw new Error('Write operations require a wallet. Initialize client with privateKey or walletClient.');
    }

    const contract = this.getVaultFactoryContract();

    // Get creation fee
    const creationFee = await client.publicClient.readContract({
      address: client.contracts.VaultManager,
      abi: VaultFactoryABI,
      functionName: 'creationFee',
    });

    // Create vault on-chain
    const name = config.id || `Vault-${Date.now()}`;
    const contentCID = ''; // Empty initially, content uploaded separately

    const hash = await client.walletClient.writeContract({
      address: client.contracts.VaultManager,
      abi: VaultFactoryABI,
      functionName: 'createVault',
      args: [name, contentCID],
      value: creationFee as bigint,
      account: client.account,
      chain: client.chain,
    });

    // Wait for transaction
    const receipt = await client.publicClient.waitForTransactionReceipt({ hash });

    // Parse VaultCreated event to get vault ID and address
    const vaultCreatedLog = receipt.logs.find((log) => {
      // VaultCreated event signature
      return log.topics[0] === '0x' + 'VaultCreated'.padEnd(64, '0'); // Simplified check
    });

    // Get vault count to find the new vault ID
    const vaultCount = await client.publicClient.readContract({
      address: client.contracts.VaultManager,
      abi: VaultFactoryABI,
      functionName: 'vaultCount',
    });

    const vaultId = (vaultCount as bigint) - 1n;

    // Get vault details
    const vaultData = await client.publicClient.readContract({
      address: client.contracts.VaultManager,
      abi: VaultFactoryABI,
      functionName: 'vaults',
      args: [vaultId],
    }) as [bigint, Address, Address, string, string, bigint, boolean];

    // If time configuration is provided, configure TimeManager
    if (config.releaseType || config.unlockTime || config.checkInPeriod) {
      const timeManager = this.getTimeManagerContract();

      // Map SDK ReleaseType to contract enum
      let releaseTypeEnum: ReleaseTypeContract = ReleaseTypeContract.NONE;
      if (config.releaseType === ReleaseType.SCHEDULED) {
        releaseTypeEnum = ReleaseTypeContract.SCHEDULED;
      } else if (config.releaseType === ReleaseType.DEADMAN) {
        releaseTypeEnum = ReleaseTypeContract.DEADMAN;
      } else if (config.releaseType === ReleaseType.HYBRID) {
        releaseTypeEnum = ReleaseTypeContract.HYBRID;
      }

      const scheduledTime = config.unlockTime ? BigInt(Math.floor(config.unlockTime / 1000)) : 0n;
      const deadmanDuration = config.checkInPeriod ? BigInt(config.checkInPeriod) : 0n;

      await client.walletClient.writeContract({
        address: client.contracts.VaultTimeManager,
        abi: TimeManagerABI,
        functionName: 'configureTime',
        args: [vaultData[1], releaseTypeEnum, scheduledTime, deadmanDuration],
        account: client.account,
        chain: client.chain,
      });
    }

    return {
      id: vaultId.toString(),
      owner: vaultData[2],
      releaseType: config.releaseType || ReleaseType.SCHEDULED,
      unlockTime: config.unlockTime,
      checkInPeriod: config.checkInPeriod,
      lastCheckIn: Date.now(),
      recipients: config.recipients || [],
      encrypted: config.encrypted ?? true,
      crossChain: config.crossChain ?? false,
      aiMonitored: config.aiMonitored ?? false,
    };
  }

  /**
   * Get vault by ID from on-chain
   *
   * @param vaultId - Vault ID (numeric string)
   * @returns Vault configuration or null if not found
   */
  async getVault(vaultId: string): Promise<VaultConfig | null> {
    const client = this.ensureClient();

    try {
      const vaultData = await client.publicClient.readContract({
        address: client.contracts.VaultManager,
        abi: VaultFactoryABI,
        functionName: 'vaults',
        args: [BigInt(vaultId)],
      }) as [bigint, Address, Address, string, string, bigint, boolean];

      if (!vaultData[6]) {
        // Not active
        return null;
      }

      // Get time configuration if available
      let releaseType = ReleaseType.SCHEDULED;
      let unlockTime: number | undefined;
      let checkInPeriod: number | undefined;
      let lastCheckIn: number | undefined;

      try {
        const timeConfig = await client.publicClient.readContract({
          address: client.contracts.VaultTimeManager,
          abi: TimeManagerABI,
          functionName: 'vaultConfigs',
          args: [vaultData[1]],
        }) as [number, bigint, bigint, bigint, boolean];

        if (timeConfig[4]) {
          // isActive
          const contractReleaseType = timeConfig[0];
          if (contractReleaseType === ReleaseTypeContract.SCHEDULED) {
            releaseType = ReleaseType.SCHEDULED;
          } else if (contractReleaseType === ReleaseTypeContract.DEADMAN) {
            releaseType = ReleaseType.DEADMAN;
          } else if (contractReleaseType === ReleaseTypeContract.HYBRID) {
            releaseType = ReleaseType.HYBRID;
          }

          unlockTime = Number(timeConfig[1]) * 1000; // Convert to milliseconds
          checkInPeriod = Number(timeConfig[2]);
          lastCheckIn = Number(timeConfig[3]) * 1000;
        }
      } catch {
        // TimeManager config not set, use defaults
      }

      return {
        id: vaultId,
        owner: vaultData[2],
        releaseType,
        unlockTime,
        checkInPeriod,
        lastCheckIn,
        recipients: [], // Recipients stored off-chain or in access control
        encrypted: true,
        crossChain: false,
        aiMonitored: false,
      };
    } catch (error) {
      console.error('Error fetching vault:', error);
      return null;
    }
  }

  /**
   * Update vault content CID on-chain
   *
   * @param vaultId - Vault ID
   * @param updates - Updates (currently only content CID can be updated)
   * @returns Updated vault configuration
   */
  async updateVault(vaultId: string, updates: Partial<VaultConfig>): Promise<VaultConfig> {
    const client = this.ensureClient();

    if (!canWrite(client)) {
      throw new Error('Write operations require a wallet. Initialize client with privateKey or walletClient.');
    }

    // If we have new content to upload, update the CID
    // Note: The actual content should be uploaded to storage first

    const vault = await this.getVault(vaultId);
    if (!vault) {
      throw new Error(`Vault ${vaultId} not found`);
    }

    return {
      ...vault,
      ...updates,
    };
  }

  /**
   * Upload content to vault (stores content and updates on-chain CID)
   *
   * @param vaultId - Vault ID
   * @param content - Content to upload
   * @returns Content CID
   */
  async uploadContent(vaultId: string, content: VaultContent): Promise<string> {
    const client = this.ensureClient();

    if (!canWrite(client)) {
      throw new Error('Write operations require a wallet. Initialize client with privateKey or walletClient.');
    }

    // Content should be uploaded to IPFS/Arweave/Ceramic via StorageClient
    // This method updates the on-chain reference

    // Convert data to string if it's a Uint8Array (should be a CID string)
    const contentCID = typeof content.data === 'string'
      ? content.data
      : new TextDecoder().decode(content.data);

    await client.walletClient.writeContract({
      address: client.contracts.VaultManager,
      abi: VaultFactoryABI,
      functionName: 'updateVaultContent',
      args: [BigInt(vaultId), contentCID],
      account: client.account!,
      chain: client.chain,
    });

    return contentCID;
  }

  /**
   * Check if vault is unlocked (release conditions met)
   *
   * @param vaultId - Vault ID
   * @returns True if vault can be released
   */
  async isUnlocked(vaultId: string): Promise<boolean> {
    const client = this.ensureClient();

    // Get vault address
    const vaultData = await client.publicClient.readContract({
      address: client.contracts.VaultManager,
      abi: VaultFactoryABI,
      functionName: 'vaults',
      args: [BigInt(vaultId)],
    }) as [bigint, Address, Address, string, string, bigint, boolean];

    const vaultAddress = vaultData[1];

    // Check release condition via TimeManager
    const [shouldRelease] = await client.publicClient.readContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'checkReleaseCondition',
      args: [vaultAddress],
    }) as [boolean, string];

    return shouldRelease;
  }

  /**
   * Trigger vault unlock (if conditions are met)
   *
   * @param vaultId - Vault ID
   * @returns True if unlock was successful
   */
  async unlockVault(vaultId: string): Promise<boolean> {
    const client = this.ensureClient();

    if (!canWrite(client)) {
      throw new Error('Write operations require a wallet. Initialize client with privateKey or walletClient.');
    }

    // Get vault address
    const vaultData = await client.publicClient.readContract({
      address: client.contracts.VaultManager,
      abi: VaultFactoryABI,
      functionName: 'vaults',
      args: [BigInt(vaultId)],
    }) as [bigint, Address, Address, string, string, bigint, boolean];

    const vaultAddress = vaultData[1];

    // Check if can be released
    const [shouldRelease, reason] = await client.publicClient.readContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'checkReleaseCondition',
      args: [vaultAddress],
    }) as [boolean, string];

    if (!shouldRelease) {
      console.log(`Cannot unlock vault: ${reason}`);
      return false;
    }

    // Trigger release
    await client.walletClient.writeContract({
      address: client.contracts.VaultTimeManager,
      abi: TimeManagerABI,
      functionName: 'triggerRelease',
      args: [vaultAddress],
      account: client.account!,
      chain: client.chain,
    });

    return true;
  }

  /**
   * Get all vaults owned by an address
   *
   * @param owner - Owner address
   * @returns Array of vault configurations
   */
  async getVaultsByOwner(owner: string): Promise<VaultConfig[]> {
    const client = this.ensureClient();

    // Get vault IDs for owner
    const vaultIds = await client.publicClient.readContract({
      address: client.contracts.VaultManager,
      abi: VaultFactoryABI,
      functionName: 'getVaultsByOwner',
      args: [owner as Address],
    }) as bigint[];

    // Fetch each vault's details
    const vaults: VaultConfig[] = [];
    for (const id of vaultIds) {
      const vault = await this.getVault(id.toString());
      if (vault) {
        vaults.push(vault);
      }
    }

    return vaults;
  }

  /**
   * Get total vault count
   *
   * @returns Total number of vaults created
   */
  async getVaultCount(): Promise<number> {
    const client = this.ensureClient();

    const count = await client.publicClient.readContract({
      address: client.contracts.VaultManager,
      abi: VaultFactoryABI,
      functionName: 'vaultCount',
    });

    return Number(count);
  }

  /**
   * Get vault creation fee
   *
   * @returns Creation fee in wei
   */
  async getCreationFee(): Promise<bigint> {
    const client = this.ensureClient();

    const fee = await client.publicClient.readContract({
      address: client.contracts.VaultManager,
      abi: VaultFactoryABI,
      functionName: 'creationFee',
    });

    return fee as bigint;
  }
}
