const { Pool } = require('pg');
require('dotenv').config(); // Membaca file .env

// Membuat koneksi ke database menggunakan URL dari Vercel
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};