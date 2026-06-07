import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { ExerciseResult } from './Exercise';
import { DONE_THRESHOLD } from './Exercise';

const TABLE = 'exercise_results';
const DATA_DIR = join(process.cwd(), 'data');
const RESULTS_FILE = join(DATA_DIR, 'exercise-results.json');

async function isDbAvailable(): Promise<boolean> {
  const url = process.env.SUPABASE_DB_URL;
  return !!(url && url !== 'missing-url');
}

// ── file-based fallback ────────────────────────────────────────────────────

async function readFileResults(): Promise<Record<string, ExerciseResult>> {
  try {
    const content = await readFile(RESULTS_FILE, 'utf-8');
    return JSON.parse(content) as Record<string, ExerciseResult>;
  } catch {
    return {};
  }
}

async function writeFileResults(data: Record<string, ExerciseResult>): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(RESULTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ── public API ─────────────────────────────────────────────────────────────

export async function recordResult(
  subject: string,
  filename: string,
  exerciseId: string,
  scorePercent: number,
): Promise<{ result: ExerciseResult; firstTimeDone: boolean }> {
  const previous = await getResult(exerciseId);
  const wasAlreadyDone = previous?.isDone ?? false;
  const isDone = scorePercent >= DONE_THRESHOLD;
  const firstTimeDone = isDone && !wasAlreadyDone;

  if (await isDbAvailable()) {
    try {
      const { getKnexInstance } = await import('../../common/db');
      const knex = getKnexInstance();
      await knex(TABLE).insert({ exercise_id: exerciseId, subject, filename, score_percent: scorePercent });
      const rows = await knex(TABLE)
        .where({ exercise_id: exerciseId })
        .select(knex.raw('MAX(score_percent) as best_score, COUNT(*) as attempts, MAX(completed_at) as last_attempt_at'));
      const row = rows[0];
      const bestScore = Number(row.best_score);
      const result: ExerciseResult = {
        exerciseId,
        subject,
        filename,
        bestScore,
        isDone: bestScore >= DONE_THRESHOLD,
        needsRepeat: bestScore < DONE_THRESHOLD,
        attempts: Number(row.attempts),
        lastAttemptAt: row.last_attempt_at,
      };
      return { result, firstTimeDone };
    } catch (err) {
      console.error('DB error in recordResult, falling back to file:', err);
    }
  }

  const all = await readFileResults();
  const existing = all[exerciseId];
  const bestScore = existing ? Math.max(existing.bestScore, scorePercent) : scorePercent;
  const result: ExerciseResult = {
    exerciseId,
    subject,
    filename,
    bestScore,
    isDone: bestScore >= DONE_THRESHOLD,
    needsRepeat: bestScore < DONE_THRESHOLD,
    attempts: (existing?.attempts ?? 0) + 1,
    lastAttemptAt: new Date().toISOString(),
  };
  all[exerciseId] = result;
  await writeFileResults(all);
  return { result, firstTimeDone };
}

export async function getResult(exerciseId: string): Promise<ExerciseResult | null> {
  if (await isDbAvailable()) {
    try {
      const { getKnexInstance } = await import('../../common/db');
      const knex = getKnexInstance();
      const rows = await knex(TABLE)
        .where({ exercise_id: exerciseId })
        .select(
          knex.raw('MAX(score_percent) as best_score'),
          knex.raw('COUNT(*) as attempts'),
          knex.raw('MAX(completed_at) as last_attempt_at'),
          'subject',
          'filename',
        );
      if (!rows.length || Number(rows[0].attempts) === 0) return null;
      const row = rows[0];
      const bestScore = Number(row.best_score);
      return {
        exerciseId,
        subject: row.subject,
        filename: row.filename,
        bestScore,
        isDone: bestScore >= DONE_THRESHOLD,
        needsRepeat: bestScore < DONE_THRESHOLD,
        attempts: Number(row.attempts),
        lastAttemptAt: row.last_attempt_at,
      };
    } catch (err) {
      console.error('DB error in getResult, falling back to file:', err);
    }
  }

  const all = await readFileResults();
  return all[exerciseId] ?? null;
}

export async function getAllResults(): Promise<Record<string, ExerciseResult>> {
  if (await isDbAvailable()) {
    try {
      const { getKnexInstance } = await import('../../common/db');
      const knex = getKnexInstance();
      const rows = await knex(TABLE)
        .select(
          'exercise_id',
          'subject',
          'filename',
          knex.raw('MAX(score_percent) as best_score'),
          knex.raw('COUNT(*) as attempts'),
          knex.raw('MAX(completed_at) as last_attempt_at'),
        )
        .groupBy('exercise_id', 'subject', 'filename');
      const map: Record<string, ExerciseResult> = {};
      for (const row of rows) {
        const bestScore = Number(row.best_score);
        map[row.exercise_id] = {
          exerciseId: row.exercise_id,
          subject: row.subject,
          filename: row.filename,
          bestScore,
          isDone: bestScore >= DONE_THRESHOLD,
          needsRepeat: bestScore < DONE_THRESHOLD,
          attempts: Number(row.attempts),
          lastAttemptAt: row.last_attempt_at,
        };
      }
      return map;
    } catch (err) {
      console.error('DB error in getAllResults, falling back to file:', err);
    }
  }

  return readFileResults();
}
