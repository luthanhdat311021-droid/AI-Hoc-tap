export interface NoteSection {
  heading: string;
  points: string[];
  subPoints?: string[];
  examples?: string[];
}

export interface KeyConcept {
  term: string;
  definition: string;
  importance: 'high' | 'medium';
}

export interface StructuredNote {
  title: string;
  summary: string;
  sections: NoteSection[];
  keyConcepts: KeyConcept[];
}

export interface MindmapNode {
  id: string;
  label: string;
  feynmanExplanation: string;
  category?: string;
  x?: number;
  y?: number;
}

export interface MindmapEdge {
  from: string;
  to: string;
  label: string; // e.g. "dẫn đến", "là ví dụ của", "trái ngược với", "gồm có"
}

export interface MindmapData {
  nodeData?: any;
  arrows?: Array<{ id?: string; from: string; to: string; label: string }>;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  status?: 'unseen' | 'remembered' | 'forgotten';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FeynmanCheckResult {
  score: number; // 1 - 10
  verdict: 'Xuất sắc' | 'Khá tốt' | 'Cần bổ sung';
  missingPoints: string[];
  incorrectOrVaguePoints: string[];
  simplifiedSuggestion: string;
  feedbackSummary: string;
}

export interface LearningSession {
  id: string;
  title: string;
  createdAt: string;
  inputType: 'text' | 'image' | 'pdf' | 'video';
  sourceName?: string;
  structuredNote: StructuredNote;
  mindmap: MindmapData;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}
