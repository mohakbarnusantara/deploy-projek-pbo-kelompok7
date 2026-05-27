const db = require('../db');

module.exports = async (req, res) => {
  const { action, table, data } = req.body;
  
  try {
    // 1. Logika HAPUS (DELETE)
    if (action === 'delete') {
      await db.query(`DELETE FROM ${table} WHERE id = $1`, [data.id]);
      return res.status(200).json({ message: 'Data berhasil dihapus' });
    } 
    
    // 2. Logika UPDATE STATUS ANTREAN (PROSES/SELESAI)
    else if (action === 'update_queue_status') {
      await db.query('UPDATE Queues SET status = $1 WHERE id = $2', [data.status, data.id]);
      return res.status(200).json({ message: 'Status antrean berhasil diupdate' });
    } 
    
    // 3. Logika UPDATE STOK SUKU CADANG (+ / -)
    else if (action === 'update_part_stock') {
      await db.query('UPDATE Parts SET stok = stok + $1 WHERE id = $2', [data.qty, data.id]);
      return res.status(200).json({ message: 'Stok berhasil disesuaikan' });
    } 
    
    // 4. Logika TAMBAH / UPDATE FORMS (ADD)
    else if (action === 'add') {
      if (table === 'Transactions') {
        const { plat, nama, deskripsi, jasa, total, parts } = data;
        await db.query(
          'INSERT INTO Transactions (plat_kendaraan, nama_pelanggan, deskripsi, biaya_jasa, total_biaya, parts_detail) VALUES ($1, $2, $3, $4, $5, $6)',
          [plat || '-', nama || 'Pelanggan Umum', deskripsi || '-', jasa || 0, total, JSON.stringify(parts || [])]
        );
      } 
      else if (table === 'Queues') {
        await db.query('INSERT INTO Queues (vehicle_id, keluhan, nomor_urut) VALUES ($1, $2, $3)', 
          [data.vehicle_id, data.keluhan, data.nomor_urut]);
      }
      else if (table === 'Vehicles') {
        // Simpan Customer dulu, ambil ID-nya, lalu simpan Kendaraannya
        const custRes = await db.query('INSERT INTO Customers (nama) VALUES ($1) RETURNING id', [data.pemilik]);
        const customerId = custRes.rows[0].id;
        await db.query('INSERT INTO Vehicles (plat_nomor, merk, model, customer_id) VALUES ($1, $2, $3, $4)', 
          [data.plat_nomor, data.merk, data.model, customerId]);
      }
      else if (table === 'Parts') {
        if (data.id) { // UPDATE BARANG LAMA
          await db.query('UPDATE Parts SET kode_part = $1, nama_part = $2, stok = $3, harga = $4 WHERE id = $5',
            [data.kode, data.nama, data.stok, data.harga, data.id]);
        } else { // TAMBAH BARANG BARU
          await db.query('INSERT INTO Parts (kode_part, nama_part, stok, harga) VALUES ($1, $2, $3, $4)',
            [data.kode, data.nama, data.stok, data.harga]);
        }
      }
      else if (table === 'InventoryLogs') {
        await db.query('INSERT INTO InventoryLogs (nama_part, qty, tipe, waktu, tanggal) VALUES ($1, $2, $3, $4, $5)',
          [data.nama, data.qty, data.tipe, data.waktu, data.tanggal]);
      }
      
      return res.status(201).json({ message: 'Data berhasil disimpan' });
    } 
    
    else {
      return res.status(400).json({ error: 'Aksi API tidak valid' });
    }
    
  } catch (error) {
    console.error(`Error ManageData API:`, error);
    res.status(500).json({ error: error.message });
  }
};