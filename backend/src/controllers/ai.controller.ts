import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { requireAuth } from '../utils/typeGuards';
import aiService from '../services/ai.service';
import AIReport from '../models/AIReport';

/**
 * Helper to extract error message
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return getErrorMessage(error);
  return String(error);
};

/**
 * Generate AI insights for a group
 * @route POST /api/v1/groups/:groupId/insights
 */
export const generateInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { groupId } = req.params;
    const userId = authReq.user.id;

    // Get period from query or default to last 30 days
    const periodEnd = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const periodStart = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const aiReport = await aiService.generateGroupInsights(
      groupId,
      userId,
      periodStart,
      periodEnd
    );

    res.status(201).json({
      status: 'success',
      data: aiReport,
    });
  } catch (error: unknown) {
    console.error('Generate insights error:', error);
    
    const errorMsg = getErrorMessage(error);
    if (errorMsg.includes('not available')) {
      res.status(503).json({
        status: 'error',
        message: 'AI service is currently unavailable. Please try again later.',
      });
      return;
    }

    res.status(500).json({
      status: 'error',
      message: errorMsg || 'Failed to generate insights',
    });
  }
};

/**
 * Get insights history for a group
 * @route GET /api/v1/groups/:groupId/insights
 */
export const getGroupInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const reports = await AIReport.find({ groupId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('generatedBy', 'firstName lastName');

    const total = await AIReport.countDocuments({ groupId });

    res.json({
      status: 'success',
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: unknown) {
    console.error('Get insights error:', error);
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error) || 'Failed to retrieve insights',
    });
  }
};

/**
 * Get a specific insight report
 * @route GET /api/v1/insights/:reportId
 */
export const getInsightById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;

    const report = await AIReport.findById(reportId)
      .populate('groupId', 'name type currency')
      .populate('generatedBy', 'firstName lastName');

    if (!report) {
      res.status(404).json({
        status: 'error',
        message: 'Insight report not found',
      });
      return;
    }

    res.json({
      status: 'success',
      data: report,
    });
  } catch (error: unknown) {
    console.error('Get insight by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error) || 'Failed to retrieve insight',
    });
  }
};

/**
 * Detect anomalies in group transactions
 * @route POST /api/v1/groups/:groupId/anomalies
 */
export const detectAnomalies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;

    const result = await aiService.detectAnomalies(groupId);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Detect anomalies error:', error);
    
    if (getErrorMessage(error).includes('not available')) {
      res.status(503).json({
        status: 'error',
        message: 'AI service is currently unavailable. Please try again later.',
      });
      return;
    }

    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error) || 'Failed to detect anomalies',
    });
  }
};

/**
 * Generate personalized recommendations for a group
 * @route POST /api/v1/groups/:groupId/recommendations
 */
export const generateRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;

    const result = await aiService.generateRecommendations(groupId);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error: unknown) {
    console.error('Generate recommendations error:', error);
    
    if (getErrorMessage(error).includes('not available')) {
      res.status(503).json({
        status: 'error',
        message: 'AI service is currently unavailable. Please try again later.',
      });
      return;
    }

    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error) || 'Failed to generate recommendations',
    });
  }
};

/**
 * Delete an insight report
 * @route DELETE /api/v1/insights/:reportId
 */
export const deleteInsight = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { reportId } = req.params;
    const userId = authReq.user.id;

    const report = await AIReport.findById(reportId);

    if (!report) {
      res.status(404).json({
        status: 'error',
        message: 'Insight report not found',
      });
      return;
    }

    // Only allow the user who generated the report to delete it
    if (report.generatedBy.toString() !== userId.toString()) {
      res.status(403).json({
        status: 'error',
        message: 'You are not authorized to delete this report',
      });
      return;
    }

    await AIReport.findByIdAndDelete(reportId);

    res.json({
      status: 'success',
      message: 'Insight report deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Delete insight error:', error);
    res.status(500).json({
      status: 'error',
      message: getErrorMessage(error) || 'Failed to delete insight',
    });
  }
};
