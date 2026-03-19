export type LmsQuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CORRECT' | 'TEXT';

export interface CreateLmsTopicInput {
  title: string;
  description?: string;
  slug?: string;
  isPublished?: boolean;
  position?: number;
  estimatedDurationMinutes?: number;
}

export interface UpdateLmsTopicInput {
  title?: string;
  description?: string;
  slug?: string;
  isPublished?: boolean;
  isActive?: boolean;
  position?: number;
  estimatedDurationMinutes?: number;
}

export interface CreateLmsLevelInput {
  title: string;
  description?: string;
  position: number;
  isPublished?: boolean;
  requireVideoCompletion?: boolean;
  minVideoWatchPercent?: number;
  requireQuizPass?: boolean;
  quizPassingPercent?: number;
  requireReadingAcknowledgement?: boolean;
  xpOnCompletion?: number;
}

export interface UpdateLmsLevelInput {
  title?: string;
  description?: string;
  position?: number;
  isPublished?: boolean;
  requireVideoCompletion?: boolean;
  minVideoWatchPercent?: number;
  requireQuizPass?: boolean;
  quizPassingPercent?: number;
  requireReadingAcknowledgement?: boolean;
  xpOnCompletion?: number;
}

export interface VideoProgressInput {
  contentId?: string;
  eventType: 'START' | 'PROGRESS' | 'PAUSE' | 'SEEK' | 'COMPLETE';
  watchSeconds?: number;
  videoPositionSeconds?: number;
  watchPercent?: number;
}

export interface CreateLmsAttemptInput {
  answers: Array<{
    questionId: string;
    selectedOptionIds?: string[];
    textAnswer?: string;
  }>;
  timeSpentSeconds?: number;
}

export interface CreateLmsVideoContentInput {
  title: string;
  description?: string;
  isRequired?: boolean;
  videoSourceType: 'UPLOAD' | 'EXTERNAL_LINK';
  videoUrl?: string;
  externalUrl?: string;
  videoDurationSeconds?: number;
  position: number;
}

export interface CreateLmsReadingContentInput {
  title: string;
  description?: string;
  attachmentUrl?: string;
  externalUrl?: string;
  isRequired?: boolean;
  position: number;
}

export interface UpdateLmsContentInput {
  title?: string;
  description?: string;
  position?: number;
  isRequired?: boolean;
  videoSourceType?: 'UPLOAD' | 'EXTERNAL_LINK';
  videoUrl?: string;
  externalUrl?: string;
  attachmentUrl?: string;
  videoDurationSeconds?: number;
}

export interface CreateLmsQuestionInput {
  questionText: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CORRECT' | 'TEXT';
  position: number;
  isRequired?: boolean;
  points?: number;
  explanation?: string;
  options?: Array<{
    optionText: string;
    position: number;
    isCorrect?: boolean;
  }>;
}

export interface UpdateLmsQuestionInput {
  questionText?: string;
  type?: 'SINGLE_CHOICE' | 'MULTIPLE_CORRECT' | 'TEXT';
  position?: number;
  isRequired?: boolean;
  points?: number;
  explanation?: string;
  options?: Array<{
    optionText: string;
    position: number;
    isCorrect?: boolean;
  }>;
}
