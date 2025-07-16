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

### Manual Edit Shipment Feature (July 16, 2025)
- **Edit Shipment Modal**: Added comprehensive modal for editing existing shipments
- **Edit Button**: Added edit button to shipments table for easy access
- **Backend API**: Created PUT endpoint for updating shipment details
- **Form Validation**: Implemented validation for tracking number, weight, dimensions, and status
- **Status Management**: Users can update shipment status (created, shipped, in_transit, delivered, cancelled)
- **Weight & Dimensions**: Editable package details with proper validation
- **Channel Lock**: Channel code (US001) and service type (Standard) remain locked but visible
- **SUCCESSFUL RESULT**: Users can now manually edit shipments after creation with full validation

### PO Box Detection Implementation (July 15, 2025)
- **Smart PO Box Detection**: Added dual-layer PO Box detection for addresses and ZIP codes
- **User-Friendly Error Messages**: Converts Chinese Jiayou errors to clear English explanations
- **ZIP Code Intelligence**: Detects PO Box-only ZIP codes like 10008 and provides actionable guidance
- **Address Pattern Matching**: Identifies "P.O. Box" patterns in street addresses before API calls
- **Error Classification**: Distinguishes between PO Box issues, pricing problems, and genuine coverage gaps
- **Fixed False Positives**: Corrected logic to prevent regular ZIP codes from being misclassified as PO Box
- **SUCCESSFUL RESULT**: ZIP 10008 shows PO Box message, ZIP 96123 shows coverage error (not PO Box)

### Advanced Debugging Implementation (July 14, 2025)
- **Enhanced Error Logging**: Added raw Jiayou API error message logging to pinpoint exact failure causes
- **Improved Coverage Check**: Better error handling to distinguish between pricing issues and postal code problems
- **Increased Weight Default**: Changed from 5 oz to 8 oz (0.227 kg) to exceed Jiayou's 0.05 kg minimum requirement
- **Extended API Timeout**: Added 60-second timeout for better reliability with Jiayou API calls
- **Better Error Classification**: System now identifies specific error types (weight, pricing, coverage, etc.)
- **SUCCESSFUL RESULT**: Created shipment with tracking number GV25USA0U019511600 for postal code 11101

### Simplified Interface Update (July 14, 2025)
- **Removed Channel Selection**: Hardcoded US001 as the only shipping channel throughout the system
- **Removed Service Type Selection**: Hardcoded "Standard" as the only service type
- **Simplified UI**: Create shipment modal now shows disabled fields for channel (US001) and service type (Standard)
- **Backend Optimization**: All API endpoints now automatically use US001 without user selection
- **Improved User Experience**: Eliminated unnecessary choices to streamline the shipment creation process
- **SUCCESSFUL RESULT**: Clean, simple interface with US001 channel and Standard service hardcoded

### Postal Code Coverage Fix (July 14, 2025)
- **Fixed 500 Error**: Resolved ReferenceError where weight dimensions weren't properly destructured
- **Improved Weight Handling**: Changed default weight from 1 oz (0.028 kg) to 5 oz (0.142 kg) to meet Jiayou's minimum requirements
- **Better Error Messages**: System now shows actual Jiayou error messages instead of generic postal code errors
- **Enhanced Coverage Check**: Added proper postal code validation with real-time feedback
- **SUCCESSFUL RESULT**: Users now see exact error reasons and can make informed decisions about shipping compatibility

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