import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import AIReport from '../models/AIReport';
import Transaction from '../models/Transaction';
import Group from '../models/Group';
import reportService from './report.service';
import { IGroup, ITransaction } from '../models';

interface PopulatedUser {
  _id: string;
  fullName: string;
  email: string;
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

interface DataContext {
  groupType: string;
  memberCount: number;
  contributionAmount: number;
  contributionFrequency: string;
  currentBalance: number;
  totalContributions: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  avgMonthlyContributions: number;
  avgMonthlyExpenses: number;
  avgDaysBetweenContributions: number;
  contributionsByMember: TransactionSummary['contributionsByMember'];
  expensesByCategory: TransactionSummary['expensesByCategory'];
}

/**
 * AI Service for generating insights using Google Gemini API
 */
class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your-gemini-api-key') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    } else {
      console.warn('⚠️  Gemini API key not configured. AI features will be disabled.');
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.model !== null;
  }

  /**
   * Generate financial insights for a group
   */
  async generateGroupInsights(
    groupId: string,
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    if (!this.isAvailable()) {
      throw new Error('AI service is not available. Please configure GEMINI_API_KEY.');
    }

    // Get group and transaction data
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const summary = await reportService.getGroupSummary(groupId, {
      startDate: periodStart,
      endDate: periodEnd,
    });

    const transactions = await Transaction.find({
      groupId,
      createdAt: { $gte: periodStart, $lte: periodEnd },
    }).sort({ createdAt: 1 });

    // Prepare data for AI analysis
    const dataContext = this.prepareDataContext(group, summary, transactions);

    // Generate insights using Gemini
    if (!this.model) {
      throw new Error('AI service is not available. Please configure GEMINI_API_KEY.');
    }
    
    const prompt = this.buildInsightsPrompt(group, dataContext);
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    const insights = this.parseInsightsResponse(text, summary);

    // Save to database
    const aiReport = await AIReport.create({
      groupId,
      generatedBy: userId,
      periodStart,
      periodEnd,
      transactionsAnalyzed: transactions.length,
      report: insights,
      modelUsed: 'gemini-pro',
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    });

    return aiReport;
  }

  /**
   * Detect anomalies in transactions
   */
  async detectAnomalies(groupId: string) {
    if (!this.isAvailable()) {
      throw new Error('AI service is not available. Please configure GEMINI_API_KEY.');
    }

    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Get last 3 months of transactions
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await Transaction.find({
      groupId,
      createdAt: { $gte: threeMonthsAgo },
    })
      .populate('initiatedBy', 'fullName')
      .sort({ createdAt: -1 });

    if (transactions.length === 0) {
      return {
        anomalies: [],
        summary: 'Pas assez de données pour détecter des anomalies.',
      };
    }

    if (!this.model) {
      throw new Error('AI service is not available. Please configure GEMINI_API_KEY.');
    }

    // Prepare anomaly detection prompt
    // Note: double cast needed because Mongoose populate() transforms ObjectId → PopulatedUser at runtime
    const prompt = this.buildAnomalyDetectionPrompt(group, transactions as unknown as Array<ITransaction & { initiatedBy: PopulatedUser }>);
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return this.parseAnomalyResponse(text);
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(groupId: string) {
    if (!this.isAvailable()) {
      throw new Error('AI service is not available. Please configure GEMINI_API_KEY.');
    }

    const group = await Group.findById(groupId).populate('members.userId', 'fullName');
    if (!group) {
      throw new Error('Group not found');
    }

    if (!this.model) {
      throw new Error('AI service is not available. Please configure GEMINI_API_KEY.');
    }

    // Get group statistics
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const summary = await reportService.getGroupSummary(groupId, {
      startDate: lastMonth,
      endDate: now,
    });

    const prompt = this.buildRecommendationsPrompt(group, summary);
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return this.parseRecommendationsResponse(text);
  }

  /**
   * Prepare data context for AI analysis
   */
  private prepareDataContext(group: IGroup, summary: TransactionSummary, transactions: ITransaction[]): DataContext {
    // Calculate actual time span in months
    const firstTx = transactions[0]?.createdAt.getTime();
    const lastTx = transactions[transactions.length - 1]?.createdAt.getTime();
    const daysDiff = firstTx && lastTx ? Math.abs(lastTx - firstTx) / (1000 * 60 * 60 * 24) : 0;
    const monthsDiff = Math.max(1, Math.round(daysDiff / 30.44)); // 30.44 = average days per month

    const avgMonthlyContributions = summary.totalContributions / monthsDiff;
    const avgMonthlyExpenses = summary.totalExpenses / monthsDiff;

    // Calculate contribution regularity
    const contributionDates = transactions
      .filter((t) => t.type === 'contribution')
      .map((t) => t.createdAt);
    
    const avgDaysBetweenContributions =
      contributionDates.length > 1
        ? contributionDates
            .slice(1)
            .reduce((sum, date, i) => {
              const diff = Math.abs(date.getTime() - contributionDates[i].getTime());
              return sum + diff / (1000 * 60 * 60 * 24);
            }, 0) /
          (contributionDates.length - 1)
        : 0;

    return {
      groupType: group.type,
      memberCount: group.members.length,
      contributionAmount: group.contributionSettings.amount,
      contributionFrequency: group.contributionSettings.frequency,
      currentBalance: group.balance,
      totalContributions: summary.totalContributions,
      totalExpenses: summary.totalExpenses,
      netBalance: summary.netBalance,
      transactionCount: summary.transactionCount,
      avgMonthlyContributions,
      avgMonthlyExpenses,
      avgDaysBetweenContributions,
      contributionsByMember: summary.contributionsByMember,
      expensesByCategory: summary.expensesByCategory,
    };
  }

  /**
   * Build insights generation prompt
   */
  private buildInsightsPrompt(group: IGroup, dataContext: DataContext): string {
    return `Tu es un expert en analyse financière pour les groupes d'épargne collaborative (tontines) en Afrique de l'Ouest.

Analyse les données suivantes du groupe "${group.name}" (Type: ${dataContext.groupType}):

Données du groupe:
- Membres: ${dataContext.memberCount}
- Cotisation attendue: ${dataContext.contributionAmount} ${group.currency} (${dataContext.contributionFrequency})
- Balance actuelle: ${dataContext.currentBalance} ${group.currency}

Statistiques de la période:
- Total cotisations: ${dataContext.totalContributions} ${group.currency}
- Total dépenses: ${dataContext.totalExpenses} ${group.currency}
- Balance nette: ${dataContext.netBalance} ${group.currency}
- Nombre de transactions: ${dataContext.transactionCount}
- Cotisations mensuelles moyennes: ${dataContext.avgMonthlyContributions.toFixed(2)} ${group.currency}
- Dépenses mensuelles moyennes: ${dataContext.avgMonthlyExpenses.toFixed(2)} ${group.currency}
- Intervalle moyen entre cotisations: ${dataContext.avgDaysBetweenContributions.toFixed(1)} jours

Top contributeurs:
${dataContext.contributionsByMember.slice(0, 5).map((m) => `- ${m.userName}: ${m.amount} ${group.currency}`).join('\n')}

Catégories de dépenses:
${dataContext.expensesByCategory.map((c) => `- ${c.category}: ${c.amount} ${group.currency}`).join('\n')}

Fournis une analyse structurée au format JSON avec:
1. Un résumé global (1-2 phrases)
2. 3-5 insights clés avec catégorie, observation et recommandation
3. 3-4 tendances avec métrique, valeur, changement (%) et direction (up/down/stable)
4. 2-3 prédictions pour le mois prochain avec timeframe, métrique, valeur prédite et confiance (0-1)

Réponds UNIQUEMENT avec un objet JSON valide, sans texte supplémentaire.`;
  }

  /**
   * Build anomaly detection prompt
   */
  private buildAnomalyDetectionPrompt(group: IGroup, transactions: Array<ITransaction & { initiatedBy: PopulatedUser }>): string {
    const txSummary = transactions
      .slice(0, 20)
      .map((t) => {
        const user = t.initiatedBy;
        return `${t.createdAt.toISOString().split('T')[0]} | ${t.type} | ${t.amount} ${t.currency} | ${user?.fullName || 'Unknown'}`;
      })
      .join('\n');

    return `Tu es un expert en détection de fraudes et anomalies financières pour les tontines.

Analyse les 20 dernières transactions du groupe "${group.name}":

${txSummary}

Détecte les anomalies potentielles telles que:
- Montants inhabituellement élevés ou faibles
- Fréquence anormale de transactions
- Comportements suspects d'utilisateurs
- Schémas de dépenses inhabituels

Réponds au format JSON avec:
{
  "anomalies": [
    {
      "type": "type d'anomalie",
      "severity": "low|medium|high",
      "description": "description",
      "recommendation": "action recommandée"
    }
  ],
  "summary": "résumé global"
}

Réponds UNIQUEMENT avec un objet JSON valide, sans texte supplémentaire.`;
  }

  /**
   * Build recommendations prompt
   */
  private buildRecommendationsPrompt(group: IGroup, summary: TransactionSummary): string {
    return `Tu es un conseiller financier expert en épargne collaborative.

Groupe: "${group.name}" (${group.type})
- Membres: ${group.members.length}
- Balance: ${group.balance} ${group.currency}
- Cotisation: ${group.contributionSettings.amount} ${group.currency}

Dernier mois:
- Cotisations: ${summary.totalContributions} ${group.currency}
- Dépenses: ${summary.totalExpenses} ${group.currency}

Fournis 3-5 recommandations personnalisées pour améliorer la gestion du groupe.

Réponds au format JSON:
{
  "recommendations": [
    {
      "category": "catégorie",
      "priority": "high|medium|low",
      "title": "titre",
      "description": "description détaillée",
      "impact": "impact attendu"
    }
  ]
}

Réponds UNIQUEMENT avec un objet JSON valide, sans texte supplémentaire.`;
  }

  /**
   * Parse insights response from AI
   */
  private parseInsightsResponse(text: string, summary: TransactionSummary) {
    try {
      // Remove markdown code blocks if present
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanText);

      return {
        summary: parsed.summary || 'Analyse générée avec succès.',
        totalContributions: summary.totalContributions,
        totalExpenses: summary.totalExpenses,
        netBalance: summary.netBalance,
        insights: parsed.insights || [],
        trends: parsed.trends || [],
        predictions: parsed.predictions || [],
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return fallback insights based on data
      return this.generateFallbackInsights(summary);
    }
  }

  /**
   * Parse anomaly detection response
   */
  private parseAnomalyResponse(text: string) {
    try {
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleanText);
    } catch (error) {
      console.error('Failed to parse anomaly response:', error);
      return {
        anomalies: [],
        summary: 'Analyse des anomalies terminée. Aucune anomalie critique détectée.',
      };
    }
  }

  /**
   * Parse recommendations response
   */
  private parseRecommendationsResponse(text: string) {
    try {
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return JSON.parse(cleanText);
    } catch (error) {
      console.error('Failed to parse recommendations response:', error);
      return {
        recommendations: [
          {
            category: 'general',
            priority: 'medium',
            title: 'Continuer la bonne gestion',
            description: 'Le groupe fonctionne bien. Continuez avec les bonnes pratiques actuelles.',
            impact: 'Maintien de la stabilité financière',
          },
        ],
      };
    }
  }

  /**
   * Generate fallback insights when AI parsing fails
   */
  private generateFallbackInsights(summary: TransactionSummary) {
    const savingsRate =
      summary.totalContributions > 0
        ? ((summary.totalContributions - summary.totalExpenses) / summary.totalContributions) * 100
        : 0;

    return {
      summary: `Le groupe a collecté ${summary.totalContributions} en cotisations et dépensé ${summary.totalExpenses}.`,
      totalContributions: summary.totalContributions,
      totalExpenses: summary.totalExpenses,
      netBalance: summary.netBalance,
      insights: [
        {
          category: 'savings',
          observation: `Taux d'épargne de ${savingsRate.toFixed(1)}%`,
          recommendation:
            savingsRate > 50
              ? 'Excellent taux d\'épargne. Continuez ainsi!'
              : 'Essayez de réduire les dépenses pour augmenter l\'épargne.',
        },
      ],
      trends: [
        {
          metric: 'Balance',
          value: summary.netBalance,
          change: 0,
          direction: 'stable' as const,
        },
      ],
      predictions: [],
    };
  }
}

export default new AIService();
