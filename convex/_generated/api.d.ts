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
import type * as emails_CreatorAlertEmail from "../emails/CreatorAlertEmail.js";
import type * as emails_TicketApprovedEmail from "../emails/TicketApprovedEmail.js";
import type * as emails_TicketReceiptEmail from "../emails/TicketReceiptEmail.js";
import type * as emails_TicketRejectedEmail from "../emails/TicketRejectedEmail.js";
import type * as emails_WelcomeEmail from "../emails/WelcomeEmail.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as internal_seed from "../internal/seed.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_stripeEngine from "../lib/stripeEngine.js";
import type * as lib_ticketEngine from "../lib/ticketEngine.js";
import type * as migrations from "../migrations.js";
import type * as payments from "../payments.js";
import type * as queues from "../queues.js";
import type * as stripeOnboarding from "../stripeOnboarding.js";
import type * as testEmails from "../testEmails.js";
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
  "emails/CreatorAlertEmail": typeof emails_CreatorAlertEmail;
  "emails/TicketApprovedEmail": typeof emails_TicketApprovedEmail;
  "emails/TicketReceiptEmail": typeof emails_TicketReceiptEmail;
  "emails/TicketRejectedEmail": typeof emails_TicketRejectedEmail;
  "emails/WelcomeEmail": typeof emails_WelcomeEmail;
  emails: typeof emails;
  http: typeof http;
  "internal/seed": typeof internal_seed;
  "lib/auth": typeof lib_auth;
  "lib/stripeEngine": typeof lib_stripeEngine;
  "lib/ticketEngine": typeof lib_ticketEngine;
  migrations: typeof migrations;
  payments: typeof payments;
  queues: typeof queues;
  stripeOnboarding: typeof stripeOnboarding;
  testEmails: typeof testEmails;
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
