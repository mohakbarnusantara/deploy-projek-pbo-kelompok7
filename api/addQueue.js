const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { vehicle_id, keluhan, nomor_urut } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO Queues (vehicle_id, keluhan, nomor_urut) VALUES ($1, $2, $3) RETURNING *',
        [vehicle_id, keluhan, nomor_urut]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error database:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan' });
  }
};