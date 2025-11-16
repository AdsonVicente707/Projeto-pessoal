const fs = require('fs');
const path = require('path');

const ensureUploadsDir = (req, res, next) => {
  // Define o caminho para o diretório de uploads
  const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

  // Verifica se o diretório não existe
  if (!fs.existsSync(uploadDir)) {
    // Cria o diretório recursivamente (cria 'public' e 'uploads' se necessário)
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  next(); // Continua para a próxima função (o controller da rota)
};

module.exports = ensureUploadsDir;