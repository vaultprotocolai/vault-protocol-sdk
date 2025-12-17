// Core Types for Vault Protocol SDK

export enum ReleaseType {
  SCHEDULED = 'SCHEDULED',
  DEADMAN = 'DEADMAN',
  HYBRID = 'HYBRID'
}

export interface VaultConfig {
  id: string;
  owner: string;
  releaseType: ReleaseType;
  unlockTime?: number;
  checkInPeriod?: number;
  lastCheckIn?: number;
  recipients: string[];
  encrypted: boolean;
  crossChain: boolean;
  aiMonitored: boolean;
}

export interface VaultContent {
  data: string | Uint8Array;
  encrypted: boolean;
  encryptionKey?: string;
  storageLocation: 'arweave' | 'ipfs' | 'ceramic';
  contentType: string;
  size: number;
}

export interface TimeManagerConfig {
  unlockTime?: number;
  checkInPeriod?: number;
  gracePeriod?: number;
}

export interface AttestationProof {
  vaultId: string;
  condition: string;
  proof: string;
  timestamp: number;
  agentSignatures: string[];
}

export interface CrossChainMessage {
  sourceChain: number;
  destChain: number;
  vaultId: string;
  operation: 'create' | 'update' | 'unlock' | 'sync';
  data: any;
}

export interface AIMonitoringConfig {
  enabled: boolean;
  livenessThreshold: number;
  riskThreshold: number;
  agents: string[];
  consensusRequired: number;
}

export interface VaultEvent {
  type: 'created' | 'updated' | 'unlocked' | 'checked_in' | 'attested' | 'cross_chain_sync';
  vaultId: string;
  timestamp: number;
  data: any;
}
