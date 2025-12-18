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
  createVaultClient,
  VaultManager,
  TimeManager,
  ReleaseType
} from '@vault/protocol-sdk';

// Option 1: Backend/Scripts - Private key mode
const client = createVaultClient({
  chainId: 97,  // BSC Testnet
  privateKey: '0x...'
});

// Option 2: Frontend - External wallet mode (MetaMask, WalletConnect)
const client = createVaultClient({
  chainId: 97,
  walletClient: existingWalletClient,
  account: '0x...'
});

// Option 3: Read-only mode
const client = createReadOnlyClient(97);

// Initialize managers with the client
const vaultManager = new VaultManager(client);
const timeManager = new TimeManager(client);

// Create a vault
const vault = await vaultManager.createVault({
  releaseType: ReleaseType.DEADMAN,
  recipients: ['0x...'],
  contentCID: 'QmYourContent...',
  config: {
    checkInPeriod: 30 * 24 * 60 * 60, // 30 days
  }
});

// Check in to reset dead-man timer
await timeManager.checkIn(vault.id);
```

## Deployed Contracts

| Chain | Chain ID | Status | VaultManager | VaultTimeManager |
|-------|----------|--------|--------------|------------------|
| BSC Testnet | 97 | Active | `0x116865F62E1714D9B512Fd9E4f35e6fDb53D019C` | `0x68e41639B0c5C56F6E6b0f0Cf9612acac089ff4D` |
| opBNB Mainnet | 204 | Pending | - | - |
| opBNB Testnet | 5611 | Pending | - | - |

## Client Factory

The SDK uses a client factory pattern that supports three wallet modes:

### Private Key Mode (Backend/Scripts)

```typescript
import { createPrivateKeyClient, VaultManager } from '@vault/protocol-sdk';

const client = createPrivateKeyClient(
  97,           // Chain ID
  '0x...',      // Private key
  'https://custom-rpc.example.com'  // Optional custom RPC
);

const vaultManager = new VaultManager(client);
```

### External Wallet Mode (Frontend)

```typescript
import { createWalletClientWrapper, VaultManager } from '@vault/protocol-sdk';

// Use with MetaMask, WalletConnect, etc.
const client = createWalletClientWrapper(
  97,               // Chain ID
  walletClient,     // viem WalletClient from your wallet provider
  '0x...'           // Account address
);

const vaultManager = new VaultManager(client);
```

### Read-Only Mode

```typescript
import { createReadOnlyClient, VaultManager } from '@vault/protocol-sdk';

// For querying without signing capability
const client = createReadOnlyClient(97);

const vaultManager = new VaultManager(client);
const vaults = await vaultManager.getVaultsByOwner('0x...');
```

## Vault Types

### Scheduled Vault

Unlocks at a specific date/time.

```typescript
import { VaultManager, ReleaseType } from '@vault/protocol-sdk';

const vault = await vaultManager.createVault({
  releaseType: ReleaseType.SCHEDULED,
  recipients: ['0x...'],
  contentCID: 'QmContent...',
  config: {
    unlockTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60  // 1 year
  }
});
```

### Dead-Man Switch Vault

Requires periodic check-ins to prevent automatic release.

```typescript
const vault = await vaultManager.createVault({
  releaseType: ReleaseType.DEADMAN,
  recipients: ['0x...'],
  contentCID: 'QmContent...',
  config: {
    checkInPeriod: 30 * 24 * 60 * 60  // 30 days in seconds
  }
});

// Check in periodically to reset the timer
const timeManager = new TimeManager(client);
await timeManager.checkIn(vault.address);
```

### Hybrid Vault

Combines scheduled release with dead-man switch.

```typescript
const vault = await vaultManager.createVault({
  releaseType: ReleaseType.HYBRID,
  recipients: ['0x...'],
  contentCID: 'QmContent...',
  config: {
    unlockTime: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    checkInPeriod: 30 * 24 * 60 * 60
  }
});
```

## AI Monitoring

Enable AI-powered monitoring for liveness detection and risk assessment.

```typescript
import { AIVaultManager } from '@vault/protocol-sdk';

const aiManager = new AIVaultManager(client);

// Enable monitoring for a vault
await aiManager.enableMonitoring(vaultAddress);

// Get liveness score (0-100)
const livenessScore = await aiManager.getLivenessScore(vaultAddress);

// Get risk score (0-100)
const riskScore = await aiManager.getRiskScore(vaultAddress);

// Get AI recommendations
const recommendations = await aiManager.getRecommendations(vaultAddress);
console.log(recommendations);
// ['Enable AI verification for enhanced security monitoring', ...]

