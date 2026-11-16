const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { ApiError } = require('../utils/ApiError');
const reportService = require('../services/report.service');

const getReport = (type) =>
  asyncHandler(async (req, res) => {
    const data = await reportService.buildReportData(req.user.id, type);
    return sendSuccess(res, { message: 'Report generated successfully', data });
  });

const exportCSV = asyncHandler(async (req, res) => {
  const { type } = req.query;
  if (!reportService.REPORT_TYPES.includes(type)) {
    throw ApiError.badRequest('Invalid report type. Use workouts, nutrition, or progress.');
  }
  const csv = await reportService.buildCSV(req.user.id, type, req.user.weightUnit);
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="fitness-${type}-report-${date}.csv"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.send(csv);
});

const exportPDF = asyncHandler(async (req, res) => {
  const { type } = req.query;
  if (!reportService.REPORT_TYPES.includes(type)) {
    throw ApiError.badRequest('Invalid report type. Use workouts, nutrition, or progress.');
  }
  const pdf = await reportService.buildReportPDF(req.user.id, type, req.user.weightUnit);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="fitness-report.pdf"');
  res.setHeader('Cache-Control', 'no-store');
  return res.send(pdf);
});

module.exports = { getReport, exportCSV, exportPDF };