const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { id, qty } = req.body;
    try {
      const result = await db.query(
        'UPDATE Parts SET stok = stok + $1 WHERE id = $2 RETURNING *',
        [parseInt(qty), id]
      );
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Error restock sparepart:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan' });
  }
};