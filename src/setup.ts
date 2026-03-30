import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { ensureEmberDir, getDbPath } from "./utils/config.js";
import { initializeDatabase } from "./db/schema.js";
import { runMigrations } from "./db/migrations.js";
import { EmberQueries } from "./db/queries.js";

const isWindows = process.platform === "win32";

function getEmberMcpConfig(): { command: string; args: string[] } {
  if (isWindows) {
    return { command: "cmd", args: ["/c", "npx", "-y", "ember-memory"] };
  }
  return { command: "npx", args: ["-y", "ember-memory"] };
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function getClaudeJsonPath(): string {
  return path.join(os.homedir(), ".claude.json");
}

function addMcpToClaudeJson(): { success: boolean; path: string; message: string } {
  const configPath = getClaudeJsonPath();
  const mcpConfig = getEmberMcpConfig();

  let existing: Record<string, unknown> = {};
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf-8");
    existing = JSON.parse(raw) as Record<string, unknown>;
  }

  const mcpServers = (existing.mcpServers ?? {}) as Record<string, unknown>;
  mcpServers.ember = { type: "stdio", ...mcpConfig, env: {} };
  existing.mcpServers = mcpServers;

  fs.writeFileSync(configPath, JSON.stringify(existing, null, 2) + "\n");
  return { success: true, path: configPath, message: `Updated: ${configPath}` };
}

function tryClaudeMcpAdd(): boolean {
  const mcpConfig = getEmberMcpConfig();
  const cmdParts = [mcpConfig.command, ...mcpConfig.args].join(" ");

  try {
    execSync(
      `claude mcp add --transport stdio ember --scope user -- ${cmdParts}`,
      { stdio: "pipe", timeout: 10000 }
    );
    return true;
  } catch {
    return false;
  }
}

export async function runSetup(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const mcpConfig = getEmberMcpConfig();

  console.log("\n  Ember — Experiential Memory Setup\n");

  // Step 1: MCP server config
  console.log("Step 1: Add Ember to Claude Code\n");
  console.log("  This will register Ember as an MCP server so Claude can use it automatically.");
  console.log(`  Platform: ${isWindows ? "Windows" : process.platform}`);
  console.log(`  Command: ${mcpConfig.command} ${mcpConfig.args.join(" ")}\n`);

  const addMcp = await ask(rl, "  Add Ember MCP server? (y/n): ");

  if (addMcp.toLowerCase() === "y") {
    // Try the CLI command first (most reliable)
    console.log("  Attempting to add via claude mcp add...");
    const cliWorked = tryClaudeMcpAdd();

    if (cliWorked) {
      console.log("  Added via Claude CLI.\n");
    } else {
      // Fallback: write directly to ~/.claude.json
      console.log("  CLI not available, writing to ~/.claude.json directly...");
      const result = addMcpToClaudeJson();
      console.log(`  ${result.message}\n`);
    }
  } else {
    console.log("  Skipped.\n");
  }

  // Step 2: Annotation mode
  console.log("Step 2: Choose annotation mode\n");
  console.log("  standard — full emotional annotation (7 fields, ~250 tokens/message)");
  console.log("  minimal  — weight and temperature only (2 fields, ~100 tokens/message)\n");

  const mode = await ask(rl, "  Annotation mode (standard/minimal) [standard]: ");
  const annotationMode = mode === "minimal" ? "minimal" : "standard";

  ensureEmberDir();
  const db = initializeDatabase(getDbPath());
  runMigrations(db);
  const queries = new EmberQueries(db);
  queries.setConfig("annotation_mode", annotationMode);

  console.log(`  Saved: ${annotationMode}\n`);

  // Done
  console.log("  Setup complete.\n");
  console.log("  Ember's MCP server includes built-in instructions that tell Claude");
  console.log("  how to use it automatically. No CLAUDE.md changes needed.\n");
  console.log("  Next: restart Claude Code (or start a new CLI session) and Ember");
  console.log("  will begin preserving the texture of your conversations.\n");

  rl.close();
}
