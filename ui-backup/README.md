# UI Component Backup and Analysis

This document outlines the function and wiring of the custom UI components that have been backed up from the original project. The backend for these components, which was previously using Prisma/Supabase/Postgres, will be replaced with a Convex backend.

## Files

- `QueueCard.tsx`: A client-side component that displays details for a single queue (personal or priority).
- `SubmitClient.tsx`: A client-side component that provides the form for submitting a new ticket.
- `TicketApprovalCard.tsx`: A client-side component used in the creator's dashboard to approve or reject submitted tickets.
- `loading.tsx`: A loading state component for the creator's page.
- `page.tsx`: The landing page for the marketing site.
- `submit-page.tsx`: The server component wrapper for the ticket submission page.
- `globals.css`: The global stylesheet for the application.

---

## Component Analysis

### `QueueCard.tsx`

- **Function:** This component is responsible for rendering one of the two queue cards ("Personal" or "Priority") on the creator's main page. It displays key information about the queue, such as the current turn number, the next available ticket number, and the estimated time for a favor. It also includes an interactive section for users to set a tip amount.

- **Styling:**
  - The component uses Tailwind CSS for styling.
  - The background color of the card's accent elements is conditional, using `bg-gold` for the priority queue and `bg-greenlite` for the personal queue.
  - The font styles are explicitly set using custom CSS variables (`--font-body`, `--font-heading`).
  - The component has a responsive layout, with a grid for the main content and flexbox for arranging items within the card.

- **Wiring:**
  - This is a client component (`"use client";`).
  - It receives queue data (`data`), the creator's slug (`slug`), the kind of queue (`kind`), and the minimum priority tip amount (`minPriorityTipCents`) as props.
  - It uses the `useState` and `useMemo` hooks to manage the tip amount and to calculate the `href` for the "Claim Ticket" button.
  - The "Claim Ticket" button is a Next.js `<Link>` that navigates to the `/submit` page, passing the queue type and tip amount as query parameters.
  - The form for adjusting the tip amount is handled with local state and does not directly interact with the backend.

### `SubmitClient.tsx`

- **Function:** This component renders the form for submitting a new ticket. It collects the user's name, email, and other details, along with a description of their request. It also allows the user to switch between the "Personal" and "Priority" queues and to adjust their tip amount.

- **Styling:**
  - The component uses Tailwind CSS for styling.
  - The form inputs are standard styled input fields with borders and rounded corners.
  - The queue selection buttons change their background color based on the currently selected queue.
  - The layout is a two-column grid on medium screens and up, with the form on the left and a summary of the ticket on the right.

- **Wiring:**
  - This is a client component (`"use client";`).
  - It receives the creator's slug (`slug`) and initial queue data (`initialQueue`) as props.
  - It uses the `useSearchParams` hook to get the initial queue type and tip amount from the URL query parameters.
  - It uses the `useState` and `useEffect` hooks to manage the form data and to automatically switch the queue type based on the tip amount.
  - When the form is submitted, it sends a `POST` request to the `/api/tickets` endpoint with the form data.
  - The backend wiring for this component will be replaced. Instead of fetching from a Next.js API route, the form submission will trigger a Convex mutation.

### `TicketApprovalCard.tsx`

- **Function:** This component is used in the creator's dashboard to display a ticket that is awaiting approval. It shows the ticket details and provides "Approve" and "Reject" buttons.

- **Styling:**
  - The component uses Tailwind CSS for styling.
  - It's a simple card with a border and padding.
  - The "Approve" and "Reject" buttons are styled with different background colors.
  - The component displays a loading state on the buttons when an action is in progress.

- **Wiring:**
  - This is a client component (`"use "client";`).
  - It receives the `ticket` object as a prop.
  - It uses the `useState` hook to manage the loading and message states.
  - The "Approve" and "Reject" buttons trigger `fetch` requests to the `/api/tickets/[ref]/approve` and `/api/tickets/[ref]/reject` endpoints, respectively.
  - After a successful action, it reloads the page using `window.location.reload()`.
  - The backend wiring for this component will be replaced. The "Approve" and "Reject" buttons will trigger a Convex mutations that update the ticket's status in the database.

### `loading.tsx`

- **Function:** This component provides a skeleton loading state for the creator's page. It mimics the layout of the page with placeholder elements.

- **Styling:**
  - The component uses Tailwind CSS for styling.
  - It uses `bg-slate-200` to create the placeholder effect.

- **Wiring:**
  - This is a server component.
  - It is automatically rendered by Next.js in place of the `page.tsx` component when the data for the page is being fetched.

### `page.tsx` (marketing landing)

- **Function:** This is the main landing page for the marketing site. It contains a basic layout with a Next.js logo and links to the Next.js documentation.

- **Styling:**
  - The component uses Tailwind CSS for styling.
  - It uses a grid layout to center the content on the page.

- **Wiring:**
  - This is a server component.
  - It uses the `Image` component from `next/image` to display the Next.js and Vercel logos.

### `submit-page.tsx`

- **Function:** This is a server component that acts as a wrapper for the `SubmitClient` component. It fetches the initial queue data for the creator and passes it to the `SubmitClient` component.

- **Styling:**
  - This component does not have any direct styling.

- **Wiring:**
  - This is a server component.
  - It fetches data from the `/api/creators/${slug}/queue` endpoint.
  - It renders the `SubmitClient` component, passing the `slug` and `initialQueue` data as props.
  - The backend wiring for this component will be replaced. Instead of fetching from a Next.js API route, the data will be fetched from Convex.

### `globals.css`

- **Function:** This file contains the global styles for the application. It uses Tailwind's `@tailwind` directives to include the base, components, and utilities styles. It also defines custom CSS variables for fonts and colors.

- **Styling:**
  - It defines two custom fonts, `--font-heading` and `--font-body`, using `@font-face`.
  - It defines a color palette with names like `bg`, `text`, `coral`, `greenlite`, and `blue`.
  - It includes a `no-spinners` class to hide the number input spinners.

- **Wiring:**
  - This file is imported into the root layout of the Next.js application (`web/src/app/layout.tsx`).
  - The custom CSS variables defined in this file are used throughout the application's components.