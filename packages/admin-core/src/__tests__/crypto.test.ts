import { describe, expect, it } from 'vitest';
import { encryptPassword, encryptPasswordEnvelope } from '../utils/crypto';
import CryptoJS from 'crypto-js';

/**
 * 密钥参数化后的 crypto：密钥由宿主传参（包内零 env 直读）。
 * Node 20+ 自带 WebCrypto（globalThis.crypto），RSA-OAEP/SHA-256 可用。
 */

// 测试用 RSA-OAEP 密钥对（2048，SHA-256）——运行时生成 SPKI 导出
async function generateSpkiB64(): Promise<string> {
  const kp = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt'],
  );
  const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
  let bin = '';
  new Uint8Array(spki).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

describe('encryptPassword（AES-128-CBC，key=iv）', () => {
  it('密文可被同 key 解密还原', () => {
    const key = '0123456789abcdef';
    const cipher = encryptPassword('Abcd@1234', key);
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const decrypted = CryptoJS.AES.decrypt(cipher, keyHex, {
      iv: keyHex,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    expect(decrypted.toString(CryptoJS.enc.Utf8)).toBe('Abcd@1234');
  });

  it('空密钥 fail-fast 抛错', () => {
    expect(() => encryptPassword('x', '')).toThrow();
  });
});

describe('encryptPasswordEnvelope（rsa-v1 混合信封）', () => {
  it('输出符合 rsa-v1 三段 base64 格式，且宿主私钥可解回原文', async () => {
    const kp = await crypto.subtle.generateKey(
      { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['encrypt', 'decrypt'],
    );
    const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
    let bin = '';
    new Uint8Array(spki).forEach((b) => (bin += String.fromCharCode(b)));
    const spkiB64 = btoa(bin);

    const envelope = await encryptPasswordEnvelope('secret-pass', spkiB64);
    expect(envelope.startsWith('rsa-v1:')).toBe(true);
    const parts = envelope.split(':');
    expect(parts).toHaveLength(4);
    parts.slice(1).forEach((p) => expect(p).toMatch(/^[A-Za-z0-9+/=]+$/));

    // 宿主侧解密链路：RSA 解 wrapped key → AES-GCM 解 cipher
    const wrapped = Uint8Array.from(atob(parts[1]), (c) => c.charCodeAt(0));
    const rawAesKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, kp.privateKey, wrapped as unknown as ArrayBuffer);
    const aesKey = await crypto.subtle.importKey('raw', rawAesKey, 'AES-GCM', false, ['decrypt']);
    const nonce = Uint8Array.from(atob(parts[2]), (c) => c.charCodeAt(0));
    const cipher = Uint8Array.from(atob(parts[3]), (c) => c.charCodeAt(0));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, aesKey, cipher as unknown as ArrayBuffer);
    expect(new TextDecoder().decode(plain)).toBe('secret-pass');
  });

  it('容忍 PEM 头尾与空白；空公钥 fail-fast', async () => {
    const spkiB64 = await generateSpkiB64();
    const pem = `-----BEGIN PUBLIC KEY-----\n  ${spkiB64}  \n-----END PUBLIC KEY-----`;
    const envelope = await encryptPasswordEnvelope('x', pem);
    expect(envelope.startsWith('rsa-v1:')).toBe(true);
    await expect(encryptPasswordEnvelope('x', '')).rejects.toThrow();
  });
});
