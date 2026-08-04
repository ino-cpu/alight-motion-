const COOLDOWN_SECONDS = 180; // 3 menit
const API_URL = window.location.origin;

let cooldown = 0;
let isProcessing = false;
let accountCount = parseInt(localStorage.getItem('am_account_count') || '0');

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

document.addEventListener('DOMContentLoaded', () => {
    accountCountDisplay.textContent = accountCount;
    checkCooldown();
    checkStatus();
    setInterval(checkStatus, 10000);
});

createBtn.addEventListener('click', async () => {
    if (isProcessing) return;
    const left = getCooldownLeft();
    if (left > 0) {
        showToast(`⏳ Tunggu ${Math.ceil(left)} detik lagi!`, 'info');
        return;
    }
    await createAccount();
});

async function createAccount() {
    isProcessing = true;
    createBtn.disabled = true;
    resultCard.style.display = 'none';
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '⏳ Memulai proses...';

    try {
        updateProgress(10, '📧 Register akun...');
        const res = await fetch('/api/create', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();

        if (data.success) {
            updateProgress(40, '📨 Mengirim verifikasi...');
            await sleep(1000);
            updateProgress(70, '🎯 Menunggu premium aktif...');
            await sleep(2000);
            updateProgress(100, '✅ Selesai!');

            showResult({
                success: true,
                email: data.email || 'email@zxy.com',
                premium: data.premium || true,
                appLink: data.appLink || '#',
                refreshToken: data.refreshToken || '---'
            });

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
        setTimeout(() => { progressContainer.style.display = 'none'; }, 3000);
    }
}

function updateProgress(value, text) {
    progressFill.style.width = Math.min(value, 100) + '%';
    if (text) progressText.textContent = text;
}

function showResult(data) {
    resultCard.style.display = 'block';
    if (data.success) {
        resultHeader.className = 'result-header success';
        resultIcon.textContent = '✅';
        resultTitle.textContent = '🎉 Premium Aktif!';
        resultBody.innerHTML = `
            <div style="margin-bottom:8px;"><strong>📧 Email:</strong> <span class="email">${data.email}</span></div>
            <div style="margin-bottom:8px;"><strong>🔑 Status:</strong> ${data.premium ? '✅ Premium' : '❌ Free'}</div>
            ${data.appLink ? `<div style="margin-bottom:8px;"><strong>🔗 Link Login:</strong><br><a href="${data.appLink}" target="_blank" class="link">${data.appLink}</a></div>` : ''}
            ${data.refreshToken ? `<div><strong>🔐 Refresh Token:</strong><span class="token">${data.refreshToken}</span></div>` : ''}
            ${data.appLink ? `<div style="margin-top:12px;padding:12px;background:rgba(255,193,7,0.1);border-radius:8px;border-left:3px solid #FFC107;"><strong>📱 Cara pakai:</strong><br>1. Copy link di atas<br>2. Kirim ke WhatsApp/Telegram/Gmail di HP<br>3. Klik link dari pesan<br>4. Pilih "Buka di Alight Motion"<br>5. Akun langsung masuk! 🎉</div>` : ''}
        `;
    } else {
        resultHeader.className = 'result-header error';
        resultIcon.textContent = '❌';
        resultTitle.textContent = 'Gagal!';
        resultBody.innerHTML = `<div style="color:#f44336;"><strong>Error:</strong> ${data.error || 'Terjadi kesalahan'}</div><div style="margin-top:8px;font-size:0.8rem;color:rgba(255,255,255,0.4);">Coba lagi dalam beberapa menit.</div>`;
    }
}

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

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
