export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  const payload = {
    message: status === 500 ? "Something went wrong" : error.message
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && status === 500) {
    payload.debug = error.message;
  }

  res.status(status).json(payload);
}
