# Badenya Backend API Documentation

## Overview
This is the backend API for Badenya, a collaborative financial management platform for tontines and savings groups.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-Validator

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- MongoDB instance (local for development, personal server for production)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Required:
# - MONGODB_URI
# - JWT_SECRET
# - JWT_REFRESH_SECRET
```

### Running the Server

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+221771234567",
  "password": "securepassword123"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

#### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <access_token>
```

#### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "John Updated",
  "phone": "+221771234567",
  "avatar": { "url": "...", "publicId": "..." }
}
```

#### Change Password
```http
PUT /auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

#### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "newsecurepassword"
}
```

### Group Endpoints

All group endpoints require authentication.

#### Create Group
```http
POST /groups
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Family Savings",
  "description": "Monthly family contributions",
  "type": "tontine",
  "settings": {
    "isPrivate": true,
    "allowMemberProposals": true
  },
  "contributionSettings": {
    "frequency": "monthly",
    "amount": 10000
  },
  "votingRules": {
    "quorum": 60,
    "approvalThreshold": 50,
    "votingDuration": 72
  }
}
```

#### Get User's Groups
```http
GET /groups
Authorization: Bearer <access_token>
```

#### Get Group by ID
```http
GET /groups/:id
Authorization: Bearer <access_token>
```

#### Update Group
```http
PUT /groups/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Group Name",
  "description": "Updated description"
}
```

#### Archive Group
```http
DELETE /groups/:id
Authorization: Bearer <access_token>
```

#### Add Member to Group
```http
POST /groups/:id/members
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "userId": "user_id_to_add",
  "role": "member"
}
```

#### Remove Member from Group
```http
DELETE /groups/:id/members/:userId
Authorization: Bearer <access_token>
```

#### Update Member Role
```http
PUT /groups/:id/members/:userId/role
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role": "treasurer"
}
```

### Transaction Endpoints

#### Create Transaction
```http
POST /groups/:groupId/transactions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "contribution",
  "amount": 10000,
  "description": "Monthly contribution",
  "category": "regular",
  "paymentMethod": "mobile_money"
}
```

#### Get Group Transactions
```http
GET /groups/:groupId/transactions?type=contribution&status=pending&limit=50&skip=0
Authorization: Bearer <access_token>
```

#### Get Transaction by ID
```http
GET /transactions/:id
Authorization: Bearer <access_token>
```

#### Verify Transaction (Admin/Treasurer only)
```http
PUT /transactions/:id/verify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "notes": "Verified payment receipt"
}
```

#### Cancel Transaction
```http
DELETE /transactions/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Duplicate payment"
}
```

### Proposal Endpoints

#### Create Proposal
```http
POST /groups/:groupId/proposals
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Purchase new equipment",
  "description": "We need to buy new equipment for the project",
  "category": "investment",
  "amount": 50000,
  "priority": "medium"
}
```

#### Get Group Proposals
```http
GET /groups/:groupId/proposals?status=pending&category=investment
Authorization: Bearer <access_token>
```

#### Get Proposal by ID
```http
GET /proposals/:id
Authorization: Bearer <access_token>
```

#### Cast Vote on Proposal
```http
POST /proposals/:id/vote
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "vote": "for",
  "comment": "I support this proposal"
}
```

#### Close Proposal (Admin/Treasurer only)
```http
PUT /proposals/:id/close
Authorization: Bearer <access_token>
```

#### Execute Proposal (Admin/Treasurer only)
```http
POST /proposals/:id/execute
Authorization: Bearer <access_token>
```

### Vote Endpoints

#### Create Vote in Group
```http
POST /groups/:groupId/votes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Should we organize a year-end party?",
  "description": "Vote on whether to use group funds for an end-of-year celebration",
  "type": "quorum",
  "quorumPercentage": 60,
  "options": [
    { "label": "Yes, organize the party" },
    { "label": "No, save the funds" },
    { "label": "Postpone to next year" }
  ],
  "endDate": "2024-12-31T23:59:59Z",
  "allowChangeVote": true,
  "anonymousVoting": false,
  "showIntermediateResults": true
}
```

#### Get Group Votes
```http
GET /groups/:groupId/votes?status=active
Authorization: Bearer <access_token>
```

Query parameters:
- `status` (optional): Filter by status (pending, active, closed, executed)

#### Get Vote Details
```http
GET /votes/:id
Authorization: Bearer <access_token>
```

#### Cast Vote
```http
POST /votes/:id/cast
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "optionId": "option_1",
  "comment": "I think this is a good idea"
}
```

#### Close Vote
```http
PUT /votes/:id/close
Authorization: Bearer <access_token>
```

Note: Only the vote creator or group admin can close a vote.

#### Delete Vote
```http
DELETE /votes/:id
Authorization: Bearer <access_token>
```

Note: Only the vote creator can delete. Votes with cast votes cannot be deleted.

## Data Models

### User
- fullName
- email (unique)
- phone (unique, optional)
- password (hashed)
- avatar
- preferences (language, currency, notifications, theme)
- refreshTokens
- emailVerificationToken
- passwordResetToken
- lastLoginAt
- deviceTokens

### Group
- name
- description
- type (tontine, association, family, friends, project)
- currency
- balance
- targetAmount
- contributionSettings
- members (with roles: admin, treasurer, member)
- votingRules
- stats
- settings
- isActive

### Transaction
- groupId
- type (contribution, expense, refund, adjustment)
- amount
- description
- initiatedBy
- paymentMethod
- status (pending, completed, failed, cancelled)
- metadata
- attachments
- processedAt

### Proposal
- groupId
- title
- description
- amount
- category (loan, investment, charity, event, emergency, other)
- priority (low, medium, high, urgent)
- proposedBy
- votes (array of userId, decision, comment)
- votingDeadline
- status (pending, approved, rejected, expired, executed)
- result
- executedAt

### Vote
- groupId
- title
- description
- createdBy
- type (simple, quorum, unanimous)
- quorumPercentage
- options (id, label, votes count)
- votes (userId, optionId, comment, votedAt)
- startDate
- endDate
- status (pending, active, closed, executed)
- result (winningOptionId, totalVotes, participationRate, votesPerOption)
- allowChangeVote (boolean)
- anonymousVoting (boolean)
- showIntermediateResults (boolean)

### Notification Endpoints

#### Get User Notifications
Get all notifications for the authenticated user.

**Endpoint:** `GET /notifications`

**Authentication:** Required

**Query Parameters:**
- `limit` (optional, default: 50) - Number of notifications to return
- `skip` (optional, default: 0) - Number of notifications to skip for pagination
- `unreadOnly` (optional, default: false) - Return only unread notifications

**Response:**
```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "_id": "notification_id",
        "userId": "user_id",
        "type": "contribution_received",
        "title": "Contribution reçue",
        "message": "Nouvelle contribution de 5000 XOF reçue dans \"Tontine Famille\"",
        "data": {
          "groupId": "group_id",
          "amount": 5000
        },
        "isRead": false,
        "priority": "normal",
        "createdAt": "2025-10-10T08:00:00.000Z"
      }
    ],
    "count": 10,
    "total": 42,
    "unreadCount": 5
  }
}
```

#### Mark Notification as Read
Mark a specific notification as read.

**Endpoint:** `PUT /notifications/:id/read`

**Authentication:** Required

**Response:**
```json
{
  "status": "success",
  "message": "Notification marked as read",
  "data": {
    "notification": {
      "_id": "notification_id",
      "isRead": true,
      "readAt": "2025-10-10T08:30:00.000Z"
    }
  }
}
```

#### Mark All Notifications as Read
Mark all notifications for the authenticated user as read.

**Endpoint:** `PUT /notifications/mark-all-read`

**Authentication:** Required

**Response:**
```json
{
  "status": "success",
  "message": "All notifications marked as read",
  "data": {
    "modifiedCount": 5
  }
}
```

#### Delete Notification
Delete a notification.

**Endpoint:** `DELETE /notifications/:id`

**Authentication:** Required

**Response:**
```json
{
  "status": "success",
  "message": "Notification deleted successfully"
}
```

#### Send Notification
Send a notification to a user (internal use or admin).

**Endpoint:** `POST /notifications/send`

**Authentication:** Required

**Request Body:**
```json
{
  "userId": "user_id",
  "type": "contribution_received",
  "title": "Custom title",
  "message": "Custom message",
  "data": {
    "groupId": "group_id",
    "amount": 5000
  },
  "priority": "normal"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Notification sent successfully",
  "data": {
    "notification": {
      "_id": "notification_id",
      "userId": "user_id",
      "type": "contribution_received",
      "title": "Custom title",
      "message": "Custom message",
      "isRead": false,
      "priority": "normal",
      "createdAt": "2025-10-10T08:00:00.000Z"
    }
  }
}
```

#### Update Device Token
Register or update a device token for push notifications.

**Endpoint:** `POST /notifications/device-token`

**Authentication:** Required

**Request Body:**
```json
{
  "token": "fcm_device_token_here",
  "platform": "android" // or "ios"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Device token updated successfully"
}
```

#### Remove Device Token
Remove a device token (e.g., on logout).

**Endpoint:** `DELETE /notifications/device-token`

**Authentication:** Required

**Request Body:**
```json
{
  "token": "fcm_device_token_here"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Device token removed successfully"
}
```

### Notification Types
- `group_invitation` - User invited to join a group
- `member_joined` - New member joined a group
- `proposal_created` - New proposal created in a group
- `proposal_approved` - Proposal was approved
- `proposal_rejected` - Proposal was rejected
- `contribution_received` - Contribution received in a group
- `vote_reminder` - Reminder to vote on active votes
- `payment_reminder` - Reminder for upcoming payment
- `expense_executed` - Expense was executed
- `role_changed` - User's role in a group changed
- `group_archived` - Group was archived

### Report Endpoints

#### Get Group Financial Summary
Get comprehensive financial summary for a group.

**Endpoint:** `GET /groups/:groupId/reports/summary`

**Authentication:** Required

**Query Parameters:**
- `startDate` (optional) - ISO 8601 date string (e.g., "2025-01-01T00:00:00Z")
- `endDate` (optional) - ISO 8601 date string (e.g., "2025-12-31T23:59:59Z")

**Response:**
```json
{
  "success": true,
  "data": {
    "totalContributions": 250000,
    "totalExpenses": 100000,
    "totalRefunds": 5000,
    "netBalance": 155000,
    "transactionCount": 45,
    "contributionsByMember": [
      {
        "userId": "user_id",
        "userName": "John Doe",
        "amount": 50000,
        "count": 10
      }
    ],
    "expensesByCategory": [
      {
        "category": "Event",
        "amount": 40000,
        "count": 5
      }
    ]
  }
}
```

#### Generate PDF Report
Download a PDF report of group transactions and financial summary.

**Endpoint:** `GET /groups/:groupId/reports/pdf`

**Authentication:** Required

**Query Parameters:**
- `startDate` (optional) - ISO 8601 date string
- `endDate` (optional) - ISO 8601 date string

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="Group_Name_Report_2025-10-10.pdf"`
- Binary PDF file

