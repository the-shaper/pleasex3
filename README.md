## Project Overview

This is a creator queue management system where people can submit tickets for personal or priority favors. The system features:

- Dual queue system (personal and priority)
- 3:1 priority:personal ratio in main queue
- Real-time queue updates
- Creator dashboard for ticket management
- Tip-based priority system

## Architecture

### Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Convex for database and serverless functions
- **Styling**: Tailwind CSS v4
- **Authentication**: Clerk (planned for future implementation)
- **Testing**: Vitest + Playwright

### Key Features

- Creator pages with queue cards
- Ticket submission with dynamic queue switching
- Real-time queue position updates
- Approval/rejection workflow
- Dashboard with filtering and search

## Documentation Structure

### Architecture Documents

- [`architecture/data-model.md`](architecture/data-model.md) - Database schema and relationships
- [`architecture/ui-migration-strategy.md`](architecture/ui-migration-strategy.md) - UI component migration plan
- [`architecture/convex-functions.md`](architecture/convex-functions.md) - Backend functions specification
- [`architecture/api-endpoints-dataflow.md`](architecture/api-endpoints-dataflow.md) - API documentation and data flow

### Implementation Plans

- [`implementation/creator-page-plan.md`](implementation/creator-page-plan.md) - Creator page implementation
- [`implementation/ticket-submission-plan.md`](implementation/ticket-submission-plan.md) - Ticket submission flow
- [`implementation/dashboard-plan.md`](implementation/dashboard-plan.md) - Creator dashboard
- [`implementation/ticket-approval-workflow.md`](implementation/ticket-approval-workflow.md) - Approval workflow
- [`implementation/main-queue-algorithm.md`](implementation/main-queue-algorithm.md) - Queue algorithm implementation
- [`implementation/notification-system-plan.md`](implementation/notification-system-plan.md) - Notification system (future)
- [`implementation/testing-strategy.md`](implementation/testing-strategy.md) - Testing approach

## Migration Strategy

### Phase 1: Foundation

1. Set up Convex integration
2. Define schema and basic functions
3. Migrate global styles and layout
4. Set up testing infrastructure

### Phase 2: Core Features

1. Implement creator page with queue cards
2. Build ticket submission flow
3. Create approval workflow
4. Add real-time updates

### Phase 3: Advanced Features

1. Build creator dashboard
2. Implement main queue algorithm
3. Add filtering and search
4. Performance optimization

### Phase 4: Polish & Testing

1. Comprehensive testing
2. Mobile responsiveness
3. Accessibility improvements
4. Documentation

## Getting Started

### Prerequisites

- Node.js 18+
- Convex account
- (Future) Clerk account for authentication

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pleasex3

# Install dependencies
pnpm install

# Set up Convex
npx convex dev

# Run development server
pnpm dev
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CONVEX_DEPLOYMENT=your_convex_deployment
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Key Components

### UI Components (from ui-backup/)

- `QueueCard.tsx` - Queue display with tip selection
- `SubmitClient.tsx` - Ticket submission form
- `TicketApprovalCard.tsx` - Dashboard approval interface
- `globals.css` - Global styles and theme

### Convex Functions

- Creator management
- Ticket operations
- Queue algorithm
- Real-time subscriptions

## Data Model

### Core Tables

- **creators** - Creator profiles and settings
- **tickets** - Ticket submissions and metadata
- **queueStates** - Queue metrics and main queue ordering

### Key Relationships

- Creator has many tickets
- Tickets belong to exactly one queue type
- Queue state tracks metrics for each creator

## Queue Algorithm

The main queue maintains a 3:1 priority:personal ratio:

1. Separate approved tickets by queue type
2. Interleave following 3 priority, 1 personal pattern
3. Maintain original order within each type
4. Dynamically recalculate positions

## Testing Strategy

### Test Types

- **Unit Tests** (70%) - Component and function testing
- **Integration Tests** (20%) - API and data flow testing
- **E2E Tests** (10%) - Full user journey testing

### Tools

- Vitest for unit/integration tests
- Playwright for E2E tests
- Convex test utilities for backend testing

## Future Enhancements

### Planned Features

- Clerk authentication integration
- Email notification system
- Analytics and reporting
- Mobile app
- Advanced queue management

### Performance Improvements

- Queue position caching
- Optimized real-time subscriptions
- Image/file uploads
- Rate limiting

## Contributing

1. Follow the established architecture patterns
2. Write tests for new features
3. Update documentation
4. Ensure mobile responsiveness
5. Check accessibility compliance

## Deployment

### Development

```bash
npx convex dev
pnpm dev
```

### Production

```bash
npx convex deploy
pnpm build
pnpm start
```

## Support

For questions about the implementation:

1. Check the relevant documentation files
2. Review the architecture documents
3. Examine the implementation plans
4. Review the testing strategy

## License

[Add your license information here]
