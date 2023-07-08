export class AppError extends Error {
  constructor(message, params) {
    super(message);
    this.params = params;
  }
}
AppError.prototype.name = "AppError";

export default AppError;
