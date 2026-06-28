const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== SERVE STATIC FILES FROM frontend/public =====
const publicPath = path.join(__dirname, 'frontend', 'public');
app.use(express.static(publicPath));

// ===== ALSO SERVE FROM ROOT FOR BACKWARD COMPATIBILITY =====
app.use(express.static(__dirname));

// ===== MULTER SETUP FOR FILE UPLOADS =====
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'slip-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// ===== DATA FILES INITIALIZATION =====
const USERS_FILE = path.join(__dirname, 'users.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const SALES_STATUS_FILE = path.join(__dirname, 'sales-status.json');

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(SALES_STATUS_FILE)) {
    const defaultStatus = {
        isOpen: true,
        startHour: 9,
        endHour: 19,
        message: 'ဆိုင်ဖွင့်ထားပါသည်'
    };
    fs.writeFileSync(SALES_STATUS_FILE, JSON.stringify(defaultStatus, null, 2));
}

// ===== HELPER FUNCTIONS =====
function readJSONFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeJSONFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function generateUserId() {
    return 'ATH' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 5).toUpperCase();
}

function generateOrderId() {
    return 'ORD' + Date.now().toString().slice(-8);
}

// ===== USER REGISTER API =====
app.post('/api/user/register', (req, res) => {
    const { phone, username } = req.body;
    
    if (!phone || !username) {
        return res.status(400).json({ 
            success: false, 
            error: 'Phone and username are required' 
        });
    }
    
    const phoneRegex = /^(09|\+?959)\d{7,9}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid phone number format. Please use Myanmar phone number (09xxxxxxxxx)'
        });
    }
    
    let users = readJSONFile(USERS_FILE);
    const existingUser = users.find(u => u.phone === phone);
    
    if (existingUser) {
        return res.json({
            success: true,
            user: existingUser,
            isNewUser: false
        });
    }
    
    const newUser = {
        user_id: generateUserId(),
        phone: phone,
        username: username.trim(),
        blocked: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    
    users.push(newUser);
    writeJSONFile(USERS_FILE, users);
    
    res.json({
        success: true,
        user: newUser,
        isNewUser: true
    });
});

// ===== GET USER DATA =====
app.get('/api/user/:phone', (req, res) => {
    const phone = req.params.phone;
    const users = readJSONFile(USERS_FILE);
    const user = users.find(u => u.phone === phone);
    
    if (!user) {
        return res.status(404).json({ 
            success: false, 
            error: 'User not found' 
        });
    }
    
    user.lastLogin = new Date().toISOString();
    writeJSONFile(USERS_FILE, users);
    
    res.json({ success: true, user });
});

// ===== GET ALL USERS (Admin) =====
app.get('/api/users', (req, res) => {
    const users = readJSONFile(USERS_FILE);
    res.json({ success: true, users });
});

// ===== CREATE ORDER =====
app.post('/api/orders', upload.single('slip'), (req, res) => {
    try {
        const { phone, plan, price, payment_method, sender_name, last5_digits } = req.body;
        
        if (!phone || !plan || !price) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone, plan and price are required' 
            });
        }
        
        const phoneRegex = /^(09|\+?959)\d{7,9}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format'
            });
        }
        
        const orderId = generateOrderId();
        let slipUrl = null;
        if (req.file) {
            slipUrl = '/uploads/' + req.file.filename;
        }
        
        const newOrder = {
            id: orderId,
            phone: phone,
            plan: plan,
            price: parseInt(price),
            status: 'Pending',
            payment_method: payment_method || 'kpay',
            sender_name: sender_name || '',
            last5_digits: last5_digits || '',
            slip_url: slipUrl,
            created_at: new Date().toISOString(),
            activated_at: null
        };
        
        let orders = readJSONFile(ORDERS_FILE);
        orders.push(newOrder);
        writeJSONFile(ORDERS_FILE, orders);
        
        res.json({
            success: true,
            orderId: orderId,
            order: newOrder
        });
        
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error while creating order' 
        });
    }
});

// ===== GET ORDERS BY PHONE =====
app.get('/api/orders/:phone', (req, res) => {
    const phone = req.params.phone;
    const orders = readJSONFile(ORDERS_FILE);
    const userOrders = orders.filter(o => o.phone === phone);
    userOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ orders: userOrders });
});

// ===== GET ALL ORDERS (Admin) =====
app.get('/api/orders', (req, res) => {
    const orders = readJSONFile(ORDERS_FILE);
    res.json({ orders });
});

// ===== UPDATE ORDER STATUS (Admin) =====
app.put('/api/orders/:orderId', (req, res) => {
    const { orderId } = req.params;
    const { status, activated_at } = req.body;
    
    if (!status) {
        return res.status(400).json({
            success: false,
            error: 'Status is required'
        });
    }
    
    let orders = readJSONFile(ORDERS_FILE);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Order not found'
        });
    }
    
    orders[orderIndex].status = status;
    if (status === 'Approved' && !orders[orderIndex].activated_at) {
        orders[orderIndex].activated_at = activated_at || new Date().toISOString();
    }
    
    writeJSONFile(ORDERS_FILE, orders);
    
    res.json({
        success: true,
        order: orders[orderIndex]
    });
});

// ===== SALES STATUS API =====
app.get('/api/sales/status', (req, res) => {
    let status = readJSONFile(SALES_STATUS_FILE);
    
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hour + minutes / 60;
    
    const isOpen = status.isOpen && 
                   currentTime >= status.startHour && 
                   currentTime < status.endHour;
    
    let message = status.isOpen ? 'ဆိုင်ဖွင့်ထားပါသည်' : 'ဆိုင်ပိတ်ထားပါသည်';
    if (!isOpen && status.isOpen) {
        message = `ဆိုင်ပိတ်ထားပါသည်။ မနက် ${status.startHour}:00 မှ ညနေ ${status.endHour}:00 အတွင်း ဝယ်ယူနိုင်ပါသည်။`;
    }
    
    res.json({
        isOpen: isOpen,
        startHour: status.startHour,
        endHour: status.endHour,
        message: message
    });
});

// ===== UPDATE SALES STATUS (Admin) =====
app.post('/api/sales/status', (req, res) => {
    const { isOpen, startHour, endHour } = req.body;
    
    const status = {
        isOpen: isOpen !== undefined ? isOpen : true,
        startHour: startHour || 9,
        endHour: endHour || 19,
        updatedAt: new Date().toISOString()
    };
    
    writeJSONFile(SALES_STATUS_FILE, status);
    
    res.json({
        success: true,
        status: status
    });
});

// ===== SERVE HTML FILES =====
app.get('/', (req, res) => {
    // Try to serve index.html from frontend/public first
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Fallback to root directory
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Serve specific HTML files from frontend/public
app.get('/:page.html', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(publicPath, page + '.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('Page not found');
    }
});

// ===== SERVE UPLOADED FILES =====
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  🚀 Server is running!                  ║');
    console.log(`║  📡 Port: ${PORT}                          ║`);
    console.log(`║  🌐 URL: http://localhost:${PORT}        ║`);
    console.log(`║  📁 Directory: ${__dirname}    ║`);
    console.log(`║  ⏰ Started: ${new Date().toLocaleString()}  ║`);
    console.log('║  Press Ctrl+C to stop the server        ║');
    console.log('╚══════════════════════════════════════════╝');
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});
