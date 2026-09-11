import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { githubCallback } from "./github/oauth";
import { mcpManifest, mcpInvoke, agentCard } from "./mcp";

const http = httpRouter();

auth.addHttpRoutes(http);

// GitHub OAuth web-flow callback (redirect_uri of the GitHub OAuth App).
http.route({
  path: "/github/callback",
  method: "GET",
  handler: githubCallback,
});

// MCP tool interface + A2A agent card discovery.
http.route({ path: "/mcp", method: "GET", handler: mcpManifest });
http.route({ path: "/mcp", method: "POST", handler: mcpInvoke });
http.route({ path: "/.well-known/agent-card.json", method: "GET", handler: agentCard });
http.route({ path: "/a2a", method: "GET", handler: agentCard });

export default http;
