// GAP-01: TOTP (Time-based One-Time Password) implementation using Web Crypto API
// RFC 6238 compliant - works in Cloudflare Workers

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Decode(encoded) {
  encoded = encoded.replace(/\s/g, '').toUpperCase();
  const output = [];
  let buffer = 0;
  let bitsLeft = 0;
  for (const char of encoded) {
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) continue;
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      output.push((buffer >> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }
  return new Uint8Array(output);
}

async function hmacSha1(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(sig);
}

function dynamicTruncation(hmac) {
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, '0');
}

export async function generateTOTP(secret, timeStep = 30) {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeBuffer = new ArrayBuffer(8);
  const view = new DataView(timeBuffer);
  view.setUint32(4, time, false);
  const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));
  return dynamicTruncation(hmac);
}

export async function verifyTOTP(token, secret, timeStep = 30, window = 1) {
  const key = base32Decode(secret);
  const currentTime = Math.floor(Date.now() / 1000 / timeStep);
  
  // Check current time step and +/- window for clock drift
  for (let i = -window; i <= window; i++) {
    const time = currentTime + i;
    const timeBuffer = new ArrayBuffer(8);
    const view = new DataView(timeBuffer);
    view.setUint32(4, time, false);
    const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));
    const code = dynamicTruncation(hmac);
    if (code === token) return true;
  }
  return false;
}

export function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    codes.push(Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  }
  return codes;
}
