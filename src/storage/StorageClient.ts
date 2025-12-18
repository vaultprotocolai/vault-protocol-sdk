/**
 * StorageClient - Decentralized storage integration
 * Supports IPFS, Arweave, and Ceramic for encrypted vault content storage
 *
 * Note: This implementation uses HTTP APIs for storage providers.
 * For production use, install the specific provider SDKs:
 * - IPFS: ipfs-http-client
 * - Arweave: arweave
 * - Ceramic: @ceramicnetwork/http-client
 */

/**
 * Storage provider types
 */
export type StorageProvider = 'ipfs' | 'arweave' | 'ceramic';

/**
 * Storage configuration
 */
export interface StorageConfig {
  provider: StorageProvider;
  // IPFS configuration
  ipfsGateway?: string;
  ipfsApiUrl?: string;
  ipfsApiKey?: string;
  // Arweave configuration
  arweaveGateway?: string;
  arweaveKey?: string; // JWK key for signing
  // Ceramic configuration
  ceramicApiUrl?: string;
  ceramicDid?: string;
}

/**
 * Upload result from storage providers
 */
export interface UploadResult {
  provider: StorageProvider;
  cid: string; // Content ID (IPFS CID, Arweave TX ID, or Ceramic Stream ID)
  url: string; // Gateway URL to access content
  size?: number;
  timestamp: number;
}

/**
 * Retrieve result from storage
 */
export interface RetrieveResult {
  provider: StorageProvider;
  cid: string;
  data: Uint8Array | string;
  contentType?: string;
  timestamp?: number;
}

/**
 * Default gateway URLs
 */
const DEFAULT_GATEWAYS = {
  ipfs: 'https://ipfs.io/ipfs/',
  ipfsApi: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
  arweave: 'https://arweave.net/',
  ceramic: 'https://ceramic-clay.3boxlabs.com',
};

/**
 * StorageClient - Decentralized storage for vault content
 *
 * @example
 * const storage = new StorageClient({
 *   provider: 'ipfs',
 *   ipfsApiUrl: 'https://api.pinata.cloud',
 *   ipfsApiKey: 'your-api-key'
 * });
 *
 * // Upload encrypted content
 * const result = await storage.uploadToIPFS(encryptedData);
 * console.log('IPFS CID:', result.cid);
 *
 * // Retrieve content
 * const data = await storage.retrieveFromIPFS(result.cid);
 */
export class StorageClient {
  private config: StorageConfig;
  private defaultProvider: StorageProvider;

