export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
        status: 'online',
        queue: 0,
        uptime: '24/7',
        telegramStatus: '🟢 Aktif'
    });
}
