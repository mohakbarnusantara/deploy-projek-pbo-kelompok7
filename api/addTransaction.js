const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { plat, nama, deskripsi, jasa, total } = req.body;
    
    try {
      const result = await db.query(
        'INSERT INTO Transactions (plat_kendaraan, nama_pelanggan, deskripsi, biaya_jasa, total_biaya) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [plat, nama, deskripsi, jasa, total]
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