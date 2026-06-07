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
}
