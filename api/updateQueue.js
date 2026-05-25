const db = require('../db');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { id, status } = req.body;
    try {
      await db.query('UPDATE Queues SET status = $1 WHERE id = $2', [status, id]);
      res.status(200).json({ message: 'Status berhasil diperbarui' });
    } catch (error) {
      console.error("Error update antrean:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Metode tidak diizinkan' });
  }
};