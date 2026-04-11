const errorHandler = (err, req, res, next) => {
  console.error("DEBUG [Backend Error]:", err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    message: message,
    error: err.toString(),
    stack: err.stack, // Temporarily always include stack for quick diagnosis
    details: err.errors // For Zod validation errors
  });
};


module.exports = errorHandler;
