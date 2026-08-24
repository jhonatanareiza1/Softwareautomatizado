export type ActivityType =
    | 'quiz'
    | 'game'
    | 'video'
    | 'listening'
    | 'dialogue'
    | 'challenge';

export type QuestionType =
    | 'multiple-choice'
    | 'true-false'
    | 'text';

export interface Activity {
    id: string;

    title: string;

    description?: string;

    type: ActivityType;

    ownerTeacherId: string;

    subjectId?: string;

    topicId?: string;

    configId?: string;

    isPublished: boolean;

    createdAt: unknown;

    updatedAt: unknown;
}

export interface ActivityQuestionOption {
    id: string;

    text: string;
}

/**
 * Pregunta que puede ser enviada al estudiante.
 *
 * IMPORTANTE:
 * No contiene correctAnswer.
 * Las respuestas correctas permanecen del lado del backend.
 */
export interface ActivityQuestion {
    id: string;

    type: QuestionType;

    text: string;

    options?: ActivityQuestionOption[];

    points?: number;

    explanation?: string;
}

/**
 * Configuración pública de una actividad.
 *
 * Esta información puede ser leída por el estudiante.
 */
export interface ActivityConfig {
    id: string;

    activityId: string;

    ownerTeacherId: string;

    questions: ActivityQuestion[];

    timeLimitSeconds?: number;

    shuffleQuestions?: boolean;

    shuffleOptions?: boolean;

    passingScore?: number;

    createdAt: unknown;

    updatedAt: unknown;
}

/**
 * Respuestas correctas.
 *
 * Este tipo se utiliza únicamente en backend.
 * NO debe enviarse al frontend.
 */
export interface ActivityAnswerKey {
    id: string;

    activityId: string;

    ownerTeacherId: string;

    answers: Record<string, string | string[]>;

    createdAt: unknown;

    updatedAt: unknown;
}

/**
 * Respuesta enviada por el estudiante.
 *
 * El frontend solamente dice qué opción eligió.
 * Nunca debe enviar isCorrect.
 */
export interface ActivityAnswer {
    questionId: string;

    answer: string | string[];
}

/**
 * Resultado calculado por el backend.
 */
export interface ActivityScoreResult {
    score: number;

    totalPoints: number;

    correctAnswers: number;

    totalQuestions: number;

    passed: boolean;

    answers: Array<{
        questionId: string;

        answer: string | string[];

        isCorrect: boolean;

        pointsEarned: number;

        pointsAvailable: number;
    }>;
}