import { Router, Request, Response } from 'express';
import { WebApiSetup } from '@event-driven-io/emmett-expressjs';
import { listSubjects, listExercises, loadExercise } from './ExerciseLoader';
import { recordResult, getAllResults } from './ExerciseResultStore';
import { addMinutes, getScore } from '../score/ScoreStore';
import { computeScoreState } from '../score/Score';

const SUBJECT_META: Record<string, { label: string; flag: string }> = {
  englisch:     { label: 'Englisch',    flag: '🇬🇧' },
  franzoesisch: { label: 'Französisch', flag: '🇫🇷' },
  spanisch:     { label: 'Spanisch',    flag: '🇪🇸' },
  mathe:        { label: 'Mathe',       flag: '🔢' },
  deutsch:      { label: 'Deutsch',     flag: '🇩🇪' },
};

export const api = (): WebApiSetup => (router: Router): void => {
  router.get('/api/subjects', async (_req: Request, res: Response) => {
    const ids = await listSubjects();
    res.json({
      subjects: ids.map(s => ({
        id: s,
        label: SUBJECT_META[s]?.label ?? (s.charAt(0).toUpperCase() + s.slice(1)),
        flag:  SUBJECT_META[s]?.flag  ?? '📚',
      })),
    });
  });

  router.get('/api/subjects/:subject/exercises', async (req: Request, res: Response) => {
    const [exercises, allResults] = await Promise.all([
      listExercises(req.params.subject),
      getAllResults(),
    ]);
    const enriched = exercises.map(ex => {
      const r = allResults[ex.id];
      return {
        ...ex,
        bestScore:   r?.bestScore   ?? null,
        isDone:      r?.isDone      ?? false,
        needsRepeat: r?.needsRepeat ?? false,
        attempts:    r?.attempts    ?? 0,
      };
    });
    res.json({ exercises: enriched });
  });

  router.get('/api/exercises/:subject/:filename', async (req: Request, res: Response) => {
    const exercise = await loadExercise(req.params.subject, req.params.filename);
    if (!exercise) {
      res.status(404).json({ error: 'Übung nicht gefunden' });
      return;
    }
    res.json({ exercise });
  });

  // POST /api/exercises/:subject/:filename/result
  // Body: { exerciseId: string, scorePercent: number, minutesSpent?: number }
  // Awards minutes only the first time an exercise reaches >= 90%.
  router.post('/api/exercises/:subject/:filename/result', async (req: Request, res: Response) => {
    const { subject, filename } = req.params;
    const { exerciseId, scorePercent, minutesSpent } = req.body as {
      exerciseId: string;
      scorePercent: number;
      minutesSpent?: number;
    };

    if (!exerciseId || typeof scorePercent !== 'number' || scorePercent < 0 || scorePercent > 100) {
      res.status(400).json({ error: 'exerciseId and scorePercent (0–100) are required' });
      return;
    }

    const { result, firstTimeDone } = await recordResult(subject, filename, exerciseId, scorePercent);

    let raw = await getScore();
    if (firstTimeDone) {
      const mins = minutesSpent && minutesSpent > 0 && minutesSpent <= 300 ? minutesSpent : 5;
      raw = await addMinutes(mins);
    }

    res.json({ result, firstTimeDone, scoreState: computeScoreState(raw) });
  });
};
