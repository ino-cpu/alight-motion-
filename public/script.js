// ===== KONFIGURASI =====
const COOLDOWN_SECONDS = 180; // 3 menit

// ===== STATE =====
let isProcessing = false;
let accountCount = parseInt(localStorage.getItem('am_account_count') || '0');

// ===== DOM ELEMENTS =====
const createBtn = document.getElementById('createBtn');
const cooldownInfo = document.getElementById('cooldownInfo');
const cooldownTimer = document.getElementById('cooldownTimer');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultCard = document.getElementById('resultCard');
const resultHeader = document.getElementById('resultHeader');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultBody = document.getElementById('resultBody');
const queueCount = document.getElementById('queueCount');
const estimateTime = document.getElementById('estimateTime');
const statusServer = document.getElementById('serverStatus');
const statusCooldown = document.getElementById('cooldownStatus');
const accountCountDisplay = document.getElementById('accountCount');
const waInput = document.getElementById('waNumber');
const notifStatus = document.getElementById('notifStatus');

// ===== POPUP WHATSAPP CHANNEL =====
function showPopup() {
    const popup = document.getElementById('whatsappPopup');
    const closed = localStorage.getItem('wa_popup_closed');
    if (!closed) {
        popup.style.display = 'flex';
    }
}

function closePopup() {
    document.getElementById('whatsappPopup').style.display = 'none';
    localStorage.setItem('wa_popup_closed', 'true');
}

// ===== NOMOR WHATSAPP =====
function loadWaNumber() {
    const saved = localStorage.getItem('wa_number');
    if (saved && waInput) {
        waInput.value = saved;
    }
}

function saveWaNumber() {
    if (waInput) {
        const value = waInput.value.replace(/\D/g, '');
        if (value.length >= 6) {
            localStorage.setItem('wa_number', value);
        }
    }
}

// ===== CEK STATUS TELEGRAM =====
async function checkTelegramStatus() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (notifStatus) {
            notifStatus.textContent = data.telegramStatus || '🟢 Aktif';
            notifStatus.style.color = data.telegramStatus === '🟢 Aktif' ? '#4CAF50' : '#f44336';
        }
    } catch (e) {
        // ignore
    }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    // Account counter
    accountCountDisplay.textContent = accountCount;

    // WA Number
    loadWaNumber();
    if (waInput) {
        waInput.addEventListener('input', saveWaNumber);
    }

    // Cooldown
    checkCooldown();
    checkStatus();
    setInterval(checkStatus, 10000);

    // Telegram Status
    checkTelegramStatus();
    setInterval(checkTelegramStatus, 30000);

    // Popup
    const closeBtn = document.getElementById('closePopup');
    const skipBtn = document.querySelector('.popup-skip');
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (skipBtn) skipBtn.addEventListener('click', closePopup);

    // Tampilkan popup setelah 2 detik
    setTimeout(showPopup, 2000);
});

// ===== EVENT LISTENER =====
createBtn.addEventListener('click', async () => {
    if (isProcessing) return;
    const left = getCooldownLeft();
    if (left > 0) {
        showToast(`⏳ Tunggu ${Math.ceil(left)} detik lagi!`, 'info');
        return;
    }
    await createAccount();
});

// ===== FUNGSI UTAMA =====
async function createAccount() {
    isProcessing = true;
    createBtn.disabled = true;
    resultCard.style.display = 'none';
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '⏳ Memulai proses...';

    // Ambil nomor WA
    const waNumber = waInput ? waInput.value : '';

    try {
        updateProgress(10, '📧 Register akun...');
        await sleep(800);

        const response = await fetch('/api/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ waNumber })
        });

        const data = await response.json();

        if (data.success) {
            updateProgress(40, '📨 Mengirim verifikasi...');
            await sleep(1200);
            updateProgress(70, '🎯 Menunggu premium aktif...');
            await sleep(1500);
            updateProgress(100, '✅ Selesai!');

            showResult(data);
            accountCount++;
            localStorage.setItem('am_account_count', String(accountCount));
            accountCountDisplay.textContent = accountCount;
            startCooldown();
            showToast('✅ Akun premium berhasil dibuat!', 'success');
        } else {
            throw new Error(data.error || 'Gagal membuat akun');
        }
    } catch (error) {
        updateProgress(100, '❌ Error!');
        showResult({ success: false, error: error.message });
        showToast(`❌ ${error.message}`, 'error');
    } finally {
        isProcessing = false;
        createBtn.disabled = false;
        setTimeout(() => {
            progressContainer.style.display = 'none';
        }, 3000);
    }
}

