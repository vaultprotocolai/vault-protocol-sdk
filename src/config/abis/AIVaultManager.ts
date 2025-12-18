/**
 * AIVaultManager ABI
 * Contract for AI-enhanced vault operations with multi-agent consensus
 */

export const AIVaultManagerABI = [
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
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'livenessScore', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'riskScore', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'AIStateUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'AIVerificationEnabled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'AIVerificationDisabled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'riskScore', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'reason', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'RiskAlertTriggered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
      { indexed: false, internalType: 'string', name: 'reason', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'VaultPausedByAI',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'VaultResumedByAI',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'agent', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'AgentAuthorized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'agent', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'AgentRevoked',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'livenessScore', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'riskScore', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'agentCount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'ConsensusReached',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'vault', type: 'address' },
      { indexed: false, internalType: 'bytes32', name: 'proofHash', type: 'bytes32' },
      { indexed: false, internalType: 'bool', name: 'verified', type: 'bool' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'ZKMLProofVerified',
    type: 'event',
  },
  // View functions
  {
    inputs: [],
    name: 'livenessThreshold',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'riskThreshold',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'consensusThreshold',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_vault', type: 'address' }],
    name: 'getVaultAIState',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'livenessScore', type: 'uint256' },
          { internalType: 'uint256', name: 'riskScore', type: 'uint256' },
          { internalType: 'uint256', name: 'lastAIPrediction', type: 'uint256' },
          { internalType: 'uint256', name: 'aiCheckCount', type: 'uint256' },
          { internalType: 'bool', name: 'aiVerificationEnabled', type: 'bool' },
          { internalType: 'bool', name: 'isPausedByAI', type: 'bool' },
          { internalType: 'string', name: 'lastAIReason', type: 'string' },
        ],
        internalType: 'struct AIVaultManager.VaultAIState',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'vaultAIStates',
    outputs: [
      { internalType: 'uint256', name: 'livenessScore', type: 'uint256' },
      { internalType: 'uint256', name: 'riskScore', type: 'uint256' },
      { internalType: 'uint256', name: 'lastAIPrediction', type: 'uint256' },
      { internalType: 'uint256', name: 'aiCheckCount', type: 'uint256' },
      { internalType: 'bool', name: 'aiVerificationEnabled', type: 'bool' },
      { internalType: 'bool', name: 'isPausedByAI', type: 'bool' },
      { internalType: 'string', name: 'lastAIReason', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'authorizedAgents',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'agentAddresses',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAuthorizedAgentCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_vault', type: 'address' }],
    name: 'shouldPreventRelease',
    outputs: [
      { internalType: 'bool', name: 'shouldPrevent', type: 'bool' },
      { internalType: 'string', name: 'reason', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_vault', type: 'address' }],
    name: 'shouldReleaseVault',
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
    inputs: [{ internalType: 'address', name: '_vault', type: 'address' }],
    name: 'enableAIVerification',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_vault', type: 'address' }],
    name: 'disableAIVerification',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_vault', type: 'address' },
      { internalType: 'uint256', name: '_livenessScore', type: 'uint256' },
      { internalType: 'uint256', name: '_riskScore', type: 'uint256' },
    ],
    name: 'updateAIPrediction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_vault', type: 'address' },
      { internalType: 'string', name: '_aiModel', type: 'string' },
    ],
    name: 'requestAIPrediction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_vault', type: 'address' },
      { internalType: 'bytes', name: '_proof', type: 'bytes' },
      { internalType: 'uint256[]', name: '_publicInputs', type: 'uint256[]' },
    ],
    name: 'verifyZKMLProof',
    outputs: [{ internalType: 'bool', name: 'verified', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_vault', type: 'address' }],
    name: 'resumeVault',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_agent', type: 'address' }],
    name: 'authorizeAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_agent', type: 'address' }],
    name: 'revokeAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_livenessThreshold', type: 'uint256' },
      { internalType: 'uint256', name: '_riskThreshold', type: 'uint256' },
    ],
    name: 'updateThresholds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_oracleAddress', type: 'address' }],
    name: 'initializeAIOracle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_verifierAddress', type: 'address' }],
    name: 'initializeZKMLVerifier',
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
