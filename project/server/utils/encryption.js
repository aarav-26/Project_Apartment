const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // Should be stored securely (e.g., env var)
const iv = crypto.randomBytes(16);

// Encrypt buffer (file)
function encryptBuffer(buffer) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return {
    data: encrypted,
    iv: iv.toString('hex')
  };
}

// Decrypt buffer
function decryptBuffer(encryptedBuffer, ivHex) {
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

module.exports = { encryptBuffer, decryptBuffer };
