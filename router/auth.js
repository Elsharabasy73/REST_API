const express = require("express");

const authController = require("../controller/auth");
const authValidator = require("../validation//auth");

const router = express.Router();

router.put("/signup",authController.creatUser);
//signup
module.exports = router;
