import {
    useEffect,
    useState,
} from 'react';

import {
    createActivity,
    getTeacherActivity,
    listActivityAttempts,
    listTeacherActivities,
    updateActivity,
    type ActivityAttempt,
    type TeacherActivity,
} from '../../services/firebase/activities';

interface QuestionOption {
    id: string;
    text: string;
}

interface QuestionForm {
    id: string;
    text: string;
    points: number;
    options: QuestionOption[];
    correctAnswer: string;
}

function createUniqueId(prefix: string): string {
    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
}

function createQuestion(index: number): QuestionForm {
    const questionId = createUniqueId(
        `question-${index}`,
    );

    const optionAId = `${questionId}-option-a`;
    const optionBId = `${questionId}-option-b`;

    return {
        id: questionId,
        text: '',
        points: 5,
        options: [
            {
                id: optionAId,
                text: '',
            },
            {
                id: optionBId,
                text: '',
            },
        ],
        correctAnswer: optionAId,
    };
}

function TeacherDashboard() {
    const [
        title,
        setTitle,
    ] = useState('');

    const [
        description,
        setDescription,
    ] = useState('');

    const [
        subjectId,
        setSubjectId,
    ] = useState('mathematics');

    const [
        passingScore,
        setPassingScore,
    ] = useState(6);

    const [
        isPublished,
        setIsPublished,
    ] = useState(false);

    const [
        questions,
        setQuestions,
    ] = useState<QuestionForm[]>([
        createQuestion(1),
    ]);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        message,
        setMessage,
    ] = useState('');

    const [
        error,
        setError,
    ] = useState('');

    const [
        activities,
        setActivities,
    ] = useState<TeacherActivity[]>([]);

    const [
        activitiesLoading,
        setActivitiesLoading,
    ] = useState(true);

    const [
        activitiesError,
        setActivitiesError,
    ] = useState('');

    const [
        editingActivityId,
        setEditingActivityId,
    ] = useState<string | null>(null);

    const [
        attemptsByActivity,
        setAttemptsByActivity,
    ] = useState<
        Record<string, ActivityAttempt[]>
    >({});

    const [
        resultsLoadingActivityId,
        setResultsLoadingActivityId,
    ] = useState<string | null>(null);

    const [
        resultsErrorByActivity,
        setResultsErrorByActivity,
    ] = useState<
        Record<string, string>
    >({});

    const [
        openResultsActivityId,
        setOpenResultsActivityId,
    ] = useState<string | null>(null);

    const [
        publishingActivityId,
        setPublishingActivityId,
    ] = useState<string | null>(null);

    async function loadTeacherActivities() {
        setActivitiesLoading(true);
        setActivitiesError('');

        try {
            const result =
                await listTeacherActivities();

            setActivities(
                result.activities,
            );
        } catch (err) {
            console.error(
                'Error cargando actividades del docente:',
                err,
            );

            setActivitiesError(
                err instanceof Error
                    ? err.message
                    : 'No se pudieron cargar tus actividades.',
            );
        } finally {
            setActivitiesLoading(false);
        }
    }

    useEffect(() => {
        void loadTeacherActivities();
    }, []);

    async function loadActivityAttempts(
        activityId: string,
    ) {
        setResultsLoadingActivityId(
            activityId,
        );

        setResultsErrorByActivity(
            (current) => {
                const next = {
                    ...current,
                };

                delete next[activityId];

                return next;
            },
        );

        try {
            const result =
                await listActivityAttempts(
                    activityId,
                );

            setAttemptsByActivity(
                (current) => ({
                    ...current,
                    [activityId]:
                        result.attempts,
                }),
            );

            setOpenResultsActivityId(
                activityId,
            );
        } catch (err) {
            console.error(
                'Error cargando resultados de la actividad:',
                err,
            );

            setResultsErrorByActivity(
                (current) => ({
                    ...current,
                    [activityId]:
                        err instanceof Error
                            ? err.message
                            : 'No se pudieron cargar los resultados.',
                }),
            );
        } finally {
            setResultsLoadingActivityId(
                null,
            );
        }
    }

    function toggleActivityResults(
        activityId: string,
    ) {
        if (
            openResultsActivityId ===
            activityId
        ) {
            setOpenResultsActivityId(
                null,
            );

            return;
        }

        void loadActivityAttempts(
            activityId,
        );
    }

    async function toggleActivityPublished(
        activity: TeacherActivity,
    ) {
        setMessage('');
        setError('');

        if (
            publishingActivityId !== null
        ) {
            return;
        }

        setPublishingActivityId(
            activity.id,
        );

        try {
            const result =
                await getTeacherActivity(
                    activity.id,
                );

            const questionsForUpdate =
                result.config.questions.map(
                    (
                        question,
                        index,
                    ) => {
                        const answer =
                            result.answerKey
                                .answers[
                            question.id
                            ];

                        const correctAnswer =
                            typeof answer ===
                                'string'
                                ? answer
                                : Array.isArray(
                                    answer,
                                )
                                    ? answer
                                    : '';

                        return {
                            id:
                                question.id ||
                                `question-${index + 1}`,
                            type:
                                'multiple-choice' as const,
                            text:
                                question.text.trim(),
                            options:
                                Array.isArray(
                                    question.options,
                                )
                                    ? question.options.map(
                                        (
                                            option,
                                        ) => ({
                                            id:
                                                option.id,
                                            text:
                                                option.text.trim(),
                                        }),
                                    )
                                    : [],
                            points:
                                typeof question.points ===
                                    'number'
                                    ? question.points
                                    : 1,
                            correctAnswer,
                            explanation:
                                question.explanation,
                        };
                    },
                );

            const nextPublished =
                !activity.isPublished;

            const updateResult =
                await updateActivity({
                    activityId:
                        activity.id,
                    title:
                        result.activity.title.trim(),
                    description:
                        result.activity.description?.trim() ||
                        undefined,
                    type:
                        'quiz',
                    subjectId:
                        result.activity.subjectId ||
                        'mathematics',
                    topicId:
                        result.activity.topicId ||
                        undefined,
                    questions:
                        questionsForUpdate,
                    timeLimitSeconds:
                        result.config.timeLimitSeconds,
                    shuffleQuestions:
                        result.config.shuffleQuestions,
                    shuffleOptions:
                        result.config.shuffleOptions,
                    passingScore:
                        result.config.passingScore ??
                        0,
                    isPublished:
                        nextPublished,
                });

            setActivities(
                (current) =>
                    current.map(
                        (
                            currentActivity,
                        ) =>
                            currentActivity.id ===
                                activity.id
                                ? {
                                    ...currentActivity,
                                    isPublished:
                                        updateResult.isPublished,
                                }
                                : currentActivity,
                    ),
            );

            setMessage(
                updateResult.isPublished
                    ? `Actividad "${activity.title}" publicada correctamente.`
                    : `Actividad "${activity.title}" despublicada correctamente.`,
            );
        } catch (err) {
            console.error(
                'Error cambiando el estado de publicación:',
                err,
            );

            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo cambiar el estado de publicación.',
            );
        } finally {
            setPublishingActivityId(
                null,
            );
        }
    }

    function updateQuestion(
        questionIndex: number,
        changes: Partial<QuestionForm>,
    ) {
        setQuestions(
            (current) =>
                current.map(
                    (
                        question,
                        index,
                    ) =>
                        index === questionIndex
                            ? {
                                ...question,
                                ...changes,
                            }
                            : question,
                ),
        );
    }

    function updateQuestionOption(
        questionIndex: number,
        optionIndex: number,
        text: string,
    ) {
        setQuestions(
            (current) =>
                current.map(
                    (
                        question,
                        index,
                    ) => {
                        if (
                            index !==
                            questionIndex
                        ) {
                            return question;
                        }

                        return {
                            ...question,
                            options:
                                question.options.map(
                                    (
                                        option,
                                        currentOptionIndex,
                                    ) =>
                                        currentOptionIndex ===
                                            optionIndex
                                            ? {
                                                ...option,
                                                text,
                                            }
                                            : option,
                                ),
                        };
                    },
                ),
        );
    }

    function addQuestion() {
        setQuestions(
            (current) => [
                ...current,
                createQuestion(
                    current.length + 1,
                ),
            ],
        );
    }

    function removeQuestion(
        questionIndex: number,
    ) {
        setQuestions(
            (current) =>
                current.filter(
                    (
                        _,
                        index,
                    ) =>
                        index !==
                        questionIndex,
                ),
        );
    }

    function resetForm() {
        setTitle('');
        setDescription('');
        setSubjectId('mathematics');
        setPassingScore(6);
        setIsPublished(false);

        setQuestions([
            createQuestion(1),
        ]);

        setEditingActivityId(null);
    }

    function validateForm(): string | null {
        if (!title.trim()) {
            return 'Escribe un título para la actividad.';
        }

        if (!subjectId) {
            return 'Selecciona una materia.';
        }

        if (questions.length === 0) {
            return 'Agrega al menos una pregunta.';
        }

        if (
            passingScore < 0 ||
            !Number.isFinite(
                passingScore,
            )
        ) {
            return 'El puntaje mínimo no es válido.';
        }

        for (
            let index = 0;
            index < questions.length;
            index += 1
        ) {
            const question =
                questions[index];

            if (!question.text.trim()) {
                return `La pregunta ${index + 1} no tiene texto.`;
            }

            if (
                !Number.isFinite(
                    question.points,
                ) ||
                question.points <= 0
            ) {
                return `Los puntos de la pregunta ${index + 1} deben ser mayores que cero.`;
            }

            if (
                question.options.length <
                2
            ) {
                return `La pregunta ${index + 1} necesita al menos dos opciones.`;
            }

            for (
                let optionIndex = 0;
                optionIndex <
                question.options.length;
                optionIndex += 1
            ) {
                if (
                    !question.options[
                        optionIndex
                    ].text.trim()
                ) {
                    return `La opción ${optionIndex + 1} de la pregunta ${index + 1} está vacía.`;
                }
            }

            const correctOptionExists =
                question.options.some(
                    (option) =>
                        option.id ===
                        question.correctAnswer,
                );

            if (
                !correctOptionExists
            ) {
                return `Selecciona una respuesta correcta para la pregunta ${index + 1}.`;
            }
        }

        const totalPoints =
            questions.reduce(
                (
                    total,
                    question,
                ) =>
                    total +
                    question.points,
                0,
            );

        if (
            passingScore >
            totalPoints
        ) {
            return `El puntaje mínimo no puede ser mayor que ${totalPoints}.`;
        }

        return null;
    }

    async function handleEditActivity(
        activityId: string,
    ) {
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const result =
                await getTeacherActivity(
                    activityId,
                );

            const loadedQuestions =
                result.config.questions.map(
                    (
                        question,
                        index,
                    ) => {
                        const questionAnswer =
                            result.answerKey
                                .answers[
                            question.id
                            ];

                        const correctAnswer =
                            typeof questionAnswer ===
                                'string'
                                ? questionAnswer
                                : Array.isArray(
                                    questionAnswer,
                                )
                                    ? questionAnswer[0] ??
                                    ''
                                    : '';

                        const loadedOptions =
                            Array.isArray(
                                question.options,
                            )
                                ? question.options.map(
                                    (
                                        option,
                                    ) => ({
                                        id:
                                            option.id,
                                        text:
                                            option.text,
                                    }),
                                )
                                : [];

                        return {
                            id:
                                question.id ||
                                `question-${index + 1}`,
                            text:
                                question.text,
                            points:
                                typeof question.points ===
                                    'number'
                                    ? question.points
                                    : 1,
                            options:
                                loadedOptions,
                            correctAnswer,
                        };
                    },
                );

            setEditingActivityId(
                result.activity.id,
            );

            setTitle(
                result.activity.title,
            );

            setDescription(
                result.activity.description ??
                '',
            );

            setSubjectId(
                result.activity.subjectId ??
                'mathematics',
            );

            setPassingScore(
                typeof result.config.passingScore ===
                    'number'
                    ? result.config.passingScore
                    : 0,
            );

            setIsPublished(
                result.activity.isPublished ===
                true,
            );

            setQuestions(
                loadedQuestions,
            );

            setMessage(
                'Actividad cargada para edición.',
            );
        } catch (err) {
            console.error(
                'Error cargando actividad para edición:',
                err,
            );

            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo cargar la actividad para editar.',
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateActivity() {
        setMessage('');
        setError('');

        const validationError =
            validateForm();

        if (validationError) {
            setError(
                validationError,
            );

            return;
        }

        setLoading(true);

        try {
            const result =
                await createActivity({
                    title:
                        title.trim(),
                    description:
                        description.trim() ||
                        undefined,
                    type:
                        'quiz',
                    subjectId,
                    questions:
                        questions.map(
                            (
                                question,
                            ) => ({
                                id:
                                    question.id,
                                type:
                                    'multiple-choice',
                                text:
                                    question.text.trim(),
                                options:
                                    question.options.map(
                                        (
                                            option,
                                        ) => ({
                                            id:
                                                option.id,
                                            text:
                                                option.text.trim(),
                                        }),
                                    ),
                                points:
                                    question.points,
                                correctAnswer:
                                    question.correctAnswer,
                            }),
                        ),
                    passingScore,
                    isPublished,
                });

            setMessage(
                isPublished
                    ? `Actividad creada y publicada correctamente. ID: ${result.activityId}`
                    : `Actividad guardada como borrador correctamente. ID: ${result.activityId}`,
            );

            resetForm();

            await loadTeacherActivities();
        } catch (err) {
            console.error(
                'Error creando actividad:',
                err,
            );

            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo crear la actividad.',
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateActivity() {
        if (
            !editingActivityId
        ) {
            return;
        }

        setMessage('');
        setError('');

        const validationError =
            validateForm();

        if (validationError) {
            setError(
                validationError,
            );

            return;
        }

        setLoading(true);

        try {
            const result =
                await updateActivity({
                    activityId:
                        editingActivityId,
                    title:
                        title.trim(),
                    description:
                        description.trim() ||
                        undefined,
                    type:
                        'quiz',
                    subjectId,
                    questions:
                        questions.map(
                            (
                                question,
                            ) => ({
                                id:
                                    question.id,
                                type:
                                    'multiple-choice',
                                text:
                                    question.text.trim(),
                                options:
                                    question.options.map(
                                        (
                                            option,
                                        ) => ({
                                            id:
                                                option.id,
                                            text:
                                                option.text.trim(),
                                        }),
                                    ),
                                points:
                                    question.points,
                                correctAnswer:
                                    question.correctAnswer,
                            }),
                        ),
                    passingScore,
                    isPublished,
                });

            setMessage(
                isPublished
                    ? `Actividad actualizada y publicada correctamente. ID: ${result.activityId}`
                    : `Actividad actualizada y guardada como borrador correctamente. ID: ${result.activityId}`,
            );

            resetForm();

            await loadTeacherActivities();
        } catch (err) {
            console.error(
                'Error actualizando actividad:',
                err,
            );

            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo actualizar la actividad.',
            );
        } finally {
            setLoading(false);
        }
    }

    function handleCancelEdit() {
        resetForm();

        setMessage(
            'Edición cancelada.',
        );

        setError('');
    }

    return (
        <main>
            <h1>
                EduPlay — Docente
            </h1>

            <section>
                <h2>
                    Mis actividades
                </h2>

                {activitiesLoading && (
                    <p>
                        Cargando actividades...
                    </p>
                )}

                {activitiesError && (
                    <p>
                        {activitiesError}
                    </p>
                )}

                {!activitiesLoading &&
                    !activitiesError &&
                    activities.length === 0 && (
                        <p>
                            Todavía no tienes actividades creadas.
                        </p>
                    )}

                {!activitiesLoading &&
                    !activitiesError &&
                    activities.length > 0 && (
                        <div>
                            {activities.map(
                                (
                                    activity,
                                ) => {
                                    const activityAttempts =
                                        attemptsByActivity[
                                        activity.id
                                        ] ?? [];

                                    const resultsOpen =
                                        openResultsActivityId ===
                                        activity.id;

                                    const resultsLoading =
                                        resultsLoadingActivityId ===
                                        activity.id;

                                    const resultsError =
                                        resultsErrorByActivity[
                                        activity.id
                                        ];

                                    const publishing =
                                        publishingActivityId ===
                                        activity.id;

                                    return (
                                        <article
                                            key={
                                                activity.id
                                            }
                                        >
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

                                            <p>
                                                Materia:{' '}
                                                {
                                                    activity.subjectId ??
                                                    'Sin materia'
                                                }
                                            </p>

                                            <p>
                                                Tipo:{' '}
                                                {
                                                    activity.type ??
                                                    'Sin tipo'
                                                }
                                            </p>

                                            <p>
                                                Estado:{' '}
                                                {activity.isPublished
                                                    ? 'Publicada'
                                                    : 'Borrador'}
                                            </p>

                                            <p>
                                                ID:{' '}
                                                {
                                                    activity.id
                                                }
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void toggleActivityPublished(
                                                        activity,
                                                    )
                                                }
                                                disabled={
                                                    loading ||
                                                    publishing
                                                }
                                            >
                                                {publishing
                                                    ? 'Guardando...'
                                                    : activity.isPublished
                                                        ? 'Despublicar'
                                                        : 'Publicar'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleActivityResults(
                                                        activity.id,
                                                    )
                                                }
                                                disabled={
                                                    loading ||
                                                    resultsLoading ||
                                                    publishing
                                                }
                                            >
                                                {resultsLoading
                                                    ? 'Cargando resultados...'
                                                    : resultsOpen
                                                        ? 'Ocultar resultados'
                                                        : 'Ver resultados'}
                                            </button>

                                            {resultsError && (
                                                <p>
                                                    {
                                                        resultsError
                                                    }
                                                </p>
                                            )}

                                            {resultsOpen && (
                                                <section>
                                                    <h4>
                                                        Resultados
                                                    </h4>

                                                    {activityAttempts.length ===
                                                        0 ? (
                                                        <p>
                                                            No hay intentos todavía.
                                                        </p>
                                                    ) : (
                                                        <div>
                                                            {activityAttempts.map(
                                                                (
                                                                    attempt,
                                                                ) => (
                                                                    <article
                                                                        key={
                                                                            attempt.attemptId
                                                                        }
                                                                    >
                                                                        <p>
                                                                            Estudiante:{' '}
                                                                            {
                                                                                attempt.studentId
                                                                            }
                                                                        </p>

                                                                        <p>
                                                                            Puntaje:{' '}
                                                                            {
                                                                                attempt.score
                                                                            }{' '}
                                                                            /{' '}
                                                                            {
                                                                                attempt.totalPoints
                                                                            }
                                                                        </p>

                                                                        <p>
                                                                            Respuestas correctas:{' '}
                                                                            {
                                                                                attempt.correctAnswers
                                                                            }{' '}
                                                                            /{' '}
                                                                            {
                                                                                attempt.totalQuestions
                                                                            }
                                                                        </p>

                                                                        <p>
                                                                            Resultado:{' '}
                                                                            {attempt.passed
                                                                                ? 'Aprobado'
                                                                                : 'No aprobado'}
                                                                        </p>

                                                                        <p>
                                                                            Estado:{' '}
                                                                            {
                                                                                attempt.status
                                                                            }
                                                                        </p>
                                                                    </article>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </section>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handleEditActivity(
                                                        activity.id,
                                                    )
                                                }
                                                disabled={
                                                    loading ||
                                                    publishing
                                                }
                                            >
                                                Editar
                                            </button>
                                        </article>
                                    );
                                },
                            )}
                        </div>
                    )}
            </section>

            <hr />

            <section>
                <h2>
                    {editingActivityId
                        ? 'Editar actividad'
                        : 'Crear actividad'}
                </h2>

                <div>
                    <label htmlFor="activity-title">
                        Título
                    </label>

                    <input
                        id="activity-title"
                        type="text"
                        value={
                            title
                        }
                        onChange={(event) =>
                            setTitle(
                                event.target.value,
                            )
                        }
                        disabled={
                            loading
                        }
                        placeholder="Ej. Matemáticas básicas"
                    />
                </div>

                <div>
                    <label htmlFor="activity-description">
                        Descripción
                    </label>

                    <textarea
                        id="activity-description"
                        value={
                            description
                        }
                        onChange={(event) =>
                            setDescription(
                                event.target.value,
                            )
                        }
                        disabled={
                            loading
                        }
                        placeholder="Describe brevemente la actividad"
                    />
                </div>

                <div>
                    <label htmlFor="activity-subject">
                        Materia
                    </label>

                    <select
                        id="activity-subject"
                        value={
                            subjectId
                        }
                        onChange={(event) =>
                            setSubjectId(
                                event.target.value,
                            )
                        }
                        disabled={
                            loading
                        }
                    >
                        <option value="mathematics">
                            Matemáticas
                        </option>

                        <option value="english">
                            Inglés
                        </option>

                        <option value="science">
                            Ciencias
                        </option>

                        <option value="history">
                            Historia
                        </option>
                    </select>
                </div>

                <div>
                    <label htmlFor="passing-score">
                        Puntaje mínimo
                    </label>

                    <input
                        id="passing-score"
                        type="number"
                        min="0"
                        value={
                            passingScore
                        }
                        onChange={(event) =>
                            setPassingScore(
                                Number(
                                    event.target.value,
                                ),
                            )
                        }
                        disabled={
                            loading
                        }
                    />
                </div>

                <div>
                    <label htmlFor="activity-status">
                        Estado
                    </label>

                    <select
                        id="activity-status"
                        value={
                            isPublished
                                ? 'published'
                                : 'draft'
                        }
                        onChange={(event) =>
                            setIsPublished(
                                event.target.value ===
                                'published',
                            )
                        }
                        disabled={
                            loading
                        }
                    >
                        <option value="draft">
                            Borrador
                        </option>

                        <option value="published">
                            Publicada
                        </option>
                    </select>
                </div>
            </section>

            <hr />

            <section>
                {editingActivityId ? (
                    <>
                        <button
                            type="button"
                            onClick={() =>
                                void handleUpdateActivity()
                            }
                            disabled={
                                loading
                            }
                        >
                            {loading
                                ? 'Guardando cambios...'
                                : isPublished
                                    ? 'Guardar cambios y publicar'
                                    : 'Guardar como borrador'}
                        </button>

                        <button
                            type="button"
                            onClick={
                                handleCancelEdit
                            }
                            disabled={
                                loading
                            }
                        >
                            Cancelar edición
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() =>
                            void handleCreateActivity()
                        }
                        disabled={
                            loading
                        }
                    >
                        {loading
                            ? 'Creando actividad...'
                            : isPublished
                                ? 'Crear y publicar'
                                : 'Guardar como borrador'}
                    </button>
                )}

                {message && (
                    <p>
                        {message}
                    </p>
                )}

                {error && (
                    <p>
                        {error}
                    </p>
                )}
            </section>

            <hr />

            <section>
                <h2>
                    Preguntas
                </h2>

                {questions.map(
                    (
                        question,
                        questionIndex,
                    ) => (
                        <article
                            key={
                                question.id
                            }
                        >
                            <h3>
                                Pregunta{' '}
                                {questionIndex + 1}
                            </h3>

                            <div>
                                <label
                                    htmlFor={`question-text-${question.id}`}
                                >
                                    Texto de la pregunta
                                </label>

                                <input
                                    id={`question-text-${question.id}`}
                                    type="text"
                                    value={
                                        question.text
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateQuestion(
                                            questionIndex,
                                            {
                                                text:
                                                    event.target.value,
                                            },
                                        )
                                    }
                                    disabled={
                                        loading
                                    }
                                    placeholder="Ej. ¿Cuánto es 2 + 2?"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor={`question-points-${question.id}`}
                                >
                                    Puntos
                                </label>

                                <input
                                    id={`question-points-${question.id}`}
                                    type="number"
                                    min="1"
                                    value={
                                        question.points
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        updateQuestion(
                                            questionIndex,
                                            {
                                                points:
                                                    Number(
                                                        event.target.value,
                                                    ),
                                            },
                                        )
                                    }
                                    disabled={
                                        loading
                                    }
                                />
                            </div>

                            <h4>
                                Opciones
                            </h4>

                            {question.options.map(
                                (
                                    option,
                                    optionIndex,
                                ) => (
                                    <div
                                        key={
                                            option.id
                                        }
                                    >
                                        <label
                                            htmlFor={`option-text-${option.id}`}
                                        >
                                            Opción{' '}
                                            {optionIndex + 1}
                                        </label>

                                        <input
                                            id={`option-text-${option.id}`}
                                            type="text"
                                            value={
                                                option.text
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                updateQuestionOption(
                                                    questionIndex,
                                                    optionIndex,
                                                    event.target.value,
                                                )
                                            }
                                            disabled={
                                                loading
                                            }
                                        />

                                        <label>
                                            <input
                                                type="radio"
                                                name={`correct-${question.id}`}
                                                checked={
                                                    question.correctAnswer ===
                                                    option.id
                                                }
                                                onChange={() =>
                                                    updateQuestion(
                                                        questionIndex,
                                                        {
                                                            correctAnswer:
                                                                option.id,
                                                        },
                                                    )
                                                }
                                                disabled={
                                                    loading
                                                }
                                            />

                                            Respuesta correcta
                                        </label>
                                    </div>
                                ),
                            )}

                            {questions.length >
                                1 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeQuestion(
                                                questionIndex,
                                            )
                                        }
                                        disabled={
                                            loading
                                        }
                                    >
                                        Eliminar pregunta
                                    </button>
                                )}
                        </article>
                    ),
                )}

                <button
                    type="button"
                    onClick={
                        addQuestion
                    }
                    disabled={
                        loading
                    }
                >
                    Agregar pregunta
                </button>
            </section>
        </main>
    );
}

export default TeacherDashboard;