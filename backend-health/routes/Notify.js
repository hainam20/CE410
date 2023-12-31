const express = require("express");
const router = express.Router();

const NotifyController = require("../controllers/NotifyController");

router.get("/", NotifyController.index);
router.post("/show", NotifyController.show);
router.post("/store", NotifyController.store);
router.post("/update", NotifyController.update);
router.post("/delete", NotifyController.destroy);

module.exports = router;
