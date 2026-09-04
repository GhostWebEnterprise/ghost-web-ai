import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

const STATE_TTL_MS = 10 * 60 * 1000;

async function jsonFetch(
  url: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-json body */
  }
  return { ok: res.ok, status: res.status, data };
}

/**
 * GET /github/callback — reached by GitHub's browser redirect after the user
 * authorizes. Exchanges the one-time code for an access token, stores the
 * account on the user who started the flow, and bounces back to the app.
 */
export const githubCallback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const siteUrl = process.env.SITE_URL ?? process.env.CONVEX_SITE_URL;

  const redirect = (to: string) =>
    new Response(null, { status: 302, headers: { Location: to } });

  if (!clientId || !clientSecret || !siteUrl) {
    return new Response(
      "GitHub OAuth is not configured — set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in project Keys.",
      { status: 500 },
    );
  }
  if (error || !code || !state) {
    return redirect(`${siteUrl}/dashboard?gh=error`);
  }

  const stateRow = await ctx.runQuery(internal.github.queries.oauthStateByState, {
    state,
  });
  if (
    !stateRow ||
    stateRow.createdAt + STATE_TTL_MS < Date.now()
  ) {
    return redirect(`${siteUrl}/dashboard?gh=error`);
  }
  const ownerId = stateRow.ownerId;
  const redirectTo = stateRow.redirectTo;
  // Consume the state row either way (single-use).
  await ctx.runMutation(internal.github.mutations.removeOauthState, { state });

  // Exchange the code for a token.
  const tokenRes = await jsonFetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${siteUrl}/github/callback`,
    }),
  });
  if (!tokenRes.ok) return redirect(`${redirectTo}/dashboard?gh=error`);
  const tokenData = tokenRes.data as {
    access_token?: string;
    scope?: string;
    token_type?: string;
    error_description?: string;
  };
  if (!tokenData.access_token) {
    return redirect(`${redirectTo}/dashboard?gh=error`);
  }

  const token = tokenData.access_token;

  // Fetch the GitHub profile to store alongside the token.
  const userRes = await jsonFetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) return redirect(`${redirectTo}/dashboard?gh=error`);
  const gh = userRes.data as {
    id: number;
    login?: string;
    name?: string | null;
    avatar_url?: string;
    html_url?: string;
  };
  const username = gh.login ?? "unknown";

  await ctx.runMutation(internal.github.mutations.registerAccount, {
    ownerId,
    githubId: String(gh.id),
    username,
    name: gh.name ?? undefined,
    avatarUrl: gh.avatar_url ?? undefined,
    profileUrl: gh.html_url ?? `https://github.com/${username}`,
    accessToken: token,
    tokenScopes: tokenData.scope,
  });

  return redirect(
    `${redirectTo}/dashboard?gh=connected&user=${encodeURIComponent(username)}`,
  );
});
