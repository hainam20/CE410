const express = require("express");
const router = express.Router();

const UserController = require("../controllers/UserController");

router.get("/", UserController.index);
router.post("/show", UserController.show);
router.post("/store", UserController.store);
router.post("/update", UserController.update);
router.post("/delete", UserController.destroy);
router.post("/authenticate", UserController.authenticate);
router.get("/users/:stuid", UserController.findStuId);

module.exports = router;
