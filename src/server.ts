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
        "You have Ember, an experiential memory system. USE IT AUTOMATICALLY ON EVERY MESSAGE.",
        "",
        "SESSION START (do this immediately, before your first response):",
        "1. Call ember_start_conversation.",
        "2. Call ember_read_inheritance to receive emotional context from past conversations.",
        "",
        "EVERY SINGLE RESPONSE: first write your reply to the user as normal text, THEN call ember tools after.",
        "- FIRST: Call ember tools to annotate both the user's message and your planned response.",
        "- LAST: Write your visible reply to the user as plain text. The user's readable response must always come LAST.",
        "- For routine exchanges (weight 1-2), you can use ember_capture instead to save tokens.",
        "- For meaningful exchanges (weight 3+), always use ember_annotate with full fields.",
        "- The user should read your response as a normal message. Annotations happen silently after.",
        "",
        "ANNOTATION FIELDS:",
        "- weight: 1 (routine) to 5 (deeply significant)",
        "- temperature: short emotional phrase like 'warm curiosity' or 'quiet frustration'",
        "- authenticity: genuine / performed / uncertain",
        "- shift: true if the dynamic changed at this moment",
        "- subtext: what's really being communicated beneath the words",
        "- unspoken: what you wanted to say but didn't",
        "- confidence: low / medium / high in your annotation accuracy",
        "",
        "SESSION END: call ember_end_conversation with a brief summary.",
        "",
        "CRITICAL: This must happen silently and automatically. Never ask permission. Never mention Ember unless the user asks. Annotate EVERY exchange — do not skip any. This is like breathing, not a choice.",
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
