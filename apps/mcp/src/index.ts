import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAdminClient } from "./lib/supabase.js";
import { registerNoteTools } from "./tools/notes.js";
import { registerTopicTools } from "./tools/topics.js";
import { registerSearchTools } from "./tools/search.js";
import { registerMediaTools } from "./tools/media.js";

const server = new McpServer({
  name: "notes-kb",
  version: "1.0.0",
});

// Lazy client — created once per request so env vars can be set after import
let _client: ReturnType<typeof createAdminClient> | null = null;
function getClient() {
  if (!_client) _client = createAdminClient();
  return _client;
}

registerNoteTools(server, getClient);
registerTopicTools(server, getClient);
registerSearchTools(server, getClient);
registerMediaTools(server, getClient);

const transport = new StdioServerTransport();
await server.connect(transport);
