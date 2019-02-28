export class NotFoundError extends Error {
  constructor(message?: string) {
    super(message || "Not Found Error");

    Object.setPrototypeOf(this, Error.prototype);
  }
}
