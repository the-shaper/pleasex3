import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const testEmails = internalAction({
    args: {},
    handler: async (ctx) => {
        console.log("Testing Welcome Email...");
        await ctx.runAction(internal.emails.sendWelcomeEmail, {
            email: "onboarding@resend.dev",
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("Testing Ticket Receipt Email...");
        await ctx.runAction(internal.emails.sendTicketReceipt, {
            email: "onboarding@resend.dev",
            userName: "Test User",
            ticketRef: "TEST-PPP-1234",
            trackingUrl: "https://pleasex3.com/tracking/TEST-PPP-1234",
            creatorName: "Test Creator",
            ticketType: "personal",
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("Testing Creator Alert Email...");
        await ctx.runAction(internal.emails.sendCreatorAlert, {
            email: "onboarding@resend.dev",
            creatorName: "Test Creator",
            userName: "Test User",
            ticketType: "priority",
            tipAmount: 50,
            dashboardUrl: "https://pleasex3.com/dashboard",
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("Testing Ticket Approved Email...");
        await ctx.runAction(internal.emails.sendTicketApproved, {
            email: "onboarding@resend.dev",
            userName: "Test User",
            ticketRef: "TEST-PPP-1234",
            queueNumber: 5,
            trackingUrl: "https://pleasex3.com/tracking/TEST-PPP-1234",
            ticketType: "priority",
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("Testing Ticket Rejected Email...");
        await ctx.runAction(internal.emails.sendTicketRejected, {
            email: "onboarding@resend.dev",
            userName: "Test User",
            ticketRef: "TEST-PPP-1234",
            creatorName: "Test Creator",
        });

        console.log("All emails sent (check Resend dashboard).");
    },
});