// Check if AI would prevent release
const { shouldPrevent, reason } = await aiManager.shouldPreventRelease(vaultAddress);

// Get full AI state
const state = await aiManager.getVaultAIState(vaultAddress);
console.log(state);
// {
//   livenessScore: 85,
//   riskScore: 15,
//   lastAIPrediction: 1702345678,
//   aiCheckCount: 42,
//   aiVerificationEnabled: true,
//   isPausedByAI: false,
//   lastAIReason: ''
// }
```

## Attestation Network

Decentralized attestation with Byzantine Fault Tolerance (5-of-7 consensus).

```typescript
import { AttestationClient, AttestationType } from '@vault/protocol-sdk';

const attestation = new AttestationClient(client);

// Submit an attestation request
const requestId = await attestation.submitAttestation({
  type: AttestationType.DEATH_VERIFICATION,
  data: vaultAddress,
  consensus: 5,  // 5-of-7 BFT
  expirationTime: Math.floor(Date.now() / 1000) + 86400  // 24 hours
});

// Verify attestation result
const result = await attestation.verifyAttestation(requestId);
console.log(result);  // { reached: true, result: true }

// Get attestation status
const status = await attestation.getAttestationStatus(requestId);

// Get attestation responses from oracles
const responses = await attestation.getAttestationResponses(requestId);

// Register as an oracle agent (requires staking)
await attestation.registerAgent(BigInt('100000000000000000000000'));  // 100,000 VAULT tokens
```

## Cross-Chain Support

Sync vaults across multiple chains via LayerZero.

```typescript
import { CrossChainClient } from '@vault/protocol-sdk';

const crossChain = new CrossChainClient(client);

// Check supported chains
console.log(crossChain.isSupportedChain(137));  // true (Polygon)
console.log(crossChain.isSupportedChain(204));  // true (opBNB Mainnet)

// Sync vault to another chain
await crossChain.syncVault(vaultAddress, 137);  // Sync to Polygon

// Send cross-chain message
await crossChain.sendMessage({
  sourceChain: 204,
  destChain: 137,
  vaultId: vaultAddress,
  operation: 'sync',
  data: {}
});

// Check message status
const status = await crossChain.getMessageStatus(messageId);
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

// Export key for storage (base64)
const exportedKey = await exportKey(key);

// Import key from storage
const importedKey = await importKey(exportedKey);
```

## Decentralized Storage

```typescript
import { StorageClient } from '@vault/protocol-sdk';

const storage = new StorageClient({
  ipfsApiKey: process.env.PINATA_API_KEY,
  ipfsApiSecret: process.env.PINATA_API_SECRET,
  arweaveKey: process.env.ARWEAVE_KEY,
  ceramicNodeUrl: 'https://ceramic-clay.3boxlabs.com'
});

// Upload to IPFS (via Pinata)
const ipfsResult = await storage.uploadToIPFS(data, {
  name: 'vault-content',
  pinataMetadata: { vaultId: '123' }
});
console.log(ipfsResult);
// { provider: 'ipfs', cid: 'Qm...', url: 'https://gateway.pinata.cloud/ipfs/Qm...', size: 1024 }

// Upload to Arweave
const arweaveResult = await storage.uploadToArweave(data, {
  tags: [{ name: 'Content-Type', value: 'application/json' }]
});

// Upload to Ceramic
const ceramicResult = await storage.uploadToCeramic(data, schema);

// Retrieve from any provider
const content = await storage.retrieveFromIPFS(cid);
const arContent = await storage.retrieveFromArweave(transactionId);
```

## Event Monitoring

Subscribe to real-time vault events.

```typescript
import { EventMonitor, createVaultClient } from '@vault/protocol-sdk';

const client = createReadOnlyClient(97);
const monitor = new EventMonitor(client);

// Subscribe to vault events
const unsubscribe = await monitor.subscribe(vaultAddress, (event) => {
  console.log('Event:', event.type, event.data);
});

// Subscribe to all events from a contract
const unsubscribeAll = await monitor.subscribeAll((event) => {
  console.log('Global event:', event);
});

// Cleanup
unsubscribe();
```

## Supported Chains

| Chain | Chain ID | Status |
|-------|----------|--------|
| opBNB (Primary) | 204 | Mainnet |
| opBNB Testnet | 5611 | Testnet |
| BSC Testnet | 97 | Active (Testing) |
| Ethereum | 1 | Supported |
| Polygon | 137 | Supported |
| Arbitrum | 42161 | Supported |
| Optimism | 10 | Planned |
| Base | 8453 | Planned |
| BSC | 56 | Planned |
| Avalanche | 43114 | Planned |

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
  VaultEvent,
  VaultClient,
  VaultClientConfig
} from '@vault/protocol-sdk';
```

