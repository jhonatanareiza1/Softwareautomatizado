import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../features/auth/context/AuthContext';

import {
    getGamificationProfileByStudentId,
    getStudentAchievements,
    initializeGamificationProfile,
} from '../../services/firebase/gamification';

import {
    getProgressByStudentId,
} from '../../services/firebase/progress';

import {
    getStudentActivities,
    type StudentActivity,
} from '../../services/firebase/activitiesList';

import {
    listActivityAttempts,
    type ActivityAttempt,
} from '../../services/firebase/activities';

import type {
    GamificationProfile,
    ProgressSubjectKey,
    StudentProgress,
} from '../../types';

const games = [
    {
        title: 'Matemáticas',
        subtitle: 'Aventura numérica',
        icon: '➗',
        level: 'Práctica',
        tone: 'purple',
    },
    {
        title: 'Inglés',
        subtitle: 'English adventure',
        icon: 'ABC',
        level: 'Práctica',
        tone: 'blue',
    },
    {
        title: 'Ciencias',
        subtitle: 'Exploradores',
        icon: '🧪',
        level: 'Práctica',
        tone: 'green',
    },
    {
        title: 'Memoria',
        subtitle: 'Challenge',
        icon: '🧠',
        level: 'Práctica',
        tone: 'orange',
    },
];

const subjectDefinitions: Array<{
    key: ProgressSubjectKey;
    name: string;
    tone: string;
}> = [
        {
            key: 'mathematics',
            name: 'Matemáticas',
            tone: 'green',
        },
        {
            key: 'english',
            name: 'Inglés',
            tone: 'blue',
        },
        {
            key: 'science',
            name: 'Ciencias',
            tone: 'purple',
        },
        {
            key: 'history',
            name: 'Historia',
            tone: 'orange',
        },
    ];

const achievementDefinitions: Record<
    string,
    {
        name: string;
        description: string;
        icon: string;
    }
> = {
    'first-victory': {
        name: 'Primera victoria',
        description: 'Aprueba tu primera actividad',
        icon: '🏆',
    },
    'perfect-score': {
        name: 'Puntuación perfecta',
        description: 'Obtén 100% en una actividad',
        icon: '⭐',
    },
    'five-activities': {
        name: 'Cinco actividades',
        description: 'Completa 5 actividades',
        icon: '🎯',
    },
    'hundred-xp': {
        name: '100 XP',
        description: 'Alcanza 100 XP',
        icon: '⚡',
    },
};

function getProgressLabel(
    percentage: number,
): string {
    if (percentage >= 85) {
        return 'Avanzado';
    }

    if (percentage >= 70) {
        return 'Intermedio';
    }

    if (percentage > 0) {
        return 'Básico';
    }

    return 'Sin actividad';
}

function clampPercentage(
    percentage: number,
): number {
    return Math.min(
        Math.max(
            Math.round(percentage),
            0,
        ),
        100,
    );
}

