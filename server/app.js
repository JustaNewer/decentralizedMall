require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const uploadRouter = require('./routes/upload');

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

// 注册路由
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/upload', uploadRouter);

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
}); 