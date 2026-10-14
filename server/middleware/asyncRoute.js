/**
 * Wrap an async route handler so a thrown error or rejected promise reaches the
 * error handler in server.js. Express 4 doesn't do this on its own, and an
 * unhandled rejection would otherwise crash the server.
 */
const asyncRoute = handler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncRoute;
