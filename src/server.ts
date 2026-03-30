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

  const server = new McpServer({ name: "ember", version: "0.1.0" });

  registerConversationTools(server, queries);
  registerCaptureTool(server, queries);
  registerAnnotateTool(server, queries);
  registerReadHistoryTool(server, queries);
  registerReadInheritanceTool(server, queries);
  registerExportTool(server, queries);
  registerConfigTool(server, queries);

  return { server, queries };
}
