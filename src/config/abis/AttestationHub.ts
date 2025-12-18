/**
 * AttestationHub ABI
 * Decentralized oracle network for vault attestations with BFT consensus
 */

export const AttestationHubABI = [
  {
    inputs: [{ internalType: 'address', name: '_vaultToken', type: 'address' }],
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
    name: 'EnforcedPause',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ExpectedPause',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ReentrancyGuardReentrantCall',
    type: 'error',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'oracle', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'stakedAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'OracleRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'oracle', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'returnedStake', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'OracleDeregistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'oracle', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'slashedAmount', type: 'uint256' },
      { indexed: false, internalType: 'bytes32', name: 'reason', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'OracleSlashed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'requestId', type: 'uint256' },
      { indexed: false, internalType: 'bytes32', name: 'requestType', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'requester', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'requiredConsensus', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'expiresAt', type: 'uint256' },
    ],
    name: 'AttestationRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'requestId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'oracle', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'result', type: 'bool' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'AttestationProvided',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'requestId', type: 'uint256' },
      { indexed: false, internalType: 'bool', name: 'result', type: 'bool' },
      { indexed: false, internalType: 'uint256', name: 'consensusCount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'ConsensusReached',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'oracle', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'RewardDistributed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }],
    name: 'Paused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'address', name: 'account', type: 'address' }],
    name: 'Unpaused',
    type: 'event',
  },
  // View functions
  {
    inputs: [],
    name: 'vaultToken',
    outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'oracle', type: 'address' }],
    name: 'getOracleNode',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'nodeAddress', type: 'address' },
          { internalType: 'uint256', name: 'stakedAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'reputation', type: 'uint256' },
          { internalType: 'bool', name: 'isActive', type: 'bool' },
          { internalType: 'uint256', name: 'attestationCount', type: 'uint256' },
          { internalType: 'uint256', name: 'slashedAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'registeredAt', type: 'uint256' },
        ],
        internalType: 'struct IAttestationHub.OracleNode',
        name: 'node',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'requestId', type: 'uint256' }],
    name: 'getAttestationRequest',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'requestId', type: 'uint256' },
          { internalType: 'bytes32', name: 'requestType', type: 'bytes32' },
          { internalType: 'bytes', name: 'data', type: 'bytes' },
          { internalType: 'address', name: 'requester', type: 'address' },
          { internalType: 'uint256', name: 'requiredConsensus', type: 'uint256' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'uint256', name: 'expiresAt', type: 'uint256' },
          { internalType: 'bool', name: 'fulfilled', type: 'bool' },
        ],
        internalType: 'struct IAttestationHub.AttestationRequest',
        name: 'request',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'requestId', type: 'uint256' }],
    name: 'getAttestationResponses',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'requestId', type: 'uint256' },
          { internalType: 'address', name: 'oracle', type: 'address' },
          { internalType: 'bool', name: 'result', type: 'bool' },
          { internalType: 'bytes', name: 'proof', type: 'bytes' },
          { internalType: 'bytes', name: 'signature', type: 'bytes' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        internalType: 'struct IAttestationHub.AttestationResponse[]',
        name: 'responses',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getActiveOracles',
    outputs: [{ internalType: 'address[]', name: 'oracles', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getActiveOracleCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'requestId', type: 'uint256' }],
    name: 'checkConsensus',
    outputs: [
      { internalType: 'bool', name: 'reached', type: 'bool' },
      { internalType: 'bool', name: 'result', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
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
  // Write functions
  {
    inputs: [{ internalType: 'uint256', name: 'stakeAmount', type: 'uint256' }],
    name: 'registerOracle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'deregisterOracle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'requestType', type: 'bytes32' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
      { internalType: 'uint256', name: 'requiredConsensus', type: 'uint256' },
      { internalType: 'uint256', name: 'expirationTime', type: 'uint256' },
    ],
    name: 'requestAttestation',
    outputs: [{ internalType: 'uint256', name: 'requestId', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'requestId', type: 'uint256' },
      { internalType: 'bool', name: 'result', type: 'bool' },
      { internalType: 'bytes', name: 'proof', type: 'bytes' },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'provideAttestation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'oracle', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes32', name: 'reason', type: 'bytes32' },
    ],
    name: 'slashOracle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'emergencyWithdraw',
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
] as const;
