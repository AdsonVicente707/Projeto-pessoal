const jwt = require('jsonwebtoken');
const User = require('../models/userModel.js');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Pega o token do cabeçalho (ex: "Bearer eyJhbGci...")
      token = req.headers.authorization.split(' ')[1];

      // Decodifica o token para obter o ID do usuário
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Busca o usuário no banco de dados pelo ID e anexa ao objeto req
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).send('Não autorizado, token falhou');
    }
  }

  if (!token) res.status(401).send('Não autorizado, sem token');
};

module.exports = { protect };