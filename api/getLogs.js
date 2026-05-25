const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      // Mengambil maksimal 30 log terakhir, diurutkan dari yang terbaru
      const result = await db.query('SELECT * FROM InventoryLogs ORDER BY id DESC LIMIT 30');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error mengambil log:', error);
      res.status(500).json({ error: 'Gagal mengambil data log' });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan' });
  }
};