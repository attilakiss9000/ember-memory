import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const EMBER_DIR_NAME = ".ember";
const DB_FILE_NAME = "ember.db";
const EXPORTS_DIR_NAME = "exports";

export function getEmberDir(): string {
  return process.env.EMBER_DIR ?? path.join(os.homedir(), EMBER_DIR_NAME);
}

export function getDbPath(): string {
  return process.env.EMBER_DB_PATH ?? path.join(getEmberDir(), DB_FILE_NAME);
}

export function getExportsDir(): string {
  return path.join(getEmberDir(), EXPORTS_DIR_NAME);
}

export function ensureEmberDir(): void {
  const emberDir = getEmberDir();
  if (!fs.existsSync(emberDir)) {
    fs.mkdirSync(emberDir, { recursive: true });
  }
}

export function ensureExportsDir(): void {
  const exportsDir = getExportsDir();
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
}
