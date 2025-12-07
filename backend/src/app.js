const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const { connectDB } = require("./config/db.js");
const surveyRoutes = require("./routes/surveyRoutes");
const responseRoutes = require("./routes/responseRoutes");
const authRoutes = require("./auth/authRoutes");
const inviteRoutes = require('./routes/inviteRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/surveys", surveyRoutes);
app.use("/api/responses", responseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/invites', inviteRoutes);

app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

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