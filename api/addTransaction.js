const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    // Tambahkan 'parts' untuk ditangkap dari frontend
    const { plat, nama, deskripsi, jasa, total, parts } = req.body;
    
    try {
      const result = await db.query(
        'INSERT INTO Transactions (plat_kendaraan, nama_pelanggan, deskripsi, biaya_jasa, total_biaya, parts_detail) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [plat, nama, deskripsi, jasa, total, JSON.stringify(parts || [])]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error Transaksi:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan' });
  }
};