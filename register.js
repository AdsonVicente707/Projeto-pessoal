document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault(); // Impede o recarregamento da página

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitButton = this.querySelector('button[type="submit"]');

    // Validação simples
    if (!name || !email || !password) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Criando conta...';

        // Conecta com o Backend (Ajuste a porta 5000 se necessário)
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Sucesso: Salva os dados do usuário (token) no navegador
            localStorage.setItem('userInfo', JSON.stringify(data));
            alert('Conta criada com sucesso!');
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Erro ao criar conta. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão com o servidor. Verifique se o backend está rodando.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Criar Conta';
    }
});