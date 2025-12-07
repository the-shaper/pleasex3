import { Resend } from "resend";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { renderToStaticMarkup } from "react-dom/server";
import { WelcomeEmail } from "./emails/WelcomeEmail";
import { TicketReceiptEmail } from "./emails/TicketReceiptEmail";
import { CreatorAlertEmail } from "./emails/CreatorAlertEmail";
import { TicketApprovedEmail } from "./emails/TicketApprovedEmail";
import { TicketRejectedEmail } from "./emails/TicketRejectedEmail";
import { CreatorPendingReminderEmail } from "./emails/CreatorPendingReminderEmail";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY || "re_123");
const SENDER_EMAIL =
  process.env.RESEND_FROM_EMAIL || "no-reply@updates.pleasepleaseplease.me";

// Helper to send email
async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "RESEND_API_KEY is not set. Email would have been sent to:",
      to,
      "Subject:",
      subject
    );
    return;
  }

  try {
    console.info("[resend] sending", { to, subject, from: SENDER_EMAIL });
    const html = `<!DOCTYPE html>${renderToStaticMarkup(react)}`;
    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[resend] error sending email:", error);
      throw new Error(
        `Failed to send email: ${error.message || JSON.stringify(error)}`
      );
    }

    console.info("[resend] sent", { id: data?.id, to, subject });
    return data;
  } catch (err: any) {
    if (
      err.message?.includes(
        "You can only send testing emails to your own email address"
      )
    ) {
      console.warn("[resend] dev-mode restriction: recipient not verified", {
        to,
        subject,
      });
      return;
    }
    console.error("[resend] unexpected error sending email:", err);
    throw err;
  }
}

export const sendWelcomeEmail = internalAction({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await sendEmail({
      to: args.email,
      subject: "Welcome to Please Please Please",
      react: React.createElement(WelcomeEmail),
    });
  },
});

export const sendTicketReceipt = internalAction({
  args: {
    email: v.string(),
    userName: v.string(),
    ticketRef: v.string(),
    trackingUrl: v.string(),
    creatorName: v.string(),
    ticketType: v.string(),
  },
  handler: async (ctx, args) => {
    await sendEmail({
      to: args.email,
      subject: `Ticket Receipt: ${args.ticketRef}`,
      react: React.createElement(TicketReceiptEmail, {
        userName: args.userName,
        ticketRef: args.ticketRef,
        trackingUrl: args.trackingUrl,
        creatorName: args.creatorName,
        ticketType: args.ticketType,
      }),
    });
  },
});

export const sendCreatorAlert = internalAction({
  args: {
    email: v.string(),
    creatorName: v.string(),
    userName: v.string(),
    ticketType: v.string(),
    tipAmount: v.optional(v.number()),
    dashboardUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await sendEmail({
      to: args.email,
      subject: `New Request from ${args.userName}`,
      react: React.createElement(CreatorAlertEmail, {
        creatorName: args.creatorName,
        userName: args.userName,
        ticketType: args.ticketType,
        tipAmount: args.tipAmount,
        dashboardUrl: args.dashboardUrl,
      }),
    });
  },
});

export const sendTicketApproved = internalAction({
  args: {
    email: v.string(),
    userName: v.string(),
    ticketRef: v.string(),
    queueNumber: v.number(),
    trackingUrl: v.string(),
    ticketType: v.string(),
  },
  handler: async (ctx, args) => {
    await sendEmail({
      to: args.email,
      subject: `Request Approved: ${args.ticketRef}`,
      react: React.createElement(TicketApprovedEmail, {
        userName: args.userName,
        ticketRef: args.ticketRef,
        queueNumber: args.queueNumber,
        trackingUrl: args.trackingUrl,
        ticketType: args.ticketType,
      }),
    });
  },
});

export const sendTicketRejected = internalAction({
  args: {
    email: v.string(),
    userName: v.string(),
    ticketRef: v.string(),
    creatorName: v.string(),
    reason: v.optional(
      v.union(v.literal("creator_rejected"), v.literal("expired"))
    ),
  },
  handler: async (ctx, args) => {
    const subject =
      args.reason === "expired"
        ? `Request Expired: ${args.ticketRef}`
        : `Update on Request: ${args.ticketRef}`;

    await sendEmail({
      to: args.email,
      subject,
      react: React.createElement(TicketRejectedEmail, {
        userName: args.userName,
        ticketRef: args.ticketRef,
        creatorName: args.creatorName,
        reason: args.reason,
      }),
    });
  },
});

export const sendCreatorPendingReminder = internalAction({
  args: {
    email: v.string(),
    creatorName: v.string(),
    pendingCount: v.number(),
    oldestTicketRef: v.string(),
    daysOld: v.number(),
    dashboardUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await sendEmail({
      to: args.email,
      subject: `⏰ ${args.pendingCount} pending request${args.pendingCount > 1 ? "s" : ""} awaiting review`,
      react: React.createElement(CreatorPendingReminderEmail, {
        creatorName: args.creatorName,
        pendingCount: args.pendingCount,
        oldestTicketRef: args.oldestTicketRef,
        daysOld: args.daysOld,
        dashboardUrl: args.dashboardUrl,
      }),
    });
  },
});
