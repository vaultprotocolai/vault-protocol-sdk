/**
 * Chain configurations for Vault Protocol SDK
 *
 * Supports:
 * - BSC Testnet (97) - for testing
 * - opBNB Mainnet (204) - primary production chain
 * - opBNB Testnet (5611) - for testing
 * - Additional chains for cross-chain support
 */

import { type Chain } from 'viem';

// BSC Testnet - Current testing environment
export const bscTestnet: Chain = {
  id: 97,
  name: 'BSC Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'tBNB',
  },
  rpcUrls: {
    default: {
      http: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    },
    public: {
      http: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BscScan',
      url: 'https://testnet.bscscan.com',
    },
  },
  testnet: true,
};

// opBNB Mainnet - Primary production chain
export const opBNBMainnet: Chain = {
  id: 204,
  name: 'opBNB',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: {
      http: ['https://opbnb-mainnet-rpc.bnbchain.org'],
    },
    public: {
      http: ['https://opbnb-mainnet-rpc.bnbchain.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'opBNBScan',
      url: 'https://opbnbscan.com',
    },
  },
  testnet: false,
};

// opBNB Testnet
export const opBNBTestnet: Chain = {
  id: 5611,
  name: 'opBNB Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'tBNB',
  },
  rpcUrls: {
    default: {
      http: ['https://opbnb-testnet-rpc.bnbchain.org'],
    },
    public: {
      http: ['https://opbnb-testnet-rpc.bnbchain.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'opBNBScan',
      url: 'https://testnet.opbnbscan.com',
    },
  },
  testnet: true,
};

// BSC Mainnet
export const bscMainnet: Chain = {
  id: 56,
  name: 'BSC',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: {
      http: ['https://bsc-dataseed1.binance.org'],
    },
    public: {
      http: ['https://bsc-dataseed1.binance.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BscScan',
      url: 'https://bscscan.com',
    },
  },
  testnet: false,
};

// Polygon Mainnet - Cross-chain support
export const polygon: Chain = {
  id: 137,
  name: 'Polygon',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://polygon-rpc.com'],
    },
    public: {
      http: ['https://polygon-rpc.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'PolygonScan',
      url: 'https://polygonscan.com',
    },
  },
  testnet: false,
};

// Arbitrum One - Cross-chain support
export const arbitrum: Chain = {
  id: 42161,
  name: 'Arbitrum One',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://arb1.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://arb1.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbiscan',
      url: 'https://arbiscan.io',
    },
  },
  testnet: false,
};

// Ethereum Mainnet - Cross-chain support
export const ethereum: Chain = {
  id: 1,
  name: 'Ethereum',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://eth.llamarpc.com'],
    },
    public: {
      http: ['https://eth.llamarpc.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://etherscan.io',
    },
  },
  testnet: false,
};

// Chain ID to Chain mapping
export const CHAINS: Record<number, Chain> = {
  1: ethereum,
  56: bscMainnet,
  97: bscTestnet,
  137: polygon,
  204: opBNBMainnet,
  5611: opBNBTestnet,
  42161: arbitrum,
};

// Supported chain IDs for cross-chain operations
export const SUPPORTED_CHAIN_IDS = [1, 56, 97, 137, 204, 5611, 42161] as const;
export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];

/**
 * Get chain configuration by ID
 */
export function getChain(chainId: number): Chain | undefined {
  return CHAINS[chainId];
}

/**
 * Check if a chain ID is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId in CHAINS;
}

/**
 * Get default RPC URL for a chain
 */
export function getDefaultRpcUrl(chainId: number): string | undefined {
  const chain = CHAINS[chainId];
  return chain?.rpcUrls.default.http[0];
}