// ===== GENERATE EMAIL RANDOM (fallback) =====
function generateRandomEmail() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + '@zxy.com';
}

// ===== UPDATE PROGRESS =====
function updateProgress(value, text) {
    progressFill.style.width = Math.min(value, 100) + '%';
    if (text) progressText.textContent = text;
}

// ===== SHOW RESULT =====
function showResult(data) {
    resultCard.style.display = 'block';

    if (data.success) {
        resultHeader.className = 'result-header success';
        resultIcon.textContent = '✅';
        resultTitle.textContent = '🎉 Premium Aktif!';

        // Email & Status
        let html = `
            <div style="margin-bottom: 8px;">
                <strong>📧 Email:</strong> <span class="email">${data.email || generateRandomEmail()}</span>
            </div>
            <div style="margin-bottom: 12px;">
                <strong>🔑 Status:</strong> ${data.premium ? '✅ Premium' : '❌ Free'}
            </div>
        `;

        // Data Pembuat
        if (data.creator) {
            html += `
                <div style="margin-top: 12px; padding: 10px 14px; background: rgba(37, 211, 102, 0.05); border-radius: 8px; border-left: 3px solid #25D366;">
                    <strong style="color: #25D366;">👤 Data Pembuat:</strong>
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-top: 4px;">
                        📱 WhatsApp: ${data.creator.waNumber || 'Tidak tersedia'}
                    </div>
                    <div style="font-size: 0.7rem; color: rgba(255,255,255,0.3);">
                        🕐 ${new Date(data.creator.timestamp).toLocaleString('id-ID')}
                    </div>
                </div>
            `;
        }

        // Deep Link
        if (data.appLink) {
            html += `
                <div style="margin-top: 12px; padding: 12px; background: rgba(255, 193, 7, 0.05); border-radius: 12px; border: 1px solid rgba(255, 193, 7, 0.1);">
                    <strong style="color: #FFC107;">📱 LINK LOGIN APLIKASI RESMI (DEEP LINK)</strong>
                    <div class="link" id="deepLink">${data.appLink}</div>

                    <div class="btn-group">
                        <button class="copy-btn" onclick="copyDeepLink()">📋 Copy Link</button>
                        <button class="whatsapp-btn" onclick="shareWhatsApp()">📤 Kirim ke WhatsApp</button>
                    </div>

                    <div class="qr-container" id="qrContainer"></div>

                    <div class="deep-link-instructions">
                        <h4>⚠️ PENTING!</h4>
                        <ol>
                            <li><span class="warning">JANGAN</span> paste langsung di address bar Chrome!</li>
                            <li>Copy link di atas</li>
                            <li>Kirim ke diri sendiri via <strong>WhatsApp / Telegram / Gmail</strong> di HP</li>
                            <li>Buka pesan, lalu <strong>KLIK</strong> linknya dari dalam WA/Gmail</li>
                            <li>Pilih <strong>"Buka di Alight Motion"</strong> saat pop-up muncul</li>
                            <li>Akun langsung masuk & Premium aktif! 🎉</li>
                        </ol>
                    </div>
                </div>
            `;

            // QR Code
            setTimeout(() => {
                const qrContainer = document.getElementById('qrContainer');
                if (qrContainer && typeof QRCode !== 'undefined') {
                    qrContainer.innerHTML = '';
                    new QRCode(qrContainer, {
                        text: data.appLink,
                        width: 160,
                        height: 160,
                        colorDark: '#000000',
                        colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.H
                    });
                }
            }, 300);
        }

        // Refresh Token
        if (data.refreshToken) {
            html += `
                <div style="margin-top: 12px;">
                    <strong>🔐 Refresh Token (untuk Mod):</strong>
                    <span class="token">${data.refreshToken}</span>
                </div>
            `;
        }

        resultBody.innerHTML = html;

    } else {
        resultHeader.className = 'result-header error';
        resultIcon.textContent = '❌';
        resultTitle.textContent = 'Gagal!';
        resultBody.innerHTML = `
            <div style="color: #f44336;"><strong>Error:</strong> ${data.error || 'Terjadi kesalahan'}</div>
            <div style="margin-top: 8px; font-size: 0.8rem; color: rgba(255,255,255,0.4);">
                Coba lagi dalam beberapa menit.
            </div>
        `;
    }
}

