#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createEmberServer } from "./server.js";

async function main() {
  if (process.argv.includes("--setup")) {
    const { runSetup } = await import("./setup.js");
    await runSetup();
    return;
  }

  const { server } = createEmberServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Ember failed to start:", error);
  process.exit(1);
});
