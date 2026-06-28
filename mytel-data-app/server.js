// ============================================================
// server.js - Full Server with Admin API Routes (FIXED PATH)
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

// ===== STATIC FILES - FIXED PATH =====
// ဒီနေရာမှာ 'public' ကို 'frontend/public' လို့ ပြောင်းပါ
const publicPath = path.join(__dirname, 'frontend', 'public');
app.use(express.static(publicPath));

// ===== SERVE HTML FILES =====
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin.html'));
});

// ===== OPERATOR PAGES =====
app.get('/atom', (req, res) => {
    res.sendFile(path.join(publicPath, 'atom.html'));
});

app.get('/mytel', (req, res) => {
    res.sendFile(path.join(publicPath, 'mytel.html'));
});

app.get('/ooredoo', (req, res) => {
    res.sendFile(path.join(publicPath, 'ooredoo.html'));
});

app.get('/mpt', (req, res) => {
    res.sendFile(path.join(publicPath, 'mpt.html'));
});

app.get('/plans-widget.html', (req, res) => {
    res.sendFile(path.join(publicPath, 'plans-widget.html'));
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

// ===== LOAD DATA FROM FILE =====
const dataPath = path.join(__dirname, 'data.json');

function loadDataFromFile() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            if (data.orders) app.locals.orders = data.orders;
            if (data.users) app.locals.users = data.users;
            if (data.salesHours) app.locals.salesHours = data.salesHours;
            console.log('📁 Data loaded from file');
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
            salesHours: app.locals.salesHours || {}
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
        app.locals.salesHours = {
            enabled: true,
            startHour: 9,
            endHour: 19,
            mode: 'auto',
            manualStatus: true
        };
        
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
// ADMIN CHAT
// ============================================================
app.get('/admin-chat.html', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin-chat.html'));
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
    console.log(`║  📁 Public: ${publicPath}    ║`);
    console.log(`║  ⏰ Started: ${new Date().toLocaleString()}  ║`);
    console.log('║  Press Ctrl+C to stop the server        ║');
    console.log('╚══════════════════════════════════════════╝');
});
