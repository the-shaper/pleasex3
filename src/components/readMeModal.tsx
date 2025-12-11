"use client";

import ReactMarkdown from "react-markdown";
import { ButtonBase } from "./general/buttonBase";

export interface ReadMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  title?: string;
}

export function ReadMeModal({
  isOpen,
  onClose,
  className = "",
  title = "Cheatsheet",
}: ReadMeModalProps) {
  if (!isOpen) return null;

  const markdownContent = `# PLEASE PLEASE PLEASE!

## KEY TERMS:

### QUEUES

The queues are where the tickets are stored. There are two queues: the PERSONAL queue and the PRIORITY queue.

#### PERSONAL

People can ask you favors for free or for any tip under the amount you set for the Priority queue.

AVG TIME/FAVOR: You can set the "average" amount it takes you to complete a ticket in the QUEUE SETTINGS panel. The app calculates the estimated time it will take you to complete all tickets based on this, so your users can see how long it will take you to complete their ticket.

#### PRIORITY

People can ask you favors for any tip above the amount you set for this queue.

AVG TIME/FAVOR: You can set the "average" amount it takes you to complete a ticket in the QUEUE SETTINGS panel. The app calculates the estimated time it will take you to complete all tickets based on this, so your users can see how long it will take you to complete their ticket.

MINIMUM FEE: You can set the minimum fee for this queue in the QUEUE SETTINGS panel. This is the minimum amount of tip that a user can give you for a ticket in this queue.

#### GENERAL QUEUE

If you look at the list of "ACTIVE" "PAST" or "ALL" favors, you will see a "General" number. This number is the sum of all tickets, past and present, numbered by the time in which they were created. Only you can see this number. Ticket requesters only get to see their assigned ticket number per type of queue.

#### 3:1 HIERARCHY

By default, there is a 3:1 hierarchy in which tickets are automatically ordered. **Per every 3 Priority tickets served, 1 Personal ticket is served.**

Why? Because it's a way to motivate users and creators to use the Priority queue. The more you get done, the more you earn.

What if you want to change the hierarchy? For now, you can only turn off the Priority queue. 
If this feature is requested enough times, we will add it.

#### TICKET STATES

##### CURRENT: 
Current is the ticket at the top of your queue. You need to serve this ticket before you can serve the next one.

##### AWAITING FEEDBACK:
Awaiting feedback is a "limbo" for your ticket. You activate it by clicking the "Current" button on the TASK DETAILS panel. It means you have completed the task, but the user has not yet given you feedback or confirmed the completion of the task. 

##### NEXT UP:
Next up is the next ticket in line. This sets up automatically.

##### PENDING:
Pending is every ticket waiting to be served after the "Next-Up" ticket. This sets up automatically.





### EARNINGS

You can start monetizing your time by connecting your Stripe account. If you don't have one, we highly recommend you create one. It won't just be useful for this app, but for transacting as an independent creator via the internet in general.

This is not a shill for Stripe nor are we compensated in any way. Eventually we will add blockchain payment methods.


##### COMMISSIONS

We take a $3.33 per every $50 you make, and your payouts are scheduled at the end of every month.

**Important:** Stripe charges separate fees per transaction and the specific amount is dependent on the account's region. 

### A PROOF OF CONCEPT

This is a proof of concept and we are looking for feedback. Please please please let us know if you have any issues or suggestions drop us a line to create@twilightfringe.com with the subject 'PPP' or click the "contact us" button.
`;

  return (
    <div
      className="fixed inset-0 bg-black/50  backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-bg border-1 border-text-muted max-w-3xl w-full max-h-[90vh] flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex border-b-1 border-text-muted bg-gold">
          <div className="flex flex-row py-4 px-6 justify-between w-full">
            <h2 className="text-lg font-bold uppercase text-text">{title}</h2>
            {/* Close button */}
            <button
              onClick={onClose}
              className="top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-subtle hover:bg-text hover:text-bg transition-colors text-2xl leading-none"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 relative custom-scrollbar">
          {/* Markdown Content */}
          <div className="readme-content font-spaceMono text-sm text-text leading-relaxed">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-3xl md:text-4xl font-bold text-text mb-8 tracking-tighter">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl md:text-3xl font-bold text-text mt-8 mb-4 tracking-tight">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl md:text-2xl font-bold text-text mt-6 mb-3">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-lg md:text-xl font-bold text-text mt-4 mb-2">
                    {children}
                  </h4>
                ),
                h5: ({ children }) => (
                  <h5 className="text-base md:text-lg font-bold text-text mt-3 mb-2">
                    {children}
                  </h5>
                ),
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-coral">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-blue hover:text-blue-2 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>

          {/* Contact Button */}
          <div className="flex flex-col gap-3 mt-8">
            <ButtonBase
              variant="neutral"
              className="w-full bg-blue hover:bg-blue-2 hover:font-bold"
              href="mailto:create@twilightfringe.com?subject=PPP"
            >
              CONTACT US
            </ButtonBase>
          </div>
        </div>
      </div>
    </div>
  );
}
