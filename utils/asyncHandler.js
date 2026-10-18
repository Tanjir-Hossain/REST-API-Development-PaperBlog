/**
 * Wraps an async route handler so any rejected promise is forwarded to the
 * Express error middleware instead of crashing the request. Saves a
 * try/catch block in every controller.
 */
const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};

export default asyncHandler;
