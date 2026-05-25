const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { id } = req.body;
    try {
      await db.query('DELETE FROM Vehicles WHERE id = $1', [id]);
      res.status(200).json({ message: 'Motor berhasil dihapus' });
    } catch (error) {
      console.error("Error hapus motor:", error);
      res.status(500).json({ error: 'Gagal menghapus. Pastikan motor ini tidak sedang dalam antrean atau memiliki riwayat transaksi.' });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan' });
  }
};