/**
 * =========================================
 * MOTOCARE PRO - FULL CLOUD SYSTEM INTEGRATED
 * =========================================
 */

// --- CLASSES / BLUEPRINTS ---
class EntitasBase {
    constructor(id) {
        if (new.target === EntitasBase) { throw new Error("Abstract Class."); }
        this.id = id || Date.now() + Math.floor(Math.random()*100);
    }
    getInfo() { return `Entitas System [ID: ${this.id}]`; }
}

class Motor extends EntitasBase {
    constructor(plat, merk, tipe, pemilik, tahun, id=null) {
        super(id);
        this.plat = (plat || '-').toUpperCase();
        this.merk = merk;
        this.tipe = tipe;
        this.pemilik = pemilik;
        this.tahun = tahun;
        this.statusTerakhir = 'NON-AKTIF';
    }
    getInfo() { return `Motor ${this.plat} - ${this.merk} ${this.tipe}`; }
}

class SukuCadang extends EntitasBase {
    constructor(nama, stok, harga, id=null, kode=null) {
        super(id);
        this.kode = kode || 'SP-' + Math.floor(Math.random() * 9000 + 1000).toString();
        this.nama = nama;
        this._stok = parseInt(stok);
        this._harga = parseInt(harga);
    }
    getInfo() { return `[${this.kode}] ${this.nama}`; }
    get stok() { return this._stok; }
    get harga() { return this._harga; }
}

class AntrianItem {
    constructor(motorId, keluhan, nomor) {
        this.id = Date.now() + Math.floor(Math.random()*100);
        this.motorId = motorId;
        this.keluhan = keluhan;
        this.nomor = nomor; 
        this.status = 'ANTRIAN'; 
        this.waktu = new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
        this.tanggal = new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'short'});
    }
}

class ItemKeranjang {
    constructor(id, nama, qty, harga) {
        this.id = id;
        this.nama = nama;
        this.qty = parseInt(qty);
        this.harga = parseInt(harga);
    }
    get subtotal() { return this.qty * this.harga; }
}

class TransaksiServis extends EntitasBase {
    constructor(motor, tglStr, desk, jasa, parts, id=null) {
        super(id);
        this.motor = motor;
        this.tglRaw = tglStr;
        this.desk = desk;
        this.jasa = parseInt(jasa);
        this.parts = parts;
    }
    getInfo() { return `Transaksi #${this.id} - Total: ${app.formatRp.format(this.hitungTotal())}`; }
    get formatWaktu() {
        const date = new Date(this.tglRaw);
        const d = date.toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'});
        const t = date.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
        return `${d} ${t}`;
    }
    hitungTotal() { return this.jasa + this.parts.reduce((sum, p) => sum + p.subtotal, 0); }
}

