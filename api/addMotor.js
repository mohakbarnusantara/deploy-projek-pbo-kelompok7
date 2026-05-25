const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { plat_nomor, merk, model, pemilik } = req.body;
    
    try {
      // 1. Simpan Pemilik ke tabel Customers
      const customerResult = await db.query(
        'INSERT INTO Customers (nama) VALUES ($1) RETURNING id',
        [pemilik]
      );
      
      const customerId = customerResult.rows[0].id;

      // 2. Simpan Motor ke tabel Vehicles dengan ID Pemilik
      const vehicleResult = await db.query(
        'INSERT INTO Vehicles (customer_id, merk, model, plat_nomor) VALUES ($1, $2, $3, $4) RETURNING *',
        [customerId, merk, model, plat_nomor]
      );
      
      res.status(201).json(vehicleResult.rows[0]);
    } catch (error) {
      console.error("Detail Error Database:", error); 
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan' });
  }
};