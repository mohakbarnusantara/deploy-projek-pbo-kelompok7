const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { id } = req.body;
    try {
      await db.query('DELETE FROM Parts WHERE id = $1', [id]);
      res.status(200).json({ message: 'Sparepart berhasil dihapus' });
    } catch (error) {
      console.error("Error hapus sparepart:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan' });
  }
};