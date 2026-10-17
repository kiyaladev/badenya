import { Request, Response } from "express";
import reportService from "../services/report.service";
import logger from "../utils/logger";

/**
 * Helper to extract error message
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

/**
 * Get group financial summary
 * GET /groups/:groupId/reports/summary
 */
export const getGroupSummary = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const { startDate, endDate } = req.query;

    let period;
    if (startDate && endDate) {
      period = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };
    }

    const summary = await reportService.getGroupSummary(groupId, period);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: unknown) {
    logger.error("Error getting group summary:", error);
    res.status(500).json({
      success: false,
      message: "Impossible de charger le résumé du groupe",
      error: getErrorMessage(error),
    });
  }
};

/**
 * Generate PDF report
 * GET /groups/:groupId/reports/pdf
 */
export const generatePdfReport = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const { startDate, endDate } = req.query;

    let period;
    if (startDate && endDate) {
      period = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };
    }

    await reportService.generatePdfReport(groupId, res, period);
  } catch (error: unknown) {
    logger.error("Error generating PDF report:", error);

    // Only send JSON if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Impossible de générer le rapport PDF",
        error: getErrorMessage(error),
      });
    }
  }
};

/**
 * Generate Excel export
 * GET /groups/:groupId/reports/excel
 */
export const generateExcelReport = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const { startDate, endDate } = req.query;

    let period;
    if (startDate && endDate) {
      period = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };
    }

    await reportService.generateExcelReport(groupId, res, period);
  } catch (error: unknown) {
    logger.error("Error generating Excel report:", error);

    // Only send JSON if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Impossible de générer le rapport Excel",
        error: getErrorMessage(error),
      });
    }
  }
};

/**
 * Get monthly report
 * GET /groups/:groupId/reports/monthly/:year/:month
 */
export const getMonthlyReport = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const year = req.params.year as string;
    const month = req.params.month as string;

    const report = await reportService.generateMonthlyReport(
      groupId,
      parseInt(year),
      parseInt(month),
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error: unknown) {
    logger.error("Error generating monthly report:", error);
    res.status(500).json({
      success: false,
      message: "Impossible de générer le rapport mensuel",
      error: getErrorMessage(error),
    });
  }
};
