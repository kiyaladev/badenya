import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Response } from 'express';
import Group from '../models/Group';
import Transaction from '../models/Transaction';

interface ReportPeriod {
  startDate: Date;
  endDate: Date;
}

interface TransactionSummary {
  totalContributions: number;
  totalExpenses: number;
  totalRefunds: number;
  netBalance: number;
  transactionCount: number;
  contributionsByMember: Array<{
    userId: string;
    userName: string;
    amount: number;
    count: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

interface PopulatedUser {
  _id: string | { toString(): string };
  firstName: string;
  lastName: string;
  email: string;
}

interface PopulatedTransaction {
  _id: string;
  type: 'contribution' | 'expense' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  category?: string;
  initiatedBy: PopulatedUser;
  createdAt: Date;
}

export class ReportService {
  /**
   * Get comprehensive financial summary for a group
   */
  async getGroupSummary(
    groupId: string,
    period?: ReportPeriod
  ): Promise<TransactionSummary> {
    const query: Record<string, unknown> = { groupId };

    if (period) {
      query.createdAt = {
        $gte: period.startDate,
        $lte: period.endDate,
      };
    }

    const transactions = await Transaction.find(query)
      .populate('initiatedBy', 'firstName lastName email')
      .sort({ createdAt: -1 }) as unknown as PopulatedTransaction[];

    const summary: TransactionSummary = {
      totalContributions: 0,
      totalExpenses: 0,
      totalRefunds: 0,
      netBalance: 0,
      transactionCount: transactions.length,
      contributionsByMember: [],
      expensesByCategory: [],
    };

    // Calculate totals
    const memberContributions = new Map<string, { name: string; amount: number; count: number }>();
    const categoryExpenses = new Map<string, { amount: number; count: number }>();

    transactions.forEach((tx) => {
      switch (tx.type) {
        case 'contribution':
          summary.totalContributions += tx.amount;
          
          // Track per member
          const userId = typeof tx.initiatedBy._id === 'string' 
            ? tx.initiatedBy._id 
            : tx.initiatedBy._id.toString();
          const userName = `${tx.initiatedBy.firstName} ${tx.initiatedBy.lastName}`;
          const existing = memberContributions.get(userId);
          if (existing) {
            existing.amount += tx.amount;
            existing.count += 1;
          } else {
            memberContributions.set(userId, { name: userName, amount: tx.amount, count: 1 });
          }
          break;

        case 'expense':
          summary.totalExpenses += tx.amount;
          
          // Track by category
          const category = tx.category || 'Uncategorized';
          const categoryData = categoryExpenses.get(category);
          if (categoryData) {
            categoryData.amount += tx.amount;
            categoryData.count += 1;
          } else {
            categoryExpenses.set(category, { amount: tx.amount, count: 1 });
          }
          break;

        case 'refund':
          summary.totalRefunds += tx.amount;
          break;
      }
    });

    // Convert maps to arrays
    memberContributions.forEach((data, userId) => {
      summary.contributionsByMember.push({
        userId,
        userName: data.name,
        amount: data.amount,
        count: data.count,
      });
    });

    categoryExpenses.forEach((data, category) => {
      summary.expensesByCategory.push({
        category,
        amount: data.amount,
        count: data.count,
      });
    });

    // Sort by amount
    summary.contributionsByMember.sort((a, b) => b.amount - a.amount);
    summary.expensesByCategory.sort((a, b) => b.amount - a.amount);

    summary.netBalance = summary.totalContributions - summary.totalExpenses + summary.totalRefunds;

    return summary;
  }

  /**
   * Generate PDF report for a group
   */
  async generatePdfReport(
    groupId: string,
    res: Response,
    period?: ReportPeriod
  ): Promise<void> {
    const group = await Group.findById(groupId).populate('createdBy', 'firstName lastName');
    if (!group) {
      throw new Error('Group not found');
    }

    const summary = await this.getGroupSummary(groupId, period);
    const transactions = await Transaction.find({
      groupId,
      ...(period && {
        createdAt: { $gte: period.startDate, $lte: period.endDate },
      }),
    })
      .populate('initiatedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    const filename = `${group.name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe to response
    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Rapport Financier', { align: 'center' });
    doc.moveDown();

    // Group Info
    doc.fontSize(16).text(`Groupe: ${group.name}`);
    doc.fontSize(12).text(`Type: ${group.type}`);
    doc.text(`Devise: ${group.currency}`);
    
    if (period) {
      doc.text(
        `Période: ${period.startDate.toLocaleDateString('fr-FR')} - ${period.endDate.toLocaleDateString('fr-FR')}`
      );
    } else {
      doc.text('Période: Depuis la création');
    }
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`);
    doc.moveDown();

    // Summary Section
    doc.fontSize(14).text('Résumé Financier', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Balance actuelle: ${group.balance.toLocaleString()} ${group.currency}`);
    doc.text(`Total contributions: ${summary.totalContributions.toLocaleString()} ${group.currency}`);
    doc.text(`Total dépenses: ${summary.totalExpenses.toLocaleString()} ${group.currency}`);
    doc.text(`Nombre de transactions: ${summary.transactionCount}`);
    doc.moveDown();

    // Contributions by Member
    if (summary.contributionsByMember.length > 0) {
      doc.fontSize(14).text('Contributions par Membre', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      
      summary.contributionsByMember.forEach((member) => {
        doc.text(
          `${member.userName}: ${member.amount.toLocaleString()} ${group.currency} (${member.count} transactions)`
        );
      });
      doc.moveDown();
    }

    // Expenses by Category
    if (summary.expensesByCategory.length > 0) {
      doc.fontSize(14).text('Dépenses par Catégorie', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      
      summary.expensesByCategory.forEach((category) => {
        doc.text(
          `${category.category}: ${category.amount.toLocaleString()} ${group.currency} (${category.count} transactions)`
        );
      });
      doc.moveDown();
    }

    // Transaction List
    doc.addPage();
    doc.fontSize(14).text('Historique des Transactions', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(9);

    transactions.slice(0, 100).forEach((tx) => {
      interface PopulatedUser {
        firstName?: string;
        lastName?: string;
      }
      
      const user = tx.initiatedBy as PopulatedUser | null | undefined;
      const userName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : 'Unknown';
      const date = tx.createdAt.toLocaleDateString('fr-FR');
      const typeLabel = {
        contribution: 'Contribution',
        expense: 'Dépense',
        refund: 'Remboursement',
        adjustment: 'Ajustement',
      }[tx.type];

      doc.text(
        `${date} | ${typeLabel} | ${tx.amount.toLocaleString()} ${group.currency} | ${userName} | ${tx.description || '-'}`
      );
    });

    if (transactions.length > 100) {
      doc.moveDown();
      doc.text(`... et ${transactions.length - 100} autres transactions`);
    }

    // Finalize PDF
    doc.end();
  }

  /**
   * Generate Excel export for group transactions
   */
  async generateExcelReport(
    groupId: string,
    res: Response,
    period?: ReportPeriod
  ): Promise<void> {
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const transactions = await Transaction.find({
      groupId,
      ...(period && {
        createdAt: { $gte: period.startDate, $lte: period.endDate },
      }),
    })
      .populate('initiatedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Prepare data for Excel
    interface PopulatedUser {
      firstName?: string;
      lastName?: string;
      email?: string;
    }
    
    const data = transactions.map((tx) => {
      const user = tx.initiatedBy as PopulatedUser | null | undefined;
      return {
        Date: tx.createdAt.toLocaleDateString('fr-FR'),
        Type: tx.type,
        Montant: tx.amount,
        Devise: tx.currency,
        Description: tx.description || '',
        Catégorie: tx.category || '',
        Initiateur: user ? `${user.firstName} ${user.lastName}` : '',
        Email: user?.email || '',
        'Méthode de paiement': tx.paymentMethod?.type || '',
        Statut: tx.status,
      };
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions');

    // Add columns with headers and widths
    worksheet.columns = [
      { header: 'Date', key: 'Date', width: 12 },
      { header: 'Type', key: 'Type', width: 15 },
      { header: 'Montant', key: 'Montant', width: 12 },
      { header: 'Devise', key: 'Devise', width: 8 },
      { header: 'Description', key: 'Description', width: 30 },
      { header: 'Catégorie', key: 'Catégorie', width: 15 },
      { header: 'Initiateur', key: 'Initiateur', width: 20 },
      { header: 'Email', key: 'Email', width: 25 },
      { header: 'Méthode de paiement', key: 'Méthode de paiement', width: 18 },
      { header: 'Statut', key: 'Statut', width: 12 },
    ];

    // Add data rows
    data.forEach(row => worksheet.addRow(row));

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    const filename = `${group.name.replace(/\s+/g, '_')}_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send buffer
    res.send(buffer);
  }

  /**
   * Generate monthly automated report data
   */
  async generateMonthlyReport(groupId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const summary = await this.getGroupSummary(groupId, { startDate, endDate });

    return {
      groupId,
      period: {
        month,
        year,
        startDate,
        endDate,
      },
      summary,
      generatedAt: new Date(),
    };
  }
}

export default new ReportService();
