require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 4000,
  JWT_SECRET: process.env.JWT_SECRET || "hackathon_secret",
  AES_SECRET: process.env.AES_SECRET || "aes_encryption_key"
};
