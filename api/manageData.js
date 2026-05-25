const db = require('../db');

module.exports = async (req, res) => {
  const { action, table, data } = req.body;
  try {
    if (action === 'delete') {
      await db.query(`DELETE FROM ${table} WHERE id = $1`, [data.id]);
      res.status(200).json({ message: 'Data berhasil dihapus' });
    } else if (action === 'add') {
      if (table === 'Transactions') {
        const { plat, nama, deskripsi, jasa, total, parts } = data;
        await db.query(
          'INSERT INTO Transactions (plat_kendaraan, nama_pelanggan, deskripsi, biaya_jasa, total_biaya, parts_detail) VALUES ($1, $2, $3, $4, $5, $6)',
          [plat || '-', nama || 'Pelanggan', deskripsi || '-', jasa || 0, total, JSON.stringify(parts || [])]
        );
      } else if (table === 'Queues') {
        await db.query('INSERT INTO Queues (vehicle_id, keluhan, nomor_urut) VALUES ($1, $2, $3)', 
          [data.vehicle_id, data.keluhan, data.nomor_urut]);
      }
      res.status(201).json({ message: 'Data berhasil ditambah' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};