import { ReportService } from '../../services/report.service';
import Transaction from '../../models/Transaction';

// Mock the models
jest.mock('../../models/Transaction');

describe('Report Service', () => {
  let reportService: ReportService;
  const mockGroupId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    reportService = new ReportService();
    jest.clearAllMocks();
  });

  describe('getGroupSummary', () => {
    it('should calculate summary for empty transactions', async () => {
      // Mock Transaction.find to return empty array
      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });
      (Transaction.find as jest.Mock) = mockFind;

      const summary = await reportService.getGroupSummary(mockGroupId);

      expect(summary).toBeDefined();
      expect(summary.totalContributions).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.totalRefunds).toBe(0);
      expect(summary.netBalance).toBe(0);
      expect(summary.transactionCount).toBe(0);
      expect(summary.contributionsByMember).toEqual([]);
      expect(summary.expensesByCategory).toEqual([]);
    });

    it('should calculate summary with contributions', async () => {
      const mockTransactions = [
        {
          type: 'contribution',
          amount: 100,
          initiatedBy: {
            _id: 'user1',
            firstName: 'John',
            lastName: 'Doe',
          },
          createdAt: new Date(),
        },
        {
          type: 'contribution',
          amount: 50,
          initiatedBy: {
            _id: 'user1',
            firstName: 'John',
            lastName: 'Doe',
          },
          createdAt: new Date(),
        },
      ];

      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTransactions),
      });
      (Transaction.find as jest.Mock) = mockFind;

      const summary = await reportService.getGroupSummary(mockGroupId);

      expect(summary.totalContributions).toBe(150);
      expect(summary.transactionCount).toBe(2);
      expect(summary.contributionsByMember.length).toBeGreaterThan(0);
    });

    it('should calculate summary with expenses', async () => {
      const mockTransactions = [
        {
          type: 'expense',
          amount: 75,
          category: 'food',
          initiatedBy: {
            _id: 'user1',
            firstName: 'John',
            lastName: 'Doe',
          },
          createdAt: new Date(),
        },
      ];

      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTransactions),
      });
      (Transaction.find as jest.Mock) = mockFind;

      const summary = await reportService.getGroupSummary(mockGroupId);

      expect(summary.totalExpenses).toBe(75);
      expect(summary.expensesByCategory.length).toBeGreaterThan(0);
    });

    it('should query only completed transactions', async () => {
      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });
      (Transaction.find as jest.Mock) = mockFind;

      await reportService.getGroupSummary(mockGroupId);

      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: mockGroupId,
          status: 'completed',
        })
      );
    });

    it('should correctly subtract refunds from net balance', async () => {
      const mockTransactions = [
        {
          type: 'contribution',
          amount: 100,
          initiatedBy: { _id: 'user1', firstName: 'John' },
          createdAt: new Date(),
        },
        {
          type: 'expense',
          amount: 30,
          category: 'supplies',
          initiatedBy: { _id: 'user1', firstName: 'John' },
          createdAt: new Date(),
        },
        {
          type: 'refund',
          amount: 20,
          initiatedBy: { _id: 'user1', firstName: 'John' },
          createdAt: new Date(),
        },
      ];

      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTransactions),
      });
      (Transaction.find as jest.Mock) = mockFind;

      const summary = await reportService.getGroupSummary(mockGroupId);

      expect(summary.totalContributions).toBe(100);
      expect(summary.totalExpenses).toBe(30);
      expect(summary.totalRefunds).toBe(20);
      expect(summary.netBalance).toBe(50); // 100 - 30 - 20 = 50
    });

    it('should handle transactions where initiatedBy user was deleted', async () => {
      const mockTransactions = [
        {
          type: 'contribution',
          amount: 100,
          initiatedBy: null,
          createdAt: new Date(),
        },
      ];

      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockTransactions),
      });
      (Transaction.find as jest.Mock) = mockFind;

      const summary = await reportService.getGroupSummary(mockGroupId);

      expect(summary.totalContributions).toBe(100);
      expect(summary.contributionsByMember).toEqual([
        {
          userId: 'deleted',
          userName: 'Utilisateur supprimé',
          amount: 100,
          count: 1,
        },
      ]);
    });

    it('should handle period filtering', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      });
      (Transaction.find as jest.Mock) = mockFind;

      await reportService.getGroupSummary(mockGroupId, { startDate, endDate });

      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          groupId: mockGroupId,
          status: 'completed',
          createdAt: expect.objectContaining({
            $gte: startDate,
            $lte: endDate,
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Database error')),
      });
      (Transaction.find as jest.Mock) = mockFind;

      await expect(reportService.getGroupSummary(mockGroupId)).rejects.toThrow('Database error');
    });
  });
});
