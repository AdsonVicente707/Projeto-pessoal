// Middleware para tratar rotas não encontradas (404)
const notFound = (req, res, next) => {
  const error = new Error(`Não encontrado - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware para tratar todos os outros erros
const errorHandler = (err, req, res, next) => {
  // Às vezes, um erro pode vir com um status code 200, o que não faz sentido.
  // Se o status code for 200, mudamos para 500 (Internal Server Error).
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  res.json({
    message: err.message,
    // Incluímos o stack trace apenas em ambiente de desenvolvimento para depuração.
    // Em produção, não queremos expor detalhes internos do servidor.
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };