/**
 * TimeManager (VaultTimeManager) ABI
 * Contract: 0x68e41639B0c5C56F6E6b0f0Cf9612acac089ff4D (BSC Testnet)
 */

export const TimeManagerABI = [
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
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'CheckInRecorded',
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
      { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'reason', type: 'string' },
    ],
    name: 'ReleaseTriggered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
      { indexed: false, internalType: 'enum TimeManager.ReleaseType', name: 'releaseType', type: 'uint8' },
      { indexed: false, internalType: 'uint256', name: 'scheduledTime', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'deadmanDuration', type: 'uint256' },
    ],
    name: 'TimeConfigSet',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'address', name: '_vault', type: 'address' }],
    name: 'checkReleaseCondition',
    outputs: [
      { internalType: 'bool', name: 'shouldRelease', type: 'bool' },
      { internalType: 'string', name: 'reason', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_vault', type: 'address' },
      { internalType: 'enum TimeManager.ReleaseType', name: '_releaseType', type: 'uint8' },
      { internalType: 'uint256', name: '_scheduledTime', type: 'uint256' },
      { internalType: 'uint256', name: '_deadmanDuration', type: 'uint256' },
    ],
    name: 'configureTime',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_vault', type: 'address' }],
    name: 'deactivate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_vault', type: 'address' }],
    name: 'getTimeUntilDeadmanRelease',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_vault', type: 'address' }],
    name: 'getTimeUntilScheduledRelease',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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
    inputs: [{ internalType: 'address', name: '_vault', type: 'address' }],
    name: 'recordCheckIn',
    outputs: [],
    stateMutability: 'nonpayable',
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
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_vault', type: 'address' }],
    name: 'triggerRelease',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'vaultConfigs',
    outputs: [
      { internalType: 'enum TimeManager.ReleaseType', name: 'releaseType', type: 'uint8' },
      { internalType: 'uint256', name: 'scheduledReleaseTime', type: 'uint256' },
      { internalType: 'uint256', name: 'deadmanDuration', type: 'uint256' },
      { internalType: 'uint256', name: 'lastCheckIn', type: 'uint256' },
      { internalType: 'bool', name: 'isActive', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * ReleaseType enum matching the smart contract
 */
export enum ReleaseTypeContract {
  NONE = 0,
  SCHEDULED = 1,
  DEADMAN = 2,
  HYBRID = 3,
}
