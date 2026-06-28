// ============================================================
// server.js - Full Server with Admin API Routes & Chat
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== MIDDLEWARE =====
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend', 'public')));

// ===== SERVE HTML FILES =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'admin.html'));
});

app.get('/operators', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'operator.html'));
});

app.get('/operators.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'operator.html'));
});

app.get('/operator.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'operator.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'chat.html'));
});

app.get('/chat.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'chat.html'));
});

app.get('/admin-chat.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'admin-chat.html'));
});

app.get('/live', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'live.html'));
});

app.get('/live.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'live.html'));
});

// ============================================================
// STORE DATA IN MEMORY
// ============================================================

// Initialize app.locals with default data
app.locals.salesHours = {
    enabled: true,
    startHour: 9,
    endHour: 19,
    mode: 'auto',
    manualStatus: true
};

app.locals.orders = [];
app.locals.users = [];
app.locals.operatorPlans = [];
app.locals.chatMessages = [];

// ===== DEFAULT OPERATOR PLANS =====
const DEFAULT_PLANS = [
    {
        id: 'atom',
        name: 'ATOM',
        logo: 'https://i.imgur.com/I5iRYm8.png',
        icon: '📱',
        status: 'active',
        plans: [
            { name: 'VIP LEVEL - 1', price: 15000, details: ['🔥 22 GB အမြန်နှုန်းမြင့်ဒေတာ', '📞 8,000 မိနစ် (ကွန်ရက်တွင်း)', '✉️ 5,000 SMS'] },
            { name: 'VIP LEVEL - 2', price: 20000, details: ['⭐ 40 GB အာထရာဒေတာ', '📞 250 မိနစ် (ကွန်ရက်တွင်း)', '📞 25 မိနစ် (အခြားကွန်ရက်)'] },
            { name: 'VIP LEVEL - 3', price: 25000, details: ['💎 40 GB အမြန်နှုန်း + အပို', '📞 1,400 မိနစ် (ကွန်ရက်တွင်း)', '✉️ 8,000 SMS'] },
            { name: 'VIP LEVEL - 4 (ULTRA)', price: 30000, details: ['👑 120 GB ဂိမ်းဒေတာ', '🎬 အကန့်အသတ်မရှိ Streaming', '🛡️ ဦးစားပေး ပံ့ပိုးမှု'] }
        ]
    },
    {
        id: 'mytel',
        name: 'MYTEL',
        logo: 'https://i.imgur.com/Xl3B5xF.jpeg',
        icon: '📶',
        status: 'active',
        plans: [
            { name: 'VIP LEVEL - 1', price: 15000, details: ['🔥 22 GB အမြန်နှုန်းမြင့်ဒေတာ', '📞 8,000 မိနစ် (ကွန်ရက်တွင်း)', '✉️ 5,000 SMS'] },
            { name: 'VIP LEVEL - 2', price: 20000, details: ['⭐ 40 GB အာထရာဒေတာ', '📞 250 မိနစ် (ကွန်ရက်တွင်း)', '📞 25 မိနစ် (အခြားကွန်ရက်)'] },
            { name: 'VIP LEVEL - 3', price: 25000, details: ['💎 40 GB အမြန်နှုန်း + အပို', '📞 1,400 မိနစ် (ကွန်ရက်တွင်း)', '✉️ 8,000 SMS'] },
            { name: 'VIP LEVEL - 4 (ULTRA)', price: 30000, details: ['👑 120 GB ဂိမ်းဒေတာ', '🎬 အကန့်အသတ်မရှိ Streaming', '🛡️ ဦးစားပေး ပံ့ပိုးမှု'] }
        ]
    },
    {
        id: 'ooredoo',
        name: 'OOREDOO',
        logo: 'https://i.imgur.com/eNdLhsk.png',
        icon: '🚀',
        status: 'active',
        plans: [
            { name: 'VIP LEVEL - 1', price: 15000, details: ['🔥 22 GB အမြန်နှုန်းမြင့်ဒေတာ', '📞 8,000 မိနစ် (ကွန်ရက်တွင်း)', '✉️ 5,000 SMS'] },
            { name: 'VIP LEVEL - 2', price: 20000, details: ['⭐ 40 GB အာထရာဒေတာ', '📞 250 မိနစ် (ကွန်ရက်တွင်း)', '📞 25 မိနစ် (အခြားကွန်ရက်)'] },
            { name: 'VIP LEVEL - 3', price: 25000, details: ['💎 40 GB အမြန်နှုန်း + အပို', '📞 1,400 မိနစ် (ကွန်ရက်တွင်း)', '✉️ 8,000 SMS'] },
            { name: 'VIP LEVEL - 4 (ULTRA)', price: 30000, details: ['👑 120 GB ဂိမ်းဒေတာ', '🎬 အကန့်အသတ်မရှိ Streaming', '🛡️ ဦးစားပေး ပံ့ပိုးမှု'] }
        ]
    },
    {
        id: 'mpt',
        name: 'MPT',
        logo: 'https://i.imgur.com/BNUZimj.png',
        icon: '🌟',
        status: 'active',
        plans: [
            { name: 'VIP LEVEL - 1', price: 15000, details: ['🔥 22 GB အမြန်နှုန်းမြင့်ဒေတာ', '📞 8,000 မိနစ် (ကွန်ရက်တွင်း)', '✉️ 5,000 SMS'] },
            { name: 'VIP LEVEL - 2', price: 20000, details: ['⭐ 40 GB အာထရာဒေတာ', '📞 250 မိနစ် (ကွန်ရက်တွင်း)', '📞 25 မိနစ် (အခြားကွန်ရက်)'] },
            { name: 'VIP LEVEL - 3', price: 25000, details: ['💎 40 GB အမြန်နှုန်း + အပို', '📞 1,400 မိနစ် (ကွန်ရက်တွင်း)', '✉️ 8,000 SMS'] },
            { name: 'VIP LEVEL - 4 (ULTRA)', price: 30000, details: ['👑 120 GB ဂိမ်းဒေတာ', '🎬 အကန့်အသတ်မရှိ Streaming', '🛡️ ဦးစားပေး ပံ့ပိုးမှု'] }
        ]
    }
];

