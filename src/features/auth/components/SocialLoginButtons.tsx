function SocialLoginButtons() {
    return (
        <div className="social-login">
            <button type="button" className="social-login__button">
                <span aria-hidden="true">G</span>
                Continuar con Google
            </button>

            <button type="button" className="social-login__button">
                <span aria-hidden="true">f</span>
                Continuar con Facebook
            </button>

            <button type="button" className="social-login__button">
                <span aria-hidden="true">M</span>
                Continuar con Microsoft
            </button>
        </div>
    );
}

export default SocialLoginButtons;