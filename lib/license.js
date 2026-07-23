// ==========================================================
// Ports the EXACT signing scheme from license_generator.html to Node.js.
//
// Deliberately uses `crypto.webcrypto` (Node's WebCrypto implementation)
// rather than the older `crypto.sign()` API, because WebCrypto's ECDSA
// signatures are raw r||s (64 bytes for P-256) -- identical to what a
// browser's `crypto.subtle.sign()` produces. Node's legacy `crypto.sign()`
// defaults to DER-encoded signatures instead, which would NOT match and
// would silently generate keys the desktop app can't verify.
//
// This was tested against the real license_generator.html: sign -> encode
// -> decode -> verify with the matching public key -> confirmed correct,
// plus a tampered-payload rejection test, before delivery.
// ==========================================================
const { webcrypto } = require('crypto');
const { subtle } = webcrypto;

async function importPrivateKey(privateKeyB64) {
  const keyBytes = Buffer.from(privateKeyB64, 'base64');
  return subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

/**
 * Generates a PharmaTrack license key. Mirrors license_generator.html:
 *   payload      = requestCode + '|' + expiry
 *   signature    = ECDSA-P256-SHA256 over payload (raw r||s via WebCrypto)
 *   combinedStr  = requestCode + '|' + expiry + '|' + base64(signature)
 *   rawKey       = base64(combinedStr)
 *   displayKey   = rawKey split into 6-char groups joined by '-'
 *
 * @param {string} requestCode
 * @param {number} validityDays
 * @param {string} privateKeyB64  PKCS8 EC private key, base64 DER (same value as PRIVATE_KEY_B64 in license_generator.html)
 * @returns {Promise<{licenseKey: string, expiresAt: number}>}  expiresAt is ms since epoch
 */
async function generateLicenseKey(requestCode, validityDays, privateKeyB64) {
  if (!privateKeyB64) {
    throw new Error('LICENSE_PRIVATE_KEY_B64 is not configured.');
  }
  const privateKey = await importPrivateKey(privateKeyB64);
  const expiry = Date.now() + (validityDays * 24 * 60 * 60 * 1000);
  const payload = requestCode + '|' + expiry;

  const signatureBuffer = await subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(payload)
  );
  const signatureB64 = Buffer.from(signatureBuffer).toString('base64');

  const combinedStr = requestCode + '|' + expiry + '|' + signatureB64;
  const rawKey = Buffer.from(combinedStr, 'utf8').toString('base64');
  const displayKey = rawKey.match(/.{1,6}/g).join('-');

  return { licenseKey: displayKey, expiresAt: expiry };
}

module.exports = { generateLicenseKey };
