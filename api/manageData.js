const db = require('../db');

module.exports = async (req, res) => {
  const { action, table, data } = req.body;
  
  try {
    if (action === 'delete') {
      // Mengubah nama tabel menjadi huruf kecil sesuai standard PostgreSQL Neon
      const targetTable = table.toLowerCase();
      await db.query(`DELETE FROM ${targetTable} WHERE id = $1`, [data.id]);
      return res.status(200).json({ message: 'Data berhasil dihapus' });
    } 
    
    else if (action === 'update_queue_status') {
      await db.query('UPDATE queues SET status = $1 WHERE id = $2', [data.status, data.id]);
      return res.status(200).json({ message: 'Status antrean berhasil diupdate' });
    } 
    
    else if (action === 'update_part_stock') {
      await db.query('UPDATE parts SET stok = stok + $1 WHERE id = $2', [data.qty, data.id]);
      return res.status(200).json({ message: 'Stok berhasil disesuaikan' });
    } 
    
    else if (action === 'add') {
      
      if (table === 'Vehicles') {
        const platNormalized = data.plat_nomor.replace(/\s+/g, ' ').trim().toUpperCase();
        const namaNormalized = data.pemilik.replace(/\s+/g, ' ').trim().replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

        let checkQuery = `SELECT v.plat_nomor, c.nama FROM vehicles v JOIN customers c ON v.customer_id = c.id WHERE v.plat_nomor = $1`;
        let checkParams = [platNormalized];

        if (data.id) {
          checkQuery += ` AND v.id != $2`;
          checkParams.push(data.id);
        }

        const existingPlat = await db.query(checkQuery, checkParams);
        
        if (existingPlat.rows.length > 0) {
          return res.status(400).json({ error: `Plat nomor ${platNormalized} sudah terdaftar atas nama ${existingPlat.rows[0].nama}` });
        }

        if (data.id) {
          const vRes = await db.query('SELECT customer_id FROM vehicles WHERE id = $1', [data.id]);
          if(vRes.rows.length > 0) {
              const cId = vRes.rows[0].customer_id;
              await db.query('UPDATE customers SET nama = $1 WHERE id = $2', [namaNormalized, cId]);
              await db.query('UPDATE vehicles SET plat_nomor = $1, merk = $2, model = $3, tahun = $4 WHERE id = $5', [platNormalized, data.merk, data.model, data.tahun, data.id]);
          }
        } else {
          const custRes = await db.query('INSERT INTO customers (nama) VALUES ($1) RETURNING id', [namaNormalized]);
          const customerId = custRes.rows[0].id;
          await db.query('INSERT INTO vehicles (plat_nomor, merk, model, customer_id, tahun) VALUES ($1, $2, $3, $4, $5)', 
            [platNormalized, data.merk, data.model, customerId, data.tahun]);
        }
      } 
      
      else if (table === 'Transactions') {
        const { plat, nama, deskripsi, jasa, total, parts } = data;
        await db.query(
          'INSERT INTO transactions (plat_kendaraan, nama_pelanggan, deskripsi, biaya_jasa, total_biaya, parts_detail) VALUES ($1, $2, $3, $4, $5, $6)',
          [plat || '-', nama || 'Pelanggan Umum', deskripsi || '-', jasa || 0, total, JSON.stringify(parts || [])]
        );
      } 
      
      else if (table === 'Queues') {
        await db.query('INSERT INTO queues (vehicle_id, keluhan, nomor_urut) VALUES ($1, $2, $3)', 
          [data.vehicle_id, data.keluhan, data.nomor_urut]);
      }
      
      else if (table === 'Parts') {
        if (data.id) { 
          await db.query('UPDATE parts SET kode_part = $1, nama_part = $2, stok = $3, harga = $4, kategori_barang = $5 WHERE id = $6',
            [data.kode, data.nama, data.stok, data.harga, data.kategori, data.id]);
        } else { 
          await db.query('INSERT INTO parts (kode_part, nama_part, stok, harga, kategori_barang) VALUES ($1, $2, $3, $4, $5)',
            [data.kode, data.nama, data.stok, data.harga, data.kategori]);
        }
      }
      
      else if (table === 'InventoryLogs') {
        await db.query('INSERT INTO inventorylogs (nama_part, qty, tipe, waktu, tanggal) VALUES ($1, $2, $3, $4, $5)',
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