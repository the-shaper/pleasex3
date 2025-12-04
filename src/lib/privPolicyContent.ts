// Shared Privacy Policy content
export const PRIVACY_POLICY_CONTENT = `**Last Updated:** [December 3, 2025]

### **1. Introduction & Beta Warning**

- **Who We Are:** Please Please Please is a product operated by Twilight Fringe ("we", "us", or "our").
- **The "Beta" Clause:**  
  You acknowledge that this Service is in a Beta phase. We may periodically wipe data, logs, or user history to improve or re-architect the system. We do not guarantee the permanent retention of any data provided during this phase. The duration of the Beta phase is undefined and may change at any time.
- **Scope:**  
  This policy explains how we handle data for our two distinct user types: **Creators** (sellers) and **Friends** (buyers/supporters).

---

### **2. Information We Collect**

#### **A. Information Collected from All Users (via Clerk)**

- **Identity Data:** Name, email address, and profile picture (synced via Clerk).
- **Technical Data:** IP address, browser type, device information, and session metadata, automatically collected for security, debugging, and reliability purposes.

#### **B. Information Collected from "Friends" (Buyers)**

- **Ticket Content:**  
  The text, prompts, or media you submit in a Ticket or request.
  - **Important Notice:** Please do not submit highly sensitive personal information (such as government IDs, medical data, or financial details) in Ticket descriptions.
- **Payment Data:**  
  We do **not** store your credit card numbers.
  - **Stripe Handoff:** All payment data is processed and stored directly by Stripe. We retain only a payment token, transaction status (Authorized, Captured, Refunded), and basic transaction metadata required to operate the queue.

#### **C. Information Collected from "Creators" (Sellers)**

- **Financial Identity (via Stripe Connect):**  
  To facilitate payouts, we collect information required by Stripe, including bank account details and tax information.
  - **Storage Note:** This sensitive data is processed and stored within Stripe's secure environment. Please Please Please does not have access to full bank account numbers or tax documents.
- **Performance & Usage Data:**  
  We track data such as approval rates, response times, queue activity, and earnings to operate the service and display information in your Creator dashboard.

---

### **3. How We Use Your Data**

We use collected information for the following purposes:

- **To Operate the Queue:**  
  We use timestamps, payment status, and service rules to algorithmically sort and manage Tickets, including the 3:1 Priority-to-Personal ratio.
- **To Process Payments and Payouts:**  
  To authorize transactions, issue refunds, and distribute Creator earnings.
- **To Send Transactional Notifications (via Resend):**  
  We use your email address to send receipts, confirmations, approvals, rejections, and other service-related notifications.
- **To Debug and Improve the Beta:**  
  During this Proof-of-Concept phase, authorized developers may have limited access to database records (via Convex) to diagnose issues, fix bugs, and improve system performance and queue logic.
- **To Understand Product Usage:**  
  We may analyze aggregated or pseudonymous data to understand how users interact with the Service and to improve usability and reliability.

---

### **4. Third-Party Sub-processors**

The Service relies on the following third-party providers to operate:

- **Clerk** - **Purpose:** Authentication - **What They Process:** Email address, name, hashed passwords, and social login tokens
- **Stripe** - **Purpose:** Payments & Payouts - **What They Process:** Credit card data, bank account information, tax identifiers
- **Convex** - **Purpose:** Database & Backend Infrastructure - **What They Process:** Ticket content, user IDs, queue positions, timestamps
- **Resend** - **Purpose:** Transactional Email - **What They Process:** Email address and notification content
- **PostHog** - **Purpose:** Product Analytics - **What They Process:** Page views, click events, device and browser information, IP address, session metadata

---

### **5. Data Retention & Deletion**

- **Beta Data Wipes:**  
  We reserve the right to delete or reset all data during the Beta phase or during major system updates.
- **User-Initiated Deletion:**
  - **Friends:** You may request deletion of your account data. Certain records related to completed financial transactions may be retained for legally required periods (often up to seven years) for accounting, tax, or compliance purposes.
  - **Creators:** Creators must disconnect their Stripe account before full account deletion can be completed.
- **Backups:**  
  Residual copies of data may persist in backups for a limited period before being automatically purged.

---

### **6. Your Rights & Choices**

Depending on your location, you may have the following rights regarding your personal data:

- **Access:** Request a copy of the personal data we hold about you.
- **Correction:** Request correction of inaccurate or incomplete information.
- **Deletion:** Request deletion of your account and associated personal data, subject to legal and financial record-keeping obligations.
- **Objection & Opt-out:** Opt out of non-essential analytics or non-transactional communications. Transactional emails related to payments or account activity are required for service operation.

Requests can be made by contacting us at: **create@twilightfringe.com**

---

### **7. User-Generated Content (UGC) Privacy**

- **Visibility:**  
  Tickets and requests submitted by Friends are private between the Friend and the selected Creator and are not displayed publicly unless explicitly stated otherwise.
- **Creator Discretion:**  
  While we encourage Creators to respect the privacy of submissions, we cannot technically prevent a Creator from recording or capturing content (for example, via screenshots). Please submit requests with appropriate discretion.

---

### **8. Children's Privacy**

The Service is not intended for individuals under the age of 18. We do not knowingly collect personal data from minors. Because the Service involves financial transactions, you must be at least 18 years old to create an account or submit payments.

---

### **9. Contact Us**

If you have questions or requests regarding this Privacy Policy or our data practices, you can contact us at:

**create@twilightfringe.com**`;
