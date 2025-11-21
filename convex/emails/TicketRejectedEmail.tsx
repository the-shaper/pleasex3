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
} from "@react-email/components";
import * as React from "react";

interface TicketRejectedEmailProps {
    userName: string;
    ticketRef: string;
    creatorName: string;
}

export const TicketRejectedEmail = ({
    userName = "User",
    ticketRef = "REF-123",
    creatorName = "Creator",
}: TicketRejectedEmailProps) => (
    <Html>
        <Head />
        <Preview>Update on Request: {ticketRef}</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Please Please Please</Heading>
                <Text style={text}>Hi {userName},</Text>
                <Text style={text}>
                    Unfortunately, your request <strong>{ticketRef}</strong> for{" "}
                    <strong>{creatorName}</strong> could not be accepted at this time.
                </Text>
                <Section style={infoBox}>
                    <Text style={infoText}>Refund Status</Text>
                    <Text style={statusText}>Hold Released</Text>
                    <Text style={smallText}>
                        Any pending charges have been voided and will not appear on your
                        statement.
                    </Text>
                </Section>
                <Hr style={hr} />
                <Text style={footer}>Provided by Twilight Fringe</Text>
            </Container>
        </Body>
    </Html>
);

export default TicketRejectedEmail;

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

const infoBox = {
    backgroundColor: "#fff5f5",
    borderRadius: "4px",
    padding: "24px",
    marginBottom: "24px",
    border: "1px solid #fed7d7",
    textAlign: "center" as const,
};

const infoText = {
    fontSize: "14px",
    color: "#c53030",
    marginBottom: "8px",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
};

const statusText = {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#c53030",
    margin: "0 0 8px 0",
};

const smallText = {
    fontSize: "14px",
    color: "#718096",
    margin: "0",
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
