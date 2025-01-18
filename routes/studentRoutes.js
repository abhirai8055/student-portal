const express = require("express");
const router = express.Router();
router.use(express.json());
const common = require("../utils/common");

const controller = require("../controller/studentController");

router.post("/userSignup", controller.userSignup);
router.put("/otpVerification", controller.otpVerification);
router.put("/resendOtp", controller.resendOtp);
router.post("/login", controller.login);
router.put("/reSetPassword", common.auth, controller.resetPassword);
router.get("/getProfile", common.auth, controller.getProfile);
router.put("/userEditProfile", common.auth, controller.userEditProfile);
router.delete("/userDelete", common.auth, controller.userDelete);
router.get("/getAllUser", common.auth, controller.getAllUser);
router.delete("/deleteAllUser", common.auth, controller.deleteAllUser);
router.delete("/deleteById/:id", common.auth, controller.deleteById);
router.put("/updateUserStatus", common.auth, controller.updateUserStatus);
router.put("/searchUsers", common.auth, controller.searchUsers);

module.exports = router;
