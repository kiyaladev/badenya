# Badenya API Documentation

## Overview

The Badenya API provides a comprehensive set of endpoints for managing collaborative financial groups (tontines), transactions, voting, and notifications.

## Base URL

- **Development:** `http://localhost:5000`
- **Production:** `https://api.badenya.app`

## Interactive Documentation

### Swagger UI

Access the interactive API documentation at:
- **Development:** http://localhost:5000/api/docs
- **Production:** https://api.badenya.app/api/docs

The Swagger UI provides:
- Complete API endpoint documentation
- Interactive request/response examples
- Try-it-out functionality to test endpoints
- Authentication support

### OpenAPI Specification

Download the OpenAPI specification (JSON format):
- http://localhost:5000/api/docs.json

## Authentication

Most endpoints require authentication using JWT (JSON Web Tokens).

### How to authenticate:

1. **Register or Login** to get access tokens:
   - `POST /api/v1/auth/register`
   - `POST /api/v1/auth/login`

2. **Use the access token** in the Authorization header:
   ```
   Authorization: Bearer <your-access-token>
   ```

3. **Refresh tokens** when they expire:
   - `POST /api/v1/auth/refresh-token`

### Token Lifetimes

- **Access Token:** 15 minutes
- **Refresh Token:** 7 days

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `PUT /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Groups (Tontines)
- `POST /api/v1/groups` - Create new group
- `GET /api/v1/groups` - Get user's groups
- `GET /api/v1/groups/:id` - Get group details
- `PUT /api/v1/groups/:id` - Update group (admin only)
- `DELETE /api/v1/groups/:id` - Archive group (admin only)
- `POST /api/v1/groups/:id/members` - Add member (admin/treasurer)
- `DELETE /api/v1/groups/:id/members/:userId` - Remove member (admin)
- `PUT /api/v1/groups/:id/members/:userId/role` - Update member role (admin)

### Transactions
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions/group/:groupId` - Get group transactions
- `GET /api/v1/transactions/:id` - Get transaction details
- `PUT /api/v1/transactions/:id` - Update transaction
- `PUT /api/v1/transactions/:id/status` - Update transaction status

### Proposals (Voting)
- `POST /api/v1/proposals` - Create proposal (admin)
- `GET /api/v1/proposals/group/:groupId` - Get group proposals
- `GET /api/v1/proposals/:id` - Get proposal details
- `PUT /api/v1/proposals/:id` - Update proposal (admin)
- `DELETE /api/v1/proposals/:id` - Delete proposal (admin)
- `POST /api/v1/proposals/:id/close` - Close voting (admin)

### Votes
- `POST /api/v1/votes` - Cast vote
- `GET /api/v1/votes/proposal/:proposalId` - Get proposal votes
- `GET /api/v1/votes/user/:proposalId` - Get user's vote on proposal
- `PUT /api/v1/votes/:id` - Update vote

### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

### Reports
- `GET /api/v1/reports/group/:groupId` - Get group report
- `GET /api/v1/reports/group/:groupId/pdf` - Download PDF report
- `GET /api/v1/reports/group/:groupId/excel` - Download Excel report

### Users (Admin Only)
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/search` - Search users
- `PUT /api/v1/users/:id/status` - Update user status

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    // Optional: Validation errors array
  ]
}
```

## Status Codes

- `200` - OK (Success)
- `201` - Created
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `409` - Conflict (Duplicate resource)
- `500` - Internal Server Error

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Limit:** 100 requests per 15 minutes per IP address
- **Response:** `429 Too Many Requests` when limit exceeded

## Data Models

### User
- `_id`: string (MongoDB ObjectId)
- `firstName`: string
- `lastName`: string
- `email`: string (unique)
- `phone`: string (unique)
- `role`: 'user' | 'admin'
- `avatar`: string (URL, optional)
- `status`: 'active' | 'inactive' | 'suspended'
- `createdAt`: Date
- `updatedAt`: Date

### Group
- `_id`: string
- `name`: string
- `description`: string (optional)
- `type`: 'tontine' | 'saving' | 'investment' | 'loan'
- `contributionAmount`: number
- `frequency`: 'weekly' | 'monthly' | 'custom'
- `status`: 'active' | 'inactive' | 'archived'
- `balance`: number
- `members`: Array of member objects
- `createdBy`: string (user ID)
- `createdAt`: Date
- `updatedAt`: Date

### Transaction
- `_id`: string
- `groupId`: string
- `userId`: string
- `type`: 'contribution' | 'withdrawal' | 'loan' | 'repayment' | 'expense' | 'other'
- `amount`: number
- `description`: string
- `status`: 'pending' | 'completed' | 'failed' | 'cancelled'
- `attachments`: Array of strings (URLs)
- `createdAt`: Date
- `updatedAt`: Date

### Proposal
- `_id`: string
- `groupId`: string
- `createdBy`: string (user ID)
- `title`: string
- `description`: string
- `amount`: number
- `category`: 'expense' | 'investment' | 'loan' | 'other'
- `status`: 'active' | 'approved' | 'rejected' | 'expired'
- `deadline`: Date
- `votesFor`: number
- `votesAgainst`: number
- `votesAbstain`: number
- `createdAt`: Date
- `updatedAt`: Date

### Vote
- `_id`: string
- `proposalId`: string
- `userId`: string
- `vote`: 'for' | 'against' | 'abstain'
- `comment`: string (optional)
- `createdAt`: Date
- `updatedAt`: Date

### Notification
- `_id`: string
- `userId`: string
- `type`: notification type enum
- `title`: string
- `message`: string
- `priority`: 'low' | 'medium' | 'high'
- `read`: boolean
- `data`: object (additional data)
- `createdAt`: Date

## Examples

### Register a new user
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+221701234567",
    "password": "SecurePass123!"
  }'
```

### Create a group
```bash
curl -X POST http://localhost:5000/api/v1/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Family Savings",
    "description": "Monthly family savings group",
    "type": "tontine",
    "contributionAmount": 10000,
    "frequency": "monthly"
  }'
```

### Get user's groups
```bash
curl -X GET http://localhost:5000/api/v1/groups \
  -H "Authorization: Bearer <your-token>"
```

## Testing with Swagger UI

1. Navigate to http://localhost:5000/api/docs
2. Click "Authorize" button at the top
3. Enter your access token in the format: `Bearer <your-token>`
4. Click "Authorize" to save
5. Try out any endpoint by clicking "Try it out"

## Support

For API support or bug reports:
- Email: support@badenya.app
- GitHub Issues: https://github.com/badenya/badenya/issues

## Version History

### v1.0.0 (Current)
- Initial API release
- Complete CRUD operations for all resources
- JWT authentication
- Role-based access control
- Swagger documentation
