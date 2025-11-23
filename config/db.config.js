require('dotenv').config();

const dbConfig = {
  HOST: process.env.DB_HOST || "localhost",
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PASSWORD || "Ajo010505",
  DB: process.env.DB_NAME || "pws_db",
  PORT: 3309
};

module.exports = dbConfig;
