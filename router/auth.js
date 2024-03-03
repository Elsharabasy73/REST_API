const express = require("express");

const authController = require("../controller/auth");
const authValidator = require("../validation//auth");

const router = express.Router();

router.put("/signup", authValidator.signup, authController.creatUser);

router.post("/login", authValidator.login, authController.login);

router.post("/test", authController.test);

module.exports = router;
