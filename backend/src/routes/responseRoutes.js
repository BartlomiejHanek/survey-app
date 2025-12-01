const router = require("express").Router();
const { sendResponse, getResponses, } = require("../controllers/responseController");

router.post("/:surveyId", sendResponse);
router.get("/:surveyId", getResponses);

module.exports = router;