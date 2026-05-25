const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { nama, qty, tipe, waktu, tanggal } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO InventoryLogs (nama_part, qty, tipe, waktu, tanggal) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [nama, qty, tipe, waktu, tanggal]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error Log:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan' });
  }
};