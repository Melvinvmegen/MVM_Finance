export default class AppError extends Error {
  constructor(message: string, params: string) {
    super(message);
    this.params = params;
  }
}
AppError.prototype.name = "AppError";
