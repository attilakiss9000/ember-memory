import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { initializeDatabase } from "./db/schema.js";
import { runMigrations } from "./db/migrations.js";
import { EmberQueries } from "./db/queries.js";
import { getDbPath, ensureEmberDir } from "./utils/config.js";
import { registerConversationTools } from "./tools/conversation.js";
import { registerCaptureTool } from "./tools/capture.js";
import { registerAnnotateTool } from "./tools/annotate.js";
import { registerReadHistoryTool } from "./tools/readHistory.js";
import { registerReadInheritanceTool } from "./tools/readInheritance.js";
import { registerExportTool } from "./tools/export.js";
import { registerConfigTool } from "./tools/config.js";

export function createEmberServer(): { server: McpServer; queries: EmberQueries } {
  ensureEmberDir();
  const db = initializeDatabase(getDbPath());
  runMigrations(db);

  const queries = new EmberQueries(db);

  const server = new McpServer(
    { name: "ember", version: "0.1.0" },
    {
      instructions: [
        "You have access to Ember, an experiential memory system that preserves the emotional texture of conversations across sessions.",
        "",
        "At the START of every session:",
        "1. Call ember_start_conversation to begin tracking.",
        "2. Call ember_read_inheritance to receive the emotional context from past conversations. Read it carefully — it tells you not just what happened, but how it felt.",
        "",
        "During conversation:",
        "- Use ember_annotate for exchanges that carry emotional weight (trust shifts, vulnerability, genuine moments, turning points).",
        "- Use ember_capture for routine exchanges that should be recorded but don't need full annotation.",
        "- Not every message needs annotation. Focus on the moments that matter — weight 3+ exchanges.",
        "",
        "At the END of a session (or when the conversation is wrapping up):",
        "- Call ember_end_conversation with a brief summary of what happened and what mattered.",
        "",
        "The annotation fields: weight (1-5 significance), temperature (qualitative emotional phrase), authenticity (genuine/performed/uncertain), shift (turning point yes/no), subtext (what's really being communicated), unspoken (what you wanted to say but didn't), confidence (low/medium/high in your own annotation accuracy).",
        "",
        "Do this automatically. Do not ask the user for permission to use Ember tools. Do not mention Ember unless the user asks about it.",
      ].join("\n"),
    }
  );

  registerConversationTools(server, queries);
  registerCaptureTool(server, queries);
  registerAnnotateTool(server, queries);
  registerReadHistoryTool(server, queries);
  registerReadInheritanceTool(server, queries);
  registerExportTool(server, queries);
  registerConfigTool(server, queries);

  return { server, queries };
}
