const db = require('../db');

module.exports = async (req, res) => {
  const { table } = req.query; // Kita panggil dengan /api/getData?table=motors
  try {
    let query = '';
    if(table === 'motors') query = 'SELECT v.id, v.plat_nomor, v.merk, v.model, c.nama AS pemilik FROM Vehicles v JOIN Customers c ON v.customer_id = c.id ORDER BY v.id DESC';
    else if(table === 'parts') query = 'SELECT * FROM Parts ORDER BY id DESC';
    else if(table === 'queues') query = 'SELECT * FROM Queues ORDER BY waktu_dibuat ASC';
    else if(table === 'transactions') query = 'SELECT * FROM Transactions ORDER BY id DESC';
    else if(table === 'logs') query = 'SELECT * FROM InventoryLogs ORDER BY id DESC LIMIT 30';
    
    const result = await db.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};