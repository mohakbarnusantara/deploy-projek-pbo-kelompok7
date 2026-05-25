const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const result = await db.query('SELECT * FROM Queues ORDER BY waktu_dibuat ASC');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error mengambil antrean:', error);
      res.status(500).json({ error: 'Gagal mengambil data antrean' });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan' });
  }
};