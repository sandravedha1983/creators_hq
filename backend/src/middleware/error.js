const errorHandler = (err, req, res, next) => {
  console.error("DEBUG [Backend Error]:", err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  const response = {
    success: false,
    message: message,
    error: err.toString(),
    details: err.errors // For Zod validation errors
  };

  // Only include stack trace in development — security risk in production
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};


module.exports = errorHandler;