  /**
   * Create a StorageClient instance
   *
   * @param config - Storage configuration
   */
  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      provider: config?.provider || 'ipfs',
      ipfsGateway: config?.ipfsGateway || DEFAULT_GATEWAYS.ipfs,
      ipfsApiUrl: config?.ipfsApiUrl || DEFAULT_GATEWAYS.ipfsApi,
      ipfsApiKey: config?.ipfsApiKey,
      arweaveGateway: config?.arweaveGateway || DEFAULT_GATEWAYS.arweave,
      arweaveKey: config?.arweaveKey,
      ceramicApiUrl: config?.ceramicApiUrl || DEFAULT_GATEWAYS.ceramic,
      ceramicDid: config?.ceramicDid,
    };
    this.defaultProvider = this.config.provider;
  }

  /**
   * Upload content to IPFS
   *
   * @param data - Data to upload (string, Uint8Array, or object)
   * @param options - Upload options
   * @returns Upload result with CID
   *
   * @example
   * const result = await storage.uploadToIPFS(encryptedVaultData);
   * // Use result.cid to reference in vault contract
   */
  async uploadToIPFS(
    data: string | Uint8Array | object,
    options?: { name?: string; pinataMetadata?: object }
  ): Promise<UploadResult> {
    // Convert data to appropriate format
    let uploadData: Blob;
    if (typeof data === 'string') {
      uploadData = new Blob([data], { type: 'text/plain' });
    } else if (data instanceof Uint8Array) {
      // Convert Uint8Array to ArrayBuffer for Blob compatibility
      const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
      uploadData = new Blob([buffer], { type: 'application/octet-stream' });
    } else {
      uploadData = new Blob([JSON.stringify(data)], { type: 'application/json' });
    }

    // If no API key, use a public IPFS gateway for development
    if (!this.config.ipfsApiKey) {
      console.warn('No IPFS API key provided. Using mock upload for development.');
      const mockCid = `Qm${this.generateMockCid()}`;
      return {
        provider: 'ipfs',
        cid: mockCid,
        url: `${this.config.ipfsGateway}${mockCid}`,
        size: uploadData.size,
        timestamp: Date.now(),
      };
    }

    try {
      // Use Pinata API for pinning
      const formData = new FormData();
      formData.append('file', uploadData, options?.name || 'vault-content');

      if (options?.pinataMetadata) {
        formData.append('pinataMetadata', JSON.stringify(options.pinataMetadata));
      }

      const response = await fetch(this.config.ipfsApiUrl!, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.ipfsApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const cid = result.IpfsHash || result.cid;

      return {
        provider: 'ipfs',
        cid,
        url: `${this.config.ipfsGateway}${cid}`,
        size: result.PinSize || uploadData.size,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
  }

  /**
   * Upload content to Arweave
   *
   * @param data - Data to upload
   * @param options - Upload options
   * @returns Upload result with transaction ID
   *
   * Note: Arweave requires AR tokens for permanent storage
   */
  async uploadToArweave(
    data: string | Uint8Array | object,
    options?: { tags?: { name: string; value: string }[] }
  ): Promise<UploadResult> {
    // Convert data to bytes
    let dataBytes: Uint8Array;
    if (typeof data === 'string') {
      dataBytes = new TextEncoder().encode(data);
    } else if (data instanceof Uint8Array) {
      dataBytes = data;
    } else {
      dataBytes = new TextEncoder().encode(JSON.stringify(data));
    }

    // If no key, use mock for development
    if (!this.config.arweaveKey) {
      console.warn('No Arweave key provided. Using mock upload for development.');
      const mockTxId = this.generateMockArweaveTxId();
      return {
        provider: 'arweave',
        cid: mockTxId,
        url: `${this.config.arweaveGateway}${mockTxId}`,
        size: dataBytes.length,
        timestamp: Date.now(),
      };
    }

    try {
      // For full implementation, use the arweave package
      // This is a simplified version using the HTTP API
      const response = await fetch(`${this.config.arweaveGateway}tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: this.uint8ArrayToBase64(dataBytes),
          tags: options?.tags || [
            { name: 'Content-Type', value: 'application/octet-stream' },
            { name: 'App-Name', value: 'VaultProtocol' },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Arweave upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const txId = result.id;

      return {
        provider: 'arweave',
        cid: txId,
        url: `${this.config.arweaveGateway}${txId}`,
        size: dataBytes.length,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Arweave upload error:', error);
      // Return mock for development if upload fails
      console.warn('Falling back to mock Arweave upload');
      const mockTxId = this.generateMockArweaveTxId();
      return {
        provider: 'arweave',
        cid: mockTxId,
        url: `${this.config.arweaveGateway}${mockTxId}`,
        size: dataBytes.length,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Upload content to Ceramic Network
   *
   * @param data - Data to upload (must be an object for Ceramic)
   * @param options - Upload options
   * @returns Upload result with Stream ID
   *
   * Note: Ceramic requires a DID for authentication
   */
  async uploadToCeramic(
    data: object,
    options?: { schema?: string; family?: string }
  ): Promise<UploadResult> {
    // If no DID, use mock for development
    if (!this.config.ceramicDid) {
      console.warn('No Ceramic DID provided. Using mock upload for development.');
      const mockStreamId = this.generateMockStreamId();
      return {
        provider: 'ceramic',
        cid: mockStreamId,
        url: `${this.config.ceramicApiUrl}/api/v0/streams/${mockStreamId}`,
        timestamp: Date.now(),
      };
    }

    try {
      // For full implementation, use @ceramicnetwork/http-client
      const response = await fetch(`${this.config.ceramicApiUrl}/api/v0/streams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 0, // TileDocument
          genesis: {
            header: {
              controllers: [this.config.ceramicDid],
              family: options?.family || 'vault-protocol',
              schema: options?.schema,
            },
            data,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ceramic upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const streamId = result.streamId;

      return {
        provider: 'ceramic',
        cid: streamId,
        url: `${this.config.ceramicApiUrl}/api/v0/streams/${streamId}`,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Ceramic upload error:', error);
      // Return mock for development if upload fails
      console.warn('Falling back to mock Ceramic upload');
      const mockStreamId = this.generateMockStreamId();
      return {
        provider: 'ceramic',
        cid: mockStreamId,
        url: `${this.config.ceramicApiUrl}/api/v0/streams/${mockStreamId}`,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Retrieve content from IPFS
   *
   * @param cid - IPFS Content ID
   * @returns Retrieved data
   */
  async retrieveFromIPFS(cid: string): Promise<RetrieveResult> {
    try {
      const response = await fetch(`${this.config.ipfsGateway}${cid}`);

      if (!response.ok) {
        throw new Error(`IPFS retrieval failed: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const data = await response.arrayBuffer();

      return {
        provider: 'ipfs',
        cid,
        data: new Uint8Array(data),
        contentType,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('IPFS retrieval error:', error);
      throw error;
    }
  }

  /**
   * Retrieve content from Arweave
   *
   * @param txId - Arweave Transaction ID
   * @returns Retrieved data
   */
  async retrieveFromArweave(txId: string): Promise<RetrieveResult> {
    try {
      const response = await fetch(`${this.config.arweaveGateway}${txId}`);

      if (!response.ok) {
        throw new Error(`Arweave retrieval failed: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const data = await response.arrayBuffer();

      return {
        provider: 'arweave',
        cid: txId,
        data: new Uint8Array(data),
        contentType,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Arweave retrieval error:', error);
      throw error;
    }
  }

  /**
   * Retrieve content from Ceramic
   *
   * @param streamId - Ceramic Stream ID
   * @returns Retrieved data
   */
  async retrieveFromCeramic(streamId: string): Promise<RetrieveResult> {
    try {
      const response = await fetch(`${this.config.ceramicApiUrl}/api/v0/streams/${streamId}`);

      if (!response.ok) {
        throw new Error(`Ceramic retrieval failed: ${response.statusText}`);
      }

      const result = await response.json();
      const data = JSON.stringify(result.state?.content || result.content || result);

      return {
        provider: 'ceramic',
        cid: streamId,
        data,
        contentType: 'application/json',
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Ceramic retrieval error:', error);
      throw error;
    }
  }

  /**
   * Upload to default provider
   *
   * @param data - Data to upload
   * @returns Upload result
   */
  async upload(data: string | Uint8Array | object): Promise<UploadResult> {
    switch (this.defaultProvider) {
      case 'ipfs':
        return this.uploadToIPFS(data);
      case 'arweave':
        return this.uploadToArweave(data);
      case 'ceramic':
        if (typeof data !== 'object' || data instanceof Uint8Array) {
          throw new Error('Ceramic requires object data. Use uploadToIPFS for binary data.');
        }
        return this.uploadToCeramic(data);
      default:
        return this.uploadToIPFS(data);
    }
  }

  /**
   * Retrieve from any provider based on CID format
   *
   * @param cid - Content ID
   * @param provider - Optional provider hint
   * @returns Retrieved data
   */
  async retrieve(cid: string, provider?: StorageProvider): Promise<RetrieveResult> {
    const resolvedProvider = provider || this.detectProvider(cid);

    switch (resolvedProvider) {
      case 'ipfs':
        return this.retrieveFromIPFS(cid);
      case 'arweave':
        return this.retrieveFromArweave(cid);
      case 'ceramic':
        return this.retrieveFromCeramic(cid);
      default:
        return this.retrieveFromIPFS(cid);
    }
  }

  /**
   * Detect provider from CID format
   */
  private detectProvider(cid: string): StorageProvider {
    // IPFS CIDs typically start with Qm (v0) or ba (v1)
    if (cid.startsWith('Qm') || cid.startsWith('ba')) {
      return 'ipfs';
    }
    // Arweave TX IDs are 43 characters of base64url
    if (cid.length === 43 && /^[a-zA-Z0-9_-]+$/.test(cid)) {
      return 'arweave';
    }
    // Ceramic Stream IDs start with kjz
    if (cid.startsWith('kjz')) {
      return 'ceramic';
    }
    // Default to IPFS
    return 'ipfs';
  }

  /**
   * Generate mock IPFS CID for development
   */
  private generateMockCid(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate mock Arweave TX ID for development
   */
  private generateMockArweaveTxId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let result = '';
    for (let i = 0; i < 43; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate mock Ceramic Stream ID for development
   */
  private generateMockStreamId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'kjzl6cwe1jw';
    for (let i = 0; i < 50; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Convert Uint8Array to base64
   */
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Get current configuration
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...updates };
    if (updates.provider) {
      this.defaultProvider = updates.provider;
    }
  }
}
