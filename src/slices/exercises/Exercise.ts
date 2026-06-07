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

export interface IrregularVerbItem {
  infinitive: string;
  simplePast: string;
  pastParticiple: string;
  german: string;
}

export interface IrregularVerbsExercise {
  id: string;
  title: string;
  description: string;
  type: 'irregular-verbs';
  items: IrregularVerbItem[];
}

export type Exercise = VocabularyExercise | TranslationExercise | IrregularVerbsExercise;

export interface ExerciseSummary {
  id: string;
  title: string;
  description: string;
  type: 'vocabulary' | 'translation' | 'irregular-verbs';
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
