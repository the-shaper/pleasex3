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
} from "@react-email/components";
import * as React from "react";

interface TicketReceiptEmailProps {
    userName: string;
    ticketRef: string;
    trackingUrl: string;
    creatorName: string;
    ticketType: string;
}

export const TicketReceiptEmail = ({
    userName = "User",
    ticketRef = "REF-123",
    trackingUrl = "https://pleasex3.com/tracking/REF-123",
    creatorName = "Creator",
    ticketType = "personal",
}: TicketReceiptEmailProps) => (
    <Html>
        <Head />
        <Preview>Ticket Receipt: {ticketRef}</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Please Please Please</Heading>
                <Text style={text}>Hi {userName},</Text>
                <Text style={text}>
                    Your request for <strong>{creatorName}</strong> has been received.
                </Text>
                <Section style={infoBox(ticketType)}>
                    <Text style={infoText}>Reference Number:</Text>
                    <Text style={refText}>{ticketRef}</Text>
                </Section>
                <Text style={text}>
                    You can track the status of your request using the link below:
                </Text>
                <Section style={btnContainer}>
                    <Link style={button} href={trackingUrl}>
                        Track Request
                    </Link>
                </Section>
                <Hr style={hr} />
                <Text style={footer}>Provided by Twilight Fringe</Text>
            </Container>
        </Body>
    </Html>
);

export default TicketReceiptEmail;

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

const infoBox = (ticketType: string) => ({
    backgroundColor: ticketType === "priority" ? "#dab67f" : "#d0ff94",
    borderRadius: "4px",
    padding: "24px",
    marginBottom: "24px",
    textAlign: "center" as const,
});

const infoText = {
    fontSize: "14px",
    color: "#666",
    marginBottom: "8px",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
};

const refText = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#000",
    margin: "0",
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

const hr = {
    borderColor: "#e6ebf1",
    margin: "20px 0",
};

const footer = {
    color: "#8898aa",
    fontSize: "12px",
    marginTop: "20px",
};
