import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  slug?: string;
  publicUrl?: string;
  dashboardUrl?: string;
}

export const WelcomeEmail = ({
  slug = "your-handle",
  publicUrl,
  dashboardUrl,
}: WelcomeEmailProps) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://pleasepleaseplease.me";
  const resolvedPublicUrl = publicUrl || `${baseUrl}/${slug}`;
  const resolvedDashboardUrl = dashboardUrl || `${baseUrl}/${slug}/dashboard`;

  return (
    <Html>
      <Head />
      <Preview>Welcome to Please Please Please</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Please Please Please</Heading>
          <Text style={text}>
            Welcome to the platform. We're excited to have you here.
          </Text>
          <Text style={text}>
            Start reclaiming your time and receiving payments. Explore your
            public profile and your dashboard to get started.
          </Text>
          <Section style={btnContainer}>
            <Link style={button} href={resolvedPublicUrl}>
              Public Profile
            </Link>
          </Section>
          <Section style={btnContainer}>
            <Link style={button} href={resolvedDashboardUrl}>
              Dashboard
            </Link>
          </Section>
          <Text style={footer}>Provided by Twilight Fringe</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#000",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  marginTop: "60px",
};
