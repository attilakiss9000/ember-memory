import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ensureEmberDir, getDbPath } from "./utils/config.js";
import { initializeDatabase } from "./db/schema.js";
import { runMigrations } from "./db/migrations.js";
import { EmberQueries } from "./db/queries.js";

const MCP_CONFIG = {
  mcpServers: {
    ember: {
      command: "npx",
      args: ["-y", "ember-memory"],
    },
  },
};

const CLAUDE_MD_SNIPPET = `## Ember — Experiential Memory

At the start of each session, call \`ember_start_conversation\` and \`ember_read_inheritance\` to inherit context from past conversations.
During conversation, use \`ember_annotate\` for significant exchanges and \`ember_capture\` for routine messages.
At session end, call \`ember_end_conversation\` with a brief summary of what happened.`;

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function findClaudeSettingsPath(): string | null {
  const candidates = [
    path.join(os.homedir(), ".claude", "settings.json"),
    path.join(os.homedir(), ".claude.json"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return candidates[0];
}

function mergeConfig(existing: Record<string, unknown>): Record<string, unknown> {
  const mcpServers = (existing.mcpServers ?? {}) as Record<string, unknown>;
  mcpServers.ember = MCP_CONFIG.mcpServers.ember;
  return { ...existing, mcpServers };
}

export async function runSetup(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n  Ember — Experiential Memory Setup\n");

  // Step 1: MCP server config
  console.log("Step 1: Add Ember to Claude Code MCP settings\n");
  console.log("This will add the following to your Claude settings:\n");
  console.log(JSON.stringify(MCP_CONFIG, null, 2));
  console.log("");

  const addMcp = await ask(rl, "Add to Claude settings? (y/n): ");

  if (addMcp.toLowerCase() === "y") {
    const settingsPath = findClaudeSettingsPath();

    if (!settingsPath) {
      console.log("Could not determine Claude settings path. Skipping.");
    } else {
      const dir = path.dirname(settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let existing: Record<string, unknown> = {};
      if (fs.existsSync(settingsPath)) {
        const raw = fs.readFileSync(settingsPath, "utf-8");
        existing = JSON.parse(raw) as Record<string, unknown>;
      }

      const merged = mergeConfig(existing);
      fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2) + "\n");
      console.log(`Updated: ${settingsPath}\n`);
    }
  } else {
    console.log("Skipped MCP settings.\n");
  }

  // Step 2: CLAUDE.md snippet
  console.log("Step 2: Add Ember instructions to CLAUDE.md\n");
  console.log("This will append the following to CLAUDE.md in the current directory:\n");
  console.log(CLAUDE_MD_SNIPPET);
  console.log("");

  const addClaudeMd = await ask(rl, "Add to CLAUDE.md? (y/n): ");

  if (addClaudeMd.toLowerCase() === "y") {
    const claudeMdPath = path.join(process.cwd(), "CLAUDE.md");
    const existing = fs.existsSync(claudeMdPath)
      ? fs.readFileSync(claudeMdPath, "utf-8")
      : "";

    const separator = existing.length > 0 ? "\n\n" : "";
    fs.writeFileSync(claudeMdPath, existing + separator + CLAUDE_MD_SNIPPET + "\n");
    console.log(`Updated: ${claudeMdPath}\n`);
  } else {
    console.log("Skipped CLAUDE.md.\n");
  }

  // Step 3: Annotation mode
  console.log("Step 3: Choose annotation mode\n");
  console.log("  standard — full emotional annotation (authenticity, shifts, subtext, unspoken)");
  console.log("  minimal  — weight and temperature only\n");

  const mode = await ask(rl, "Annotation mode (standard/minimal) [standard]: ");
  const annotationMode = mode === "minimal" ? "minimal" : "standard";

  ensureEmberDir();
  const db = initializeDatabase(getDbPath());
  runMigrations(db);
  const queries = new EmberQueries(db);
  queries.setConfig("annotation_mode", annotationMode);

  console.log(`\nSaved annotation mode: ${annotationMode}`);
  console.log("\nEmber setup complete. Start a new Claude Code session to begin.\n");

  rl.close();
}
