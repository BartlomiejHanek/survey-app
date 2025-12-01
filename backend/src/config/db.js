const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    mongoose.connection.on("error", (err) => {
      console.error("Bląd połączenia z bazą danych:", err);
    });
  } catch (error) {
    console.error("Nie udało się połączyć z baza danych:", error);
    throw error;
  }
};

module.exports = { connectDB };
