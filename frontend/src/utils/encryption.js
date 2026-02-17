// End-to-End Encryption Utility for Chat Messages
// Uses Web Crypto API for AES-GCM encryption

class ChatEncryption {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }

  /**
   * Generate a shared encryption key from two user IDs
   * This creates a deterministic key that both users can generate independently
   */
  async generateSharedKey(userId1, userId2) {
    // Sort user IDs to ensure same key regardless of order
    const sortedIds = [userId1, userId2].sort();
    const keyMaterial = sortedIds.join('-');
    
    // Use PBKDF2 to derive a key from the user IDs
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);
    
    // Import key material
    const baseKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive actual encryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('siksha-mantra-chat-salt'), // Fixed salt for deterministic key
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
    
    return key;
  }

  /**
   * Encrypt a message
   */
  async encryptMessage(message, userId1, userId2) {
    try {
      const key = await this.generateSharedKey(userId1, userId2);
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      // Generate random IV (Initialization Vector)
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the message
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedData), iv.length);
      
      // Convert to base64 for storage
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('❌ Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt a message
   */
  async decryptMessage(encryptedMessage, userId1, userId2) {
    try {
      const key = await this.generateSharedKey(userId1, userId2);
      
      // Convert from base64
      const combined = this.base64ToArrayBuffer(encryptedMessage);
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);
      
      // Decrypt the message
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encryptedData
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('❌ Decryption error:', error);
      return '[Encrypted Message - Unable to decrypt]';
    }
  }

  /**
   * Helper: Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper: Convert Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Check if a message is encrypted
   */
  isEncrypted(message) {
    // Encrypted messages are base64 strings of a certain length
    if (!message || typeof message !== 'string') return false;
    
    // Check if it's a valid base64 string
    try {
      const decoded = atob(message);
      return decoded.length > 12; // IV (12 bytes) + encrypted data
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const chatEncryption = new ChatEncryption();

// Export class for testing
export default ChatEncryption;
