#!/usr/bin/env node
/**
 * Một lệnh E2E (ADR-009 mục 3.4):  npm --prefix tests run e2e:local
 *
 * Vòng đời: dựng stack riêng (tests/docker-compose.e2e.yml) → chờ Postgres/API/Web healthy
 * → setup fixture → Playwright → teardown (luôn chạy khi stack đã lên) → dừng stack, xóa volume E2E.
 * Exit code khác 0 khi bất kỳ bước nào lỗi, kể cả test xanh nhưng teardown lỗi hoặc còn sót dữ liệu.
 *
 * Biến môi trường tùy chọn: E2E_RUN_ID (mặc định sinh ngẫu nhiên), E2E_WEB_PORT (3100), E2E_API_PORT (4100).
 * Tham số thêm được chuyển cho Playwright, ví dụ: npm --prefix tests run e2e:local -- --grep E2E-02
 */
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const composeFile = path.join(testsDir, 'docker-compose.e2e.yml');
const require = createRequire(import.meta.url);

const runId = (process.env.E2E_RUN_ID || randomBytes(5).toString('hex')).toLowerCase();
if (!/^[a-z0-9]{4,24}$/.test(runId)) {
  console.error('[e2e:local] E2E_RUN_ID phải gồm 4-24 ký tự a-z, 0-9.');
  process.exit(2);
}
const webPort = process.env.E2E_WEB_PORT || '3100';
const apiPort = process.env.E2E_API_PORT || '4100';
const runDir = path.join(testsDir, '.e2e-run', runId);
const baseEnv = { ...process.env, E2E_RUN_ID: runId, E2E_WEB_PORT: webPort, E2E_API_PORT: apiPort };

function log(message) {
  console.log(`[e2e:local] ${message}`);
}

function exec(command, args, { capture = false, extraEnv = {} } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: testsDir,
      env: { ...baseEnv, ...extraEnv },
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    });
    let stdout = '';
    if (capture) {
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
    }
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 1, stdout }));
  });
}

function compose(args, options) {
  return exec('docker', ['compose', '-f', composeFile, '-p', 'brewlite-e2e', ...args], options);
}

function runFixture(script) {
  return compose(
    ['--profile', 'tools', 'run', '--rm', '-T', 'e2e-fixtures', `e2e-fixtures/${script}`],
    { capture: true },
  );
}

/** Script fixture in kết quả máy đọc trên một dòng `<MARKER>=<json>`. */
function readMarker(stdout, marker) {
  const line = stdout.split(/\r?\n/).find((item) => item.startsWith(`${marker}=`));
  return line ? JSON.parse(line.slice(marker.length + 1)) : null;
}

async function main() {
  mkdirSync(runDir, { recursive: true });
  log(`runId=${runId} | web http://localhost:${webPort} | api http://localhost:${apiPort}/api/v1`);

  let exitCode = 1;
  let stackHealthy = false;

  try {
    const up = await compose(['up', '-d', '--build', '--wait', '--wait-timeout', '600']);
    if (up.code !== 0) {
      throw new Error('Không dựng được stack E2E (docker compose up). Docker đã chạy chưa?');
    }
    stackHealthy = true;

    const setup = await runFixture('setup.cjs');
    const manifest = readMarker(setup.stdout, 'E2E_MANIFEST');
    if (setup.code !== 0 || !manifest) {
      throw new Error('Setup fixture thất bại.');
    }
    writeFileSync(path.join(runDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    log(`Fixture sẵn sàng: món "${manifest.product.name}", topping "${manifest.topping.name}".`);

    const playwrightCli = require.resolve('@playwright/test/cli');
    const playwright = await exec(process.execPath, [playwrightCli, 'test', ...process.argv.slice(2)], {
      extraEnv: { E2E_BASE_URL: `http://localhost:${webPort}`, E2E_RUN_DIR: runDir },
    });
    exitCode = playwright.code;
    log(playwright.code === 0 ? 'Playwright: các kịch bản đều xanh.' : `Playwright lỗi (exit ${playwright.code}).`);
  } catch (error) {
    console.error(`[e2e:local] ${error instanceof Error ? error.message : error}`);
    exitCode = 1;
  } finally {
    if (stackHealthy) {
      const teardown = await runFixture('teardown.cjs');
      const summary = readMarker(teardown.stdout, 'E2E_TEARDOWN');
      if (summary) {
        writeFileSync(path.join(runDir, 'teardown.json'), `${JSON.stringify(summary, null, 2)}\n`);
      }
      if (teardown.code !== 0) {
        console.error('[e2e:local] Teardown lỗi hoặc còn sót dữ liệu: lượt chạy KHÔNG được tính là đạt.');
        exitCode = exitCode || 1;
      } else {
        log(`Teardown: đã dọn sạch dữ liệu của runId=${runId}.`);
      }
    }
    await compose(['down', '-v', '--remove-orphans']);
  }

  log(`Kết quả: ${exitCode === 0 ? 'ĐẠT' : 'KHÔNG ĐẠT'} (manifest và teardown.json trong tests/.e2e-run/${runId}/).`);
  process.exit(exitCode);
}

main();
