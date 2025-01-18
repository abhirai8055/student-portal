const express = require("express");
const router = express.Router();
router.use(express.json());
const common = require("../utils/common");

const controller = require("../controller/applicationController");

router.post("/submitApplication", common.auth, controller.submitApplication);
router.get("/getMyApplications", common.auth, controller.getMyApplications);
router.put("/updateApplication", common.auth, controller.updateApplication);
router.delete(
  "/deleteApplication/:applicationId",
  common.auth,
  controller.deleteApplication
);
router.get("/filterApplications", common.auth, controller.filterApplications);
router.put(
  "/updateApplicationStatus/:id",
  common.auth,
  controller.updateApplicationStatus
);

module.exports = router;