// ===== COPY DEEP LINK =====
function copyDeepLink() {
    const linkElement = document.getElementById('deepLink');
    if (!linkElement) return;

    const link = linkElement.textContent;
    navigator.clipboard.writeText(link).then(() => {
        showToast('✅ Link berhasil di-copy!', 'success');
    }).catch(() => {
        // Fallback
        const range = document.createRange();
        range.selectNode(linkElement);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        showToast('✅ Link berhasil di-copy!', 'success');
    });
}

// ===== SHARE TO WHATSAPP =====
function shareWhatsApp() {
    const linkElement = document.getElementById('deepLink');
    if (!linkElement) return;

    const link = linkElement.textContent;
    const waNumber = localStorage.getItem('wa_number') || '';
    const creatorName = waInput ? waInput.value : 'Creator';

    const message = `🚀 *AM Premium Creator By Ino.Digital*\n\n📱 *Link Login Alight Motion:*\n${link}\n\n📲 *Cara pakai:*\n1. Klik link ini dari WhatsApp\n2. Pilih "Buka di Alight Motion"\n3. Akun langsung masuk! 🎉\n\n📌 *Dibuat oleh:* ${creatorName}`;

    let url;
    if (waNumber && waNumber.length >= 6) {
        url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    } else {
        url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    }

    window.open(url, '_blank');
}

// ===== COOLDOWN SYSTEM =====
function getCooldownLeft() {
    const last = localStorage.getItem('am_last_create');
    if (!last) return 0;
    return Math.max(0, COOLDOWN_SECONDS - (Date.now() - parseInt(last)) / 1000);
}

function checkCooldown() {
    const left = getCooldownLeft();
    if (left > 0) {
        cooldownInfo.classList.add('active');
        cooldownTimer.textContent = Math.ceil(left);
        statusCooldown.textContent = `⏳ ${Math.ceil(left)}s`;
        createBtn.disabled = true;

        const iv = setInterval(() => {
            const newLeft = getCooldownLeft();
            if (newLeft <= 0) {
                clearInterval(iv);
                cooldownInfo.classList.remove('active');
                statusCooldown.textContent = '✅ Siap';
                createBtn.disabled = false;
                showToast('✅ Cooldown selesai! Bisa buat akun lagi.', 'info');
            } else {
                cooldownTimer.textContent = Math.ceil(newLeft);
                statusCooldown.textContent = `⏳ ${Math.ceil(newLeft)}s`;
            }
        }, 1000);
    }
}

function startCooldown() {
    localStorage.setItem('am_last_create', String(Date.now()));
    checkCooldown();
}

// ===== CHECK STATUS =====
async function checkStatus() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.status === 'online') {
            statusServer.textContent = '🟢 Online';
            statusServer.style.color = '#4CAF50';
        } else {
            statusServer.textContent = '🔴 Offline';
            statusServer.style.color = '#f44336';
        }
        queueCount.textContent = data.queue || 0;
        estimateTime.textContent = Math.ceil((data.queue || 0) * 3.5);
    } catch (e) {
        statusServer.textContent = '🔴 Offline';
        statusServer.style.color = '#f44336';
    }
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// ===== HELPER =====
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== EXPOSE GLOBAL FUNCTIONS =====
window.copyDeepLink = copyDeepLink;
window.shareWhatsApp = shareWhatsApp;
window.closePopup = closePopup;
