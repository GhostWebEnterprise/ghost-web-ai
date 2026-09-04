/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as ghost_actions from "../ghost/actions.js";
import type * as ghost_mutations from "../ghost/mutations.js";
import type * as ghost_plan from "../ghost/plan.js";
import type * as ghost_queries from "../ghost/queries.js";
import type * as github_actions from "../github/actions.js";
import type * as github_helpers from "../github/helpers.js";
import type * as github_mutations from "../github/mutations.js";
import type * as github_oauth from "../github/oauth.js";
import type * as github_queries from "../github/queries.js";
import type * as http from "../http.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  "ghost/actions": typeof ghost_actions;
  "ghost/mutations": typeof ghost_mutations;
  "ghost/plan": typeof ghost_plan;
  "ghost/queries": typeof ghost_queries;
  "github/actions": typeof github_actions;
  "github/helpers": typeof github_helpers;
  "github/mutations": typeof github_mutations;
  "github/oauth": typeof github_oauth;
  "github/queries": typeof github_queries;
  http: typeof http;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
