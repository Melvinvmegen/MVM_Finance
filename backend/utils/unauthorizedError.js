export default class UnauthorizedError extends Error {
  constructor(message, params = {}) {
    super(message);
    this.params = params;
  }
}
UnauthorizedError.prototype.name = "UnauthorizedError";