## API Reference

### Client Factory
- `createVaultClient(config)` - Create client with full configuration
- `createReadOnlyClient(chainId, rpcUrl?)` - Create read-only client
- `createPrivateKeyClient(chainId, privateKey, rpcUrl?)` - Create client with private key
- `createWalletClientWrapper(chainId, walletClient, account, rpcUrl?)` - Create client with external wallet
- `canWrite(client)` - Check if client can sign transactions
- `getAccountOrThrow(client)` - Get account address or throw

### VaultManager
- `createVault(config)` - Create a new vault
- `getVault(vaultAddress)` - Get vault by address
- `updateVault(vaultAddress, contentCID)` - Update vault content
- `uploadContent(vaultAddress, content)` - Upload content to vault
- `isUnlocked(vaultAddress)` - Check if vault is unlocked
- `unlockVault(vaultAddress)` - Unlock vault (if conditions met)
- `getVaultsByOwner(owner)` - Get all vaults for an owner

### TimeManager
- `configureScheduledRelease(vaultAddress, unlockTime)` - Set scheduled unlock
- `configureDeadmanSwitch(vaultAddress, checkInPeriod)` - Set dead-man switch
- `configureHybridRelease(vaultAddress, unlockTime, checkInPeriod)` - Set hybrid mode
- `checkIn(vaultAddress)` - Check in to reset dead-man timer
- `getTimeUntilUnlock(vaultAddress)` - Get time remaining
- `isDeadmanTriggered(vaultAddress)` - Check if dead-man triggered
- `setUnlockTime(vaultAddress, time)` - Set unlock time
- `getLastCheckIn(vaultAddress)` - Get last check-in timestamp

### AIVaultManager
- `enableMonitoring(vaultAddress, config?)` - Enable AI monitoring
- `disableMonitoring(vaultAddress)` - Disable AI monitoring
- `getLivenessScore(vaultAddress)` - Get liveness score (0-100)
- `getRiskScore(vaultAddress)` - Get risk score (0-100)
- `getVaultAIState(vaultAddress)` - Get full AI state
- `predictUnlockTime(vaultAddress)` - Predict unlock time
- `getRecommendations(vaultAddress)` - Get AI recommendations
- `shouldPreventRelease(vaultAddress)` - Check if AI would prevent release
- `shouldReleaseVault(vaultAddress)` - Check if vault can be released
- `resumeVault(vaultAddress)` - Resume AI-paused vault

### AttestationClient
- `submitAttestation(params)` - Submit attestation request
- `verifyAttestation(requestId)` - Verify attestation result
- `getAttestationStatus(requestId)` - Get request status
- `getAttestationResponses(requestId)` - Get oracle responses
- `registerAgent(stakeAmount)` - Register as oracle agent
- `deregisterAgent()` - Deregister as oracle agent
- `getOracleNode(address)` - Get oracle node info
- `getActiveOracles()` - Get active oracle addresses
- `provideAttestation(requestId, result, proof, signature)` - Submit oracle response

### CrossChainClient
- `sendMessage(message)` - Send cross-chain message
- `getMessageStatus(messageId)` - Get message status
- `syncVault(vaultAddress, targetChain)` - Sync vault across chains
- `isSupportedChain(chainId)` - Check if chain is supported
- `getSupportedChains()` - Get list of supported chains

### StorageClient
- `uploadToIPFS(data, options?)` - Upload to IPFS via Pinata
- `uploadToArweave(data, options?)` - Upload to Arweave
- `uploadToCeramic(data, schema)` - Upload to Ceramic
- `retrieveFromIPFS(cid)` - Retrieve from IPFS
- `retrieveFromArweave(txId)` - Retrieve from Arweave
- `retrieveFromCeramic(streamId)` - Retrieve from Ceramic

### Encryption Utilities
- `generateEncryptionKey()` - Generate AES-256-GCM key
- `encryptData(data, key)` - Encrypt data
- `decryptData(encrypted, key, iv)` - Decrypt data
- `exportKey(key)` - Export key to base64
- `importKey(keyData)` - Import key from base64

## License

MIT

## Links

- [Website](https://vaultprotocol.ai)
- [Documentation](https://vaultprotocol.ai/developers)
- [GitHub](https://github.com/vaultprotocolai)
- [Twitter/X](https://x.com/vaultprotocolai)
- [Telegram](https://t.me/vaultprotocolai)
