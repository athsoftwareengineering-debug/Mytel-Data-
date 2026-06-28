// ============================================================
// server.js - Full Server with Admin API Routes
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
app.use(express.static(path.join(__dirname, 'public')));

// ===== SERVE HTML FILES =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ===== STORE DATA IN MEMORY =====
// Initialize with default data
if (!req.app.locals.salesHours) {
    req.app.locals.salesHours = {
        enabled: true,
        startHour: 9,
        endHour: 19,
        mode: 'auto',
        manualStatus: true
    };
}

if (!req.app.locals.orders) {
    req.app.locals.orders = [];
}

if (!req.app.locals.users) {
    req.app.locals.users = [];
}

// Load data from JSON file if exists
function loadDataFromFile() {
    try {
        const dataPath = path.join(__dirname, 'data.json');
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            if (data.orders) req.app.locals.orders = data.orders;
            if (data.users) req.app.locals.users = data.users;
            if (data.salesHours) req.app.locals.salesHours = data.salesHours;
            console.log('📁 Data loaded from file');
        }
    } catch (e) {
        console.error('Error loading data:', e);
    }
}

// Save data to JSON file
function saveDataToFile() {
    try {
        const data = {
            orders: req.app.locals.orders || [],
            users: req.app.locals.users || [],
            salesHours: req.app.locals.salesHours || {}
        };
        fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data, null, 2));
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
        
        // Check if user exists
        let user = req.app.locals.users.find(u => u.phone === phone);
        let isNewUser = false;
        
        if (!user) {
            // Create new user
            user = {
                phone,
                username,
                user_id: 'ATH' + Date.now().toString().slice(-6),
                orders: [],
                blocked: false,
                suspect_flag: false,
                created_at: new Date().toISOString()
            };
            req.app.locals.users.push(user);
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
        const user = req.app.locals.users.find(u => u.phone === req.params.phone);
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
        const { phone, plan, price, payment_method, slip, sender_name, last5_digits } = req.body;
        
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
            slip_url: slip || null,
            status: 'Pending',
            created_at: new Date().toISOString(),
            activated_at: null
        };
        
        req.app.locals.orders.push(order);
        
        // Update user's orders
        const user = req.app.locals.users.find(u => u.phone === phone);
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
        const orders = req.app.locals.orders.filter(o => o.phone === req.params.phone);
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// ADMIN API ROUTES
// ============================================================

// ===== SALES HOURS =====
// GET - Get current sales hours
app.get('/api/admin/sales-hours', (req, res) => {
    try {
        const salesHours = req.app.locals.salesHours || {
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

// POST - Update sales hours
app.post('/api/admin/sales-hours', (req, res) => {
    try {
        const { enabled, startHour, endHour, mode, manualStatus } = req.body;
        req.app.locals.salesHours = {
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
// GET - Get current shop status
app.get('/api/sales/status', (req, res) => {
    try {
        const salesHours = req.app.locals.salesHours || {
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
// GET - Get all orders (admin)
app.get('/api/admin/orders', (req, res) => {
    try {
        const orders = req.app.locals.orders || [];
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT - Approve order
app.put('/api/admin/orders/:id/approve', (req, res) => {
    try {
        const order = req.app.locals.orders.find(o => o.id === req.params.id);
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

// PUT - Reject order
app.put('/api/admin/orders/:id/reject', (req, res) => {
    try {
        const order = req.app.locals.orders.find(o => o.id === req.params.id);
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

// DELETE - Delete order
app.delete('/api/admin/orders/:id', (req, res) => {
    try {
        const index = req.app.locals.orders.findIndex(o => o.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        req.app.locals.orders.splice(index, 1);
        saveDataToFile();
        res.json({ success: true, message: 'Order deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== USER STATS =====
// GET - Get user statistics (admin)
app.get('/api/admin/user-stats', (req, res) => {
    try {
        const users = req.app.locals.users || [];
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

// ===== ADMIN LOGIN (Simple) =====
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

// ============================================================
// SERVE ADMIN CHAT
// ============================================================
app.get('/admin-chat.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-chat.html'));
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
