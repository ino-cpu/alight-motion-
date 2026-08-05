export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { waNumber } = req.body || {};

    try {
        // Simulasi proses pembuatan akun
        const result = {
            success: true,
            email: generateRandomEmail(),
            premium: true,
            appLink: 'https://alight-creative.firebaseapp.com/__/auth/links?link=https%3A%2F%2Falightcreative.com%2Fauth_action%2F%3FoobCode%3DAMf-vBx7kL3pQ9wR2yU5nJ8',
            refreshToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkZUIjp7ImlkIjoiYW1wcmVtIn0',
            creator: {
                waNumber: waNumber || 'Tidak tersedia',
                timestamp: new Date().toISOString()
            }
        };

        // ===== KIRIM NOTIFIKASI KE TELEGRAM =====
        await sendTelegramNotification(waNumber);

        res.json(result);

    } catch (error) {
        await sendTelegramError(error.message, waNumber);
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

function generateRandomEmail() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + '@zxy.com';
}

// ===== NOTIFIKASI TELEGRAM =====
async function sendTelegramNotification(waNumber) {
    const BOT_TOKEN = '8598427112:AAFLT7lgdu7fzxbgr-Jhr6rSfCjI7hEJM2c';
    const ADMIN_ID = '8379816457';

    const message = `
🤖 *Create AM Premium By Ino.Digital Bot*
─────────────────────────────
✅ *ADA PEMBUATAN AKUN AM PREMIUM!*

📱 *Nomor WhatsApp:* ${waNumber || 'Tidak tersedia'}
🕐 *Waktu:* ${new Date().toLocaleString('id-ID')}

📌 *Status:* Berhasil dibuat ✅
─────────────────────────────
🚀 *Powered by Ino.Digital*
`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        console.log('✅ Notifikasi Telegram terkirim');
    } catch (error) {
        console.error('❌ Gagal kirim notifikasi Telegram:', error.message);
    }
}

async function sendTelegramError(errorMessage, waNumber) {
    const BOT_TOKEN = '8598427112:AAFLT7lgdu7fzxbgr-Jhr6rSfCjI7hEJM2c';
    const ADMIN_ID = '8379816457';

    const message = `
🤖 *Create AM Premium By Ino.Digital Bot*
─────────────────────────────
❌ *ERROR PEMBUATAN AKUN AM!*

📱 *Nomor WhatsApp:* ${waNumber || 'Tidak tersedia'}
🕐 *Waktu:* ${new Date().toLocaleString('id-ID')}

⚠️ *Error:*
${errorMessage}
─────────────────────────────
🚀 *Powered by Ino.Digital*
`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (error) {
        console.error('❌ Gagal kirim error Telegram:', error.message);
    }
}