// --- MAIN CONTROLLER ---
const app = {
    motors: [], parts: [], antrian: [], riwayat: [], restokStack: [], cart: [], isLogin: false, currentUserRole: null,
    formatRp: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }),

    async init() {
        await this.load(); 
        this.startClock();
        ui.renderAll();

        // 1. VALIDASI REAL-TIME INPUT (Auto-Format)
        const namaInput = document.getElementById('motor-pemilik');
        const platInput = document.getElementById('motor-plat');
        const jasaInput = document.getElementById('kasir-jasa');
        const stokInput = document.getElementById('part-stok');
        const hargaInput = document.getElementById('part-harga');
        const restokQtyInput = document.getElementById('restok-qty');

        // Validasi Nama Pemilik (Hapus karakter aneh saat mengetik, lalu format saat selesai)
        if (namaInput) {
            namaInput.addEventListener('input', function() {
                this.value = this.value.replace(/[^a-zA-Z\s.,']/g, ''); // Hanya alfabet, spasi, ., '
                const errLabel = document.getElementById('err-nama');
                if(errLabel) errLabel.classList.add('hidden');
            });
            namaInput.addEventListener('blur', function() {
                // Saat selesai mengetik: Hapus spasi ganda & buat Title Case
                this.value = this.value.replace(/\s+/g, ' ').trim().replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            });
        }

        // Validasi Plat Nomor (Otomatis kapital & hapus spasi berlebih)
        if (platInput) {
            platInput.addEventListener('input', function() { this.value = this.value.toUpperCase(); });
            platInput.addEventListener('blur', function() { this.value = this.value.replace(/\s+/g, ' ').trim(); });
        }

        // Cegah Minus
        if (jasaInput) jasaInput.addEventListener('input', function() { if (this.value < 0) this.value = 0; ui.renderCart(); });
        if (stokInput) stokInput.addEventListener('input', function() { if (this.value < 0) this.value = 0; });
        if (hargaInput) hargaInput.addEventListener('input', function() { if (this.value < 0) this.value = 0; });
        if (restokQtyInput) restokQtyInput.addEventListener('input', function() { if (this.value < 1) this.value = 1; });
    },

    startClock() {
        const clockEl = document.getElementById('digital-clock');
        const dateEl = document.getElementById('current-date');
        const update = () => {
            const now = new Date();
            if(clockEl) clockEl.innerText = now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
            if(dateEl) dateEl.innerText = now.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
        };
        setInterval(update, 1000);
        update();
    },

    // --- FITUR LOGIN ---
    handleLogin(e) {
        e.preventDefault();
        const u = document.getElementById('log-user').value;
        const p = document.getElementById('log-pass').value;
        const errorMsg = document.getElementById('login-error');

        if(u === 'admin' && p === 'admin123') this.currentUserRole = 'admin';
        else if(u === 'kasir' && p === 'kasir123') this.currentUserRole = 'kasir';
        else if(u === 'gudang' && p === 'gudang123') this.currentUserRole = 'gudang';
        else {
            errorMsg.classList.remove('hidden');
            return; 
        }

        errorMsg.classList.add('hidden');
        this.isLogin = true;
        document.getElementById('login-overlay').style.opacity = '0';
        setTimeout(() => { document.getElementById('login-overlay').style.display = 'none'; }, 500);
        
        ui.applyRolePermissions();
        if(this.currentUserRole === 'gudang') ui.nav('stok');
        else ui.nav('dashboard');
        this.refreshUI();
    },

    logout() { 
        this.isLogin = false;
        this.currentUserRole = null;
        const loginOverlay = document.getElementById('login-overlay');
        loginOverlay.style.display = 'flex';
        setTimeout(() => { loginOverlay.style.opacity = '1'; }, 50);
        document.getElementById('log-user').value = '';
        document.getElementById('log-pass').value = '';
        this.cart = [];
        ui.renderCart();
        ui.nav('dashboard');
    },

    // --- INTEGRASI CORE CLOUD ---
    async load() {
        try {
            const [mRes, pRes, qRes, tRes, lRes] = await Promise.all([
                fetch('/api/getData?table=motors').then(r => r.json()),
                fetch('/api/getData?table=parts').then(r => r.json()),
                fetch('/api/getData?table=queues').then(r => r.json()),
                fetch('/api/getData?table=transactions').then(r => r.json()),
                fetch('/api/getData?table=logs').then(r => r.json())
            ]);

            this.motors = (mRes || []).map(x => { 
                const m = new Motor(x.plat_nomor, x.merk, x.model, x.pemilik, 2026, x.id);
                return m;
            });

            this.antrian = (qRes || []).map(q => {
                const a = new AntrianItem(q.vehicle_id, q.keluhan, q.nomor_urut);
                a.id = q.id; a.status = q.status;
                a.waktu = new Date(q.waktu_dibuat).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
                a.tanggal = new Date(q.waktu_dibuat).toLocaleDateString('id-ID', {day:'2-digit', month:'short'});
                return a;
            });
            this.antrian.forEach(q => {
                if(q.status !== 'SELESAI') {
                    const m = this.motors.find(x => x.id == q.motorId);
                    if(m) m.statusTerakhir = q.status;
                }
            });

            this.parts = (pRes || []).map(x => new SukuCadang(x.nama_part, x.stok, x.harga, x.id, x.kode_part));

            this.riwayat = (tRes || []).map(t => {
                const m = new Motor(t.plat_kendaraan, '-', '-', t.nama_pelanggan, '-');
                const partsList = typeof t.parts_detail === 'string' ? JSON.parse(t.parts_detail) : (t.parts_detail || []);
                const c = partsList.map(cp => new ItemKeranjang(cp.id, cp.nama, cp.qty, cp.harga));
                const trx = new TransaksiServis(m, t.waktu_transaksi, t.deskripsi, t.biaya_jasa, c, t.id);
                trx.hitungTotal = () => t.total_biaya; 
                return trx;
            });

            this.restokStack = (lRes || []).map(l => ({
                nama: l.nama_part, qty: l.qty, tipe: l.tipe, waktu: l.waktu, tanggal: l.tanggal
            }));

            this.refreshUI();
        } catch (e) { console.error("Error Loading Data:", e); }
    },

    async deleteData(table, id) {
        try {
            await fetch('/api/manageData', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', table: table, data: { id: id } })
            });
            await this.load();
        } catch (e) { console.error("Error Deleting Data:", e); }
    },

    // --- MANAJEMEN MOTOR (Dengan Validasi Penuh) ---
    async handleMotorSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('motor-id-edit').value;
        let plat = document.getElementById('motor-plat').value;
        const merk = document.getElementById('motor-merk').value;
        const model = document.getElementById('motor-tipe').value;
        let pemilik = document.getElementById('motor-pemilik').value; 
        const tahun = document.getElementById('motor-tahun').value;

        // Validasi Final sebelum di push ke server
        plat = plat.replace(/\s+/g, ' ').trim().toUpperCase();
        pemilik = pemilik.replace(/\s+/g, ' ').trim();
        
        if (pemilik.length < 3 || pemilik.length > 60) {
            return alert("GAGAL: Panjang nama pemilik harus antara 3 hingga 60 karakter.");
        }
        
        const regexNama = /^[a-zA-Z\s.,']+$/;
        if (!regexNama.test(pemilik)) {
            return alert("GAGAL: Nama pemilik mengandung karakter yang dilarang.");
        }

        // Title Case
        pemilik = pemilik.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

        const btn = document.getElementById('btn-save-motor');
        const prevText = btn.innerText;
        btn.innerText = "Memverifikasi..."; btn.disabled = true;

        try {
            const response = await fetch('/api/manageData', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'add', table: 'Vehicles', 
                    data: { id: id || null, plat_nomor: plat, merk: merk, model: model, pemilik: pemilik, tahun: tahun }
                })
            });
            
            const result = await response.json();
            
            // Tangkap Error 400 (Plat Duplikat)
            if (!response.ok) {
                throw new Error(result.error || "Gagal menyimpan data motor ke server.");
            }

            alert("Data Motor Berhasil Disimpan & Diverifikasi!");
            ui.resetMotorForm();
            await this.load(); 
        } catch (error) { 
            console.error(error); 
            alert(`⚠️ PERHATIAN:\n${error.message}`); 
        } finally { 
            btn.innerText = prevText; btn.disabled = false; 
        }
    },

    editMotor(id) {
        const m = this.motors.find(m => m.id == id);
        if(!m) return;
        document.getElementById('motor-id-edit').value = m.id;
        document.getElementById('motor-plat').value = m.plat;
        document.getElementById('motor-merk').value = m.merk;
        document.getElementById('motor-tipe').value = m.tipe;
        document.getElementById('motor-pemilik').value = m.pemilik;
        document.getElementById('motor-tahun').value = m.tahun;
        document.getElementById('motor-form-title').innerHTML = '<i class="fa-solid fa-pen text-blue-500"></i> Edit Data Motor';
        document.getElementById('btn-save-motor').innerText = "Update Motor";
        document.getElementById('btn-cancel-motor').classList.remove('hidden');
    },

    async hapusMotor(id) { 
        if(confirm("Hapus data motor ini permanen dari database?")) await this.deleteData('Vehicles', id); 
    },

    // --- MANAJEMEN ANTREAN ---
    async handleAntrianSubmit(e) {
        e.preventDefault();
        const motorId = document.getElementById('antrian-motor-id').value;
        const keluhan = document.getElementById('antrian-keluhan').value;
        
        if(this.antrian.find(a => a.motorId == motorId && a.status != 'SELESAI')) return alert("Motor sudah dalam antrean!");
        const nomor = this.antrian.length + 1;

        try {
            await fetch('/api/manageData', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'add', table: 'Queues', 
                    data: { vehicle_id: motorId, keluhan: keluhan, nomor_urut: nomor } 
                })
            });
            e.target.reset(); 
            await this.load(); 
        } catch (error) { console.error(error); }
    },

    async setProses(antrianId) {
        try {
            await fetch('/api/manageData', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_queue_status', data: { id: antrianId, status: 'PROSES' } })
            });
            await this.load(); 
            const item = this.antrian.find(a => a.id == antrianId);
            if (item) {
                document.getElementById('kasir-motor-id').value = item.motorId;
                document.getElementById('kasir-deskripsi').value = item.keluhan;
            }
        } catch (error) { console.error(error); }
    },

    // --- MANAJEMEN SPAREPART & INVENTORY LOGS ---
    async handlePartSubmit() {
        if(this.currentUserRole === 'kasir') return alert("Akses Ditolak!");
        const id = document.getElementById('part-id-edit').value, 
              kodeInput = document.getElementById('part-kode').value.toUpperCase(),
              n = document.getElementById('part-nama').value,
              s = parseInt(document.getElementById('part-stok').value), 
              h = parseInt(document.getElementById('part-harga').value);
              
        if(!n || isNaN(s) || isNaN(h) || s < 0 || h < 0) return alert("Lengkapi form nama, stok (minimal 0), dan harga (minimal 0)!");
        
        try {
            await fetch('/api/manageData', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'add', table: 'Parts', 
                    data: { id: id || null, kode: kodeInput || null, nama: n, stok: s, harga: h } 
                })
            });

            if(id) {
                const idx = this.parts.findIndex(p => p.id == id);
                if(idx !== -1) {
                    const diff = s - this.parts[idx].stok;
                    if (diff > 0) await this.pushInventoryLog(n, diff, 'MASUK');
                    else if (diff < 0) await this.pushInventoryLog(n, Math.abs(diff), 'KELUAR');
                }
            } else {
                await this.pushInventoryLog(n, s, 'MASUK');
            }
            
            ui.resetPartForm();
            await this.load();
        } catch (error) { console.error(error); }
    },

    editPart(id) {
        if(this.currentUserRole === 'kasir') return alert("Akses Ditolak!");
        const p = this.parts.find(x => x.id == id);
        if(!p) return;
        document.getElementById('part-id-edit').value = p.id;
        document.getElementById('part-kode').value = p.kode || '';
        document.getElementById('part-nama').value = p.nama;
        document.getElementById('part-stok').value = p.stok;
        document.getElementById('part-harga').value = p.harga;
        document.getElementById('btn-save-part').innerText = "Update";
        document.getElementById('btn-cancel-part').classList.remove('hidden');
    },

    async hapusPart(id) { 
        if(this.currentUserRole === 'kasir') return alert("Akses Ditolak!");
        if(confirm("Hapus item secara permanen dari Gudang?")) {
            const p = this.parts.find(x => x.id == id);
            if (p) {
                await this.pushInventoryLog(p.nama, p.stok, 'DIHAPUS');
                await this.deleteData('Parts', id);
            }
        } 
    },

    async prosesRestok() {
        if(this.currentUserRole === 'kasir') return alert("Akses Ditolak!");
        const id = document.getElementById('restok-id').value, qty = parseInt(document.getElementById('restok-qty').value);
        const p = this.parts.find(x => x.id == id);
        if(!p || qty < 1) return;

        try {
            await fetch('/api/manageData', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_part_stock', data: { id: id, qty: qty } })
            });
            await this.pushInventoryLog(p.nama, qty, 'MASUK');
            ui.closeStokModal();
            await this.load();
        } catch (error) { console.error(error); }
    },

    async pushInventoryLog(nama, qty, tipe) {
        const now = new Date();
        const waktuStr = now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
        const tanggalStr = now.toLocaleDateString('id-ID', {day:'2-digit', month:'short'});
        try {
            await fetch('/api/manageData', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'add', table: 'InventoryLogs', 
                    data: { nama: nama, qty: qty, tipe: tipe, waktu: waktuStr, tanggal: tanggalStr } 
                })
            });
        } catch (error) { console.error(error); }
    },

    // --- MANAJEMEN KASIR & TRANSAKSI ---
    toggleKasirMode() {
        const isP = document.getElementById('kasir-parts-only').checked;
        const mS = document.getElementById('kasir-motor-id'), dS = document.getElementById('kasir-deskripsi'), jI = document.getElementById('kasir-jasa');
        if(isP) {
            mS.removeAttribute('required'); mS.disabled = true; mS.value = ''; mS.classList.add('bg-slate-200');
            dS.removeAttribute('required'); dS.disabled = true; dS.value = 'Pembelian Langsung'; dS.classList.add('bg-slate-200');
            jI.disabled = true; jI.value = 0; jI.classList.add('bg-slate-200');
        } else {
            mS.setAttribute('required', 'true'); mS.disabled = false; mS.classList.remove('bg-slate-200');
            dS.setAttribute('required', 'true'); dS.disabled = false; dS.value = ''; dS.classList.remove('bg-slate-200');
            jI.disabled = false; jI.classList.remove('bg-slate-200');
        }
        ui.renderCart();
    },

    tambahKeKeranjang() {
        const id = document.getElementById('kasir-pilih-part').value, qty = parseInt(document.getElementById('kasir-qty').value);
        if(!id || qty < 1) return;
        const pF = this.parts.find(x => x.id == id), ex = this.cart.find(c => c.id == id), tot = ex ? (ex.qty + qty) : qty;
        if(pF.stok < tot) return alert("Stok kurang di Gudang!");
        if(ex) { ex.qty += qty; } else { this.cart.push(new ItemKeranjang(pF.id, pF.nama, qty, pF.harga)); }
        ui.renderCart();
    },

    hapusItemCart(id) { this.cart = this.cart.filter(c => c.id != id); ui.renderCart(); },

    async handleTransaksiSubmit(e) {
        e.preventDefault();
        
        const isP = document.getElementById('kasir-parts-only').checked;
        const mId = document.getElementById('kasir-motor-id').value;
        const dsk = document.getElementById('kasir-deskripsi').value;
        
        const jsa = Math.max(0, parseInt(document.getElementById('kasir-jasa').value) || 0);
        const totalParts = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
        const totalSemua = jsa + totalParts;

        if(!isP && !mId) return alert("Pilih motor yang sedang diproses!");
        if(this.cart.length === 0 && jsa === 0) return alert("Keranjang belanja kosong!");

        let platKendaraan = '-', namaPemilik = 'Pelanggan Umum', antrianIdTarget = null, trxMotorInfo;

        if (!isP) {
            const m = this.motors.find(x => x.id == mId);
            platKendaraan = m.plat;
            namaPemilik = m.pemilik;
            trxMotorInfo = m;
            const qI = this.antrian.find(a => a.motorId == mId && a.status == 'PROSES');
            if(qI) antrianIdTarget = qI.id;
        } else {
            trxMotorInfo = new Motor('-', '-', '-', 'Pelanggan Umum', '-');
        }

        const btn = e.target.querySelector('button[type="submit"]');
        const prevText = btn.innerText;
        btn.innerText = "Memproses Transaksi..."; btn.disabled = true;

        try {
            await fetch('/api/manageData', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'add', table: 'Transactions', 
                    data: { plat: platKendaraan, nama: namaPemilik, deskripsi: dsk, jasa: jsa, total: totalSemua, parts: this.cart } 
                })
            });

            for (let item of this.cart) {
                await fetch('/api/manageData', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_part_stock', data: { id: item.id, qty: -item.qty } }) 
                });
                await this.pushInventoryLog(item.nama, item.qty, 'KELUAR');
            }

            if (antrianIdTarget) {
                await fetch('/api/manageData', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update_queue_status', data: { id: antrianIdTarget, status: 'SELESAI' }})
                });
            }

            const trxUntukCetak = new TransaksiServis(trxMotorInfo, new Date().toISOString(), dsk, jsa, [...this.cart], "BARU");
            trxUntukCetak.hitungTotal = () => totalSemua;

            this.cart = []; 
            e.target.reset(); 
            document.getElementById('kasir-parts-only').checked = false; 
            this.toggleKasirMode(); 
            
            await this.load(); 
            ui.printStruk(trxUntukCetak); 
            ui.nav('dashboard');

        } catch (error) { alert("Terjadi kesalahan saat menghubungi server."); console.error(error); } 
        finally { btn.innerText = prevText; btn.disabled = false; }
    },

    cetakUlang(id) { const tr = this.riwayat.find(r => r.id == id); if(tr) ui.printStruk(tr); },
    refreshUI() { ui.renderAll(); }
};

