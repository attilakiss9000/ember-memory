import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { EmberQueries } from "../db/queries.js";
import { VALID_CONFIG_KEYS } from "../types/index.js";

const VALID_VALUES: Record<string, string[]> = {
  annotation_mode: ["minimal", "standard"],
};

export function registerConfigTool(
  server: McpServer,
  queries: EmberQueries
): void {
  server.tool(
    "ember_config",
    "Get or set Ember configuration values. Use action 'get' to read current config (optionally filtered by key) or 'set' to update a config value.",
    {
      action: z.enum(["get", "set"]).describe("Whether to read or write config"),
      key: z
        .string()
        .optional()
        .describe("Config key to get or set. Valid keys: annotation_mode"),
      value: z
        .string()
        .optional()
        .describe("Value to set (required when action is 'set')"),
    },
    async ({ action, key, value }) => {
      if (action === "get") {
        if (key) {
          if (!VALID_CONFIG_KEYS.includes(key as typeof VALID_CONFIG_KEYS[number])) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: Unknown config key '${key}'. Valid keys: ${VALID_CONFIG_KEYS.join(", ")}`,
                },
              ],
              isError: true,
            };
          }
          const val = queries.getConfig(key);
          return {
            content: [
              {
                type: "text" as const,
                text: `${key}: ${val ?? "(default)"}`,
              },
            ],
          };
        }

        const allConfig = queries.getAllConfig();
        const lines = Object.entries(allConfig)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n");
        return {
          content: [{ type: "text" as const, text: lines || "No config set." }],
        };
      }

      // action === "set"
      if (!key) {
        return {
          content: [
            { type: "text" as const, text: "Error: 'key' is required when action is 'set'." },
          ],
          isError: true,
        };
      }

      if (!VALID_CONFIG_KEYS.includes(key as typeof VALID_CONFIG_KEYS[number])) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Unknown config key '${key}'. Valid keys: ${VALID_CONFIG_KEYS.join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      if (value === undefined) {
        return {
          content: [
            { type: "text" as const, text: "Error: 'value' is required when action is 'set'." },
          ],
          isError: true,
        };
      }

      const validValues = VALID_VALUES[key];
      if (validValues && !validValues.includes(value)) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Invalid value '${value}' for '${key}'. Valid values: ${validValues.join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      queries.setConfig(key, value);

      return {
        content: [
          { type: "text" as const, text: `Config updated. ${key}: ${value}` },
        ],
      };
    }
  );
}
