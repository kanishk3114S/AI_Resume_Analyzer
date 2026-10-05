const express = require("express");
const { HealthCheck } = require("../controllers/health.controller");

const router = express.Router();

router.route("/").get(HealthCheck);

module.exports = router;