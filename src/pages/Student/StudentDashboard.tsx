import {
    useEffect,
    useState,
    type CSSProperties,
} from 'react';

import { useAuth } from '../../features/auth/context/AuthContext';

import {
    getGamificationProfileByStudentId,
    initializeGamificationProfile,
} from '../../services/firebase/gamification';

import type {
    GamificationProfile,
    SubjectKey,
} from '../../types';

const games = [
    { title: 'Matemáticas', subtitle: 'Aventura numérica', icon: '➗', level: 'Nivel 4', tone: 'purple' },
    { title: 'Inglés', subtitle: 'English adventure', icon: 'ABC', level: 'Nivel 3', tone: 'blue' },
    { title: 'Ciencias', subtitle: 'Exploradores', icon: '🧪', level: 'Nivel 2', tone: 'green' },
    { title: 'Memoria', subtitle: 'Challenge', icon: '🧠', level: 'Nivel 3', tone: 'orange' },
];

const subjectDefinitions: Array<{
    key: SubjectKey;
    name: string;
    tone: string;
}> = [
        { key: 'mathematics', name: 'Matemáticas', tone: 'green' },
        { key: 'english', name: 'Inglés', tone: 'blue' },
        { key: 'science', name: 'Ciencias', tone: 'purple' },
        { key: 'history', name: 'Historia', tone: 'orange' },
    ];

const fallbackSubjects = {
    mathematics: { percentage: 80, level: 4, label: 'Avanzado' as const },
    english: { percentage: 65, level: 3, label: 'Intermedio' as const },
    science: { percentage: 50, level: 2, label: 'Básico' as const },
    history: { percentage: 40, level: 2, label: 'Básico' as const },
};

