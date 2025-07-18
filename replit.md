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

### Jiayou Tracking API Resolution (July 17, 2025)
- **Official Documentation Review**: Analyzed V3.8 API documentation to find correct tracking endpoint
- **Correct Endpoint Found**: `/api/tracking/query/trackInfo` (not ChatGPT's `/api/orderNew/getTrackInfo`)
- **Authentication Fixed**: Only requires `apikey` header (not full auth headers)
- **Request Format Fixed**: Array of tracking numbers as POST body
- **Testing Confirmed**: Returns `{"code":1,"message":"success","data":[...]}` for valid tracking numbers
- **Empty Tracking Details**: Normal for new shipments - `fromDetail: []` until packages enter tracking system
- **Bulk Support**: API supports up to 100 tracking numbers per request
- **SUCCESSFUL RESULT**: Full shipment management system now working with both order creation and tracking

### Manual Order Creation Removal (July 16, 2025)
- **Removed Manual Order Creation**: Eliminated the ability to create manual orders from the dashboard
- **ShipStation-Only Workflow**: System now only accepts orders imported from ShipStation
- **Cleaned Up UI**: Removed "Create Manual Order" button from order table
- **Updated Descriptions**: Changed header text to reflect ShipStation-only workflow
- **Removed Backend Endpoint**: Deleted `/api/orders/manual` endpoint for security and simplicity
- **Streamlined User Experience**: Orders now have a clear single source of truth from ShipStation
- **SUCCESSFUL RESULT**: Clean workflow where all orders must come from ShipStation, eliminating manual data entry errors

### Dashboard UI Improvements (July 16, 2025)
- **Combined Integration Boxes**: Merged ShipStation and carrier integration into single "API Integration Status" card
- **Fixed Notifications**: Added working notification functionality with toast messages showing recent activity
- **Streamlined Order Actions**: Combined View/Edit buttons for pending orders; removed View button for shipped orders
- **Relocated API Status**: Moved API Integration Status card to bottom of dashboard for better content flow
- **Removed Quick Actions**: Eliminated redundant Quick Actions section to keep interface clean and focused
- **Enhanced UX**: Shipped orders now show "Edit Shipment" and "Print" buttons only, removing redundant View option
- **Added Tracking Links**: Added clickable tracking column in orders table that navigates to tracking page with pre-filled tracking number
- **URL Parameter Support**: Tracking page now supports ?track= parameter for direct tracking link navigation
- **SUCCESSFUL RESULT**: Cleaner, more intuitive dashboard with consolidated integration status and seamless tracking navigation

### Unified Orders Interface (July 16, 2025)
- **Single Orders Page**: Consolidated 3 separate tabs (Orders, Shipments, Labels) into one unified interface
- **Smart Filtering**: Added filter buttons for All, Pending, and Shipped orders with live counts
- **Contextual Actions**: Pending orders show Ship/View/Delete actions; Shipped orders show Edit/Print/View actions
- **Integrated Label Printing**: Print labels directly from shipped orders rather than separate page
- **Streamlined Navigation**: Removed redundant Shipments and Labels pages from sidebar
- **Database Unified**: All order data stored in single orders table; shipments are orders with tracking numbers
- **API Consistency**: Updated all endpoints to work with unified orders structure
- **SUCCESSFUL RESULT**: Clean, intuitive interface where orders naturally progress from pending to shipped

### Manual Edit Shipment Feature (July 16, 2025)
- **Edit Shipment Modal**: Added comprehensive modal for editing existing shipments
- **Edit Button**: Added edit button to shipments table for easy access
- **Backend API**: Created PUT endpoint for updating shipment details
- **Form Validation**: Implemented validation for tracking number, weight, dimensions, and status
- **Status Management**: Users can update shipment status (created, shipped, in_transit, delivered, cancelled)
- **Weight & Dimensions**: Editable package details with proper validation
- **Address Editing**: Added full shipping address editing capability with validation
- **Database Relations**: Enhanced shipment queries to include order data for address population
- **Channel Lock**: Channel code (US001) and service type (Standard) remain locked but visible
- **SUCCESSFUL RESULT**: Users can now manually edit shipments after creation with full validation including shipping addresses

### PO Box Detection Implementation (July 15, 2025)
- **Smart PO Box Detection**: Added dual-layer PO Box detection for addresses and ZIP codes
- **User-Friendly Error Messages**: Converts Chinese Jiayou errors to clear English explanations
- **ZIP Code Intelligence**: Detects PO Box-only ZIP codes like 10008 and provides actionable guidance
- **Address Pattern Matching**: Identifies "P.O. Box" patterns in street addresses before API calls
- **Error Classification**: Distinguishes between PO Box issues, pricing problems, and genuine coverage gaps
- **Fixed False Positives**: Corrected logic to prevent regular ZIP codes from being misclassified as PO Box
- **SUCCESSFUL RESULT**: ZIP 10008 shows PO Box message, ZIP 96123 shows coverage error (not PO Box)

### Automatic Dark Mode Implementation (July 16, 2025)
- **System Theme Detection**: Added automatic theme detection based on device display settings
- **ThemeProvider Component**: Created React context for theme management with system preference support
- **Theme Toggle Interface**: Added dropdown menu in sidebar with Light/Dark/System options
- **Responsive Theme Button**: Theme toggle adapts to mobile with proper touch targets
- **CSS Variables Integration**: All UI components use CSS variables for seamless theme switching
- **Persistent Theme Storage**: User preferences saved to localStorage with fallback to system
- **Real-time Theme Updates**: Theme changes instantly when user switches system dark/light mode
- **Mobile-First Design**: Theme toggle positioned at bottom of sidebar for easy access
- **SUCCESSFUL RESULT**: Application automatically switches between light/dark themes based on mobile display settings

### Mobile Responsive Design Implementation (July 16, 2025)
- **Responsive Sidebar**: Added collapsible mobile navigation with hamburger menu and overlay
- **Mobile-First Order Table**: Implemented card-based layout for mobile with touch-friendly buttons
- **Flexible Filter Buttons**: Orders page filters now stack vertically on mobile devices
- **Responsive Headers**: Optimized header spacing and text sizes for mobile screens
- **Touch-Friendly Controls**: Ensured 44px minimum touch targets for all interactive elements
- **Improved Input Fields**: Added proper font sizes to prevent zoom on mobile focus
- **Mobile Meta Tags**: Added viewport meta tag with proper mobile configuration
- **Adaptive Typography**: Scaled text sizes appropriately for iPhone 14 and Pro Max
- **SUCCESSFUL RESULT**: Application now fully responsive for iPhone 14 and Pro Max devices

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