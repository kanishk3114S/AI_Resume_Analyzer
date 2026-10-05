class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    if (arguments.length === 2 && typeof data === "string") {
      this.message = data;
      this.data = null;
    } else {
      this.data = data;
      this.message = message;
    }
    this.success = statusCode < 400;
  }
}

module.exports = { ApiResponse };
module.exports.ApiResponse = ApiResponse;
