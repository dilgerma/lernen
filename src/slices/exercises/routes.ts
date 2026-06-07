import { Router, Request, Response } from 'express';
import { WebApiSetup } from '@event-driven-io/emmett-expressjs';
import { listSubjects, listExercises, loadExercise } from './ExerciseLoader';

const SUBJECT_META: Record<string, { label: string; flag: string }> = {
  englisch:    { label: 'Englisch',    flag: '🇬🇧' },
  franzoesisch:{ label: 'Französisch', flag: '🇫🇷' },
  spanisch:    { label: 'Spanisch',    flag: '🇪🇸' },
  mathe:       { label: 'Mathe',       flag: '🔢' },
  deutsch:     { label: 'Deutsch',     flag: '🇩🇪' },
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
    const exercises = await listExercises(req.params.subject);
    res.json({ exercises });
  });

  router.get('/api/exercises/:subject/:filename', async (req: Request, res: Response) => {
    const exercise = await loadExercise(req.params.subject, req.params.filename);
    if (!exercise) {
      res.status(404).json({ error: 'Übung nicht gefunden' });
      return;
    }
    res.json({ exercise });
  });
};
