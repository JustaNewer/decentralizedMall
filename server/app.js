require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const uploadRouter = require('./routes/upload');
const ordersRouter = require('./routes/orders');
const axios = require('axios');

const app = express();

// 全局变量来跟踪AI服务状态
global.aiServiceStatus = {
    isAvailable: false,
    lastCheck: null,
    error: null
};

// AI服务连接测试
async function testAIService() {
    const XAI_API_KEY = 'xai-LXVuJ9wM50hfB3znwYCwAllliYkE7VKuzmYWNhthzefiB0BnSB9Njm5EJcg4CEEdWdandpQYPzjyGjLv';
    const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

    try {
        console.log('正在测试AI服务连接...');
        const response = await axios.post(XAI_API_URL, {
            model: 'grok-beta',
            messages: [
                {
                    role: 'system',
                    content: 'You are a test assistant.'
                },
                {
                    role: 'user',
                    content: 'Testing. Just say hi and hello world and nothing else.'
                }
            ],
            stream: false,
            temperature: 0
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${XAI_API_KEY}`
            },
            timeout: 10000 // 10秒超时
        });

        if (response.data && response.data.choices && response.data.choices[0]) {
            console.log('AI服务连接成功！');
            console.log('测试响应:', response.data.choices[0].message.content);
            global.aiServiceStatus = {
                isAvailable: true,
                lastCheck: new Date(),
                error: null
            };
            return true;
        } else {
            console.log('AI服务响应格式异常:', response.data);
            global.aiServiceStatus = {
                isAvailable: false,
                lastCheck: new Date(),
                error: 'AI服务响应格式异常'
            };
            return false;
        }
    } catch (error) {
        console.error('AI服务连接测试失败:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        global.aiServiceStatus = {
            isAvailable: false,
            lastCheck: new Date(),
            error: error.message
        };
        return false;
    }
}

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

// 添加AI服务状态检查中间件
app.use('/api/products', async (req, res, next) => {
    // 如果是发布或修改商品的请求，检查AI服务状态
    if ((req.method === 'POST' || req.method === 'PUT') && !global.aiServiceStatus.isAvailable) {
        // 如果上次检查是在5分钟之前，重新测试
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (!global.aiServiceStatus.lastCheck || global.aiServiceStatus.lastCheck < fiveMinutesAgo) {
            await testAIService();
        }

        if (!global.aiServiceStatus.isAvailable) {
            return res.status(503).json({
                message: 'AI内容审核服务暂时不可用，请稍后重试',
                details: global.aiServiceStatus.error
            });
        }
    }
    next();
});

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

// 在应用启动时测试AI服务连接
testAIService().then(isAvailable => {
    if (isAvailable) {
        console.log('AI服务初始化成功，系统准备就绪');
    } else {
        console.log('AI服务初始化失败，系统将在有请求时重试连接');
    }
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