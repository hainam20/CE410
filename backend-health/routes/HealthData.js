const express = require("express");
const router = express.Router();

const HealthDataController = require("../controllers/HealthDataController");

router.get("/", HealthDataController.index);
router.post("/show", HealthDataController.show);
router.post("/store", HealthDataController.store);
router.post("/update", HealthDataController.update);
router.post("/delete", HealthDataController.destroy);

module.exports = router;
