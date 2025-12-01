const express = require("express");
const cors = require("cors");

const surveyRoutes = require("./routes/surveyRoutes");
const responseRoutes = require("./routes/responseRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/surveys", surveyRoutes);
app.use("/api/responses", responseRoutes);

module.exports = app;