**Report Contents:**
- Group information (name, type, currency)
- Financial summary (balance, contributions, expenses, transaction count)
- Contributions breakdown by member
- Expenses breakdown by category
- Transaction history (up to 100 most recent transactions)

#### Generate Excel Export
Download an Excel file with all group transactions.

**Endpoint:** `GET /groups/:groupId/reports/excel`

**Authentication:** Required

**Query Parameters:**
- `startDate` (optional) - ISO 8601 date string
- `endDate` (optional) - ISO 8601 date string

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="Group_Name_Transactions_2025-10-10.xlsx"`
- Binary Excel file

**Excel Columns:**
- Date
- Type (contribution, expense, refund, adjustment)
- Montant (amount)
- Devise (currency)
- Description
- Catégorie (category)
- Initiateur (initiator name)
- Email (initiator email)
- Méthode de paiement (payment method)
- Statut (status)

#### Get Monthly Report
Get automated monthly report data for a specific month.

**Endpoint:** `GET /groups/:groupId/reports/monthly/:year/:month`

**Authentication:** Required

**Path Parameters:**
- `year` - Four-digit year (e.g., 2025)
- `month` - Month number 1-12 (e.g., 10 for October)

**Response:**
```json
{
  "success": true,
  "data": {
    "groupId": "group_id",
    "period": {
      "month": 10,
      "year": 2025,
      "startDate": "2025-10-01T00:00:00.000Z",
      "endDate": "2025-10-31T23:59:59.999Z"
    },
    "summary": {
      "totalContributions": 50000,
      "totalExpenses": 20000,
      "totalRefunds": 1000,
      "netBalance": 31000,
      "transactionCount": 15,
      "contributionsByMember": [...],
      "expensesByCategory": [...]
    },
    "generatedAt": "2025-10-10T08:00:00.000Z"
  }
}
```

### Notification Model
- userId (ObjectId)
- type (NotificationType)
- title (string)
- message (string)
- data (object with groupId, proposalId, transactionId, amount, actionUrl)
- isRead (boolean)
- readAt (Date)
- priority (low, normal, high)
- createdAt (Date)
- expiresAt (Date, optional)

## Error Handling

All endpoints return errors in the following format:

```json
{
  "status": "error",
  "message": "Error message here",
  "errors": [ /* validation errors if any */ ]
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Security

### Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Password Requirements
- Minimum 8 characters
- Passwords are hashed using bcrypt

### Token Expiration
- Access tokens: 24 hours (configurable)
- Refresh tokens: 7 days (configurable)

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── group.controller.ts
│   │   ├── transaction.controller.ts
│   │   ├── proposal.controller.ts
│   │   ├── vote.controller.ts
│   │   ├── notification.controller.ts
│   │   └── report.controller.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── validation.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Group.ts
│   │   ├── Transaction.ts
│   │   ├── Proposal.ts
│   │   ├── Vote.ts
│   │   ├── Notification.ts
│   │   ├── Invitation.ts
│   │   ├── AIReport.ts
│   │   └── index.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── group.routes.ts
│   │   ├── transaction.routes.ts
│   │   ├── proposal.routes.ts
│   │   ├── vote.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── report.routes.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── crypto.ts
│   └── index.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Next Steps

- [x] Add notification endpoints
- [x] Add report endpoints (PDF, Excel, Monthly)
- [ ] Add invitation endpoints
- [ ] Add AI report endpoints
- [ ] Add payment integration
- [ ] Add file upload (stockage local)
- [ ] Add email service
- [x] Add push notifications (placeholder ready for Firebase)
- [ ] Add comprehensive tests
- [ ] Add API rate limiting
- [ ] Add request logging

## Support

For issues or questions, please contact the development team.
