import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import type { Exercise, ExerciseSummary, VocabularyExercise, IrregularVerbsExercise } from './Exercise';

const EXERCISES_DIR = join(process.cwd(), 'exercises');

export async function listSubjects(): Promise<string[]> {
  try {
    const entries = await readdir(EXERCISES_DIR, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch {
    return [];
  }
}

export async function listExercises(subject: string): Promise<ExerciseSummary[]> {
  const dir = join(EXERCISES_DIR, subject);
  try {
    const files = (await readdir(dir)).filter(f => f.endsWith('.json'));
    const summaries: ExerciseSummary[] = [];
    for (const filename of files) {
      try {
        const content = await readFile(join(dir, filename), 'utf-8');
        const ex = JSON.parse(content) as Exercise;
        summaries.push({
          id: ex.id,
          title: ex.title,
          description: ex.description,
          type: ex.type,
          itemCount: ex.type === 'vocabulary' ? (ex as VocabularyExercise).items.length :
                     ex.type === 'irregular-verbs' ? (ex as IrregularVerbsExercise).items.length : undefined,
          filename,
          subject,
          bestScore: null,
          isDone: false,
          needsRepeat: false,
          attempts: 0,
        });
      } catch (err) {
        console.error(`Failed to parse ${filename}:`, err);
      }
    }
    return summaries.sort((a, b) => a.filename.localeCompare(b.filename));
  } catch {
    return [];
  }
}

export async function loadExercise(subject: string, filename: string): Promise<Exercise | null> {
  try {
    const content = await readFile(join(EXERCISES_DIR, subject, filename), 'utf-8');
    return JSON.parse(content) as Exercise;
  } catch {
    return null;
  }
}
