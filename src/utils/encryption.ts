/**
 * Encryption utilities - AES-256-GCM client-side encryption
 */

export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: string, key: CryptoKey): Promise<{
  encrypted: Uint8Array;
  iv: Uint8Array;
}> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    dataBuffer
  );

  return {
    encrypted: new Uint8Array(encrypted),
    iv: iv,
  };
}

export async function decryptData(
  encrypted: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    encrypted as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importKey(keyData: string): Promise<CryptoKey> {
  const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}
