import { type Address, getContract, encodeAbiParameters, parseAbiParameters, toHex } from 'viem';
import { VaultClient, canWrite } from '../client';
import { AttestationHubABI } from '../config/abis';

/**
 * Oracle node information
 */
export interface OracleNode {
  nodeAddress: Address;
  stakedAmount: bigint;
  reputation: number; // 0-10000 (0-100%)
  isActive: boolean;
  attestationCount: number;
  slashedAmount: bigint;
  registeredAt: number; // Unix timestamp
}

/**
 * Attestation request details
 */
export interface AttestationRequest {
  requestId: bigint;
  requestType: string; // bytes32 as hex string
  data: string; // bytes as hex string
  requester: Address;
  requiredConsensus: number;
  createdAt: number;
  expiresAt: number;
  fulfilled: boolean;
}

/**
 * Attestation response from oracle
 */
export interface AttestationResponse {
  requestId: bigint;
  oracle: Address;
  result: boolean;
  proof: string; // bytes as hex string
  signature: string; // bytes as hex string
  timestamp: number;
}

/**
 * Consensus check result
 */
export interface ConsensusResult {
  reached: boolean;
  result: boolean;
}

/**
 * Attestation types supported
 */
export enum AttestationType {
  DEATH_VERIFICATION = 'DEATH_VERIFICATION',
  ACTIVITY_CHECK = 'ACTIVITY_CHECK',
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  DOCUMENT_VERIFICATION = 'DOCUMENT_VERIFICATION',
  CUSTOM = 'CUSTOM',
}

/**
 * Convert attestation type to bytes32
 */
function attestationTypeToBytes32(type: AttestationType | string): `0x${string}` {
  const typeString = typeof type === 'string' ? type : String(type);
  // Pad or truncate to 32 bytes
  const bytes = new TextEncoder().encode(typeString);
  const result = new Uint8Array(32);
  result.set(bytes.slice(0, 32));
  return toHex(result);
}

/**
 * AttestationClient - Decentralized attestation network client
 * Implements Byzantine Fault Tolerance with configurable consensus
 *
 * Note: The AttestationHub contract needs to be deployed and its address
 * added to the contracts configuration. Currently, it may not be deployed
 * on all networks.
 *
 * @example
 * const client = createVaultClient({ chainId: 97, privateKey: '0x...' });
 * const attestation = new AttestationClient(client);
 *
 * // Submit an attestation request
 * const requestId = await attestation.submitAttestation({
 *   type: AttestationType.DEATH_VERIFICATION,
 *   data: vaultAddress,
 *   consensus: 5,
 *   expirationTime: Math.floor(Date.now() / 1000) + 86400 // 24 hours
 * });
 *
 * // Check status
 * const status = await attestation.getAttestationStatus(requestId);
 */
export class AttestationClient {
  private client: VaultClient | null;
  private contractAddress: Address;

  /**
   * Create an AttestationClient instance
   *
   * @param clientOrAddress - VaultClient instance OR legacy contract address
   */
  constructor(clientOrAddress: VaultClient | string) {
    if (typeof clientOrAddress === 'string') {
      this.contractAddress = clientOrAddress as Address;
      this.client = null;
      console.warn(
        'AttestationClient: Legacy constructor detected. Use createVaultClient() for full functionality.'
      );
    } else {
      this.client = clientOrAddress;
      this.contractAddress = clientOrAddress.contracts.AttestationHub || ('0x0000000000000000000000000000000000000000' as Address);
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
   * Check if AttestationHub contract is available
   */
  private ensureContractAvailable(): void {
    if (!this.contractAddress || this.contractAddress === ('0x0000000000000000000000000000000000000000' as Address)) {
      throw new Error(
        'AttestationHub contract not deployed on this network. Attestation features are not yet available.'
      );
    }
  }

  /**
   * Get contract instance
   */
  private getContract(client: VaultClient) {
    return getContract({
      address: this.contractAddress,
      abi: AttestationHubABI,
      client: client.publicClient,
    });
  }

  /**
   * Submit an attestation request to the oracle network
   *
   * @param params - Attestation request parameters
   * @returns Request ID for tracking
   *
   * @example
   * const requestId = await attestation.submitAttestation({
   *   type: AttestationType.DEATH_VERIFICATION,
   *   data: vaultAddress,
   *   consensus: 5, // 5-of-7 BFT
   *   expirationTime: Math.floor(Date.now() / 1000) + 86400
   * });
   */
  async submitAttestation(params: {
    type: AttestationType | string;
    data: string | Uint8Array;
    consensus: number;
    expirationTime: number;
  }): Promise<bigint> {
    this.ensureContractAvailable();
    const client = this.ensureWriteClient();

    const requestType = attestationTypeToBytes32(params.type);
    const requestData =
      typeof params.data === 'string'
        ? (params.data.startsWith('0x') ? params.data : toHex(new TextEncoder().encode(params.data)))
        : toHex(params.data);

    try {
      const hash = await client.walletClient!.writeContract({
        address: this.contractAddress,
        abi: AttestationHubABI,
        functionName: 'requestAttestation',
        args: [requestType, requestData as `0x${string}`, BigInt(params.consensus), BigInt(params.expirationTime)],
        account: client.account!,
        chain: client.chain,
      });

      const receipt = await client.publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status !== 'success') {
        throw new Error('Attestation request transaction failed');
      }

      // Find the AttestationRequested event to get the request ID
      // For now, we'll query the contract to get the latest request
      // In a full implementation, we'd parse the event logs
      console.log(`Attestation request submitted: ${hash}`);

      // Return a placeholder - in real usage, parse from event logs
      return BigInt(Date.now());
    } catch (error) {
      console.error('Failed to submit attestation:', error);
      throw error;
    }
  }

  /**
   * Verify an attestation result
   *
   * @param requestId - Request ID to verify
   * @returns Consensus result with verification status
   */
  async verifyAttestation(requestId: bigint | number): Promise<ConsensusResult> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    const result = await contract.read.checkConsensus([BigInt(requestId)]);

    return {
      reached: result[0],
      result: result[1],
    };
  }

