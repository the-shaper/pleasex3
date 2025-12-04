import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Hr,
  Link,
} from "@react-email/components";
import * as React from "react";

interface CreatorPendingReminderEmailProps {
  creatorName: string;
  pendingCount: number;
  oldestTicketRef: string;
  daysOld: number;
  dashboardUrl: string;
}

export const CreatorPendingReminderEmail = ({
  creatorName = "Creator",
  pendingCount = 1,
  oldestTicketRef = "REF-123",
  daysOld = 3,
  dashboardUrl = "https://example.com/dashboard",
}: CreatorPendingReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>
      {pendingCount} pending request{pendingCount > 1 ? "s" : ""} awaiting your
      review
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Please Please Please</Heading>
        <Text style={text}>Hi {creatorName},</Text>
        <Text style={text}>
          You have <strong>{pendingCount}</strong> pending request
          {pendingCount > 1 ? "s" : ""} waiting for your approval.
        </Text>
        <Section style={warningBox}>
          <Text style={warningText}>⏰ Action Required</Text>
          <Text style={statusText}>
            Request {oldestTicketRef} has been waiting for {daysOld} days
          </Text>
          <Text style={smallText}>
            Requests automatically expire after 7 days if not approved or
            rejected. The submitter&apos;s card hold will be released and they
            won&apos;t be charged.
          </Text>
        </Section>
        <Section style={buttonSection}>
          <Link href={dashboardUrl} style={button}>
            Review Pending Requests
          </Link>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Provided by Twilight Fringe</Text>
      </Container>
    </Body>
  </Html>
);

export default CreatorPendingReminderEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "'Space Mono', 'Courier New', Courier, monospace",
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const h1 = {
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  color: "#333",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
};

const warningBox = {
  backgroundColor: "#fffbeb",
  borderRadius: "4px",
  padding: "24px",
  marginBottom: "24px",
  border: "1px solid #fbbf24",
  textAlign: "center" as const,
};

const warningText = {
  fontSize: "14px",
  color: "#b45309",
  marginBottom: "8px",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

const statusText = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#92400e",
  margin: "0 0 8px 0",
};

const smallText = {
  fontSize: "14px",
  color: "#718096",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  marginTop: "24px",
};

const button = {
  backgroundColor: "#333",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  marginTop: "20px",
};
