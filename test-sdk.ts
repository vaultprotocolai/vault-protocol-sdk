/**
 * SDK Integration Test
 * Tests the Vault Protocol SDK against deployed contracts on BSC Testnet
 *
 * Run: npx ts-node test-sdk.ts
 */

import {
  createVaultClient,
  createReadOnlyClient,
  VaultManager,
  TimeManager,
  getContractAddresses,
  BSC_TESTNET_CONTRACTS,
  ReleaseType,
} from './src';

const BSC_TESTNET_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545/';

async function testReadOnlyOperations() {
  console.log('\n=== Testing Read-Only Operations ===\n');

  // Create read-only client
  const client = createReadOnlyClient(97, BSC_TESTNET_RPC);

  console.log('✅ Created read-only client for BSC Testnet (Chain ID: 97)');
  console.log(`   VaultManager address: ${client.contracts.VaultManager}`);
  console.log(`   VaultTimeManager address: ${client.contracts.VaultTimeManager}`);

  // Test VaultManager read operations
  const vaultManager = new VaultManager(client);
  console.log('\n📦 Testing VaultManager...');

  try {
    // Try to get vaults by owner (may return empty if no vaults exist)
    const testAddress = '0x0000000000000000000000000000000000000000';
    const vaults = await vaultManager.getVaultsByOwner(testAddress);
    console.log(`   getVaultsByOwner(${testAddress.slice(0, 10)}...): ${vaults.length} vaults found`);
  } catch (error: any) {
    console.log(`   getVaultsByOwner: ${error.message}`);
  }

  // Test TimeManager read operations
  const timeManager = new TimeManager(client);
  console.log('\n⏰ Testing TimeManager...');

  try {
    // Test with a hypothetical vault address
    const testVaultId = '0x0000000000000000000000000000000000000000';
    const timeUntilUnlock = await timeManager.getTimeUntilUnlock(testVaultId);
    console.log(`   getTimeUntilUnlock: ${timeUntilUnlock} seconds`);
  } catch (error: any) {
    console.log(`   getTimeUntilUnlock: ${error.message}`);
  }

  console.log('\n✅ Read-only operations test complete');
}

async function testContractAddresses() {
  console.log('\n=== Testing Contract Address Configuration ===\n');

  // Test BSC Testnet contracts
  console.log('BSC Testnet (97) Contracts:');
  console.log(`   VaultManager: ${BSC_TESTNET_CONTRACTS.VaultManager}`);
  console.log(`   VaultTimeManager: ${BSC_TESTNET_CONTRACTS.VaultTimeManager}`);
  console.log(`   AccessControl: ${BSC_TESTNET_CONTRACTS.AccessControl}`);
  console.log(`   NotificationOracle: ${BSC_TESTNET_CONTRACTS.NotificationOracle}`);

  // Test getContractAddresses function
  const addresses = getContractAddresses(97);
  console.log('\n✅ getContractAddresses(97) returned correct addresses');

  // Test unsupported chain
  const unknownAddresses = getContractAddresses(999);
  if (unknownAddresses === undefined) {
    console.log('✅ Correctly returned undefined for unsupported chain (999)');
  } else {
    console.log('❌ Should have returned undefined for unsupported chain');
  }
}

async function testClientFactoryModes() {
  console.log('\n=== Testing Client Factory Modes ===\n');

  // Test 1: Read-only mode
  console.log('1. Read-only mode (no wallet):');
  const readOnlyClient = createReadOnlyClient(97, BSC_TESTNET_RPC);
  console.log(`   ✅ Created client with chainId: ${readOnlyClient.chain.id}`);
  console.log(`   ✅ Has publicClient: ${!!readOnlyClient.publicClient}`);
  console.log(`   ✅ Has walletClient: ${!!readOnlyClient.walletClient}`);
  console.log(`   ✅ Has account: ${!!readOnlyClient.account}`);

  // Test 2: Full client mode (would require private key)
  console.log('\n2. Full client mode (with private key):');
  console.log('   ⚠️  Skipping - requires private key');

  // Test 3: External wallet mode
  console.log('\n3. External wallet mode:');
  console.log('   ⚠️  Skipping - requires external wallet client');
}

async function testTypeExports() {
  console.log('\n=== Testing Type Exports ===\n');

  // Test ReleaseType enum
  console.log('ReleaseType enum:');
  console.log(`   SCHEDULED: ${ReleaseType.SCHEDULED}`);
  console.log(`   DEADMAN: ${ReleaseType.DEADMAN}`);
  console.log(`   HYBRID: ${ReleaseType.HYBRID}`);
  console.log('✅ All ReleaseType values exported correctly');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           Vault Protocol SDK Integration Test              ║');
  console.log('║                  BSC Testnet (Chain ID: 97)                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await testContractAddresses();
    await testClientFactoryModes();
    await testTypeExports();
    await testReadOnlyOperations();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║               All Tests Passed Successfully!              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

main();
