/**
         * =========================================
         * [ABSTRACTION & INHERITANCE & POLYMORPHISM]
         * =========================================
         */
        class EntitasBase {
            constructor(id) {
                if (new.target === EntitasBase) {
                    throw new Error("Abstract Class 'EntitasBase' tidak bisa dibuat objeknya secara langsung.");
                }
                this.id = id || Date.now() + Math.floor(Math.random()*100);
            }

            // Konsep Polimorfisme: Base method yang akan di-override oleh Child Classes
            getInfo() {
                return `Entitas System [ID: ${this.id}]`;
            }
        }

        class Motor extends EntitasBase {
            constructor(plat, merk, tipe, pemilik, tahun, id=null) {
                super(id);
                this.plat = plat.toUpperCase();
                this.merk = merk;
                this.tipe = tipe;
                this.pemilik = pemilik;
                this.tahun = tahun;
                this.statusTerakhir = 'NON-AKTIF';
            }

            // Implementasi Polimorfisme (Overriding)
            getInfo() {
                return `Motor ${this.plat} - ${this.merk} ${this.tipe}`;
            }
        }

        /**
         * =========================================
         * [ENCAPSULATION]
         * =========================================
         */
        class SukuCadang extends EntitasBase {
            constructor(nama, stok, harga, id=null, kode=null) {
                super(id);
                // Tambahan: Auto-generate kode jika tidak diberikan
                this.kode = kode || 'SP-' + Math.floor(Math.random() * 9000 + 1000).toString();
                this.nama = nama;
                this._stok = parseInt(stok);
                this._harga = parseInt(harga);
            }

            // Implementasi Polimorfisme (Overriding)
            getInfo() {
                return `[${this.kode}] ${this.nama}`;
            }

            get stok() { return this._stok; }
            get harga() { return this._harga; }
            
            tambah(jml) { this._stok += parseInt(jml); }
            kurang(jml) { 
                if(this._stok >= jml) { this._stok -= parseInt(jml); return true; } 
                return false; 
            }
            updateData(kode, nama, harga) { 
                if(kode) this.kode = kode; 
                this.nama = nama; 
                this._harga = parseInt(harga); 
            }
            setStok(jml) { this._stok = parseInt(jml); }
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

            // Implementasi Polimorfisme (Overriding)
            getInfo() {
                return `Transaksi #${this.id} - Total: ${app.formatRp.format(this.hitungTotal())}`;
            }
            
            get formatWaktu() {
                const date = new Date(this.tglRaw);
                const d = date.toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit', year:'numeric'});
                const t = date.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
                return `${d} ${t}`;
            }

            hitungTotal() { return this.jasa + this.parts.reduce((sum, p) => sum + p.subtotal, 0); }
        }

        /**
         * =========================================
         * [CONTROLLER SYSTEM]
         * =========================================
         */
        const app = {
            motors: [], parts: [], antrian: [], restokStack: [], riwayat: [], cart: [], isLogin: false, currentUserRole: null,
            formatRp: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }),

            init() {
                this.load();
                this.startClock();
                ui.renderAll();
                document.getElementById('motor-pemilik').addEventListener('input', (e) => {
                    const regex = /^[a-zA-Z\s]*$/;
                    const err = document.getElementById('err-nama');
                    if(!regex.test(e.target.value)) { e.target.classList.add('border-red-500'); err.classList.remove('hidden'); }
                    else { e.target.classList.remove('border-red-500'); err.classList.add('hidden'); }
                });
                document.getElementById('kasir-jasa').addEventListener('input', () => ui.renderCart());
            },

            startClock() {
                const clockEl = document.getElementById('digital-clock');
                const dateEl = document.getElementById('current-date');
                const update = () => {
                    const now = new Date();
                    clockEl.innerText = now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
                    dateEl.innerText = now.toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
                };
                setInterval(update, 1000);
                update();
            },

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
                document.getElementById('login-error').classList.add('hidden');
                
                this.cart = [];
                ui.renderCart();
                
                ui.nav('dashboard');
            },

            // CRUD MOTOR
            handleMotorSubmit(e) {
                e.preventDefault();
                const id = document.getElementById('motor-id-edit').value, plat = document.getElementById('motor-plat').value, merk = document.getElementById('motor-merk').value, tipe = document.getElementById('motor-tipe').value, pemilik = document.getElementById('motor-pemilik').value, tahun = document.getElementById('motor-tahun').value;
                if(!/^[a-zA-Z\s]*$/.test(pemilik)) return alert("Nama pemilik dilarang angka!");

                if(id) {
                    if (this.motors.some(m => m.plat === plat.toUpperCase() && m.id != id)) return alert("Plat Nomor sudah terdaftar!");
                    const idx = this.motors.findIndex(m => m.id == id);
                    const st = this.motors[idx].statusTerakhir;
                    this.motors[idx] = new Motor(plat, merk, tipe, pemilik, tahun, id);
                    this.motors[idx].statusTerakhir = st;
                } else {
                    if (this.motors.some(m => m.plat === plat.toUpperCase())) return alert("Plat Nomor ini sudah ada!");
                    this.motors.push(new Motor(plat, merk, tipe, pemilik, tahun));
                }
                this.save(); ui.resetMotorForm(); this.refreshUI();
            },

            editMotor(id) {
                const m = this.motors.find(m => m.id == id);
                document.getElementById('motor-id-edit').value = m.id;
                document.getElementById('motor-plat').value = m.plat;
                document.getElementById('motor-merk').value = m.merk;
                document.getElementById('motor-tipe').value = m.tipe;
                document.getElementById('motor-pemilik').value = m.pemilik;
                document.getElementById('motor-tahun').value = m.tahun;
                document.getElementById('motor-form-title').innerHTML = '<i class="fa-solid fa-pen text-blue-500"></i> Edit Motor';
                document.getElementById('btn-save-motor').innerText = "Update Motor";
                document.getElementById('btn-cancel-motor').classList.remove('hidden');
            },

            hapusMotor(id) { if(confirm("Hapus data motor?")) { this.motors = this.motors.filter(m => m.id != id); this.save(); this.refreshUI(); } },

            // QUEUE
            handleAntrianSubmit(e) {
                e.preventDefault();
                const mId = document.getElementById('antrian-motor-id').value, kel = document.getElementById('antrian-keluhan').value;
                if(this.antrian.find(a => a.motorId == mId && a.status != 'SELESAI')) return alert("Motor sudah dalam antrian!");
                const nomorAntrian = this.antrian.length + 1;
                this.antrian.push(new AntrianItem(mId, kel, nomorAntrian));
                this.motors.find(x => x.id == mId).statusTerakhir = 'ANTRIAN';
                this.save(); e.target.reset(); this.refreshUI();
            },

            setProses(antrianId) {
                const item = this.antrian.find(a => a.id == antrianId);
                item.status = 'PROSES';
                this.motors.find(x => x.id == item.motorId).statusTerakhir = 'PROSES';
                this.save();
                document.getElementById('kasir-motor-id').value = item.motorId;
                document.getElementById('kasir-deskripsi').value = item.keluhan;
                this.refreshUI();
            },

            // CRUD PART & LOG
            handlePartSubmit() {
                if(this.currentUserRole === 'kasir') return alert("Akses Ditolak: Anda tidak memiliki hak akses mengubah stok!");
                const id = document.getElementById('part-id-edit').value, 
                      kodeInput = document.getElementById('part-kode').value.toUpperCase(),
                      n = document.getElementById('part-nama').value, 
                      s = parseInt(document.getElementById('part-stok').value), 
                      h = document.getElementById('part-harga').value;
                      
                if(!n || isNaN(s) || !h) return alert("Lengkapi form nama, stok, dan harga!");
                
                if(id) {
                    const idx = this.parts.findIndex(p => p.id == id);
                    if(idx !== -1) {
                        const diff = s - this.parts[idx].stok;
                        this.parts[idx].updateData(kodeInput, n, h);
                        this.parts[idx].setStok(s);
                        if (diff > 0) this.pushInventoryLog(n, diff, 'MASUK');
                        else if (diff < 0) this.pushInventoryLog(n, Math.abs(diff), 'KELUAR');
                    }
                } else {
                    this.parts.push(new SukuCadang(n, s, h, null, kodeInput || null));
                    this.pushInventoryLog(n, s, 'MASUK');
                }
                this.save(); ui.resetPartForm(); this.refreshUI();
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

            hapusPart(id) { 
                if(this.currentUserRole === 'kasir') return alert("Akses Ditolak!");
                if(confirm("Hapus item?")) { this.parts = this.parts.filter(p => p.id != id); this.save(); this.refreshUI(); } 
            },

            prosesRestok() {
                if(this.currentUserRole === 'kasir') return alert("Akses Ditolak!");
                const id = document.getElementById('restok-id').value, qty = document.getElementById('restok-qty').value;
                const p = this.parts.find(x => x.id == id);
                p.tambah(qty); this.pushInventoryLog(p.nama, qty, 'MASUK');
                this.save(); ui.closeStokModal(); this.refreshUI();
            },

            pushInventoryLog(nama, qty, tipe) {
                const now = new Date();
                this.restokStack.push({ nama, qty, tipe, waktu: now.toLocaleTimeString('id-ID'), tanggal: now.toLocaleDateString('id-ID', {day:'2-digit', month:'short'}) });
                if(this.restokStack.length > 25) this.restokStack.shift(); 
            },

            toggleKasirMode() {
                const isP = document.getElementById('kasir-parts-only').checked, mS = document.getElementById('kasir-motor-id'), dS = document.getElementById('kasir-deskripsi'), jI = document.getElementById('kasir-jasa');
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
                if(!id) return;
                const pF = this.parts.find(x => x.id == id), ex = this.cart.find(c => c.id == id), tot = ex ? (ex.qty + qty) : qty;
                if(pF.stok < tot) return alert("Stok kurang!");
                if(ex) { ex.qty += qty; } else { this.cart.push(new ItemKeranjang(pF.id, pF.nama, qty, pF.harga)); }
                ui.renderCart();
            },

            hapusItemCart(id) { this.cart = this.cart.filter(c => c.id != id); ui.renderCart(); },

            handleTransaksiSubmit(e) {
                e.preventDefault();
                const isP = document.getElementById('kasir-parts-only').checked, mId = document.getElementById('kasir-motor-id').value, tglStr = document.getElementById('kasir-tanggal').value, dsk = document.getElementById('kasir-deskripsi').value, jsa = document.getElementById('kasir-jasa').value;
                if(!isP && !mId) return alert("Pilih motor!");
                if(this.cart.length === 0 && jsa == 0) return alert("Kosong!");

                let m;
                if (isP) { m = new Motor('-', '-', '-', 'Pelanggan Umum', '-'); }
                else {
                    m = this.motors.find(x => x.id == mId);
                    const qI = this.antrian.find(a => a.motorId == mId && a.status == 'PROSES');
                    if(qI) qI.status = 'SELESAI';
                    m.statusTerakhir = 'SELESAI';
                }
                this.cart.forEach(c => { this.parts.find(x => x.id == c.id).kurang(c.qty); this.pushInventoryLog(c.nama, c.qty, 'KELUAR'); });
                const trx = new TransaksiServis(m, tglStr, dsk, jsa, [...this.cart]);
                this.riwayat.unshift(trx); this.cart = []; this.save(); e.target.reset(); document.getElementById('kasir-parts-only').checked = false; this.toggleKasirMode(); this.refreshUI(); ui.printStruk(trx); ui.nav('dashboard');
            },

            cetakUlang(id) { const tr = this.riwayat.find(r => r.id == id); if(tr) ui.printStruk(tr); },

            refreshUI() { ui.renderAll(); },
            
            save() {
                localStorage.setItem('motocare_motors', JSON.stringify(this.motors));
                localStorage.setItem('motocare_parts', JSON.stringify(this.parts));
                localStorage.setItem('motocare_antrian', JSON.stringify(this.antrian));
                localStorage.setItem('motocare_stack', JSON.stringify(this.restokStack));
                localStorage.setItem('motocare_riwayat', JSON.stringify(this.riwayat));
            },
            
            load() {
                const storedMotors = JSON.parse(localStorage.getItem('motocare_motors'));
                const storedParts = JSON.parse(localStorage.getItem('motocare_parts'));
                const storedAntrian = JSON.parse(localStorage.getItem('motocare_antrian'));
                const storedStack = JSON.parse(localStorage.getItem('motocare_stack'));
                const storedRiwayat = JSON.parse(localStorage.getItem('motocare_riwayat'));

                if (storedMotors && storedParts) {
                    this.motors = storedMotors.map(x => { 
                        const o = new Motor(x.plat, x.merk, x.tipe, x.pemilik, x.tahun, x.id); 
                        o.statusTerakhir = x.statusTerakhir; 
                        return o; 
                    });
                    this.parts = storedParts.map(x => new SukuCadang(x.nama, x._stok, x._harga, x.id, x.kode));
                    this.antrian = storedAntrian || [];
                    this.restokStack = storedStack || [];
                    this.riwayat = (storedRiwayat || []).map(x => {
                        const c = x.parts.map(cp => new ItemKeranjang(cp.id, cp.nama, cp.qty, cp.harga));
                        return new TransaksiServis(x.motor, x.tglRaw, x.desk, x.jasa, c, x.id);
                    });
                } else {
                    if (this.motors.length === 0) {
                        const m1 = new Motor('B 1234 ABC', 'Honda', 'Vario 150', 'Budi', 2020);
                        m1.statusTerakhir = 'PROSES';
                        this.motors.push(m1);

                        const m2 = new Motor('D 5678 EFG', 'Yamaha', 'NMAX', 'Siti', 2022);
                        m2.statusTerakhir = 'ANTRIAN';
                        this.motors.push(m2);

                        const m3 = new Motor('AB 9012 HI', 'Suzuki', 'GSX R150', 'Agus', 2019);
                        m3.statusTerakhir = 'SELESAI';
                        this.motors.push(m3);

                        // Dummy Suku Cadang sekarang juga menggunakan Kode (Otomatis digenerate)
                        this.parts.push(new SukuCadang('Oli Mesin MPX 2 0.8L', 45, 55000));
                        this.parts.push(new SukuCadang('Kampas Rem Depan Cakram Honda', 25, 45000));
                        this.parts.push(new SukuCadang('Busi NGK CPR9EA-9', 60, 20000));
                        this.parts.push(new SukuCadang('Oli Mesin Yamalube Sport 1L', 30, 65000));
                        this.parts.push(new SukuCadang('Oli Gardan AHM', 50, 15000));
                        this.parts.push(new SukuCadang('Kampas Rem Belakang Tromol Yamaha', 20, 40000));
                        this.parts.push(new SukuCadang('Busi Denso U27EPR-N9', 40, 22000));

                        const a1 = new AntrianItem(m1.id, 'Servis rutin dan ganti oli mesin', 1);
                        a1.status = 'PROSES';
                        this.antrian.push(a1);

                        const a2 = new AntrianItem(m2.id, 'Rem depan blong, tolong di cek', 2);
                        this.antrian.push(a2);

                        const partTerjual = [new ItemKeranjang(this.parts[2].id, this.parts[2].nama, 1, this.parts[2].harga)];
                        const trx = new TransaksiServis(m3, new Date().toISOString().slice(0, 16), 'Ganti busi', 15000, partTerjual);
                        this.riwayat.push(trx);

                        this.save();
                    }
                }
            }
        };

        /**
         * =========================================
         * [VIEW UI RENDERER]
         * =========================================
         */
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
            
            // Render Motors: Diperbarui dengan logic pencarian
            renderMotors() {
                const tb = document.getElementById('table-motor-data'); tb.innerHTML = '';
                const searchEl = document.getElementById('search-motor');
                const keyword = searchEl ? searchEl.value.toLowerCase() : '';

                const filteredMotors = app.motors.filter(m => 
                    m.plat.toLowerCase().includes(keyword) || 
                    m.pemilik.toLowerCase().includes(keyword) || 
                    m.merk.toLowerCase().includes(keyword) || 
                    m.tipe.toLowerCase().includes(keyword)
                );

                if(filteredMotors.length === 0) tb.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400 italic">Kendaraan tidak ditemukan.</td></tr>`;
                
                filteredMotors.forEach(m => {
                    const sc = m.statusTerakhir === 'ANTRIAN' ? 'status-antrian' : (m.statusTerakhir === 'PROSES' ? 'status-proses' : (m.statusTerakhir === 'SELESAI' ? 'status-selesai' : 'status-nonaktif'));
                    tb.innerHTML += `<tr class="border-b hover:bg-slate-50"><td class="px-6 py-4 font-black uppercase">${m.plat}</td><td class="px-6 py-4 font-bold text-slate-600">${m.merk} <span class="font-normal text-slate-400">${m.tipe}</span></td><td class="px-6 py-4 capitalize">${m.pemilik}</td><td class="px-6 py-4 text-center"><span class="status-badge ${sc}">${m.statusTerakhir}</span></td><td class="px-6 py-4 text-center flex gap-2 justify-center"><button onclick="app.editMotor('${m.id}')" class="text-blue-500 hover:scale-110"><i class="fa-solid fa-pen"></i></button><button onclick="app.hapusMotor('${m.id}')" class="text-red-500 hover:scale-110"><i class="fa-solid fa-trash"></i></button></td></tr>`;
                });
            },

            // Render Antrian: Diperbarui dengan logic pencarian
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

            // Render Stok: Diperbarui dengan logic pencarian dan Kode Unik
            renderStok() {
                const tb = document.getElementById('table-stok-data'); tb.innerHTML = '';
                const searchEl = document.getElementById('search-stok');
                const keyword = searchEl ? searchEl.value.toLowerCase() : '';
                const role = app.currentUserRole;

                const filteredParts = app.parts.filter(p => 
                    p.nama.toLowerCase().includes(keyword) || 
                    (p.kode && p.kode.toLowerCase().includes(keyword))
                );

                if(filteredParts.length === 0) tb.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-slate-400 italic">Suku cadang tidak ditemukan.</td></tr>`;

                filteredParts.forEach(p => {
                    const lw = p.stok < 5;
                    let actionBtns = '';
                    
                    if (role === 'admin' || role === 'gudang') {
                        actionBtns = `<button onclick="app.editPart('${p.id}')" class="text-blue-500 hover:scale-110"><i class="fa-solid fa-pen"></i></button><button onclick="ui.openStokModal('${p.id}','${p.nama}')" class="text-green-600 hover:scale-110"><i class="fa-solid fa-plus"></i></button><button onclick="app.hapusPart('${p.id}')" class="text-red-500 hover:scale-110"><i class="fa-solid fa-trash"></i></button>`;
                    } else {
                        actionBtns = `<span class="text-[10px] font-black text-slate-300 italic uppercase">Hanya Lihat</span>`;
                    }

                    tb.innerHTML += `<tr class="border-b hover:bg-slate-50 transition-all"><td class="px-6 py-4"><span class="text-[10px] font-black text-slate-400 block mb-0.5 tracking-wider">${p.kode}</span><span class="font-bold text-slate-700">${p.nama}</span></td><td class="px-6 py-4 text-center font-black ${lw ? 'text-red-500 bg-red-50 rounded-xl' : 'text-slate-800'}">${p.stok}</td><td class="px-6 py-4 text-right font-bold text-blue-600">${app.formatRp.format(p.harga)}</td><td class="px-6 py-4 text-center flex justify-center items-center gap-3 pt-6">${actionBtns}</td></tr>`;
                });

                const lf = document.getElementById('stack-lifo-container'); lf.innerHTML = '';
                if(app.restokStack.length === 0) lf.innerHTML = `<p class="text-slate-500 italic text-xs">Belum ada histori pergerakan stok.</p>`;
                [...app.restokStack].reverse().forEach(x => {
                    const isM = x.tipe === 'MASUK';
                    lf.innerHTML += `<div class="relative pl-6 border-l-2 ${isM?'border-green-500':'border-red-500'} pb-4"><div class="absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-slate-900 ${isM?'bg-green-500':'bg-red-500'}"></div><span class="block text-[10px] text-slate-400 font-bold uppercase mb-1">${x.tanggal} ${x.waktu}</span><span class="text-sm font-black ${isM?'text-green-400':'text-red-400'}">${isM?'+':'-'}${x.qty} ${x.nama}</span></div>`;
                });
            },
            
            renderSelects() {
                const sa = document.getElementById('antrian-motor-id'); sa.innerHTML = '<option value="">-- Pilih Motor --</option>';
                // Penerapan Polimorfisme: memanggil m.getInfo() dari objek Motor
                app.motors.filter(m => m.statusTerakhir !== 'PROSES' && m.statusTerakhir !== 'ANTRIAN').forEach(m => sa.innerHTML += `<option value="${m.id}">${m.getInfo()} (Milik: ${m.pemilik})</option>`);
                
                const sk = document.getElementById('kasir-motor-id'); sk.innerHTML = '<option value="">-- Pilih Motor Proses --</option>';
                // Penerapan Polimorfisme: memanggil m.getInfo()
                app.antrian.filter(a => a.status === 'PROSES').forEach(n => { const m = app.motors.find(x => x.id == n.motorId); if(m) sk.innerHTML += `<option value="${m.id}">#${n.nomor} | ${m.getInfo()}</option>`; });
                
                const sp = document.getElementById('kasir-pilih-part'); sp.innerHTML = '<option value="">-- Cari Suku Cadang --</option>';
                // Penerapan Polimorfisme: memanggil p.getInfo() dari objek SukuCadang.
                // Metode yang dipanggil sama (.getInfo()), namun outputnya berbeda-beda tergantung kelasnya.
                app.parts.forEach(p => sp.innerHTML += `<option value="${p.id}">${p.getInfo()} (${app.formatRp.format(p.harga)})</option>`);
            },
            renderCart() {
                const c = document.getElementById('cart-container'); c.innerHTML = '';
                if(app.cart.length === 0) {
                    c.innerHTML = `<p class="text-center text-slate-400 py-10 italic text-sm font-medium">Belum ada item ditambahkan.</p>`;
                } else {
                    app.cart.forEach(it => { c.innerHTML += `<div class="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-2"><div><span class="font-bold text-slate-700 text-sm block">${it.nama}</span><span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-black">x${it.qty}</span></div><div class="flex items-center gap-4"><span class="font-black text-slate-800">${app.formatRp.format(it.subtotal)}</span><button onclick="app.hapusItemCart('${it.id}')" class="text-red-400 hover:bg-red-500 hover:text-white p-2 rounded-xl"><i class="fa-solid fa-trash"></i></button></div></div>`; });
                }
                let t = app.cart.reduce((s,i)=>s+i.subtotal, 0) + parseInt(document.getElementById('kasir-jasa').value || 0);
                document.getElementById('kasir-total-display').innerText = app.formatRp.format(t);
            },
            resetMotorForm() { document.getElementById('form-motor').reset(); document.getElementById('motor-id-edit').value = ''; document.getElementById('motor-form-title').innerHTML = '<i class="fa-solid fa-plus-circle text-blue-500"></i> Tambah Motor Baru'; document.getElementById('btn-save-motor').innerText = "Simpan Data"; document.getElementById('btn-cancel-motor').classList.add('hidden'); },
            resetPartForm() { 
                document.getElementById('part-id-edit').value = ''; 
                document.getElementById('part-kode').value = ''; 
                document.getElementById('part-nama').value = ''; 
                document.getElementById('part-stok').value = ''; 
                document.getElementById('part-harga').value = ''; 
                document.getElementById('btn-save-part').innerText = "Tambah"; 
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
                    tr.parts.forEach(p => {
                        partsHtml += `<li class="flex justify-between items-center border-b border-dashed border-slate-100 pb-2"><div class="flex flex-col"><span class="font-bold text-slate-700">${p.nama}</span><span class="text-[10px] bg-blue-50 w-fit text-blue-600 px-1.5 py-0.5 rounded font-black mt-1">x ${p.qty} item</span></div> <span class="font-black text-slate-800">${app.formatRp.format(p.subtotal)}</span></li>`;
                    });
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

                    ${!isP ? `<div class="mb-4">
                        <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Deskripsi / Keluhan</p>
                        <p class="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100 italic text-sm font-medium">"${tr.desk}"</p>
                        <div class="flex justify-between items-center mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100"><span class="text-slate-500 text-xs font-bold uppercase">Biaya Jasa Mekanik</span> <span class="font-black text-slate-800">${app.formatRp.format(tr.jasa)}</span></div>
                    </div>` : `<div class="mb-4">
                        <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Keterangan</p>
                        <p class="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 italic text-sm font-medium">"${tr.desk}"</p>
                    </div>`}

                    ${partsHtml}

                    <div class="mt-6 pt-4 border-t-2 border-dashed border-slate-200 flex justify-between items-center bg-green-50 p-4 rounded-xl border border-green-100">
                        <span class="font-black text-green-700 text-sm">TOTAL KESELURUHAN</span>
                        <span class="font-black text-green-600 text-xl">${app.formatRp.format(tr.hitungTotal())}</span>
                    </div>
                `;

                document.getElementById('detail-transaksi-content').innerHTML = content;
                document.getElementById('modal-detail-transaksi').classList.replace('hidden', 'flex');
            },
            closeDetailTransaksi() {
                document.getElementById('modal-detail-transaksi').classList.replace('flex', 'hidden');
            },
            printStruk(tr) {
                const a = document.getElementById('invoice-print'); let it = '';
                const isP = tr.motor.plat === '-';
                tr.parts.forEach(p => it += `<tr style="border-bottom:1px dashed #ccc;"><td style="padding:6px 0;">${p.nama} <br><small>x${p.qty}</small></td><td style="text-align:right; font-weight:bold;">${app.formatRp.format(p.subtotal)}</td></tr>`);
                let hH = isP ? `<div>INV: #${tr.id}</div><div>WAKTU: ${tr.formatWaktu}</div><div>PELANGGAN: UMUM</div>` : `<div>INV: #${tr.id}</div><div>WAKTU: ${tr.formatWaktu}</div><div>PLAT: ${tr.motor.plat}</div><div>NAMA: ${tr.motor.pemilik}</div>`;
                a.innerHTML = `<div style="text-align:center;"><h2>MOTOCARE</h2><small>Final Project PBO Edition</small><hr></div><div style="font-size:12px; border-bottom:1px solid #000; padding:10px 0;">${hH}</div><table style="width:100%; font-size:12px;">${!isP?`<tr><td style="padding:6px 0;">Jasa Mekanik: <br><small>${tr.desk}</small></td><td style="text-align:right;">${app.formatRp.format(tr.jasa)}</td></tr>`:''}${it}</table><hr><div style="display:flex; justify-content:space-between; font-weight:bold;"><span>TOTAL</span> <span>${app.formatRp.format(tr.hitungTotal())}</span></div><center><br><small>Terima Kasih!</small></center>`;
                a.classList.remove('hidden'); setTimeout(() => { window.print(); a.innerHTML = ''; a.classList.add('hidden'); }, 500);
            }
        };

        app.init();