// --- VIEW UI RENDERER ---
const ui = {
    nav(id) {
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        document.querySelectorAll('.sidebar-btn').forEach(b => { b.classList.remove('active'); if(b.dataset.id === id) b.classList.add('active'); });
        if(id === 'kasir') {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('kasir-tanggal').value = now.toISOString().slice(0, 16);
        }
        app.refreshUI();
    },
    applyRolePermissions() {
        const role = app.currentUserRole;
        const nDash = document.getElementById('btn-nav-dashboard'), nMot = document.getElementById('btn-nav-motor'), nAnt = document.getElementById('btn-nav-antrian'), nStok = document.getElementById('btn-nav-stok'), nKas = document.getElementById('btn-nav-kasir');
        const formGudang = document.getElementById('gudang-action-form');
        
        if (role === 'admin') {
            nDash.style.display = 'flex'; nMot.style.display = 'flex'; nAnt.style.display = 'flex'; nStok.style.display = 'flex'; nKas.style.display = 'flex';
            formGudang.style.display = 'flex';
        } else if (role === 'kasir') {
            nDash.style.display = 'flex'; nMot.style.display = 'flex'; nAnt.style.display = 'flex'; nStok.style.display = 'flex'; nKas.style.display = 'flex';
            formGudang.style.display = 'none';
        } else if (role === 'gudang') {
            nDash.style.display = 'none'; nMot.style.display = 'none'; nAnt.style.display = 'none'; nStok.style.display = 'flex'; nKas.style.display = 'none';
            formGudang.style.display = 'flex';
        }
        document.getElementById('sidebar-role-label').innerText = `Akses: ${role.toUpperCase()}`;
    },
    renderAll() { this.renderDash(); this.renderMotors(); this.renderAntrian(); this.renderStok(); this.renderSelects(); this.renderCart(); },
    
    renderDash() {
        const sH = app.riwayat.filter(r => r.motor.plat !== '-');
        const dH = app.riwayat.filter(r => r.motor.plat === '-');
        const uM = new Set(sH.map(r => r.motor.plat));
        
        document.getElementById('stat-motor').innerText = uM.size;
        document.getElementById('stat-antrian').innerText = app.antrian.filter(a=>a.status === 'ANTRIAN').length;
        document.getElementById('stat-proses').innerText = app.antrian.filter(a=>a.status === 'PROSES').length;
        document.getElementById('stat-selesai').innerText = sH.length;
        document.getElementById('stat-pembelian').innerText = dH.length;

        const tbS = document.getElementById('table-recent-servis'); tbS.innerHTML = '';
        if(sH.length === 0) tbS.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-slate-400 italic">Belum ada data</td></tr>`;
        sH.slice(0,10).forEach(r => {
            tbS.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="px-6 py-4 text-[11px]">${r.formatWaktu}</td><td class="px-6 py-4 font-black uppercase text-center">${r.motor.plat}</td><td class="px-6 py-4 font-bold text-slate-500 capitalize text-center">${r.motor.pemilik}</td><td class="px-6 py-4 font-black text-blue-600 text-center">${app.formatRp.format(r.hitungTotal())}</td><td class="px-6 py-4 text-center"><button onclick="ui.showDetailTransaksi('${r.id}')" class="text-slate-400 hover:text-blue-500 mr-3" title="Detail"><i class="fa-solid fa-eye"></i></button><button onclick="app.cetakUlang('${r.id}')" class="text-slate-400 hover:text-green-500" title="Cetak Ulang"><i class="fa-solid fa-print"></i></button></td></tr>`;
        });

        const tbD = document.getElementById('table-direct-purchase'); tbD.innerHTML = '';
        if(dH.length === 0) tbD.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-slate-400 italic">Belum ada data</td></tr>`;
        dH.slice(0,10).forEach(r => {
            const iN = r.parts.map(p => p.nama).join(', ');
            tbD.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="px-6 py-4 text-[11px]">${r.formatWaktu}</td><td class="px-6 py-4 max-w-[200px] truncate text-center">${iN}</td><td class="px-6 py-4 font-black text-emerald-600 text-center">${app.formatRp.format(r.hitungTotal())}</td><td class="px-6 py-4 text-center"><button onclick="ui.showDetailTransaksi('${r.id}')" class="text-slate-400 hover:text-blue-500 mr-3" title="Detail"><i class="fa-solid fa-eye"></i></button><button onclick="app.cetakUlang('${r.id}')" class="text-slate-400 hover:text-emerald-500" title="Cetak Ulang"><i class="fa-solid fa-print"></i></button></td></tr>`;
        });
    },
            
    renderMotors() {
        const tb = document.getElementById('table-motor-data');
        if (!tb) return;  tb.innerHTML = '';
        const searchEl = document.getElementById('search-motor');
        const keyword = searchEl ? searchEl.value.toLowerCase() : '';

        const filteredMotors = app.motors.filter(m => 
            (m.plat || '').toLowerCase().includes(keyword) || 
            (m.pemilik || '').toLowerCase().includes(keyword) || 
            (m.merk || '').toLowerCase().includes(keyword)
        );

        if(filteredMotors.length === 0) {
            tb.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400 italic">Kendaraan tidak ditemukan.</td></tr>`;
            return;
        }
                
        filteredMotors.forEach(m => {
            const status = m.statusTerakhir || 'NON-AKTIF';
            const sc = status === 'ANTRIAN' ? 'status-antrian' : (status === 'PROSES' ? 'status-proses' : (status === 'SELESAI' ? 'status-selesai' : 'status-nonaktif'));
            tb.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="px-6 py-4 font-black uppercase">${m.plat || '-'}</td><td class="px-6 py-4 font-bold text-slate-600">${m.merk || '-'} <span class="font-normal text-slate-400">${m.tipe || '-'}</span></td><td class="px-6 py-4 capitalize">${m.pemilik || '-'}</td><td class="px-6 py-4 text-center"><span class="status-badge ${sc}">${status}</span></td><td class="px-6 py-4 text-center flex gap-2 justify-center"><button onclick="app.editMotor('${m.id}')" class="text-blue-500 hover:scale-110"><i class="fa-solid fa-pen"></i></button><button onclick="app.hapusMotor('${m.id}')" class="text-red-500 hover:scale-110"><i class="fa-solid fa-trash"></i></button></td></tr>`;
        });
    },

    renderAntrian() {
        const c = document.getElementById('list-antrian-container'); c.innerHTML = '';
        const searchEl = document.getElementById('search-antrian');
        const keyword = searchEl ? searchEl.value.toLowerCase() : '';

        const a = app.antrian.filter(x => x.status != 'SELESAI');
        const filteredA = a.filter(node => {
            const m = app.motors.find(x => x.id == node.motorId);
            if(!m) return false;
            return m.plat.toLowerCase().includes(keyword) || m.pemilik.toLowerCase().includes(keyword) || node.keluhan.toLowerCase().includes(keyword);
        });

        if(filteredA.length === 0) c.innerHTML = `<p class="text-slate-400 italic text-sm text-center mt-4">Pencarian tidak menemukan antrian.</p>`;
                
        filteredA.forEach(node => {
            const m = app.motors.find(x => x.id == node.motorId), pr = node.status === 'PROSES';
            c.innerHTML += `<div class="bg-white p-5 rounded-2xl border flex justify-between items-center ${pr ? 'border-blue-300 ring-4 ring-blue-50' : 'border-slate-100 shadow-sm'}"><div class="flex items-start gap-4"><div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 shrink-0 text-sm">#${node.nomor.toString().padStart(2, '0')}</div><div><div class="flex items-center gap-3 mb-1"><span class="font-black text-lg text-slate-800 uppercase">${m ? m.plat : '??'}</span><span class="status-badge ${pr ? 'status-proses' : 'status-antrian'}">${node.status}</span></div><p class="text-xs text-slate-500 font-bold mb-2">Pemilik: ${m ? m.pemilik : '??'} (${node.tanggal} ${node.waktu})</p><p class="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border italic">"${node.keluhan}"</p></div></div><div>${!pr ? `<button onclick="app.setProses('${node.id}')" class="bg-blue-600 text-white px-5 py-3 rounded-xl text-xs font-black shadow-lg">KERJAKAN</button>` : `<i class="fa-solid fa-spinner animate-spin text-blue-500 text-2xl mr-4"></i>`}</div></div>`;
        });
    },

    renderStok() {
        const tb = document.getElementById('table-stok-data'); tb.innerHTML = '';
        const searchEl = document.getElementById('search-stok');
        const keyword = searchEl ? searchEl.value.toLowerCase() : '';
        const role = app.currentUserRole;

        const filteredParts = app.parts.filter(p => p.nama.toLowerCase().includes(keyword) || (p.kode && p.kode.toLowerCase().includes(keyword)));
        if(filteredParts.length === 0) tb.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-slate-400 italic">Suku cadang tidak ditemukan.</td></tr>`;

        filteredParts.forEach(p => {
            const lw = p.stok < 5;
            let actionBtns = (role === 'admin' || role === 'gudang') 
                ? `<button onclick="app.editPart('${p.id}')" class="text-blue-500 hover:scale-110"><i class="fa-solid fa-pen"></i></button><button onclick="ui.openStokModal('${p.id}','${p.nama}')" class="text-green-600 hover:scale-110"><i class="fa-solid fa-plus"></i></button><button onclick="app.hapusPart('${p.id}')" class="text-red-500 hover:scale-110"><i class="fa-solid fa-trash"></i></button>`
                : `<span class="text-[10px] font-black text-slate-300 italic uppercase">Hanya Lihat</span>`;

            tb.innerHTML += `<tr class="border-b hover:bg-slate-50 transition-all"><td class="px-6 py-4"><span class="text-[10px] font-black text-slate-400 block mb-0.5 tracking-wider">${p.kode}</span><span class="font-bold text-slate-700">${p.nama}</span></td><td class="px-6 py-4 text-center font-black ${lw ? 'text-red-500 bg-red-50 rounded-xl' : 'text-slate-800'}">${p.stok}</td><td class="px-6 py-4 text-right font-bold text-blue-600">${app.formatRp.format(p.harga)}</td><td class="px-6 py-4 text-center flex justify-center items-center gap-3 pt-6">${actionBtns}</td></tr>`;
        });

        const lf = document.getElementById('stack-lifo-container'); lf.innerHTML = '';
        if(app.restokStack.length === 0) lf.innerHTML = `<p class="text-slate-500 italic text-xs">Belum ada histori pergerakan stok.</p>`;
        
        app.restokStack.forEach(x => {
            const isM = x.tipe === 'MASUK';
            const isDel = x.tipe === 'DIHAPUS';
            
            const borderColor = isM ? 'border-green-500' : 'border-red-500';
            const bgColor = isM ? 'bg-green-500' : 'bg-red-500';
            const textColor = isM ? 'text-green-400' : 'text-red-400';
            const sign = isDel ? '[HAPUS]' : (isM ? '+' : '-');

            lf.innerHTML += `<div class="relative pl-6 border-l-2 ${borderColor} pb-4"><div class="absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-slate-900 ${bgColor}"></div><span class="block text-[10px] text-slate-400 font-bold uppercase mb-1">${x.tanggal} ${x.waktu}</span><span class="text-sm font-black ${textColor}">${sign} ${x.qty} ${x.nama}</span></div>`;
        });
    },
            
    renderSelects() {
        const sa = document.getElementById('antrian-motor-id'); sa.innerHTML = '<option value="">-- Pilih Motor --</option>';
        app.motors.filter(m => m.statusTerakhir !== 'PROSES' && m.statusTerakhir !== 'ANTRIAN').forEach(m => sa.innerHTML += `<option value="${m.id}">${m.getInfo()} (Milik: ${m.pemilik})</option>`);
                
        const sk = document.getElementById('kasir-motor-id'); sk.innerHTML = '<option value="">-- Pilih Motor Process --</option>';
        app.antrian.filter(a => a.status === 'PROSES').forEach(n => { const m = app.motors.find(x => x.id == n.motorId); if(m) sk.innerHTML += `<option value="${m.id}">#${n.nomor} | ${m.getInfo()}</option>`; });
                
        const sp = document.getElementById('kasir-pilih-part'); sp.innerHTML = '<option value="">-- Cari Suku Cadang --</option>';
        app.parts.forEach(p => sp.innerHTML += `<option value="${p.id}">${p.getInfo()} (${app.formatRp.format(p.harga)})</option>`);
    },

    renderCart() {
        const c = document.getElementById('cart-container'); c.innerHTML = '';
        if(app.cart.length === 0) {
            c.innerHTML = `<p class="text-center text-slate-400 py-10 italic text-sm font-medium">Belum ada item ditambahkan.</p>`;
        } else {
            app.cart.forEach(it => { c.innerHTML += `<div class="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-2"><div><span class="font-bold text-slate-700 text-sm block">${it.nama}</span><span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black">x${it.qty}</span></div><div class="flex items-center gap-4"><span class="font-black text-slate-800">${app.formatRp.format(it.subtotal)}</span><button type="button" onclick="app.hapusItemCart('${it.id}')" class="text-red-400 hover:bg-red-500 hover:text-white p-2 rounded-xl"><i class="fa-solid fa-trash"></i></button></div></div>`; });
        }
        
        let jsa = parseInt(document.getElementById('kasir-jasa').value) || 0;
        if(jsa < 0) jsa = 0; 
        
        let t = app.cart.reduce((s,i)=>s+i.subtotal, 0) + jsa;
        document.getElementById('kasir-total-display').innerText = app.formatRp.format(t);
    },

    resetMotorForm() { 
        document.getElementById('form-motor').reset(); document.getElementById('motor-id-edit').value = ''; 
        document.getElementById('motor-form-title').innerHTML = '<i class="fa-solid fa-plus-circle text-blue-500"></i> Tambah Motor Baru'; 
        document.getElementById('btn-save-motor').innerText = "Simpan Data"; document.getElementById('btn-cancel-motor').classList.add('hidden'); 
    },
    resetPartForm() { 
        document.getElementById('part-id-edit').value = ''; document.getElementById('part-kode').value = ''; 
        document.getElementById('part-nama').value = ''; document.getElementById('part-stok').value = ''; 
        document.getElementById('part-harga').value = ''; document.getElementById('btn-save-part').innerText = "Tambah"; 
        document.getElementById('btn-cancel-part').classList.add('hidden'); 
    },
    openStokModal(id, nm) { document.getElementById('restok-id').value = id; document.getElementById('restok-label').innerText = nm; document.getElementById('modal-stok').classList.replace('hidden','flex'); },
    closeStokModal() { document.getElementById('modal-stok').classList.replace('flex','hidden'); },
    
    showDetailTransaksi(id) {
        const tr = app.riwayat.find(r => r.id == id);
        if(!tr) return;
        const isP = tr.motor.plat === '-';
        let partsHtml = '';
        if(tr.parts.length > 0) {
            partsHtml = `<div class="mt-4"><p class="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b border-slate-100 pb-1">Suku Cadang Dibeli</p><ul class="space-y-2">`;
            tr.parts.forEach(p => { partsHtml += `<li class="flex justify-between items-center border-b border-dashed border-slate-100 pb-2"><div class="flex flex-col"><span class="font-bold text-slate-700">${p.nama}</span><span class="text-[10px] bg-blue-50 w-fit text-blue-600 px-1.5 py-0.5 rounded font-black mt-1">x ${p.qty} item</span></div> <span class="font-black text-slate-800">${app.formatRp.format(p.subtotal)}</span></li>`; });
            partsHtml += `</ul></div>`;
        } else {
            partsHtml = `<div class="mt-4"><p class="text-[10px] font-bold text-slate-400 uppercase mb-2 border-b border-slate-100 pb-1">Suku Cadang Dibeli</p><p class="text-xs italic text-slate-400">- Tidak ada pembelian suku cadang -</p></div>`;
        }

        const content = `
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                <div class="flex justify-between mb-2"><span class="font-bold text-blue-400 text-xs">ID INVOICE</span> <span class="font-mono text-xs font-black text-blue-700">#${tr.id}</span></div>
                <div class="flex justify-between"><span class="font-bold text-blue-400 text-xs">WAKTU</span> <span class="text-xs font-black text-blue-700">${tr.formatWaktu}</span></div>
            </div>
            <div class="mb-4">
                <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Informasi Pelanggan</p>
                ${isP ? `<p class="font-bold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">Pelanggan Umum (Beli Langsung)</p>` : `<div class="bg-slate-50 p-3 rounded-lg border border-slate-100"><p class="font-black text-slate-800 uppercase text-lg mb-1">${tr.motor.plat}</p><p class="text-slate-500 font-medium text-xs capitalize"><i class="fa-solid fa-user mr-1 text-slate-400"></i> ${tr.motor.pemilik} &nbsp;|&nbsp; <i class="fa-solid fa-motorcycle mr-1 text-slate-400"></i> ${tr.motor.merk} ${tr.motor.tipe}</p></div>`}
            </div>
            ${!isP ? `<div class="mb-4"><p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Deskripsi / Keluhan</p><p class="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100 italic text-sm font-medium">"${tr.desk}"</p><div class="flex justify-between items-center mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100"><span class="text-slate-500 text-xs font-bold uppercase">Biaya Jasa Mekanik</span> <span class="font-black text-slate-800">${app.formatRp.format(tr.jasa)}</span></div></div>` : `<div class="mb-4"><p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Keterangan</p><p class="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 italic text-sm font-medium">"${tr.desk}"</p></div>`}
            ${partsHtml}
            <div class="mt-6 pt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-center bg-green-50 p-4 rounded-xl border border-green-100">
                <span class="font-black text-green-700 text-sm">TOTAL KESELURUHAN</span>
                <span class="font-black text-green-600 text-xl">${app.formatRp.format(tr.hitungTotal())}</span>
            </div>`;
        document.getElementById('detail-transaksi-content').innerHTML = content;
        document.getElementById('modal-detail-transaksi').classList.replace('hidden', 'flex');
    },
    closeDetailTransaksi() { document.getElementById('modal-detail-transaksi').classList.replace('flex', 'hidden'); },
    
    printStruk(tr) {
        const a = document.getElementById('invoice-print'); let it = '';
        const isP = tr.motor.plat === '-';
        tr.parts.forEach(p => it += `<tr style="border-bottom:1px dashed #ccc;"><td style="padding:6px 0;">${p.nama} <br><small>x${p.qty}</small></td><td style="text-align:right; font-weight:bold;">${app.formatRp.format(p.subtotal)}</td></tr>`);
        let hH = isP ? `<div>INV: #${tr.id}</div><div>WAKTU: ${tr.formatWaktu}</div><div>PELANGGAN: UMUM</div>` : `<div>INV: #${tr.id}</div><div>WAKTU: ${tr.formatWaktu}</div><div>PLAT: ${tr.motor.plat}</div><div>NAMA: ${tr.motor.pemilik}</div>`;
        a.innerHTML = `<div style="text-align:center;"><h2>MOTOCARE</h2><small>Final Project PBO Edition</small><hr></div><div style="font-size:12px; border-bottom:1px solid #000; padding:10px 0;">${hH}</div><table style="width:100%; font-size:12px;">${!isP?`<tr><td style="padding:6px 0;">Jasa Mekanik: <br><small>${tr.desk}</small></td><td style="text-align:right;">${app.formatRp.format(tr.jasa)}</td></tr>`:''}${it}</table><hr><div style="display:flex; justify-content:space-between; font-weight:bold;"><span>TOTAL</span> <span>${app.formatRp.format(tr.hitungTotal())}</span></div><center><br><small>Terima Kasih!</small></center>`;
        a.classList.remove('hidden'); setTimeout(() => { window.print(); a.innerHTML = ''; a.classList.add('hidden'); }, 500);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());