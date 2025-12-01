const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const { connectDB } = require("./config/db.js");
const surveyRoutes = require("./routes/surveyRoutes");
const responseRoutes = require("./routes/responseRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/surveys", surveyRoutes);
app.use("/api/responses", responseRoutes);

const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));
  } catch (err) {
    console.error("Błąd przy uruchamianiu serwera:", err);
    process.exit(1);
  }
};

startServer();