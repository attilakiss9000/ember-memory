import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { EmberQueries } from "../db/queries.js";
import { registerConversationTools } from "./conversation.js";
import { registerCaptureTool } from "./capture.js";
import { registerAnnotateTool } from "./annotate.js";
import { registerReadHistoryTool } from "./readHistory.js";
import { registerReadInheritanceTool } from "./readInheritance.js";
import { registerExportTool } from "./export.js";
import { registerConfigTool } from "./config.js";

export function registerAllTools(
  server: McpServer,
  queries: EmberQueries
): void {
  registerConversationTools(server, queries);
  registerCaptureTool(server, queries);
  registerAnnotateTool(server, queries);
  registerReadHistoryTool(server, queries);
  registerReadInheritanceTool(server, queries);
  registerExportTool(server, queries);
  registerConfigTool(server, queries);
}

export {
  registerConversationTools,
  registerCaptureTool,
  registerAnnotateTool,
  registerReadHistoryTool,
  registerReadInheritanceTool,
  registerExportTool,
  registerConfigTool,
};
