const db = require('../db');

module.exports = async (req, res) => {
  // Pastikan hanya menerima request dengan metode GET
  if (req.method === 'GET') {
    try {
      // Mengambil semua data dari tabel Vehicles, diurutkan dari yang terbaru
      const result = await db.query('SELECT * FROM Vehicles ORDER BY id DESC');
      
      // Mengirimkan hasil query ke frontend dalam format JSON
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error saat mengambil data:', error);
      res.status(500).json({ error: 'Terjadi kesalahan pada server database' });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan, gunakan GET' });
  }
};