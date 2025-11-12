document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (event) => {
        // Impede o envio padrão do formulário
        event.preventDefault();

        // Remove espaços em branco do início e do fim dos valores
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Verifica se algum dos campos está vazio
        if (email === '' || password === '') {
            errorMessage.textContent = 'Por favor, preencha o email e a senha.';
            errorMessage.style.display = 'block'; // Torna a mensagem de erro visível
        } else {
            // Se ambos os campos estiverem preenchidos, esconde a mensagem de erro
            errorMessage.style.display = 'none';
            
            // Efetivamente envia o formulário (neste caso, redireciona para index.html)
            loginForm.submit();
        }
    });
});