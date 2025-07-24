# Quikpik Shipment Management System

A sophisticated multi-tenant shipping platform that manages shipments between ShipStation and multiple carriers (Quikpik via Jiayou API, FedEx, USPS) with integrated prepaid wallet system and comprehensive tracking.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [User Guide](#user-guide)
  - [Master Admin](#master-admin)
  - [Client Users](#client-users)
- [Wallet System](#wallet-system)
- [API Integrations](#api-integrations)
- [Common Operations](#common-operations)
- [Troubleshooting](#troubleshooting)

## Overview

Quikpik is a full-stack web application that streamlines shipping operations by:
- Importing orders from ShipStation
- Creating shipments through multiple carriers
- Managing prepaid wallets for automatic payment
- Tracking shipments in real-time
- Providing batch rate comparisons across carriers

## Features

### Core Features
- **Multi-tenant Architecture**: Organizations with multiple users and role-based access
- **ShipStation Integration**: Automatic order import and synchronization
- **Multi-Carrier Support**: Quikpik (via Jiayou), FedEx, and USPS integration
- **Prepaid Wallet System**: Automatic payment deduction with transaction history
- **Batch Operations**: Create multiple shipments and compare rates in bulk
- **Real-time Tracking**: Monitor shipment status with carrier updates
- **Label Customization**: Automatic logo removal and tracking number formatting

### User Roles
- **Master Admin**: Full system access, manage organizations, add wallet credits
- **Client Users**: Access own organization's orders, create shipments, view wallet balance

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL database
- API credentials for:
  - ShipStation (API Key and Secret)
  - Jiayou/Quikpik (API credentials)
  - FedEx (optional - Client ID, Secret, Account Number)
  - USPS (optional - User ID)

## Setup Instructions

### 1. Environment Variables

Create a `.env` file with the following required variables:

```bash
# Database
DATABASE_URL=your_postgresql_connection_string

# ShipStation API
SHIPSTATION_API_KEY=your_shipstation_api_key
SHIPSTATION_API_SECRET=your_shipstation_api_secret

# Session Secret (generate a random string)
SESSION_SECRET=your_random_session_secret
```

### 2. Database Setup

The system will automatically create the required tables on first run. Key tables include:
- `organizations` - Multi-tenant organizations
- `users` - User accounts with bcrypt passwords
- `orders` - Orders imported from ShipStation
- `wallets` - Prepaid wallet balances
- `wallet_transactions` - Transaction history

### 3. Running the Application

```bash
# Install dependencies (handled automatically by Replit)
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5000`

## User Guide

### Default Login Credentials

**Master Admin:**
- Email: `rajan@quikpik.io`
- Password: `demo123`

**Demo Client:**
- Email: `demo@client.com`
- Password: `demo123`

### Master Admin

As a master admin, you can:

1. **Manage Organizations**
   - Navigate to Settings → Organizations
   - Create new organizations with initial users
   - Edit organization details
   - Delete organizations (cascades all related data)

2. **Manage User Accounts**
   - Navigate to Settings → Users
   - Create users for any organization
   - Reset passwords
   - Change user roles

3. **Add Wallet Credits**
   - Go to any organization's wallet in Settings
   - Use "Add Credits" form to add funds
   - Credits appear immediately in wallet balance

4. **View System Analytics**
   - Dashboard shows system-wide metrics
   - Revenue and profit tracking (master admin only)
   - Organization performance comparison

### Client Users

As a client user, you can:

1. **Import Orders from ShipStation**
   - Click "Sync Orders from ShipStation" on Orders page
   - System imports new orders and updates existing ones
   - Orders appear with customer details and items

2. **Create Shipments**
   - Select an order and click "Ship"
   - Enter package weight and dimensions
   - Choose carrier (Quikpik, FedEx, or USPS)
   - System checks wallet balance before creating shipment
   - Label is generated automatically

3. **Batch Rate Comparison**
   - Select multiple orders
   - Click "Get Batch Rates"
   - Compare prices across carriers
   - Create all shipments with selected carrier

4. **Track Shipments**
   - Click on tracking number in orders table
   - View real-time tracking updates
   - Public tracking page available for customers

5. **Manage Wallet**
   - View balance in Settings → Wallet
   - See bank transfer instructions for adding funds
   - View transaction history with tracking details

## Wallet System

### How It Works

1. **Adding Funds**
   - Bank Transfer: Send ACH payment to provided bank details
   - Processing Time: 2-3 hours for funds to appear
   - Master Admin: Can add credits instantly

2. **Bank Transfer Details**
   - Beneficiary: Radius Platforms Inc.
   - Account Number: 8334837632
   - ACH Routing: 026073150
   - Bank: Community Federal Savings Bank
   - Address: 5 Penn Plaza, 14th Floor, New York, NY 10001

3. **Automatic Deduction**
   - Quikpik shipments deduct $3.99 per shipment
   - Insufficient balance prevents shipment creation
   - Full transaction history maintained

### Transaction History

Each transaction records:
- Type (credit/debit)
- Amount
- Balance before/after
- Description with order/tracking details
- Timestamp

## API Integrations

### ShipStation

The system connects to ShipStation to:
- Import orders with "awaiting_shipment" status
- Update orders with tracking information
- Sync customer and shipping details

### Quikpik (via Jiayou)

Quikpik shipping features:
- US domestic shipping only (US001 channel)
- Standard service type
- Automatic address validation
- PO Box detection and rejection
- Zone-based pricing

### FedEx

FedEx integration supports:
- Ground and Express services
- Real-time rate quotes
- Direct label generation
- Tracking updates

### USPS

USPS integration provides:
- Priority Mail and Ground Advantage
- Rate calculations
- Tracking services

## Common Operations

### Creating a Single Shipment

1. Go to Orders page
2. Find pending order
3. Click "Ship" button
4. Enter weight (oz) and dimensions (inches)
5. Select carrier
6. Confirm shipment creation
7. Print label

### Batch Shipment Creation

1. Select multiple orders using checkboxes
2. Click "Selected Orders → Get Batch Rates"
3. Enter weight/dimensions for each order
4. Compare rates across carriers
5. Select preferred carrier
6. Create all shipments at once

### Adding Funds to Wallet

**For Clients:**
1. Go to Settings → Wallet
2. Note bank transfer details
3. Send ACH payment
4. Wait 2-3 hours for processing

**For Master Admin:**
1. Navigate to organization's wallet
2. Enter credit amount
3. Add description
4. Click "Add Credits"

### Tracking Shipments

1. Click tracking number in orders table
2. View tracking history
3. Share public tracking link with customers

## Troubleshooting

### Common Issues

**"Insufficient wallet balance"**
- Check wallet balance in Settings
- Add funds via bank transfer or ask master admin

**"Postal code not supported"**
- Quikpik doesn't service all ZIP codes
- Try alternative carrier (FedEx/USPS)

**"Address is a PO Box"**
- Quikpik requires street addresses
- Update customer address in ShipStation

**Orders not importing**
- Verify ShipStation API credentials
- Check orders have "awaiting_shipment" status
- Ensure store is connected in ShipStation

**Label not printing**
- Pop-up blockers may prevent label window
- Check browser downloads folder
- Try different browser if issues persist

### Error Messages

- **"User organization not found"**: Re-login to refresh session
- **"Reference number too long"**: System issue, contact support
- **"Price field missing"**: System issue, will retry automatically

## Support

For technical issues or questions:
- Master admins: Contact system administrator
- Client users: Contact your organization's master admin
- API issues: Check carrier documentation or contact carrier support

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- JavaScript enabled
- Pop-ups allowed for label printing

---

Built with React, Express, PostgreSQL, and integrated with ShipStation, Jiayou, FedEx, and USPS APIs.