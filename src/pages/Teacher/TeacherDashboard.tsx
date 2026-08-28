import {
    useState,
} from 'react';

import {
    createActivity,
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

function createQuestion(
    index: number,
): QuestionForm {
    return {
        id:
            `question - ${index}`,

        text:
            '',

        points:
            5,

        options: [
            {
                id:
                    `option - ${index} -a`,

                text:
                    '',
            },
            {
                id:
                    `option - ${index} -b`,

                text:
                    '',
            },
        ],

        correctAnswer:
            `option - ${index} -a`,
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

    function updateQuestion(
        questionIndex: number,
        changes: Partial<QuestionForm>,
    ) {
        setQuestions(
            (current) =>
                current.map(
                    (question, index) =>
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
                    (question, index) => {
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
                    (_, index) =>
                        index !==
                        questionIndex,
                ),
        );
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
            passingScore < 0
            || !Number.isFinite(
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
                )
                || question.points <= 0
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
                        description.trim()
                        || undefined,

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

                    isPublished:
                        true,
                });

            setMessage(
                `Actividad creada correctamente.ID: ${result.activityId}`,
            );

            setTitle('');
            setDescription('');
            setPassingScore(6);
            setQuestions([
                createQuestion(1),
            ]);
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

    return (
        <main>
            <h1>
                EduPlay — Docente
            </h1>

            <p>
                Crear actividad
            </p>

            <section>
                <div>
                    <label htmlFor="activity-title">
                        Título
                    </label>

                    <input
                        id="activity-title"
                        type="text"
                        value={title}
                        onChange={(event) =>
                            setTitle(
                                event.target.value,
                            )
                        }
                        disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
                    />
                </div>
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
                                    htmlFor={
                                        `question - ${questionIndex}`
                                    }
                                >
                                    Texto de la pregunta
                                </label>

                                <input
                                    id={
                                        `question - ${questionIndex}`
                                    }
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
                                    htmlFor={
                                        `points - ${questionIndex}`
                                    }
                                >
                                    Puntos
                                </label>

                                <input
                                    id={
                                        `points - ${questionIndex}`
                                    }
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
                                            htmlFor={
                                                `${question.id} -${option.id}`
                                            }
                                        >
                                            Opción{' '}
                                            {optionIndex + 1}
                                        </label>

                                        <input
                                            id={
                                                `${question.id} -${option.id}`
                                            }
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
                                                name={
                                                    `correct - ${question.id}`
                                                }
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

            <hr />

            <section>
                <button
                    type="button"
                    onClick={
                        handleCreateActivity
                    }
                    disabled={
                        loading
                    }
                >
                    {loading
                        ? 'Creando actividad...'
                        : 'Crear actividad'}
                </button>

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
        </main>
    );
}

export default TeacherDashboard;
