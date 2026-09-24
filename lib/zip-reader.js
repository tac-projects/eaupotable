'use strict';

const fs = require('fs');
const https = require('https');
const zlib = require('zlib');

// Helpers HTTP + lecture ZIP sans dépendance externe (EOCD + central directory).
// Partagés par scripts/fetch-sise-eaux.js et scripts/check-sise-codes.js.

function getJson(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'EauPotable.net-data-refresh' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
        res.resume();
        return resolve(getJson(new URL(res.headers.location, url).toString(), redirects + 1));
      }
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode} pour ${url}`));
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function download(url, filePath, redirects = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'EauPotable.net-data-refresh' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
        res.resume();
        return resolve(download(new URL(res.headers.location, url).toString(), filePath, redirects + 1));
      }
      if (res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode} pour ${url}`)); res.resume(); return; }
      const out = fs.createWriteStream(filePath);
      res.pipe(out);
      out.on('finish', () => out.close(() => resolve(filePath)));
      out.on('error', reject);
    }).on('error', reject);
  });
}

function listZip(buf) {
  const eocd = buf.lastIndexOf(Buffer.from('PK\x05\x06'));
  if (eocd < 0) throw new Error('Archive ZIP invalide');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const nameLen = buf.readUInt16LE(off + 28);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString();
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const localOff = buf.readUInt32LE(off + 42);
    entries.push({ name, method, csize, localOff });
    off += 46 + nameLen + buf.readUInt16LE(off + 30) + buf.readUInt16LE(off + 32);
  }
  return entries;
}

function zipExtract(buf, entry) {
  const nameLen = buf.readUInt16LE(entry.localOff + 26);
  const extraLen = buf.readUInt16LE(entry.localOff + 28);
  const start = entry.localOff + 30 + nameLen + extraLen;
  const data = buf.slice(start, start + entry.csize);
  return entry.method === 0 ? data : zlib.inflateRawSync(data);
}

module.exports = { getJson, download, listZip, zipExtract };