function StudentDashboard() {
    const { profile, user, logout } = useAuth();

    const [gamificationProfile, setGamificationProfile] =
        useState<GamificationProfile | null>(null);

    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setProfileLoading(false);
            return;
        }

        let isMounted = true;

        async function loadGamificationProfile() {
            try {
                let profileData =
                    await getGamificationProfileByStudentId(
                        user.uid,
                    );

                if (!profileData) {
                    await initializeGamificationProfile(
                        user.uid,
                    );

                    profileData =
                        await getGamificationProfileByStudentId(
                            user.uid,
                        );
                }

                if (isMounted) {
                    setGamificationProfile(profileData);
                }
            } catch (error) {
                console.error(
                    'No se pudo cargar el perfil de gamificación:',
                    error,
                );
            } finally {
                if (isMounted) {
                    setProfileLoading(false);
                }
            }
        }

        void loadGamificationProfile();

        return () => {
            isMounted = false;
        };
    }, [user]);

    const studentName =
        profile?.displayName?.split(' ')[0] || 'Sofía';

    const totalXP = gamificationProfile?.totalXP ?? 1250;
    const level = gamificationProfile?.level ?? 4;
    const coins = gamificationProfile?.coins ?? 1250;
    const currentStreak =
        gamificationProfile?.currentStreak ?? 5;

    const nextLevelXP = Math.max(level * 400, 400);
    const remainingXP = Math.max(nextLevelXP - totalXP, 0);
    const progressPercentage = Math.min(
        (totalXP / nextLevelXP) * 100,
        100,
    );

    const subjects = subjectDefinitions.map((subject) => {
        const subjectProgress =
            gamificationProfile?.subjects[subject.key]
            ?? fallbackSubjects[subject.key];

        return {
            ...subject,
            progress: subjectProgress.percentage,
            level: subjectProgress.label,
        };
    });

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
                    <a className="is-active" href="#inicio">
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
                </nav>

                <div className="student-header__account">
                    <span className="coin-balance">
                        🪙 {coins.toLocaleString('es-CO')}
                    </span>

                    <button
                        className="student-avatar"
                        type="button"
                        onClick={() => void logout()}
                        title="Cerrar sesión"
                    >
                        {studentName.slice(0, 1).toUpperCase()}
                    </button>
                </div>
            </header>

            <main className="student-dashboard" id="inicio">
                <section className="student-welcome">
                    <div>
                        <p className="eyebrow">
                            TU AVENTURA DE HOY
                        </p>
                        <h1>¡Hola, {studentName}! 👋</h1>
                        <p>
                            Sigue aprendiendo y alcanza nuevas metas.
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
                            <span>Nivel actual</span>
                            <strong>{level}</strong>
                            <small>Avanzado</small>
                        </div>
                    </article>

                    <article className="student-stat card">
                        <span className="student-stat__icon student-stat__icon--green">
                            ♜
                        </span>
                        <div>
                            <span>XP total</span>
                            <strong>
                                {totalXP.toLocaleString('es-CO')}
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
                            <span>Racha</span>
                            <strong>{currentStreak} días</strong>
                            <small>¡Sigue así!</small>
                        </div>
                    </article>
                </section>

                <section
                    className="student-panel student-progress"
                    id="progreso"
                >
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">TU CAMINO</p>
                            <h2>Tu progreso</h2>
                        </div>

                        <strong>
                            {totalXP.toLocaleString('es-CO')}
                            {' / '}
                            {nextLevelXP.toLocaleString('es-CO')} XP
                        </strong>
                    </div>

                    <div className="progress-track">
                        <span
                            style={{
                                width: `${progressPercentage}%`,
                            }}
                        />
                    </div>

                    <p>
                        {profileLoading
                            ? 'Actualizando tu progreso...'
                            : (
                                <>
                                    Te faltan{' '}
                                    <strong>
                                        {remainingXP.toLocaleString('es-CO')} XP
                                    </strong>{' '}
                                    para subir al nivel {level + 1}.
                                </>
                            )}
                    </p>
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
                            <h2>Juegos recomendados</h2>
                        </div>
                        <a href="#juegos">Ver todos</a>
                    </div>

                    <div className="game-grid">
                        {games.map((game) => (
                            <article
                                className={`game-card game-card--${game.tone}`}
                                key={game.title}
                            >
                                <div className="game-card__sparkle">
                                    ✦
                                </div>

                                <div className="game-card__icon">
                                    {game.icon}
                                </div>

                                <p>{game.subtitle}</p>
                                <h3>{game.title}</h3>
                                <span>{game.level}</span>

                                <button type="button">
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
                            <h2>Retos diarios</h2>
                        </div>
                        <a href="#retos">Ver todos</a>
                    </div>

                    <div className="challenge-grid">
                        <article className="challenge-card">
                            <span>🎯</span>
                            <div>
                                <h3>
                                    Responde 20 preguntas correctas
                                </h3>
                                <p>15 / 20</p>
                                <div className="mini-progress">
                                    <i style={{ width: '75%' }} />
                                </div>
                            </div>
                            <strong>+25 XP</strong>
                        </article>

                        <article className="challenge-card">
                            <span>⏱️</span>
                            <div>
                                <h3>
                                    Juega 15 minutos seguidos
                                </h3>
                                <p>10 / 15 min</p>
                                <div className="mini-progress mini-progress--blue">
                                    <i style={{ width: '66%' }} />
                                </div>
                            </div>
                            <strong>+20 XP</strong>
                        </article>

                        <article className="challenge-card">
                            <span>⭐</span>
                            <div>
                                <h3>
                                    Completa 3 juegos distintos
                                </h3>
                                <p>2 / 3</p>
                                <div className="mini-progress mini-progress--orange">
                                    <i style={{ width: '66%' }} />
                                </div>
                            </div>
                            <strong>+30 XP</strong>
                        </article>
                    </div>
                </section>

                <section className="student-section">
                    <div className="section-heading">
                        <div>
                            <p className="eyebrow">
                                APRENDE A TU RITMO
                            </p>
                            <h2>Tu progreso por materia</h2>
                        </div>
                    </div>

                    <div className="subject-grid">
                        {subjects.map((subject) => (
                            <article
                                className="subject-card"
                                key={subject.name}
                            >
                                <div>
                                    <h3>{subject.name}</h3>
                                    <strong>
                                        {subject.progress}%
                                    </strong>
                                    <p>{subject.level}</p>
                                </div>

                                <div
                                    className={`subject-ring subject-ring--${subject.tone}`}
                                    style={{
                                        '--progress':
                                            `${subject.progress * 3.6}deg`,
                                    } as CSSProperties}
                                />
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default StudentDashboard;