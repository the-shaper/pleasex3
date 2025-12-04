"Please Please Please" Terms of Service Outline
This outline is structured to specifically protect a "Beta" product handling money via Stripe Connect with two distinct user types.

1. Preamble & The "Beta" Warning

Acceptance of Terms: By creating an account, you agree to these terms.

Beta/Proof of Concept Disclaimer: "Please Please Please is currently in a Beta/Proof of Concept phase. You acknowledge that the Service may contain bugs, errors, and other problems that could cause system failures. The Service is provided 'AS IS' and 'AS AVAILABLE' without warranties of any kind."

Data Integrity: "While we use robust databases (Convex), strictly for this Beta phase, we do not guarantee the permanent preservation of data, ticket history, or queue positions."

Contact Preservation: "Twilight Fringe, the producers of Please Please Please save your e-mail address and name/username for direct-communication purposes only. Should you want us to erase your information, please write to uncreate@twilightfringe.com with the subject line "uncreate me", containing references to the information you would like to erase. Twilight Fringe will never provide third parties access to its user's information"

2. Definitions
   Creator: The user receiving requests and managing the queue.

Friend: The user submitting requests.

Ticket: The specific request for a favor, task, or interaction.

The Queue: The algorithmic sorting mechanism (3:1 ratio) that determines Ticket visibility.

3. Terms for "Friends" (The Buyers/Requesters)
   Submission Integrity: Friends agree to submit only lawful requests. No harassment, spamming or illegal tasks.

The "Priority" Payment Structure (Authorize/Capture):

Authorization: "When you submit a Priority Ticket (if made available by Creator), you authorize a hold on your payment method via Stripe. This is not a charge."

Capture Condition: "You will only be financially charged if and when the Creator explicitly approves your Ticket."

Release of Funds: "If a Creator rejects your Ticket, or if the Ticket remains 'Open' for 3 days without approval, the authorization hold will be released. We are not responsible for overdraft fees resulting from these holds."

No Guarantee of Service: "Submission of a ticket—even a Priority Ticket—does not guarantee the Creator will accept or perform the task. Creators have full discretion to reject any request."

Refunds: "Once a Creator marks a Ticket as 'Approved' and the charge is captured, refunds are at the sole discretion of the Creator, not the Platform."

4. Terms for "Creators" (The Sellers)
   Stripe Connect Obligations: Creators must maintain a valid Stripe Connect account to receive payouts. The Platform is not responsible for failed payouts due to invalid Stripe accounts.

Fulfillment Responsibility: "By marking a Ticket as 'Approved', you agree to make a good-faith effort to fulfill the request. Repeated failure to fulfill 'Approved' (charged) tickets may result in account suspension."

Platform Fees: "The Platform retains a [X]% fee on all Priority Tickets. This fee is deducted automatically upon the capture of funds."

Taxes: Creators are solely responsible for reporting income to relevant tax authorities.

5. The Queue Algorithm (Managing Expectations)
   The Ratio: "The Queue utilizes an automated sorting algorithm designed to display Priority and Personal tickets at an approximate 3:1 ratio."

No Manipulation: Users agree not to attempt to reverse-engineer or manipulate the queue logic (e.g., spamming free tickets to flood the dashboard).

6. User-Generated Content (UGC) & IP
   The Request: Friends retain ownership of the text/media in their request but grant the Creator and Platform a license to view/process it.

The Deliverable:

Creator retains copyright of the work produced but grants the Friend a perpetual, non-exclusive license to use it for personal and commercial use.

7. Code of Conduct
   Account Security: Users are responsible for their Clerk login credentials.

Harassment: Zero tolerance for abuse in Ticket descriptions or Creator responses.

Ban Hammer: "We reserve the right to terminate any Creator or Friend account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users."

8. Limitation of Liability
   "In no event shall 'Please Please Please' be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits (for Creators) or loss of data."

"Our total liability to you for any claim arising out of the service is limited to the amount you paid the Service in the last 3 months."

---

## Implementation Plan

### 0. Plan Overview

- Create TOS modal component based on `readMeModal.tsx` structure
- Integrate TOS modal into Clerk sign-up flow
- Add TOS modal to ticket submission flow for friends/requesters
- Maintain existing email consent messaging in SubmitClient

### 1. Component Creation

- **File**: `src/components/general/tosModal.tsx`
  - Based on `readMeModal.tsx` structure and styling
  - Use markdown content from this document (formatted appropriately)
  - Same modal structure: fixed overlay, scrollable content, close button
  - Title: "Terms of Service"
- **File**: `src/components/general/tosModal.stories.tsx`
  - Follow pattern from `readMeModal.stories.tsx`
  - Include Interactive, Open, Closed, Scrollable stories

### 2. Clerk Sign-Up Integration

- **File**: `src/app/sign-up/[[...sign-up]]/page.tsx`
  - Add TOS modal state management
  - Use Clerk's `termsUrl` prop OR customize the terms link element
  - Since Clerk shows checkbox automatically when "legal compliance" is enabled, we need to:
    - Option A: Use `termsUrl` pointing to a route that opens modal (requires route)
    - Option B: Customize the link element via `appearance.elements` to trigger modal
  - **Recommended**: Create a `/terms` route that redirects/opens modal, or use JavaScript to intercept link clicks
  - **Better approach**: Add modal to page, use CSS/JS to intercept Clerk's terms link and open modal instead

### 3. SubmitClient Integration

- **File**: `src/app/[slug]/submit/SubmitClient.tsx`
  - Add TOS modal state
  - Add link/button near email consent checkbox: "View Terms of Service"
  - Keep existing text: "By submitting, you allow the creator to email you occasionally."
  - Add: "By submitting, you agree to our [Terms of Service]."
  - Make "Terms of Service" clickable to open modal

### 4. Content Formatting

- Convert outline format to markdown-friendly format
- Preserve structure (numbered sections, subsections)
- Ensure proper markdown rendering in ReactMarkdown component
