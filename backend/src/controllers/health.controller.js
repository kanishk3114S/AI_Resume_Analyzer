const { ApiResponse } = require("../utils/ApiResponse");
const { AsyncHandler } = require("../utils/AsyncHandler");

const HealthCheck = AsyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, "successful and the server is running"));
});

module.exports = { HealthCheck };