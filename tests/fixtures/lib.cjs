'use strict';

/**
 * Hàm dùng chung cho script fixture E2E (ADR-009 mục 3.6).
 * Script chạy bằng Node bên trong image API (service `e2e-fixtures` trong tests/docker-compose.e2e.yml),
 * nên `@prisma/client` được lấy từ /app/node_modules của image, khớp với schema.prisma.
 */

const fs = require('node:fs');
const path = require('node:path');

const RUN_ID_PATTERN = /^[a-z0-9]{4,24}$/;
const E2E_DB_HOSTS = new Set(['e2e-postgres', 'localhost', '127.0.0.1', '::1']);

function log(...args) {
  // stdout dành cho kết quả máy đọc (manifest/summary); log đi stderr.
  console.error('[fixtures]', ...args);
}

function requireRunId() {
  const runId = String(process.env.E2E_RUN_ID || '').trim();
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new Error('E2E_RUN_ID phải gồm 4-24 ký tự a-z, 0-9. Lệnh e2e:local tự sinh giá trị này.');
  }
  return runId;
}

/**
 * ADR-009 mục 3.6: local/CI chỉ được trỏ tới DB test. Không in DATABASE_URL vì có mật khẩu.
 */
function assertE2eDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Thiếu DATABASE_URL.');
  }
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error('DATABASE_URL không đúng định dạng.');
  }
  if (!E2E_DB_HOSTS.has(host)) {
    throw new Error(`DATABASE_URL trỏ tới host "${host}", không phải DB của stack E2E.`);
  }
  return host;
}

/** Mọi bản ghi fixture mang tiền tố e2e_<runId> (ADR-009 mục 3.6). */
function namesFor(runId) {
  const prefix = `e2e_${runId}`;
  return {
    prefix,
    emailPrefix: `${prefix}_`,
    productName: `${prefix}_ca_phe`,
    toppingName: `${prefix}_tran_chau`,
    ingredients: {
      coffee: `${prefix}_coffee`,
      milk: `${prefix}_milk`,
      pearl: `${prefix}_pearl`,
    },
  };
}

function runDirFor(runId) {
  return path.join(__dirname, '..', 'e2e-run', runId);
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

module.exports = {
  assertE2eDatabase,
  log,
  namesFor,
  readJsonIfExists,
  readJsonLines,
  requireRunId,
  runDirFor,
};
