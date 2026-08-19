import type { ReactNode } from 'react';

interface AuthCardProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer: ReactNode;
}

function AuthCard({
    title,
    subtitle,
    children,
    footer,
}: AuthCardProps) {
    return (
        <section className="auth-card">
            <div className="auth-card__header">
                <h1>{title}</h1>

                <p>{subtitle}</p>
            </div>

            {children}

            <div className="auth-card__footer">
                {footer}
            </div>
        </section>
    );
}

export default AuthCard;