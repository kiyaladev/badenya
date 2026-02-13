import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Badenya API Documentation',
    version,
    description: 'API documentation for Badenya - Collaborative Financial Management Platform',
    contact: {
      name: 'Badenya Team',
      email: 'support@badenya.app',
    },
    license: {
      name: 'ISC',
    },
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:5000',
      description: 'Development server',
    },
    {
      url: 'https://api.badenya.app',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error',
          },
          message: {
            type: 'string',
            example: 'An error occurred',
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'success',
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          firstName: {
            type: 'string',
            example: 'John',
          },
          lastName: {
            type: 'string',
            example: 'Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com',
          },
          phone: {
            type: 'string',
            example: '+221701234567',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            example: 'user',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Group: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          name: {
            type: 'string',
            example: 'Family Savings',
          },
          description: {
            type: 'string',
            example: 'Monthly family savings group',
          },
          type: {
            type: 'string',
            enum: ['tontine', 'saving', 'investment', 'loan'],
            example: 'tontine',
          },
          contributionAmount: {
            type: 'number',
            example: 10000,
          },
          frequency: {
            type: 'string',
            enum: ['weekly', 'monthly', 'custom'],
            example: 'monthly',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'archived'],
            example: 'active',
          },
          balance: {
            type: 'number',
            example: 50000,
          },
          members: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                },
                role: {
                  type: 'string',
                  enum: ['admin', 'treasurer', 'member'],
                },
                joinedAt: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
          createdBy: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          groupId: {
            type: 'string',
          },
          userId: {
            type: 'string',
          },
          type: {
            type: 'string',
            enum: ['contribution', 'withdrawal', 'loan', 'repayment', 'expense', 'other'],
            example: 'contribution',
          },
          amount: {
            type: 'number',
            example: 10000,
          },
          description: {
            type: 'string',
            example: 'Monthly contribution',
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            example: 'completed',
          },
          attachments: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Proposal: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          groupId: {
            type: 'string',
          },
          createdBy: {
            type: 'string',
          },
          title: {
            type: 'string',
            example: 'Purchase new equipment',
          },
          description: {
            type: 'string',
            example: 'Proposal to purchase new farming equipment',
          },
          amount: {
            type: 'number',
            example: 100000,
          },
          category: {
            type: 'string',
            enum: ['expense', 'investment', 'loan', 'other'],
            example: 'expense',
          },
          status: {
            type: 'string',
            enum: ['active', 'approved', 'rejected', 'expired'],
            example: 'active',
          },
          deadline: {
            type: 'string',
            format: 'date-time',
          },
          votesFor: {
            type: 'number',
            example: 5,
          },
          votesAgainst: {
            type: 'number',
            example: 2,
          },
          votesAbstain: {
            type: 'number',
            example: 1,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          userId: {
            type: 'string',
          },
          type: {
            type: 'string',
            enum: [
              'group_invite',
              'member_joined',
              'contribution_received',
              'payment_reminder',
              'vote_created',
              'vote_reminder',
              'vote_closed',
              'proposal_approved',
              'proposal_rejected',
              'system',
            ],
            example: 'contribution_received',
          },
          title: {
            type: 'string',
            example: 'Contribution received',
          },
          message: {
            type: 'string',
            example: 'Your contribution of 10000 XOF has been received',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            example: 'medium',
          },
          read: {
            type: 'boolean',
            example: false,
          },
          data: {
            type: 'object',
            additionalProperties: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Auth',
      description: 'Authentication and authorization endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Groups',
      description: 'Group/Tontine management endpoints',
    },
    {
      name: 'Transactions',
      description: 'Transaction management endpoints',
    },
    {
      name: 'Proposals',
      description: 'Proposal and voting endpoints',
    },
    {
      name: 'Votes',
      description: 'Voting endpoints',
    },
    {
      name: 'Notifications',
      description: 'Notification endpoints',
    },
    {
      name: 'Reports',
      description: 'Reporting and analytics endpoints',
    },
  ],
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts',
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
