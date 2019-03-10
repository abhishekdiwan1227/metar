var express = require("express");
var router = express.Router();
var metarController = require("../controllers/metarController");

router.route("/ping").get(metarController.ping);

router.route("/info").get(metarController.getReport);

module.exports = router;