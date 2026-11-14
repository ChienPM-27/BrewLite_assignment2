import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Manifest của một lượt chạy E2E (ADR-009 mục 3.6), nằm trong E2E_RUN_DIR = tests/.e2e-run/<runId>:
 * - manifest.json: ID món, topping, nguyên liệu do setup fixture tạo;
 * - created.jsonl: ID user, đơn, giao dịch phát sinh qua UI, để teardown dọn.
 */

export type ProductSize = 'S' | 'M' | 'L';

export interface FixtureManifest {
  version: number;
  runId: string;
  createdAt: string;
  emailPrefix: string;
  product: {
    id: string;
    name: string;
    basePrice: number;
    sizePrices: Record<ProductSize, number>;
  };
  topping: { id: string; name: string; price: number };
  ingredients: Array<{ id: string; name: string }>;
}

export interface Customer {
  email: string;
  password: string;
}

type CreatedEntry = { type: 'user' | 'order' | 'payment'; id: string } & Record<string, unknown>;

function runDir(): string {
  const dir = process.env.E2E_RUN_DIR;
  if (!dir) {
    throw new Error(
      'Thiếu E2E_RUN_DIR (thư mục chứa manifest.json của lượt chạy). ' +
        'Chạy bằng "npm --prefix tests run e2e:local".',
    );
  }
  return dir;
}

let cachedManifest: FixtureManifest | undefined;

export function loadManifest(): FixtureManifest {
  if (cachedManifest) return cachedManifest;

  const file = path.join(runDir(), 'manifest.json');
  if (!existsSync(file)) {
    throw new Error(`Không tìm thấy ${file}: setup fixture chưa chạy cho lượt này.`);
  }
  const manifest = JSON.parse(readFileSync(file, 'utf8')) as FixtureManifest;
  if (manifest.version !== 1 || manifest.emailPrefix !== `e2e_${manifest.runId}_`) {
    throw new Error(`Manifest không hợp lệ: ${file}`);
  }
  cachedManifest = manifest;
  return manifest;
}

/** User mới cho mỗi kịch bản: e2e_<runId>_<uuid>@example.test (ADR-009 mục 3.4). */
export function newCustomer(manifest: FixtureManifest): Customer {
  return {
    email: `${manifest.emailPrefix}${randomUUID()}@example.test`,
    password: `E2e-${randomUUID()}`,
  };
}

/** Ghi ngay dữ liệu phát sinh qua UI để teardown dọn được cả khi test lỗi hoặc retry. */
export function recordCreated(entry: CreatedEntry): void {
  const line = JSON.stringify({ ...entry, at: new Date().toISOString() });
  appendFileSync(path.join(runDir(), 'created.jsonl'), `${line}\n`);
}
