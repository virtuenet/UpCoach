import { Router } from 'express';
import { authMiddleware as authenticate } from '../../middleware/auth';
import { DocsService } from '../../services/google/DocsService';
import { SheetsService } from '../../services/google/SheetsService';

const router = Router();

router.post('/weekly/:userId/docs', authenticate, async (req, res) => {
  const { userId } = req.params;
  const title = `Weekly Report - ${userId}`;
  const content = req.body?.content || 'Weekly report content';
  try {
    const url = await DocsService.createWeeklyReportDoc(userId, title, content);
    res.json({ success: true, data: { url } });
  } catch (e: unknown) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to create Doc' });
  }
});

router.post('/weekly/:userId/sheets', authenticate, async (req, res) => {
  const { userId } = req.params;
  const title = `Weekly Sheet - ${userId}`;
  const rows = (req.body?.rows as (string | number)[][]) || [
    ['Metric', 'Value'],
    ['Completed Tasks', 0],
    ['Active Days', 0],
  ];
  try {
    const url = await SheetsService.createOrUpdateWeeklySheet(title, rows);
    res.json({ success: true, data: { url } });
  } catch (e: unknown) {
    res.status(500).json({ success: false, error: e?.message || 'Failed to create Sheet' });
  }
});

export default router;


