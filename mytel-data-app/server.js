const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
// Static files တွေကို frontend/public/ ကနေ Serve လုပ်ပါ
app.use(express.static(path.join(__dirname, 'frontend/public')));

// Request လာတာကို Log ထုတ်ပါ (Debug အတွက်)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ===== Routes =====

// Default route - frontend/public/index.html ကိုပြပါ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/public/index.html'));
});

// HTML ဖိုင်တွေအတွက် Route
app.get('/atom.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/public/atom.html'));
});

app.get('/mytel.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/public/mytel.html'));
});

app.get('/ooredoo.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/public/ooredoo.html'));
});

app.get('/mpt.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/public/mpt.html'));
});

// ===== 404 Error Handler =====
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html lang="my">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>404 - Page Not Found</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: #0b0e1a;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    color: #fff;
                    text-align: center;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    background: rgba(255,255,255,0.04);
                    backdrop-filter: blur(20px);
                    padding: 50px 40px;
                    border-radius: 24px;
                    border: 1px solid rgba(255,255,255,0.06);
                }
                h1 { font-size: 80px; color: #4a9eff; margin-bottom: 10px; }
                h2 { font-size: 28px; margin-bottom: 16px; color: #fff; }
                p { color: rgba(255,255,255,0.5); font-size: 16px; margin-bottom: 24px; }
                a {
                    display: inline-block;
                    padding: 12px 32px;
                    background: #4a9eff;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 12px;
                    font-weight: 600;
                    transition: 0.3s;
                }
                a:hover {
                    background: #3a8ae8;
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>404</h1>
                <h2>စာမျက်နှာ မတွေ့ပါ</h2>
                <p>သင်ရှာဖွေနေသော စာမျက်နှာကို ရှာမတွေ့ပါ။ ကျေးဇူးပြု၍ ပင်မစာမျက်နှာသို့ ပြန်သွားပါ။</p>
                <a href="/">← ပင်မစာမျက်နှာသို့ ပြန်သွားရန်</a>
            </div>
        </body>
        </html>
    `);
});

// ===== Server ကို Start လုပ်ပါ =====
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║  🚀 Server is running!                  ║
║  📡 Port: ${PORT}                          ║
║  🌐 URL: http://localhost:${PORT}        ║
║  📁 Directory: ${__dirname}    ║
║  ⏰ Started: ${new Date().toLocaleString()}  ║
║  Press Ctrl+C to stop the server        ║
╚══════════════════════════════════════════╝
    `);
});

// ===== Error Handling =====
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
