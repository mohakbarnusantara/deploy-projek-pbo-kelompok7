const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { id, kode, nama, stok, harga } = req.body;
    try {
      if (id) {
        // Logika Update data barang
        const result = await db.query(
          'UPDATE Parts SET kode_part = $1, nama_part = $2, stok = $3, harga = $4 WHERE id = $5 RETURNING *',
          [kode, nama, stok, harga, id]
        );
        res.status(200).json(result.rows[0]);
      } else {
        // Logika Tambah barang baru
        const result = await db.query(
          'INSERT INTO Parts (kode_part, nama_part, stok, harga) VALUES ($1, $2, $3, $4) RETURNING *',
          [kode, nama, stok, harga]
        );
        res.status(201).json(result.rows[0]);
      }
    } catch (error) {
      console.error("Detail Error Database Sparepart:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan' });
  }
};