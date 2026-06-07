import { Router, Request, Response } from 'express';
import { WebApiSetup } from '@event-driven-io/emmett-expressjs';
import { getScore, addMinutes, resetDoner } from './ScoreStore';
import { computeScoreState } from './Score';

export const api = (): WebApiSetup => (router: Router): void => {
  router.get('/api/score', async (_req: Request, res: Response) => {
    const raw = await getScore();
    res.json(computeScoreState(raw));
  });

  router.post('/api/score/add-minutes', async (req: Request, res: Response) => {
    const { minutes } = req.body as { minutes: number };
    const mins = Math.floor(Number(minutes));
    if (!mins || mins <= 0 || mins > 300) {
      res.status(400).json({ error: 'Ungültige Zeit (1–300 Minuten)' });
      return;
    }
    const raw = await addMinutes(mins);
    res.json(computeScoreState(raw));
  });

  router.post('/api/score/reset-doner', async (_req: Request, res: Response) => {
    const raw = await resetDoner();
    res.json(computeScoreState(raw));
  });
};
