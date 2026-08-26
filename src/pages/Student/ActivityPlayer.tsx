/* eslint-disable react-hooks/set-state-in-effect */
import {
    useEffect,
    useState,
} from 'react';

import {
    useNavigate,
    useParams,
} from 'react-router-dom';

import { useAuth } from '../../features/auth/context/AuthContext';

import {
    getActivity,
    submitAttempt,
    type SubmitAttemptResult,
} from '../../services/firebase/activities';

import type {
    Activity,
    ActivityConfig,
} from '../../types';

interface SelectedAnswers {
    [questionId: string]: string | string[];
}

function ActivityPlayer() {
    const { activityId } = useParams<{
        activityId: string;
    }>();

    const navigate = useNavigate();

    const { user } = useAuth();

    const [activity, setActivity] =
        useState<Activity | null>(null);

    const [config, setConfig] =
        useState<ActivityConfig | null>(null);

    const [answers, setAnswers] =
        useState<SelectedAnswers>({});

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [result, setResult] =
        useState<SubmitAttemptResult | null>(null);

    useEffect(() => {
        if (!activityId) {
            setError(
                'No se especificó una actividad.',
            );

            setLoading(false);

            return;
        }

        const currentActivityId = activityId;

        let isMounted = true;

        async function loadActivity() {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await getActivity(
                        currentActivityId,
                    );

                if (!isMounted) {
                    return;
                }

                setActivity(data.activity);
                setConfig(data.config);
            } catch (loadError) {
                console.error(
                    'No se pudo cargar la actividad:',
                    loadError,
                );

                if (isMounted) {
                    setError(
                        'No se pudo cargar la actividad.',
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        void loadActivity();

        return () => {
            isMounted = false;
        };
    }, [activityId]);

    function handleAnswerChange(
        questionId: string,
        answer: string,
    ) {
        setAnswers((current) => ({
            ...current,
            [questionId]: answer,
        }));
    }

    async function handleSubmit() {
        if (!activityId) {
            setError(
                'No se especificó una actividad.',
            );

            return;
        }

        if (!user) {
            setError(
                'Debes iniciar sesión para enviar la actividad.',
            );

            return;
        }

        if (!config) {
            setError(
                'La configuración de la actividad no está disponible.',
            );

            return;
        }

        if (submitting) {
            return;
        }

        const unansweredQuestions =
            config.questions.filter(
                (question) =>
                    answers[question.id] === undefined,
            );

        if (unansweredQuestions.length > 0) {
            setError(
                'Debes responder todas las preguntas antes de enviar.',
            );

            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const response =
                await submitAttempt({
                    activityId,
                    studentId: user.uid,
                    answers,
                });

            setResult(response);
        } catch (submitError) {
            console.error(
                'No se pudo enviar el intento:',
                submitError,
            );

            setError(
                'No se pudo enviar la actividad.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <main className="student-dashboard">
                <section className="student-panel">
                    <p>
                        Cargando actividad...
                    </p>
                </section>
            </main>
        );
    }

    if (error && !activity) {
        return (
            <main className="student-dashboard">
                <section className="student-panel">
                    <h1>
                        No se pudo cargar la actividad
                    </h1>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate('/student')
                        }
                    >
                        Volver al inicio
                    </button>
                </section>
            </main>
        );
    }

    if (!activity || !config) {
        return (
            <main className="student-dashboard">
                <section className="student-panel">
                    <p>
                        La actividad no está disponible.
                    </p>
                </section>
            </main>
        );
    }

    if (result) {
        return (
            <main className="student-dashboard">
                <section className="student-panel">
                    <p className="eyebrow">
                        ACTIVIDAD COMPLETADA
                    </p>

                    <h1>
                        {activity.title}
                    </h1>

                    <div>
                        <strong>
                            {result.score} /{' '}
                            {result.totalPoints}
                        </strong>
                    </div>

                    <p>
                        Respuestas correctas:{' '}
                        {result.correctAnswers} de{' '}
                        {result.totalQuestions}
                    </p>

                    <p>
                        Resultado:{' '}
                        {result.passed
                            ? 'Aprobada'
                            : 'No aprobada'}
                    </p>

                    <div>
                        <p>
                            XP ganada:{' '}
                            <strong>
                                {
                                    result
                                        .gamification
                                        .xp
                                }
                            </strong>
                        </p>

                        <p>
                            EduCoins ganadas:{' '}
                            <strong>
                                {
                                    result
                                        .gamification
                                        .coins
                                }
                            </strong>
                        </p>

                        <p>
                            XP total:{' '}
                            <strong>
                                {
                                    result
                                        .gamification
                                        .totalXP
                                }
                            </strong>
                        </p>

                        <p>
                            EduCoins totales:{' '}
                            <strong>
                                {
                                    result
                                        .gamification
                                        .totalCoins
                                }
                            </strong>
                        </p>
                    </div>

                    <p>
                        {result.passed
                            ? '¡Excelente trabajo! Aprobaste la actividad. 🎉'
                            : 'La actividad no fue aprobada. ¡Sigue practicando! 💪'}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate('/student')
                        }
                    >
                        Volver al inicio
                    </button>
                </section>
            </main>
        );
    }

    return (
        <main className="student-dashboard">
            <section className="student-panel">
                <button
                    type="button"
                    onClick={() =>
                        navigate('/student')
                    }
                >
                    ← Volver
                </button>

                <div className="section-heading">
                    <div>
                        <p className="eyebrow">
                            ACTIVIDAD
                        </p>

                        <h1>
                            {activity.title}
                        </h1>

                        {activity.description && (
                            <p>
                                {activity.description}
                            </p>
                        )}
                    </div>
                </div>

                {error && (
                    <p role="alert">
                        {error}
                    </p>
                )}

                <div>
                    {config.questions.map(
                        (question, index) => (
                            <article
                                key={question.id}
                                className="student-panel"
                            >
                                <p>
                                    Pregunta {index + 1}
                                </p>

                                <h2>
                                    {question.text}
                                </h2>

                                {question.options?.map(
                                    (option) => (
                                        <label
                                            key={
                                                option.id
                                            }
                                        >
                                            <input
                                                type="radio"
                                                name={
                                                    question.id
                                                }
                                                value={
                                                    option.id
                                                }
                                                checked={
                                                    answers[
                                                    question.id
                                                    ] ===
                                                    option.id
                                                }
                                                onChange={() =>
                                                    handleAnswerChange(
                                                        question.id,
                                                        option.id,
                                                    )
                                                }
                                            />

                                            {' '}

                                            {
                                                option.text
                                            }
                                        </label>
                                    ),
                                )}
                            </article>
                        ),
                    )}
                </div>

                <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                        void handleSubmit()
                    }
                >
                    {submitting
                        ? 'Enviando...'
                        : 'Enviar actividad'}
                </button>
            </section>
        </main>
    );
}

export default ActivityPlayer;