// Set default plans if empty
if (app.locals.operatorPlans.length === 0) {
    app.locals.operatorPlans = JSON.parse(JSON.stringify(DEFAULT_PLANS));
}

// ===== LOAD DATA FROM FILE =====
const dataPath = path.join(__dirname, 'data.json');

function loadDataFromFile() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            if (data.orders) app.locals.orders = data.orders;
            if (data.users) app.locals.users = data.users;
            if (data.salesHours) app.locals.salesHours = data.salesHours;
            if (data.operatorPlans) app.locals.operatorPlans = data.operatorPlans;
            if (data.chatMessages) app.locals.chatMessages = data.chatMessages;
            console.log('📁 Data loaded from file');
        } else {
            // Create default data file
            saveDataToFile();
        }
    } catch (e) {
        console.error('Error loading data:', e);
    }
}

// ===== SAVE DATA TO FILE =====
function saveDataToFile() {
    try {
        const data = {
            orders: app.locals.orders || [],
            users: app.locals.users || [],
            salesHours: app.locals.salesHours || {},
            operatorPlans: app.locals.operatorPlans || DEFAULT_PLANS,
            chatMessages: app.locals.chatMessages || []
        };
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        console.log('💾 Data saved to file');
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

// Load data on startup
loadDataFromFile();

// Save data every 30 seconds
setInterval(saveDataToFile, 30000);

// ============================================================
// USER API ROUTES
// ============================================================

// ===== REGISTER / LOGIN USER =====
app.post('/api/user/register', (req, res) => {
    try {
        const { phone, username } = req.body;
        
        if (!phone || !username) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone and username are required' 
            });
        }
        
        let user = app.locals.users.find(u => u.phone === phone);
        let isNewUser = false;
        
        if (!user) {
            user = {
                phone,
                username,
                user_id: 'ATH' + Date.now().toString().slice(-6),
                orders: [],
                blocked: false,
                suspect_flag: false,
                created_at: new Date().toISOString()
            };
            app.locals.users.push(user);
            isNewUser = true;
            saveDataToFile();
        }
        
        res.json({
            success: true,
            user: {
                phone: user.phone,
                username: user.username,
                user_id: user.user_id,
                blocked: user.blocked,
                suspect_flag: user.suspect_flag
            },
            isNewUser
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== GET USER DATA =====
app.get('/api/user/:phone', (req, res) => {
    try {
        const user = app.locals.users.find(u => u.phone === req.params.phone);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({
            success: true,
            user: {
                phone: user.phone,
                username: user.username,
                user_id: user.user_id,
                blocked: user.blocked,
                suspect_flag: user.suspect_flag,
                created_at: user.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== CREATE ORDER =====
app.post('/api/orders', (req, res) => {
    try {
        const { phone, plan, price, payment_method, sender_name, last5_digits } = req.body;
        
        if (!phone || !plan || !price) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone, plan and price are required' 
            });
        }
        
        const order = {
            id: 'ORD' + Date.now().toString().slice(-6),
            phone,
            plan,
            price: parseInt(price),
            payment_method: payment_method || 'kpay',
            sender_name: sender_name || '',
            last5_digits: last5_digits || '',
            slip_url: null,
            status: 'Pending',
            created_at: new Date().toISOString(),
            activated_at: null
        };
        
        app.locals.orders.push(order);
        
        const user = app.locals.users.find(u => u.phone === phone);
        if (user) {
            if (!user.orders) user.orders = [];
            user.orders.push(order);
        }
        
        saveDataToFile();
        
        res.json({
            success: true,
            orderId: order.id,
            order
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== GET USER ORDERS =====
app.get('/api/orders/:phone', (req, res) => {
    try {
        const orders = app.locals.orders.filter(o => o.phone === req.params.phone);
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// OPERATOR PLANS API (REAL-TIME SYNC)
// ============================================================

// ===== GET ALL OPERATOR PLANS =====
app.get('/api/operator-plans', (req, res) => {
    try {
        const plans = app.locals.operatorPlans || DEFAULT_PLANS;
        res.json({ success: true, plans });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== UPDATE OPERATOR PLANS =====
app.post('/api/operator-plans', (req, res) => {
    try {
        const { plans } = req.body;
        
        if (!plans || !Array.isArray(plans)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid plans data' 
            });
        }
        
        for (const op of plans) {
            if (!op.id || !op.plans || !Array.isArray(op.plans)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid plan structure' 
                });
            }
        }
        
        app.locals.operatorPlans = plans;
        saveDataToFile();
        
        res.json({ 
            success: true, 
            message: 'Operator plans updated successfully' 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// CHAT API ROUTES
// ============================================================

// ===== GET ALL CHAT MESSAGES =====
app.get('/api/chat/messages', (req, res) => {
    try {
        const messages = app.locals.chatMessages || [];
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== SEND A CHAT MESSAGE =====
app.post('/api/chat/send', (req, res) => {
    try {
        const { user_id, username, phone, message } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }
        
        const newMessage = {
            id: 'MSG' + Date.now().toString().slice(-6),
            user_id: user_id || phone || 'guest',
            username: username || 'User',
            phone: phone || '',
            message: message,
            type: user_id === 'admin' ? 'admin' : 'user',
            created_at: new Date().toISOString()
        };
        
        app.locals.chatMessages.push(newMessage);
        
        // Keep only last 500 messages
        if (app.locals.chatMessages.length > 500) {
            app.locals.chatMessages = app.locals.chatMessages.slice(-500);
        }
        
        // Broadcast to other clients
        broadcastChatUpdate(newMessage);
        
        saveDataToFile();
        
        res.json({ success: true, message: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== BROADCAST CHAT UPDATE =====
function broadcastChatUpdate(message) {
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                const channel = new BroadcastChannel('chat-updates');
                channel.postMessage({ type: 'newMessage', message });
                channel.close();
            } catch(e) {}
        }
        
        localStorage.setItem('_chatUpdateTimestamp', Date.now().toString());
    } catch(e) {
        console.log('Chat broadcast not available');
    }
}

// ============================================================
// ADMIN API ROUTES
// ============================================================

// ===== SALES HOURS =====
app.get('/api/admin/sales-hours', (req, res) => {
    try {
        const salesHours = app.locals.salesHours || {
            enabled: true,
            startHour: 9,
            endHour: 19,
            mode: 'auto',
            manualStatus: true
        };
        res.json({ success: true, salesHours });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/sales-hours', (req, res) => {
    try {
        const { enabled, startHour, endHour, mode, manualStatus } = req.body;
        app.locals.salesHours = {
            enabled: enabled !== undefined ? enabled : true,
            startHour: startHour || 9,
            endHour: endHour || 19,
            mode: mode || 'auto',
            manualStatus: manualStatus !== undefined ? manualStatus : true
        };
        saveDataToFile();
        res.json({ success: true, message: 'Sales hours updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== SALES STATUS =====
app.get('/api/sales/status', (req, res) => {
    try {
        const salesHours = app.locals.salesHours || {
            enabled: true,
            startHour: 9,
            endHour: 19,
            mode: 'auto',
            manualStatus: true
        };
        
        let isOpen = true;
        let message = '🟢 ဆိုင်ဖွင့်ထားပါသည်';
        
        if (salesHours.mode === 'auto') {
            const now = new Date();
            const currentHour = now.getHours();
            const start = salesHours.startHour || 9;
            const end = salesHours.endHour || 19;
            
            if (!salesHours.enabled) {
                isOpen = false;
                message = '🔴 ဆိုင်ပိတ်ထားပါသည် (Admin မှပိတ်ထား)';
            } else if (currentHour >= start && currentHour < end) {
                isOpen = true;
                message = `🟢 ဆိုင်ဖွင့်ထားပါသည် (${start}:00 - ${end}:00)`;
            } else {
                isOpen = false;
                message = `🔴 ဆိုင်ပိတ်ထားပါသည် (${start}:00 - ${end}:00)`;
            }
        } else {
            isOpen = salesHours.manualStatus !== false;
            message = isOpen ? '🟢 ဆိုင်ဖွင့်ထားပါသည် (Manual)' : '🔴 ဆိုင်ပိတ်ထားပါသည် (Manual)';
        }
        
        res.json({ 
            success: true, 
            isOpen, 
            message,
            startHour: salesHours.startHour,
            endHour: salesHours.endHour
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== ORDERS =====
app.get('/api/admin/orders', (req, res) => {
    try {
        const orders = app.locals.orders || [];
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/admin/orders/:id/approve', (req, res) => {
    try {
        const order = app.locals.orders.find(o => o.id === req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        order.status = 'Approved';
        order.activated_at = new Date().toISOString();
        saveDataToFile();
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/admin/orders/:id/reject', (req, res) => {
    try {
        const order = app.locals.orders.find(o => o.id === req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        order.status = 'Rejected';
        saveDataToFile();
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/admin/orders/:id', (req, res) => {
    try {
        const index = app.locals.orders.findIndex(o => o.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        app.locals.orders.splice(index, 1);
        saveDataToFile();
        res.json({ success: true, message: 'Order deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== USER STATS =====
app.get('/api/admin/user-stats', (req, res) => {
    try {
        const users = app.locals.users || [];
        const stats = users.map(user => ({
            phone: user.phone || '',
            username: user.username || '',
            user_id: user.user_id || '',
            order_count: (user.orders || []).length,
            reject_count: (user.orders || []).filter(o => o.status === 'Rejected').length,
            blocked: user.blocked || false,
            suspect_flag: user.suspect_flag || false,
            created_at: user.created_at || new Date().toISOString()
        }));
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== ADMIN LOGIN =====
app.post('/api/admin/login', (req, res) => {
    try {
        const { password } = req.body;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
        
        if (password === ADMIN_PASSWORD) {
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ success: false, error: 'Invalid password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== CLEANUP OLD ORDERS =====
app.post('/api/admin/cleanup-old', (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const before = app.locals.orders.length;
        app.locals.orders = app.locals.orders.filter(order => {
            if (order.status === 'Approved') return true;
            return new Date(order.created_at) > thirtyDaysAgo;
        });
        const after = app.locals.orders.length;
        
        saveDataToFile();
        res.json({ 
            success: true, 
            message: `Cleaned up ${before - after} old orders`,
            removed: before - after,
            remaining: after
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== SYSTEM RESET =====
app.post('/api/admin/system-reset', (req, res) => {
    try {
        const { confirm, keepProducts } = req.body;
        
        if (confirm !== 'RESET_ALL_DATA') {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid confirmation' 
            });
        }
        
        app.locals.orders = [];
        app.locals.users = [];
        app.locals.chatMessages = [];
        app.locals.salesHours = {
            enabled: true,
            startHour: 9,
            endHour: 19,
            mode: 'auto',
            manualStatus: true
        };
        app.locals.operatorPlans = JSON.parse(JSON.stringify(DEFAULT_PLANS));
        
        saveDataToFile();
        res.json({ 
            success: true, 
            message: 'System reset completed successfully' 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  🚀 Server is running!                  ║');
    console.log(`║  📡 Port: ${PORT}                          ║`);
    console.log(`║  🌐 URL: http://localhost:${PORT}        ║`);
    console.log(`║  📁 Directory: ${__dirname}    ║`);
    console.log(`║  ⏰ Started: ${new Date().toLocaleString()}  ║`);
    console.log('║  Press Ctrl+C to stop the server        ║');
    console.log('╚══════════════════════════════════════════╝');
});