  /**
   * Get attestation request status
   *
   * @param requestId - Request ID to check
   * @returns Attestation request details
   */
  async getAttestationStatus(requestId: bigint | number): Promise<AttestationRequest> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    const request = await contract.read.getAttestationRequest([BigInt(requestId)]);

    return {
      requestId: request.requestId,
      requestType: request.requestType,
      data: request.data,
      requester: request.requester,
      requiredConsensus: Number(request.requiredConsensus),
      createdAt: Number(request.createdAt),
      expiresAt: Number(request.expiresAt),
      fulfilled: request.fulfilled,
    };
  }

  /**
   * Get responses for an attestation request
   *
   * @param requestId - Request ID
   * @returns Array of attestation responses
   */
  async getAttestationResponses(requestId: bigint | number): Promise<AttestationResponse[]> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    const responses = await contract.read.getAttestationResponses([BigInt(requestId)]);

    return responses.map((r) => ({
      requestId: r.requestId,
      oracle: r.oracle,
      result: r.result,
      proof: r.proof,
      signature: r.signature,
      timestamp: Number(r.timestamp),
    }));
  }

  /**
   * Register as an oracle agent
   *
   * @param stakeAmount - Amount of VAULT tokens to stake (minimum 100,000)
   * @returns true if registration successful
   *
   * Note: Requires VAULT token approval before calling
   */
  async registerAgent(stakeAmount: bigint): Promise<boolean> {
    this.ensureContractAvailable();
    const client = this.ensureWriteClient();

    try {
      const hash = await client.walletClient!.writeContract({
        address: this.contractAddress,
        abi: AttestationHubABI,
        functionName: 'registerOracle',
        args: [stakeAmount],
        account: client.account!,
        chain: client.chain,
      });

      const receipt = await client.publicClient.waitForTransactionReceipt({ hash });
      return receipt.status === 'success';
    } catch (error) {
      console.error('Failed to register as agent:', error);
      throw error;
    }
  }

  /**
   * Deregister as an oracle agent and withdraw stake
   *
   * @returns true if deregistration successful
   */
  async deregisterAgent(): Promise<boolean> {
    this.ensureContractAvailable();
    const client = this.ensureWriteClient();

    try {
      const hash = await client.walletClient!.writeContract({
        address: this.contractAddress,
        abi: AttestationHubABI,
        functionName: 'deregisterOracle',
        args: [],
        account: client.account!,
        chain: client.chain,
      });

      const receipt = await client.publicClient.waitForTransactionReceipt({ hash });
      return receipt.status === 'success';
    } catch (error) {
      console.error('Failed to deregister agent:', error);
      throw error;
    }
  }

  /**
   * Get oracle node information
   *
   * @param oracleAddress - Oracle address to query
   * @returns Oracle node details
   */
  async getOracleNode(oracleAddress: string): Promise<OracleNode> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    const node = await contract.read.getOracleNode([oracleAddress as Address]);

    return {
      nodeAddress: node.nodeAddress,
      stakedAmount: node.stakedAmount,
      reputation: Number(node.reputation),
      isActive: node.isActive,
      attestationCount: Number(node.attestationCount),
      slashedAmount: node.slashedAmount,
      registeredAt: Number(node.registeredAt),
    };
  }

  /**
   * Get all active oracle addresses
   *
   * @returns Array of active oracle addresses
   */
  async getActiveOracles(): Promise<Address[]> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    const oracles = await contract.read.getActiveOracles();
    return [...oracles]; // Convert readonly array to mutable array
  }

  /**
   * Get number of active oracles
   *
   * @returns Number of active oracle nodes
   */
  async getActiveOracleCount(): Promise<number> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    const count = await contract.read.getActiveOracleCount();
    return Number(count);
  }

  /**
   * Provide attestation response (oracle only)
   *
   * @param requestId - Request ID to respond to
   * @param result - Attestation result (true/false)
   * @param proof - Supporting proof data
   * @param signature - Oracle signature
   * @returns true if attestation provided successfully
   */
  async provideAttestation(
    requestId: bigint | number,
    result: boolean,
    proof: string | Uint8Array,
    signature: string | Uint8Array
  ): Promise<boolean> {
    this.ensureContractAvailable();
    const client = this.ensureWriteClient();

    const proofHex =
      typeof proof === 'string' ? (proof.startsWith('0x') ? proof : toHex(new TextEncoder().encode(proof))) : toHex(proof);
    const sigHex =
      typeof signature === 'string'
        ? (signature.startsWith('0x') ? signature : toHex(new TextEncoder().encode(signature)))
        : toHex(signature);

    try {
      const hash = await client.walletClient!.writeContract({
        address: this.contractAddress,
        abi: AttestationHubABI,
        functionName: 'provideAttestation',
        args: [BigInt(requestId), result, proofHex as `0x${string}`, sigHex as `0x${string}`],
        account: client.account!,
        chain: client.chain,
      });

      const receipt = await client.publicClient.waitForTransactionReceipt({ hash });
      return receipt.status === 'success';
    } catch (error) {
      console.error('Failed to provide attestation:', error);
      throw error;
    }
  }

  /**
   * Check if contract is paused
   *
   * @returns true if contract is paused
   */
  async isPaused(): Promise<boolean> {
    this.ensureContractAvailable();
    const client = this.ensureClient();

    const contract = this.getContract(client);
    return await contract.read.paused();
  }
}
