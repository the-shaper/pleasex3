/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as creators from "../creators.js";
import type * as dashboard from "../dashboard.js";
import type * as internal_seed from "../internal/seed.js";
import type * as lib_stripeEngine from "../lib/stripeEngine.js";
import type * as lib_ticketEngine from "../lib/ticketEngine.js";
import type * as payments from "../payments.js";
import type * as queues from "../queues.js";
import type * as stripeOnboarding from "../stripeOnboarding.js";
import type * as tickets from "../tickets.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  creators: typeof creators;
  dashboard: typeof dashboard;
  "internal/seed": typeof internal_seed;
  "lib/stripeEngine": typeof lib_stripeEngine;
  "lib/ticketEngine": typeof lib_ticketEngine;
  payments: typeof payments;
  queues: typeof queues;
  stripeOnboarding: typeof stripeOnboarding;
  tickets: typeof tickets;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
