export interface VocabularyItem {
  question: string;
  answers: string[];
}

export interface VocabularyExercise {
  id: string;
  title: string;
  description: string;
  type: 'vocabulary';
  items: VocabularyItem[];
}

export interface TranslationExercise {
  id: string;
  title: string;
  description: string;
  type: 'translation';
  source: string;
  reference: string;
  minimumScore: number;
}

export type Exercise = VocabularyExercise | TranslationExercise;

export interface ExerciseSummary {
  id: string;
  title: string;
  description: string;
  type: 'vocabulary' | 'translation';
  itemCount?: number;
  filename: string;
  subject: string;
  bestScore: number | null;
  isDone: boolean;
  attempts: number;
  needsRepeat: boolean;
}

export interface ExerciseResult {
  exerciseId: string;
  subject: string;
  filename: string;
  bestScore: number;
  isDone: boolean;
  needsRepeat: boolean;
  attempts: number;
  lastAttemptAt: string;
}

export const DONE_THRESHOLD = 90;