function getAttemptDate(
    attempt: ActivityAttempt,
): Date | null {
    const value = attempt.createdAt;

    if (!value) {
        return null;
    }

    if (
        typeof value === 'object' &&
        value !== null &&
        'toDate' in value &&
        typeof value.toDate === 'function'
    ) {
        return value.toDate();
    }

    if (
        typeof value === 'object' &&
        value !== null &&
        'seconds' in value &&
        typeof value.seconds === 'number'
    ) {
        return new Date(
            value.seconds * 1000,
        );
    }

    if (
        typeof value === 'string' ||
        typeof value === 'number'
    ) {
        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    return null;
}

function isToday(
    date: Date | null,
): boolean {
    if (!date) {
        return false;
    }

    const today = new Date();

    return (
        date.getFullYear() ===
        today.getFullYear() &&
        date.getMonth() ===
        today.getMonth() &&
        date.getDate() ===
        today.getDate()
    );
}

function formatAttemptDate(
    date: Date | null,
): string {
    if (!date) {
        return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat(
        'es-CO',
        {
            dateStyle: 'medium',
            timeStyle: 'short',
        },
    ).format(date);
}

function getSubjectName(
    subjectId: string | undefined,
): string {
    if (!subjectId) {
        return 'Sin materia';
    }

    const subject = subjectDefinitions.find(
        (definition) =>
            definition.key === subjectId,
    );

    return subject?.name ?? subjectId;
}

function formatAnswer(
    answer: string | string[],
): string {
    if (Array.isArray(answer)) {
        if (answer.length === 0) {
            return 'Sin respuesta';
        }

        return answer.join(', ');
    }

    if (answer.trim() === '') {
        return 'Sin respuesta';
    }

    return answer;
}

function StudentDashboard() {
    const {
        profile,
        user,
        logout,
    } = useAuth();

    const navigate = useNavigate();

    const [
        gamificationProfile,
        setGamificationProfile,
    ] = useState<GamificationProfile | null>(
        null,
    );

    const [
        studentAchievements,
        setStudentAchievements,
    ] = useState<
        Awaited<
            ReturnType<
                typeof getStudentAchievements
            >
        >
    >([]);

    const [
        studentProgress,
        setStudentProgress,
    ] = useState<StudentProgress | null>(
        null,
    );

    const [
        activities,
        setActivities,
    ] = useState<StudentActivity[]>([]);

    const [
        attemptsByActivity,
        setAttemptsByActivity,
    ] = useState<Record<string, ActivityAttempt[]>>(
        {},
    );

    const [
        profileLoading,
        setProfileLoading,
    ] = useState(true);

    const [
        progressLoading,
        setProgressLoading,
    ] = useState(true);

    const [
        activitiesLoading,
        setActivitiesLoading,
    ] = useState(true);

    const [
        attemptsLoading,
        setAttemptsLoading,
    ] = useState(true);

    const [
        progressError,
        setProgressError,
    ] = useState<string | null>(
        null,
    );

    const [
        activitiesError,
        setActivitiesError,
    ] = useState<string | null>(
        null,
    );

    const [
        attemptsError,
        setAttemptsError,
    ] = useState<string | null>(
        null,
    );

    const [
        selectedHistory,
        setSelectedHistory,
    ] = useState<{
        activity: StudentActivity;
        attempt: ActivityAttempt;
        attemptNumber: number;
    } | null>(null);

    useEffect(() => {
        if (!user) {
            setProfileLoading(false);
            setProgressLoading(false);
            return;
        }

        const studentId = user.uid;

        let isMounted = true;

        async function loadStudentData() {
            setProfileLoading(true);
            setProgressLoading(true);
            setProgressError(null);

            try {
                const [
                    existingGamificationProfile,
                    existingProgress,
                    existingStudentAchievements,
                ] = await Promise.all([
                    getGamificationProfileByStudentId(
                        studentId,
                    ),
                    getProgressByStudentId(
                        studentId,
                    ),
                    getStudentAchievements(
                        studentId,
                    ),
                ]);

                let resolvedGamificationProfile =
                    existingGamificationProfile;

                if (
                    !resolvedGamificationProfile
                ) {
                    await initializeGamificationProfile(
                        studentId,
                    );

                    resolvedGamificationProfile =
                        await getGamificationProfileByStudentId(
                            studentId,
                        );
                }

                if (!isMounted) {
                    return;
                }

                setGamificationProfile(
                    resolvedGamificationProfile,
                );

                setStudentAchievements(
                    existingStudentAchievements,
                );

                setStudentProgress(
                    existingProgress,
                );
            } catch (error) {
                console.error(
                    'No se pudieron cargar los datos del estudiante:',
                    error,
                );

                if (isMounted) {
                    setProgressError(
                        'No se pudo cargar tu progreso.',
                    );
                }
            } finally {
                if (isMounted) {
                    setProfileLoading(false);
                    setProgressLoading(false);
                }
            }
        }

        void loadStudentData();

        return () => {
            isMounted = false;
        };
    }, [user]);

    useEffect(() => {
        let isMounted = true;

        async function loadActivities() {
            try {
                setActivitiesLoading(true);
                setActivitiesError(null);

                const data =
                    await getStudentActivities();

                if (isMounted) {
                    setActivities(data);
                }
            } catch (error) {
                console.error(
                    'No se pudieron cargar las actividades:',
                    error,
                );

                if (isMounted) {
                    setActivitiesError(
                        'No se pudieron cargar las actividades.',
                    );
                }
            } finally {
                if (isMounted) {
                    setActivitiesLoading(false);
                }
            }
        }

        void loadActivities();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (
            activitiesLoading ||
            activities.length === 0
        ) {
            if (!activitiesLoading) {
                setAttemptsLoading(false);
            }

            return;
        }

        let isMounted = true;

        async function loadAttempts() {
            try {
                setAttemptsLoading(true);
                setAttemptsError(null);

                const results =
                    await Promise.all(
                        activities.map(
                            async (activity) => {
                                const response =
                                    await listActivityAttempts(
                                        activity.id,
                                    );

                                return [
                                    activity.id,
                                    response.attempts,
                                ] as const;
                            },
                        ),
                    );

                if (!isMounted) {
                    return;
                }

                const groupedAttempts: Record<
                    string,
                    ActivityAttempt[]
                > = {};

                for (
                    const [
                        activityId,
                        attempts,
                    ] of results
                ) {
                    groupedAttempts[
                        activityId
                    ] = attempts;
                }

                setAttemptsByActivity(
                    groupedAttempts,
                );
            } catch (error) {
                console.error(
                    'No se pudieron cargar los intentos del estudiante:',
                    error,
                );

                if (isMounted) {
                    setAttemptsError(
                        'No se pudieron cargar los resultados de tus actividades.',
                    );
                }
            } finally {
                if (isMounted) {
                    setAttemptsLoading(false);
                }
            }
        }

        void loadAttempts();

        return () => {
            isMounted = false;
        };
    }, [
        activities,
        activitiesLoading,
    ]);

    function handlePlayActivity(
        activityId: string,
    ) {
        navigate(
            `/student/activity/${activityId}`,
        );
    }

    function getLatestAttempt(
        activityId: string,
    ): ActivityAttempt | null {
        const attempts =
            attemptsByActivity[
            activityId
            ];

        if (
            !attempts ||
            attempts.length === 0
        ) {
            return null;
        }

        return attempts[0];
    }

    const historyEntries = useMemo(() => {
        return activities
            .flatMap((activity) => {
                const attempts =
                    attemptsByActivity[
                    activity.id
                    ] ?? [];

                return attempts.map(
                    (
                        attempt,
                        index,
                    ) => ({
                        activity,
                        attempt,
                        attemptNumber:
                            attempts.length -
                            index,
                    }),
                );
            })
            .sort((first, second) => {
                const firstDate =
                    getAttemptDate(
                        first.attempt,
                    )?.getTime() ?? 0;

                const secondDate =
                    getAttemptDate(
                        second.attempt,
                    )?.getTime() ?? 0;

                return secondDate - firstDate;
            });
    }, [
        activities,
        attemptsByActivity,
    ]);

    const dailyAttempts =
        useMemo(() => {
            return Object.values(
                attemptsByActivity,
            )
                .flat()
                .filter((attempt) =>
                    isToday(
                        getAttemptDate(
                            attempt,
                        ),
                    ),
                );
        }, [attemptsByActivity]);

    const dailyCorrectAnswers =
        useMemo(() => {
            return dailyAttempts.reduce(
                (
                    total,
                    attempt,
                ) =>
                    total +
                    Math.max(
                        attempt.correctAnswers ??
                        0,
                        0,
                    ),
                0,
            );
        }, [dailyAttempts]);

    const dailyDistinctActivities =
        useMemo(() => {
            return new Set(
                dailyAttempts.map(
                    (attempt) =>
                        attempt.activityId,
                ),
            ).size;
        }, [dailyAttempts]);

    const correctAnswersChallenge =
        Math.min(
            dailyCorrectAnswers,
            20,
        );

    const correctAnswersPercentage =
        clampPercentage(
            (
                correctAnswersChallenge /
                20
            ) * 100,
        );

    const distinctActivitiesChallenge =
        Math.min(
            dailyDistinctActivities,
            3,
        );

    const distinctActivitiesPercentage =
        clampPercentage(
            (
                distinctActivitiesChallenge /
                3
            ) * 100,
        );

    const studentName =
        profile?.displayName
            ?.split(' ')[0] ||
        'Estudiante';

    const totalXP =
        gamificationProfile?.totalXP ??
        0;

    const level =
        gamificationProfile?.level ??
        1;

    const coins =
        gamificationProfile?.coins ??
        0;

    const currentStreak =
        gamificationProfile?.currentStreak ??
        0;

    const nextLevelXP =
        Math.max(
            level * 400,
            400,
        );

    const remainingXP =
        Math.max(
            nextLevelXP - totalXP,
            0,
        );

    const xpProgressPercentage =
        Math.min(
            (totalXP / nextLevelXP) * 100,
            100,
        );

    const subjectProgress =
        useMemo(
            () => {
                return subjectDefinitions.map(
                    (subject) => {
                        const progress =
                            studentProgress?.subjects?.[
                            subject.key
                            ];

                        const percentage =
                            clampPercentage(
                                progress?.percentage ??
                                0,
                            );

                        return {
                            ...subject,
                            percentage,
                            level:
                                getProgressLabel(
                                    percentage,
                                ),
                            activitiesCompleted:
                                progress
                                    ?.activitiesCompleted ??
                                0,
                            passedActivities:
                                progress
                                    ?.passedActivities ??
                                0,
                            totalScore:
                                progress
                                    ?.totalScore ??
                                0,
                            totalPoints:
                                progress
                                    ?.totalPoints ??
                                0,
                        };
                    },
                );
            },
            [studentProgress],
        );

    const overallProgress =
        useMemo(
            () => {
                const subjects =
                    subjectProgress.filter(
                        (subject) =>
                            subject.totalPoints >
                            0,
                    );

                if (
                    subjects.length ===
                    0
                ) {
                    return {
                        percentage: 0,
                        activitiesCompleted: 0,
                        passedActivities: 0,
                        totalScore: 0,
                        totalPoints: 0,
                    };
                }

                const totalScore =
                    subjects.reduce(
                        (
                            total,
                            subject,
                        ) =>
                            total +
                            subject.totalScore,
                        0,
                    );

                const totalPoints =
                    subjects.reduce(
                        (
                            total,
                            subject,
                        ) =>
                            total +
                            subject.totalPoints,
                        0,
                    );

                const activitiesCompleted =
                    subjects.reduce(
                        (
                            total,
                            subject,
                        ) =>
                            total +
                            subject.activitiesCompleted,
                        0,
                    );

                const passedActivities =
                    subjects.reduce(
                        (
                            total,
                            subject,
                        ) =>
                            total +
                            subject.passedActivities,
                        0,
                    );

                const percentage =
                    totalPoints > 0
                        ? Math.round(
                            (
                                totalScore /
                                totalPoints
                            ) * 100,
                        )
                        : 0;

                return {
                    percentage:
                        clampPercentage(
                            percentage,
                        ),
                    activitiesCompleted,
                    passedActivities,
                    totalScore,
                    totalPoints,
                };
            },
            [subjectProgress],
        );

    const selectedAnswerResults =
        selectedHistory &&
            Array.isArray(
                selectedHistory.attempt.answerResults,
            )
            ? selectedHistory.attempt.answerResults
            : [];

    return (
        <div className="student-shell">
            <header className="student-header">
                <a
                    className="student-brand"
                    href="/student"
                    aria-label="Inicio de EduPlay"
                >
                    <span className="student-brand__mark">
                        🎮
                    </span>

                    <span>
                        Edu<span>Play</span>
                    </span>
                </a>

                <nav
                    className="student-header__nav"
                    aria-label="Navegación principal"
                >
                    <a
                        className="is-active"
                        href="#inicio"
                    >
                        ⌂ <span>Inicio</span>
                    </a>

                    <a href="#juegos">
                        🎮 <span>Juegos</span>
                    </a>

                    <a href="#retos">
                        🎯 <span>Retos</span>
                    </a>

                    <a href="#progreso">
                        ▥ <span>Progreso</span>
                    </a>

                    <a href="#historial">
                        📚 <span>Historial</span>
                    </a>
                </nav>

                <div className="student-header__account">
                    <span className="coin-balance">
                        🪙{' '}
                        {coins.toLocaleString(
                            'es-CO',
                        )}
                    </span>

                    <button
                        className="student-avatar"
                        type="button"
                        onClick={() =>
                            void logout()
                        }
                        title="Cerrar sesión"
                    >
                        {studentName
                            .slice(0, 1)
                            .toUpperCase()}
                    </button>
                </div>
            </header>

            <main
                className="student-dashboard"
                id="inicio"
            >
                <section className="student-welcome">
                    <div>
                        <p className="eyebrow">
                            TU AVENTURA DE HOY
                        </p>

                        <h1>
                            ¡Hola, {studentName}! 👋
                        </h1>

                        <p>
                            Sigue aprendiendo y alcanza
                            nuevas metas.
                        </p>
                    </div>

                    <div className="student-welcome__mascot">
                        🚀
                    </div>
                </section>

                <section className="student-stats">
                    <article className="student-stat card">
                        <span className="student-stat__icon student-stat__icon--purple">
                            ★
                        </span>

                        <div>
                            <span>
                                Nivel actual
                            </span>

                            <strong>
                                {level}
                            </strong>

                            <small>
                                {getProgressLabel(
                                    overallProgress.percentage,
                                )}
                            </small>
                        </div>
                    </article>

                    <article className="student-stat card">
                        <span className="student-stat__icon student-stat__icon--green">
                            ♜
                        </span>

                        <div>
                            <span>
                                XP total
                            </span>

                            <strong>
                                {totalXP.toLocaleString(
                                    'es-CO',
                                )}
                            </strong>

                            <small className="is-success">
                                Sigue aprendiendo
                            </small>
                        </div>
                    </article>

                    <article className="student-stat card">
                        <span className="student-stat__icon student-stat__icon--orange">
                            🔥
                        </span>

                        <div>
                            <span>
                                Racha
                            </span>

                            <strong>
                                {currentStreak} días
                            </strong>

                            <small>
                                ¡Sigue así!
                            </small>
                        </div>
                    </article>
                </section>

                <section
                    className="student-panel student-progress"
                    id="progreso"
                >
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">
                                TU CAMINO
                            </p>

                            <h2>
                                Tu progreso
                            </h2>
                        </div>

                        <strong>
                            {totalXP.toLocaleString(
                                'es-CO',
                            )}
                            {' / '}
                            {nextLevelXP.toLocaleString(
                                'es-CO',
                            )}{' '}
                            XP
                        </strong>
                    </div>

                    <div className="progress-track">
                        <span
                            style={{
                                width: `${xpProgressPercentage}%`,
                            }}
                        />
                    </div>

                    <p>
                        {profileLoading ||
                            progressLoading
                            ? 'Actualizando tu progreso...'
                            : (
                                <>
                                    Te faltan{' '}
                                    <strong>
                                        {remainingXP.toLocaleString(
                                            'es-CO',
                                        )}{' '}
                                        XP
                                    </strong>{' '}
                                    para subir al
                                    nivel{' '}
                                    {level + 1}.
                                </>
                            )}
                    </p>

                    {progressError && (
                        <p role="alert">
                            {progressError}
                        </p>
                    )}

                    {!progressLoading &&
                        !progressError && (
                            <p>
                                Actividades
                                completadas:{' '}
                                <strong>
                                    {
                                        overallProgress.activitiesCompleted
                                    }
                                </strong>
                                {' · '}
                                Aprobadas:{' '}
                                <strong>
                                    {
                                        overallProgress.passedActivities
                                    }
                                </strong>
                            </p>
                        )}
                </section>

                <section className="student-section">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">
                                ACTIVIDADES
                            </p>

                            <h2>
                                Actividades disponibles
                            </h2>
                        </div>
                    </div>

                    {activitiesLoading && (
                        <p>
                            Cargando actividades...
                        </p>
                    )}

                    {activitiesError && (
                        <p role="alert">
                            {activitiesError}
                        </p>
                    )}

                    {attemptsError && (
                        <p role="alert">
                            {attemptsError}
                        </p>
                    )}

                    {!activitiesLoading &&
                        !activitiesError &&
                        activities.length ===
                        0 && (
                            <p>
                                No hay actividades
                                disponibles
                                todavía.
                            </p>
                        )}

                    {!activitiesLoading &&
                        !activitiesError &&
                        activities.length > 0 && (
                            <div className="game-grid">
                                {activities.map(
                                    (activity) => {
                                        const latestAttempt =
                                            getLatestAttempt(
                                                activity.id,
                                            );

                                        const hasAttempt =
                                            latestAttempt !==
                                            null;

                                        return (
                                            <article
                                                className="game-card"
                                                key={
                                                    activity.id
                                                }
                                            >
                                                <div className="game-card__sparkle">
                                                    ✦
                                                </div>

                                                <div className="game-card__icon">
                                                    🎯
                                                </div>

                                                <p>
                                                    {activity.type ??
                                                        'Actividad'}
                                                </p>

                                                <h3>
                                                    {
                                                        activity.title
                                                    }
                                                </h3>

                                                {activity.description && (
                                                    <p>
                                                        {
                                                            activity.description
                                                        }
                                                    </p>
                                                )}

                                                {attemptsLoading ? (
                                                    <span>
                                                        Cargando resultado...
                                                    </span>
                                                ) : hasAttempt ? (
                                                    <>
                                                        <span>
                                                            {latestAttempt.passed
                                                                ? 'Actividad aprobada'
                                                                : 'Actividad no aprobada'}
                                                        </span>

                                                        <p>
                                                            Resultado:{' '}
                                                            <strong>
                                                                {
                                                                    latestAttempt.score
                                                                }
                                                                {' / '}
                                                                {
                                                                    latestAttempt.totalPoints
                                                                }
                                                            </strong>
                                                        </p>

                                                        <p>
                                                            Correctas:{' '}
                                                            {
                                                                latestAttempt.correctAnswers
                                                            }
                                                            {' de '}
                                                            {
                                                                latestAttempt.totalQuestions
                                                            }
                                                        </p>
                                                    </>
                                                ) : (
                                                    <span>
                                                        Actividad disponible
                                                    </span>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handlePlayActivity(
                                                            activity.id,
                                                        )
                                                    }
                                                >
                                                    {hasAttempt
                                                        ? 'Reintentar'
                                                        : 'Jugar'}
                                                </button>
                                            </article>
                                        );
                                    },
                                )}
                            </div>
                        )}
                </section>

                <section
                    className="student-section"
                    id="logros"
                >
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">
                                TUS RECOMPENSAS
                            </p>

                            <h2>
                                Logros desbloqueados
                            </h2>

                            <p>
                                Sigue jugando para conseguir
                                nuevos logros.
                            </p>
                        </div>

                        <strong>
                            {studentAchievements.length}{' '}
                            {studentAchievements.length === 1
                                ? 'logro'
                                : 'logros'}
                        </strong>
                    </div>

                    {studentAchievements.length === 0 ? (
                        <article className="student-panel">
                            <h3>
                                Todavía no tienes logros
                                desbloqueados.
                            </h3>

                            <p>
                                Completa actividades y alcanza
                                nuevas metas para conseguirlos.
                            </p>
                        </article>
                    ) : (
                        <div className="game-grid">
                            {studentAchievements.map(
                                (achievement) => {
                                    const definition =
                                        achievementDefinitions[
                                        achievement.achievementId
                                        ];

                                    return (
                                        <article
                                            className="game-card"
                                            key={achievement.id}
                                        >
                                            <div className="game-card__sparkle">
                                                ✦
                                            </div>

                                            <div className="game-card__icon">
                                                {definition?.icon ??
                                                    '🏅'}
                                            </div>

                                            <p>
                                                LOGRO
                                            </p>

                                            <h3>
                                                {definition?.name ??
                                                    achievement.achievementId}
                                            </h3>

                                            <p>
                                                {definition?.description ??
                                                    'Logro desbloqueado.'}
                                            </p>

                                            <span>
                                                ✓ Desbloqueado
                                            </span>
                                        </article>
                                    );
                                },
                            )}
                        </div>
                    )}
                </section>

                <section
                    className="student-section"
                    id="juegos"
                >
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">
                                EXPLORA Y APRENDE
                            </p>

                            <h2>
                                Juegos recomendados
                            </h2>
                        </div>

                        <a href="#juegos">
                            Ver todos
                        </a>
                    </div>

                    <div className="game-grid">
                        {games.map((game) => (
                            <article
                                className={`game - card game - card--${game.tone}`}
                                key={game.title}
                            >
                                <div className="game-card__sparkle">
                                    ✦
                                </div>

                                <div className="game-card__icon">
                                    {game.icon}
                                </div>

                                <p>
                                    {game.subtitle}
                                </p>

                                <h3>
                                    {game.title}
                                </h3>

                                <span>
                                    {game.level}
                                </span>

                                <button
                                    type="button"
                                >
                                    Jugar
                                </button>
                            </article>
                        ))}
                    </div>
                </section>

                <section
                    className="student-section"
                    id="retos"
                >
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">
                                RECOMPENSAS DE HOY
                            </p>

                            <h2>
                                Retos diarios
                            </h2>
                        </div>

                        <a href="#retos">
                            Ver todos
                        </a>
                    </div>

                    <div className="challenge-grid">
                        <article className="challenge-card">
                            <span>
                                🎯
                            </span>

                            <div>
                                <h3>
                                    Responde 20
                                    preguntas
                                    correctas
                                </h3>

                                <p>
                                    {
                                        correctAnswersChallenge
                                    }{' '}
                                    / 20
                                </p>

                                <div className="mini-progress">
                                    <i
                                        style={{
                                            width: `${correctAnswersPercentage}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <strong>
                                +25 XP
                            </strong>
                        </article>

                        <article className="challenge-card">
                            <span>
                                ⏱️
                            </span>

                            <div>
                                <h3>
                                    Juega 15
                                    minutos
                                    seguidos
                                </h3>

                                <p>
                                    Próximamente
                                </p>

                                <div className="mini-progress mini-progress--blue">
                                    <i
                                        style={{
                                            width: '0%',
                                        }}
                                    />
                                </div>
                            </div>

                            <strong>
                                +20 XP
                            </strong>
                        </article>

                        <article className="challenge-card">
                            <span>
                                ⭐
                            </span>

                            <div>
                                <h3>
                                    Completa 3
                                    actividades
                                    distintas
                                </h3>

                                <p>
                                    {
                                        distinctActivitiesChallenge
                                    }{' '}
                                    / 3
                                </p>

                                <div className="mini-progress mini-progress--orange">
                                    <i
                                        style={{
                                            width: `${distinctActivitiesPercentage}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <strong>
                                +30 XP
                            </strong>
                        </article>
                    </div>
                </section>

                <section className="student-section">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">
                                APRENDE A TU RITMO
                            </p>

                            <h2>
                                Tu progreso por materia
                            </h2>
                        </div>

                        <strong>
                            {overallProgress.percentage}%
                        </strong>
                    </div>

                    <div className="subject-grid">
                        {subjectProgress.map(
                            (subject) => (
                                <article
                                    className="subject-card"
                                    key={
                                        subject.name
                                    }
                                >
                                    <div>
                                        <h3>
                                            {
                                                subject.name
                                            }
                                        </h3>

                                        <strong>
                                            {
                                                subject.percentage
                                            }%
                                        </strong>

                                        <p>
                                            {
                                                subject.level
                                            }
                                        </p>

                                        <small>
                                            {
                                                subject.activitiesCompleted
                                            }{' '}
                                            actividades
                                            {' · '}
                                            {
                                                subject.passedActivities
                                            }{' '}
                                            aprobadas
                                        </small>
                                    </div>

                                    <div
                                        className={`subject - ring subject - ring--${subject.tone}`}
                                        style={{
                                            '--progress':
                                                `${subject.percentage * 3.6} deg`,
                                        } as CSSProperties}
                                    />
                                </article>
                            ),
                        )}
                    </div>
                </section>

                <section
                    className="student-section"
                    id="historial"
                >
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">
                                TU ACTIVIDAD
                            </p>

                            <h2>
                                Historial de actividades
                            </h2>

                            <p>
                                Revisa tus resultados y
                                vuelve a intentar las
                                actividades cuando quieras.
                            </p>
                        </div>

                        <strong>
                            {historyEntries.length}{' '}
                            {historyEntries.length === 1
                                ? 'intento'
                                : 'intentos'}
                        </strong>
                    </div>

                    {attemptsLoading && (
                        <p>
                            Cargando historial...
                        </p>
                    )}

                    {!attemptsLoading &&
                        attemptsError && (
                            <p role="alert">
                                {attemptsError}
                            </p>
                        )}

                    {!attemptsLoading &&
                        !attemptsError &&
                        historyEntries.length ===
                        0 && (
                            <article className="student-panel">
                                <h3>
                                    Todavía no tienes
                                    actividades
                                    realizadas.
                                </h3>

                                <p>
                                    Completa una actividad
                                    para que aparezca aquí
                                    tu historial.
                                </p>
                            </article>
                        )}

                    {!attemptsLoading &&
                        !attemptsError &&
                        historyEntries.length >
                        0 && (
                            <div className="game-grid">
                                {historyEntries.map(
                                    ({
                                        activity,
                                        attempt,
                                        attemptNumber,
                                    }) => {
                                        const attemptDate =
                                            getAttemptDate(
                                                attempt,
                                            );

                                        const percentage =
                                            attempt.totalPoints >
                                                0
                                                ? clampPercentage(
                                                    (
                                                        attempt.score /
                                                        attempt.totalPoints
                                                    ) * 100,
                                                )
                                                : 0;

                                        return (
                                            <article
                                                className="game-card"
                                                key={`${activity.id} -${attemptNumber}`}
                                            >
                                                <div className="game-card__sparkle">
                                                    ✦
                                                </div>

                                                <div className="game-card__icon">
                                                    {attempt.passed
                                                        ? '🏆'
                                                        : '📘'}
                                                </div>

                                                <p>
                                                    {getSubjectName(
                                                        activity.subjectId,
                                                    )}
                                                    {' · '}
                                                    Intento{' '}
                                                    {attemptNumber}
                                                </p>

                                                <h3>
                                                    {
                                                        activity.title
                                                    }
                                                </h3>

                                                <p>
                                                    {formatAttemptDate(
                                                        attemptDate,
                                                    )}
                                                </p>

                                                <p>
                                                    Resultado:{' '}
                                                    <strong>
                                                        {
                                                            attempt.score
                                                        }
                                                        {' / '}
                                                        {
                                                            attempt.totalPoints
                                                        }
                                                    </strong>
                                                    {' · '}
                                                    {percentage}%
                                                </p>

                                                <p>
                                                    Correctas:{' '}
                                                    <strong>
                                                        {
                                                            attempt.correctAnswers
                                                        }
                                                        {' de '}
                                                        {
                                                            attempt.totalQuestions
                                                        }
                                                    </strong>
                                                </p>

                                                <span>
                                                    {attempt.passed
                                                        ? '✓ Actividad aprobada'
                                                        : 'Actividad no aprobada'}
                                                </span>

                                                <div
                                                    style={{
                                                        display:
                                                            'flex',
                                                        gap: '0.75rem',
                                                        flexWrap:
                                                            'wrap',
                                                        marginTop:
                                                            '1rem',
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedHistory(
                                                                {
                                                                    activity,
                                                                    attempt,
                                                                    attemptNumber,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        Ver resultado
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handlePlayActivity(
                                                                activity.id,
                                                            )
                                                        }
                                                    >
                                                        Reintentar
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    },
                                )}
                            </div>
                        )}
                </section>
            </main>

            {selectedHistory && (
                <div
                    role="presentation"
                    onClick={() =>
                        setSelectedHistory(
                            null,
                        )
                    }
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                        background:
                            'rgba(15, 23, 42, 0.55)',
                    }}
                >
                    <article
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="student-result-title"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                        style={{
                            width: 'min(100%, 720px)',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '2rem',
                            borderRadius: '1.25rem',
                            background: 'white',
                            boxShadow:
                                '0 24px 80px rgba(15, 23, 42, 0.25)',
                        }}
                    >
                        <div className="section-heading">
                            <div>
                                <p className="eyebrow">
                                    RESULTADO
                                </p>

                                <h2 id="student-result-title">
                                    {
                                        selectedHistory
                                            .activity
                                            .title
                                    }
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedHistory(
                                        null,
                                    )
                                }
                                aria-label="Cerrar resultado"
                            >
                                ✕
                            </button>
                        </div>

                        <p>
                            {
                                getSubjectName(
                                    selectedHistory
                                        .activity
                                        .subjectId,
                                )
                            }
                        </p>

                        <p>
                            Intento{' '}
                            {
                                selectedHistory.attemptNumber
                            }
                            {' · '}
                            {formatAttemptDate(
                                getAttemptDate(
                                    selectedHistory.attempt,
                                ),
                            )}
                        </p>

                        <div className="student-stats">
                            <article className="student-stat card">
                                <div>
                                    <span>
                                        Puntuación
                                    </span>

                                    <strong>
                                        {
                                            selectedHistory
                                                .attempt
                                                .score
                                        }
                                        {' / '}
                                        {
                                            selectedHistory
                                                .attempt
                                                .totalPoints
                                        }
                                    </strong>
                                </div>
                            </article>

                            <article className="student-stat card">
                                <div>
                                    <span>
                                        Correctas
                                    </span>

                                    <strong>
                                        {
                                            selectedHistory
                                                .attempt
                                                .correctAnswers
                                        }
                                        {' / '}
                                        {
                                            selectedHistory
                                                .attempt
                                                .totalQuestions
                                        }
                                    </strong>
                                </div>
                            </article>
                        </div>

                        <p>
                            Estado:{' '}
                            <strong>
                                {selectedHistory.attempt
                                    .passed
                                    ? 'Actividad aprobada ✓'
                                    : 'Actividad no aprobada'}
                            </strong>
                        </p>

                        <section
                            style={{
                                marginTop: '1.5rem',
                            }}
                        >
                            <div
                                className="section-heading"
                                style={{
                                    marginBottom:
                                        '1rem',
                                }}
                            >
                                <div>
                                    <p className="eyebrow">
                                        DETALLE
                                    </p>

                                    <h3>
                                        Tus respuestas
                                    </h3>
                                </div>

                                <strong>
                                    {
                                        selectedAnswerResults.length
                                    }{' '}
                                    preguntas
                                </strong>
                            </div>

                            {selectedAnswerResults.length ===
                                0 ? (
                                <article className="student-panel">
                                    <p>
                                        No hay detalle de
                                        respuestas
                                        disponible para
                                        este intento.
                                    </p>
                                </article>
                            ) : (
                                <div
                                    style={{
                                        display: 'grid',
                                        gap: '1rem',
                                    }}
                                >
                                    {selectedAnswerResults.map(
                                        (
                                            result,
                                            index,
                                        ) => (
                                            <article
                                                key={`${selectedHistory.attempt.attemptId} -${result.questionId} -${index}`}
                                                style={{
                                                    padding:
                                                        '1rem',
                                                    border:
                                                        '1px solid #e2e8f0',
                                                    borderRadius:
                                                        '1rem',
                                                    background:
                                                        result.isCorrect
                                                            ? '#f0fdf4'
                                                            : '#fff7ed',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display:
                                                            'flex',
                                                        justifyContent:
                                                            'space-between',
                                                        alignItems:
                                                            'flex-start',
                                                        gap:
                                                            '1rem',
                                                        marginBottom:
                                                            '0.75rem',
                                                    }}
                                                >
                                                    <strong>
                                                        Pregunta{' '}
                                                        {index +
                                                            1}
                                                    </strong>

                                                    <span>
                                                        {result.isCorrect
                                                            ? '✓ Correcta'
                                                            : '✕ Incorrecta'}
                                                    </span>
                                                </div>

                                                <p>
                                                    <strong>
                                                        Respuesta:
                                                    </strong>{' '}
                                                    {formatAnswer(
                                                        result.answerText ??
                                                        result.answer,
                                                    )}
                                                </p>

                                                <p>
                                                    <strong>
                                                        Puntos:
                                                    </strong>{' '}
                                                    {
                                                        result.pointsEarned
                                                    }
                                                    {' / '}
                                                    {
                                                        result.pointsAvailable
                                                    }
                                                </p>

                                                <p
                                                    style={{
                                                        fontSize:
                                                            '0.8rem',
                                                        opacity:
                                                            0.65,
                                                        marginBottom:
                                                            0,
                                                    }}
                                                >
                                                    ID de pregunta:{' '}
                                                    {
                                                        result.questionId
                                                    }
                                                </p>
                                            </article>
                                        ),
                                    )}
                                </div>
                            )}
                        </section>

                        <div
                            style={{
                                display: 'flex',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                                marginTop: '1.5rem',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    handlePlayActivity(
                                        selectedHistory
                                            .activity.id,
                                    )
                                }
                            >
                                Reintentar actividad
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedHistory(
                                        null,
                                    )
                                }
                            >
                                Cerrar
                            </button>
                        </div>
                    </article>
                </div>
            )}
        </div>
    );
}

export default StudentDashboard;