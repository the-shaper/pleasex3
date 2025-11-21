## Tracking Number Plan

app/[slug]/page.tsx "I have a tracking button" needs its tracking page

app/[slug]/tracking/

for this we can either create a standalone page or a modal-based component, so that when "I have a tracking number" is clicked, it opens a modal with the tracking number input and a submit button. From there, it should show the submitted ticket with the same visual structure found in /[slug]/submit/success. We can either reuse ticketApprovalCreatorCard or create a new component.