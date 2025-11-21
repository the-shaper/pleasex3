import { Resend } from "resend";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { render } from "@react-email/render";
import { WelcomeEmail } from "./emails/WelcomeEmail";
import { TicketReceiptEmail } from "./emails/TicketReceiptEmail";
import { CreatorAlertEmail } from "./emails/CreatorAlertEmail";
import { TicketApprovedEmail } from "./emails/TicketApprovedEmail";
import { TicketRejectedEmail } from "./emails/TicketRejectedEmail";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY || "re_123");
const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

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
        const html = await render(react);
        const { data, error } = await resend.emails.send({
            from: SENDER_EMAIL,
            to,
            subject,
            html,
        });

        if (error) {
            console.error("Error sending email:", error);
            throw new Error(`Failed to send email: ${error.message || JSON.stringify(error)}`);
        }

        console.log("Email sent successfully:", data?.id);
        return data;
    } catch (err) {
        console.error("Unexpected error sending email:", err);
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
    },
    handler: async (ctx, args) => {
        await sendEmail({
            to: args.email,
            subject: `Update on Request: ${args.ticketRef}`,
            react: React.createElement(TicketRejectedEmail, {
                userName: args.userName,
                ticketRef: args.ticketRef,
                creatorName: args.creatorName,
            }),
        });
    },
});
