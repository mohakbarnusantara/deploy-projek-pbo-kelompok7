const db = require('../db');

module.exports = async (req, res) => {
  const { table } = req.query; 
  
  try {
    let query = '';
    
    // Switch logika pengambilan data berdasarkan parameter 'table'
    if (table === 'motors') {
      query = 'SELECT v.id, v.plat_nomor, v.merk, v.model, c.nama AS pemilik FROM Vehicles v LEFT JOIN Customers c ON v.customer_id = c.id ORDER BY v.id DESC';
    } 
    else if (table === 'parts') {
      query = 'SELECT * FROM Parts ORDER BY id DESC';
    } 
    else if (table === 'queues') {
      query = 'SELECT * FROM Queues ORDER BY waktu_dibuat ASC';
    } 
    else if (table === 'transactions') {
      query = 'SELECT * FROM Transactions ORDER BY id DESC';
    } 
    else if (table === 'logs') {
      query = 'SELECT * FROM InventoryLogs ORDER BY id DESC LIMIT 30';
    } 
    else {
      return res.status(400).json({ error: 'Parameter tabel tidak valid' });
    }
    
    const result = await db.query(query);
    res.status(200).json(result.rows);
    
  } catch (error) {
    console.error(`Error mengambil data dari tabel ${table}:`, error);
    res.status(500).json({ error: error.message });
  }
};