const router = require("express").Router();
const { createSurvey, getSurvey } = require("../controllers/surveyController");

router.post("/", createSurvey);
router.get("/:id", getSurvey);

module.exports = router;
