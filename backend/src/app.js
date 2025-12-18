require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/db');

const surveyRoutes = require('./routes/surveyRoutes');
const responseRoutes = require('./routes/responseRoutes');
const authRoutes = require('./auth/authRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const questionRoutes = require('./routes/questionRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const routes = {
  surveys: surveyRoutes,
  responses: responseRoutes,
  auth: authRoutes,
  invites: inviteRoutes,
  questions: questionRoutes
};

Object.entries(routes).forEach(([path, router]) => {
  app.use(`/api/${path}`, router);
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal Server Error' });
});

process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Serwer działa na porcie ${PORT}`);
    });
  } catch (err) {
    console.error('Błąd przy starcie serwera:', err);
    process.exit(1);
  }
};

startServer();
