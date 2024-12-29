require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const uploadRouter = require('./routes/upload');
const ordersRouter = require('./routes/orders');

const app = express();

// CORS 配置
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length'],
    exposedHeaders: ['Content-Length', 'Content-Type']
}));

// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加请求日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    console.log('请求头:', req.headers);
    next();
});

// 调试中间件 - 记录所有请求
app.use((req, res, next) => {
    console.log('收到请求:', {
        method: req.method,
        url: req.url,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.body,
        headers: req.headers
    });
    next();
});

// 注册路由
console.log('正在注册路由...');

// 注册订单路由（移到前面）
app.use('/api/orders', ordersRouter);
console.log('已注册 orders 路由');

app.use('/api/auth', authRouter);
console.log('已注册 auth 路由');

app.use('/api/products', productsRouter);
console.log('已注册 products 路由');

app.use('/api/upload', uploadRouter);
console.log('已注册 upload 路由');

// 404 处理中间件
app.use((req, res, next) => {
    console.log('404 - 未找到路由:', req.url);
    res.status(404).json({ message: '未找到请求的资源' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('错误处理中间件捕获到错误:', err);
    res.status(500).json({
        message: '服务器错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log('已注册的路由:');
    console.log('- /api/orders');
    console.log('- /api/auth');
    console.log('- /api/products');
    console.log('- /api/upload');
}); 