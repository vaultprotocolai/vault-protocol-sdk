# Vault Protocol SDK

TypeScript SDK for building applications on Vault Protocol - the permissionless, AI-monitored vault infrastructure for Web3.

## Installation

```bash
npm install @vault/protocol-sdk
# or
yarn add @vault/protocol-sdk
# or
pnpm add @vault/protocol-sdk
```

## Features

- **Vault Management** - Create, read, update, and manage vaults
- **Time-Based Releases** - Scheduled unlocks and dead-man switch functionality
- **AI Monitoring** - Multi-agent consensus with liveness and risk scoring
- **Cross-Chain Support** - 8+ chains via LayerZero (Ethereum, Polygon, Arbitrum, Optimism, Base, BSC, Avalanche, opBNB)
- **Client-Side Encryption** - AES-256-GCM encryption for vault contents
- **FHE Support** - Fully Homomorphic Encryption for advanced privacy
- **Event Monitoring** - Real-time WebSocket event subscriptions
- **Decentralized Storage** - Arweave, IPFS, and Ceramic integration

## Quick Start

```typescript
import {
  VaultManager,
  TimeManager,
  AIVaultManager,
  ReleaseType
} from '@vault/protocol-sdk';

// Initialize the SDK
const vaultManager = new VaultManager(
  'https://api.vaultprotocol.ai',
  '0x...' // Contract address
);

// Create a vault
const vault = await vaultManager.createVault({
  releaseType: ReleaseType.DEADMAN,
  checkInPeriod: 30 * 24 * 60 * 60, // 30 days
  recipients: ['0x...'],
  encrypted: true,
  aiMonitored: true
});

// Upload content
await vaultManager.uploadContent(vault.id, {
  data: 'encrypted-content',
  encrypted: true,
  storageLocation: 'arweave',
  contentType: 'application/json',
  size: 1024
});
```

## Vault Types

### Scheduled Vault
Unlocks at a specific date/time.

```typescript
import { VaultManager, ReleaseType } from '@vault/protocol-sdk';

const vault = await vaultManager.createVault({
  releaseType: ReleaseType.SCHEDULED,
  unlockTime: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
  recipients: ['0x...']
});
```

### Dead-Man Switch Vault
Requires periodic check-ins to prevent automatic release.

```typescript
import { VaultManager, TimeManager, ReleaseType } from '@vault/protocol-sdk';

const vault = await vaultManager.createVault({
  releaseType: ReleaseType.DEADMAN,
  checkInPeriod: 30 * 24 * 60 * 60, // 30 days in seconds
  recipients: ['0x...']
});

// Check in to reset the timer
const timeManager = new TimeManager('0x...');
await timeManager.checkIn(vault.id);
```

### Hybrid Vault
Combines scheduled release with dead-man switch.

```typescript
const vault = await vaultManager.createVault({
  releaseType: ReleaseType.HYBRID,
  unlockTime: Date.now() + 365 * 24 * 60 * 60 * 1000,
  checkInPeriod: 30 * 24 * 60 * 60,
  recipients: ['0x...']
});
```

## AI Monitoring

Enable AI-powered monitoring for liveness detection and risk assessment.

```typescript
import { AIVaultManager } from '@vault/protocol-sdk';

const aiManager = new AIVaultManager('0x...');

// Enable monitoring
await aiManager.enableMonitoring(vault.id, {
  enabled: true,
  livenessThreshold: 50,
  riskThreshold: 70,
  agents: ['agent1', 'agent2', 'agent3'],
  consensusRequired: 2
});

// Get scores
const livenessScore = await aiManager.getLivenessScore(vault.id);
const riskScore = await aiManager.getRiskScore(vault.id);

// Get AI recommendations
const recommendations = await aiManager.getRecommendations(vault.id);
```

## Cross-Chain Support

Sync vaults across multiple chains via LayerZero.

```typescript
import { CrossChainClient } from '@vault/protocol-sdk';

const crossChain = new CrossChainClient('0x...');

// Check supported chains
crossChain.isSupportedChain(137); // true (Polygon)
crossChain.isSupportedChain(204); // true (opBNB Mainnet)

// Sync vault to another chain
await crossChain.syncVault(vault.id, 137); // Sync to Polygon

// Send cross-chain message
await crossChain.sendMessage({
  sourceChain: 204,
  destChain: 137,
  vaultId: vault.id,
  operation: 'sync',
  data: {}
});
```

## Encryption

Client-side AES-256-GCM encryption utilities.

```typescript
import {
  generateEncryptionKey,
  encryptData,
  decryptData,
  exportKey,
  importKey
} from '@vault/protocol-sdk';

// Generate a new encryption key
const key = await generateEncryptionKey();

// Encrypt data
const { encrypted, iv } = await encryptData('sensitive data', key);

// Decrypt data
const decrypted = await decryptData(encrypted, key, iv);

// Export key for storage
const exportedKey = await exportKey(key);

// Import key from storage
const importedKey = await importKey(exportedKey);
```

## FHE (Fully Homomorphic Encryption)

Advanced privacy with FHE support.

```typescript
import { FHEVault } from '@vault/protocol-sdk';

const fheVault = new FHEVault('0x...');

// Encrypt with FHE
const ciphertext = await fheVault.encrypt(vault.id, 'data');

// Compute on encrypted data
const result = await fheVault.compute(vault.id, 'operation', params);

// Decrypt result
const decrypted = await fheVault.decrypt(vault.id, result);
```

