const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const result = await db.query('SELECT * FROM Parts ORDER BY id DESC');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error mengambil data sparepart:', error);
      res.status(500).json({ error: 'Terjadi kesalahan pada server database' });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan, gunakan GET' });
  }
};