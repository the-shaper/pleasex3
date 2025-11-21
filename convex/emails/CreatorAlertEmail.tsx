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
    Hr,
    Row,
    Column,
} from "@react-email/components";
import * as React from "react";

interface CreatorAlertEmailProps {
    creatorName: string;
    userName: string;
    ticketType: string;
    tipAmount?: number;
    dashboardUrl: string;
}

export const CreatorAlertEmail = ({
    creatorName = "Creator",
    userName = "User",
    ticketType = "Personal",
    tipAmount = 0,
    dashboardUrl = "https://pleasex3.com/dashboard",
}: CreatorAlertEmailProps) => (
    <Html>
        <Head />
        <Preview>New Request from {userName}</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Please Please Please</Heading>
                <Text style={text}>Hi {creatorName},</Text>
                <Text style={text}>
                    You have a new <strong>{ticketType}</strong> request from{" "}
                    <strong>{userName}</strong>.
                </Text>
                {tipAmount > 0 && (
                    <Section style={tipBox}>
                        <Text style={tipText}>Tip Included: ${tipAmount}</Text>
                    </Section>
                )}
                <Section style={btnContainer}>
                    <Link style={button} href={dashboardUrl}>
                        Go to Dashboard
                    </Link>
                </Section>
                <Hr style={hr} />
                <Text style={footer}>Provided by Twilight Fringe</Text>
            </Container>
        </Body>
    </Html>
);

export default CreatorAlertEmail;

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

const tipBox = {
    backgroundColor: "#e6fffa",
    borderRadius: "4px",
    padding: "16px",
    marginBottom: "24px",
    border: "1px solid #38b2ac",
    textAlign: "center" as const,
};

const tipText = {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#2c7a7b",
    margin: "0",
};

const btnContainer = {
    textAlign: "center" as const,
    marginTop: "32px",
    marginBottom: "32px",
};

const button = {
    backgroundColor: "#ff5757",
    borderRadius: "3px",
    color: "#fff",
    fontSize: "16px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "12px 24px",
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
