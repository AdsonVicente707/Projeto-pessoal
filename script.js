document.addEventListener('DOMContentLoaded', function() {
  const menuItems = document.querySelectorAll('.sidebar nav li');

  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove a classe 'active' de todos os itens
      menuItems.forEach(i => i.classList.remove('active'));

      // Adiciona a classe 'active' apenas ao item clicado
      this.classList.add('active');
    });
  });
});