## Event Monitoring

Subscribe to real-time vault events via WebSocket.

```typescript
import { EventMonitor } from '@vault/protocol-sdk';

const monitor = new EventMonitor('wss://events.vaultprotocol.ai');

// Connect to event stream
await monitor.connect();

// Subscribe to specific vault events
const unsubscribe = monitor.subscribe(vault.id, (event) => {
  console.log('Vault event:', event.type, event.data);
});

// Subscribe to all events
monitor.subscribeAll((event) => {
  console.log('Global event:', event);
});

// Cleanup
unsubscribe();
monitor.disconnect();
```

## Storage

Decentralized storage integration.

```typescript
import { StorageClient } from '@vault/protocol-sdk';

const storage = new StorageClient();

// Upload to Arweave
const arweaveId = await storage.uploadToArweave(data);

// Upload to IPFS
const ipfsHash = await storage.uploadToIPFS(data);

// Upload to Ceramic
const ceramicId = await storage.uploadToCeramic(data);

// Retrieve content
const content = await storage.retrieve(storageId, 'arweave');
```

## Attestation

ZK attestation for vault conditions.

```typescript
import { AttestationClient } from '@vault/protocol-sdk';

const attestation = new AttestationClient('0x...');

// Create attestation proof
const proof = await attestation.createAttestation(vault.id, {
  condition: 'owner_inactive',
  proof: '0x...',
  timestamp: Date.now(),
  agentSignatures: ['0x...', '0x...']
});

// Verify attestation
const isValid = await attestation.verifyAttestation(proof);
```

## Supported Chains

| Chain | Chain ID | Status |
|-------|----------|--------|
| opBNB (Primary) | 204 | Mainnet |
| opBNB Testnet | 5611 | Testnet |
| Ethereum | 1 | Supported |
| Polygon | 137 | Supported |
| Arbitrum | 42161 | Supported |
| Optimism | 10 | Supported |
| Base | 8453 | Supported |
| BSC | 56 | Supported |
| Avalanche | 43114 | Supported |

## TypeScript Types

```typescript
import type {
  VaultConfig,
  VaultContent,
  ReleaseType,
  TimeManagerConfig,
  AttestationProof,
  CrossChainMessage,
  AIMonitoringConfig,
  VaultEvent
} from '@vault/protocol-sdk';
```

## API Reference

### VaultManager
- `createVault(config)` - Create a new vault
- `getVault(vaultId)` - Get vault by ID
- `updateVault(vaultId, updates)` - Update vault configuration
- `uploadContent(vaultId, content)` - Upload content to vault
- `isUnlocked(vaultId)` - Check if vault is unlocked
- `unlockVault(vaultId)` - Unlock vault (if conditions met)
- `getVaultsByOwner(owner)` - Get all vaults for an owner

### TimeManager
- `setUnlockTime(vaultId, time)` - Set scheduled unlock time
- `checkIn(vaultId)` - Check in to reset dead-man timer
- `getTimeUntilUnlock(vaultId)` - Get time remaining until unlock
- `getLastCheckIn(vaultId)` - Get last check-in timestamp

### AIVaultManager
- `enableMonitoring(vaultId, config)` - Enable AI monitoring
- `getLivenessScore(vaultId)` - Get liveness score (0-100)
- `getRiskScore(vaultId)` - Get risk score (0-100)
- `predictUnlockTime(vaultId)` - Predict unlock time
- `getRecommendations(vaultId)` - Get AI recommendations

### CrossChainClient
- `sendMessage(message)` - Send cross-chain message
- `getMessageStatus(messageId)` - Get message status
- `syncVault(vaultId, targetChain)` - Sync vault across chains
- `isSupportedChain(chainId)` - Check if chain is supported

### FHEVault
- `encrypt(vaultId, data)` - Encrypt data with FHE
- `decrypt(vaultId, ciphertext)` - Decrypt FHE ciphertext
- `compute(vaultId, operation, params)` - Compute on encrypted data

### AttestationClient
- `createAttestation(vaultId, proof)` - Create attestation proof
- `verifyAttestation(proof)` - Verify attestation
- `getAttestations(vaultId)` - Get all attestations for vault

### EventMonitor
- `connect()` - Connect to WebSocket event stream
- `disconnect()` - Disconnect from event stream
- `subscribe(vaultId, callback)` - Subscribe to vault events
- `subscribeAll(callback)` - Subscribe to all events

### StorageClient
- `uploadToArweave(data)` - Upload to Arweave
- `uploadToIPFS(data)` - Upload to IPFS
- `uploadToCeramic(data)` - Upload to Ceramic
- `retrieve(id, provider)` - Retrieve stored content

### Encryption Utilities
- `generateEncryptionKey()` - Generate AES-256-GCM key
- `encryptData(data, key)` - Encrypt data
- `decryptData(encrypted, key, iv)` - Decrypt data
- `exportKey(key)` - Export key to string
- `importKey(keyData)` - Import key from string

## License

MIT

## Links

- [Website](https://vaultprotocol.ai)
- [Documentation](https://vaultprotocol.ai/developers)
- [GitHub](https://github.com/vaultprotocolai)
- [Twitter/X](https://x.com/vaultprotocolai)
- [Telegram](https://t.me/vaultprotocolai)
