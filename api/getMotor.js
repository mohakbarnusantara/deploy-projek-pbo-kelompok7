const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      // Mengambil data motor dan JOIN dengan nama pemilik di tabel Customers
      const query = `
        SELECT v.id, v.plat_nomor, v.merk, v.model, c.nama AS pemilik 
        FROM Vehicles v
        JOIN Customers c ON v.customer_id = c.id
        ORDER BY v.id DESC
      `;
      const result = await db.query(query);
      
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error saat mengambil data:', error);
      res.status(500).json({ error: 'Terjadi kesalahan pada server database' });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan, gunakan GET' });
  }
};