import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { githubCallback } from "./github/oauth";

const http = httpRouter();

auth.addHttpRoutes(http);

// GitHub OAuth web-flow callback (redirect_uri of the GitHub OAuth App).
http.route({
  path: "/github/callback",
  method: "GET",
  handler: githubCallback,
});

export default http;
