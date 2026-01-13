document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginErrorMessage = document.getElementById('login-error-message');
    const registerErrorMessage = document.getElementById('register-error-message');

    const API_URL = '/api';

    // Alternar entre as telas de login e cadastro
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        registerView.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerView.style.display = 'none';
        loginView.style.display = 'block';
    });

    // Lógica de Login
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Algo deu errado');
            }

            // Salva os dados no localStorage e redireciona
            localStorage.setItem('userInfo', JSON.stringify(data));
            window.location.href = 'index.html';

        } catch (error) {
            loginErrorMessage.textContent = error.message;
            loginErrorMessage.style.display = 'block';
        }
    });

    // Lógica de Cadastro
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const res = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Algo deu errado');
            }

            // Salva os dados no localStorage e redireciona
            localStorage.setItem('userInfo', JSON.stringify(data));
            window.location.href = 'index.html';

        } catch (error) {
            registerErrorMessage.textContent = error.message;
            registerErrorMessage.style.display = 'block';
        }
    });

    // Se o usuário já estiver logado, redireciona para a página principal
    const storedUser = JSON.parse(localStorage.getItem('userInfo'));
    if (storedUser && storedUser.token) {
        window.location.href = 'index.html';
    }
});