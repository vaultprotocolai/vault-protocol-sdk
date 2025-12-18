/**
 * VaultFactory (VaultManager) ABI
 * Contract: 0x116865F62E1714D9B512Fd9E4f35e6fDb53D019C (BSC Testnet)
 */

export const VaultFactoryABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ReentrancyGuardReentrantCall',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'oldFee', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'newFee', type: 'uint256' },
    ],
    name: 'FeeUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'oldFee', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'newFee', type: 'uint256' },
    ],
    name: 'PlatformFeeUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'vaultId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'vaultAddress', type: 'address' },
      { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'VaultCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'vaultId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'newCID', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'VaultContentUpdated',
    type: 'event',
  },
  {
    inputs: [
      { internalType: 'string', name: '_name', type: 'string' },
      { internalType: 'string', name: '_encryptedContentCID', type: 'string' },
    ],
    name: 'createVault',
    outputs: [
      { internalType: 'uint256', name: 'vaultId', type: 'uint256' },
      { internalType: 'address', name: 'vaultAddress', type: 'address' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'creationFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_owner', type: 'address' }],
    name: 'getVaultsByOwner',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'platformFeeBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_fee', type: 'uint256' }],
    name: 'setCreationFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_feeBps', type: 'uint256' }],
    name: 'setPlatformFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_vaultId', type: 'uint256' },
      { internalType: 'string', name: '_newCID', type: 'string' },
    ],
    name: 'updateVaultContent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'vaultCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'vaults',
    outputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'address', name: 'vaultAddress', type: 'address' },
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'encryptedContentCID', type: 'string' },
      { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
      { internalType: 'bool', name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdrawFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
