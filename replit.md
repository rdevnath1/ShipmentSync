# Jiayou Shipment Management System

## Overview

This is a full-stack web application built with React and Express that manages shipments between ShipStation and Jiayou. The system allows users to import orders from ShipStation, create shipments with Jiayou, and track the shipping process. It features a modern UI built with shadcn/ui components and uses PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Pattern**: RESTful API with typed routes
- **Development**: Hot reloading with Vite middleware integration

## Key Components

### Database Schema
- **Users**: Basic user authentication table
- **Orders**: Store orders imported from ShipStation with customer and shipping details
- **Shipments**: Track shipments created with Jiayou, linked to orders
- **Tracking Events**: Log tracking updates and status changes

### API Integration Services
- **ShipStation Service**: Pull orders from ShipStation API
- **Jiayou Service**: Create shipments and generate shipping labels
- **Storage Layer**: Abstracted database operations with type safety

### UI Components
- **Dashboard**: Overview with stats cards and recent activity
- **Order Management**: Import and view orders from ShipStation
- **Shipment Creation**: Modal-based workflow for creating shipments
- **Tracking**: Real-time shipment status monitoring

## Data Flow

1. **Order Import**: Users pull orders from ShipStation API, which are stored in the database
2. **Shipment Creation**: Orders can be converted to shipments using Jiayou API
3. **Status Updates**: Tracking events are logged and displayed in real-time
4. **Dashboard Analytics**: Aggregated data is displayed on the dashboard

## Recent Changes

### ShipStation Integration Fix (July 14, 2025)
- **Mark as Shipped Implementation**: Replaced updateOrderWithTracking with ShipStation's mark as shipped API
- **Custom Carrier Support**: Using "jiayou" as carrier code for proper tracking integration
- **Label URL Integration**: Passing Jiayou label URLs to ShipStation for direct printing
- **Automatic Tracking Push**: System now automatically pushes tracking numbers to ShipStation on shipment creation
- **Manual Sync Endpoint**: Added `/api/shipments/:id/mark-shipped` for manual ShipStation updates
- **SUCCESSFUL RESULT**: ShipStation now receives tracking numbers and can print Jiayou labels directly

### ChatGPT O3 Fixes Implementation (July 13, 2025)
- **Hub Injection**: Added fromAddressId "JFK" for US001 channel hub injection
- **US Shipper Address**: Updated to JFK Airport fulfillment center with NY postal code 11430
- **Weight Conversion**: Implemented proper ounces to kg conversion with 3 decimal precision
- **Address Verification**: Added pre-shipment address verification API call
- **Unique Reference Numbers**: Generated unique references with timestamp and random strings
- **SUCCESSFUL RESULT**: System now creates shipments successfully with tracking numbers

### API Integration Fixes (July 13, 2025)
- Fixed critical payload formatting for Jiayou API compliance
- Corrected shipper address from US to China (CN) as required by documentation
- Removed optional fields (shipMode, returnLabel) that were causing issues
- Updated phone number formats and address structure
- System now sends properly formatted requests that match API documentation exactly

### Color Scheme Update (July 13, 2025)
- Updated the entire application's color palette to match the provided logo
- Primary color changed to dark teal/slate: `hsl(210, 24%, 16%)`
- Integrated the company logo into the sidebar navigation
- Updated both light and dark theme variants to maintain consistency
- Modified scrollbar colors and background tones to complement the new brand identity

## External Dependencies

### Third-Party APIs
- **ShipStation API**: Source for order data and customer information
- **Jiayou API**: Shipping service for creating labels and tracking

### Database
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Drizzle ORM**: Type-safe database queries with schema migrations

### UI Framework
- **shadcn/ui**: Pre-built accessible components
- **Radix UI**: Headless UI primitives for complex interactions
- **Tailwind CSS**: Utility-first styling with custom design system

## Deployment Strategy

### Development Environment
- **Local Development**: Uses Vite dev server with Express middleware
- **Hot Reloading**: Full-stack TypeScript compilation and reloading
- **Environment Variables**: Database URL and API keys managed through .env

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild compiles TypeScript to ES modules
- **Database**: Automatic migrations using Drizzle Kit
- **Deployment**: Single Node.js process serving both API and static files

### Configuration
- **TypeScript**: Shared configuration for client, server, and shared code
- **Path Aliases**: Simplified imports with @ prefixes
- **Build Scripts**: Automated build and deployment pipeline