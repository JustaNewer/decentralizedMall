const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const authenticateToken = require('../middleware/auth')
const { moderateContent } = require('../services/contentModeration')

// 搜索我发布的商品
router.get('/my/search', authenticateToken, async (req, res) => {
    try {
        const searchQuery = `%${req.query.q || ''}%`;
        const [products] = await pool.query(
            `SELECT p.*, u.username as seller,
                    CASE 
                        WHEN p.purchase_status = 1 THEN '已售出'
                        ELSE '在售中'
                    END as status_text
             FROM products p 
             JOIN users u ON p.created_by = u.user_id 
             WHERE p.created_by = ? AND (p.name LIKE ? OR p.description LIKE ?)
             ORDER BY p.purchase_status ASC, p.product_id DESC`,
            [req.user.userId, searchQuery, searchQuery]
        );
        res.json(products || []);
    } catch (error) {
        console.error('搜索商品错误:', error);
        res.status(500).json({ message: '搜索失败' });
    }
});

// 获取通知列表
router.get('/notifications', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 获取通知列表
        const [notifications] = await connection.query(
            'SELECT notification_id, user_id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.userId]
        );

        // 标记所有未读通知为已读
        if (notifications.some(n => n.is_read === 0)) {
            await connection.query(
                'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
                [req.user.userId]
            );
        }

        await connection.commit();
        res.json(notifications || []);
    } catch (error) {
        await connection.rollback();
        console.error('获取通知错误:', error);
        res.status(500).json({ message: '获取通知失败' });
    } finally {
        connection.release();
    }
});

// 获取未读通知数量
router.get('/notifications/unread', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [req.user.userId]
        );
        res.json({ count: result[0].count || 0 });
    } catch (error) {
        console.error('获取未读通知数量错误:', error);
        res.status(500).json({ message: '获取未读通知数量失败' });
    }
});

// 获取购物车列表
router.get('/cart', authenticateToken, async (req, res) => {
    try {
        const [items] = await pool.query(
            `SELECT sc.cart_id, sc.quantity, p.*, u.username as seller, u.user_id as seller_id
             FROM shopping_cart sc
             JOIN products p ON sc.product_id = p.product_id
             JOIN users u ON p.created_by = u.user_id
             WHERE sc.user_id = ?
             ORDER BY sc.added_at DESC`,
            [req.user.userId]
        );
        res.json(items || []);
    } catch (error) {
        console.error('获取购物车错误:', error);
        res.status(500).json({ message: '获取购物车失败' });
    }
});

// 添加到购物车
router.post('/cart/add', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { product_id, quantity = 1 } = req.body;
        const user_id = req.user.userId;

        if (!product_id || quantity < 1) {
            return res.status(400).json({ message: '无效的商品信息' });
        }

        // 检查商品是否存在且不是自己的商品
        const [products] = await connection.query(
            'SELECT * FROM products WHERE product_id = ? AND created_by != ?',
            [product_id, user_id]
        );

        if (products.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: '商品不存在或不能购买自己的商品' });
        }

        // 检查是否已在购物车中
        const [existingItems] = await connection.query(
            'SELECT * FROM shopping_cart WHERE user_id = ? AND product_id = ?',
            [user_id, product_id]
        );

        if (existingItems.length > 0) {
            // 更新数量
            await connection.query(
                'UPDATE shopping_cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
                [quantity, user_id, product_id]
            );
        } else {
            // 新增购物车项
            await connection.query(
                'INSERT INTO shopping_cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [user_id, product_id, quantity]
            );
        }

        await connection.commit();
        res.json({
            message: '已添加到购物车',
            product: products[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('添加到购物车错误:', error);
        res.status(500).json({ message: '添加到购物车失败' });
    } finally {
        connection.release();
    }
});

// 更新购物车商品数量
router.put('/cart/:cart_id', authenticateToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: '无效的数量' });
        }

        const [result] = await pool.query(
            'UPDATE shopping_cart SET quantity = ? WHERE cart_id = ? AND user_id = ?',
            [quantity, req.params.cart_id, req.user.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '购物车商品不存在' });
        }

        res.json({ message: '更新成功' });
    } catch (error) {
        console.error('更新购物车错误:', error);
        res.status(500).json({ message: '更新失败' });
    }
});

// 删除购物车商品
router.delete('/cart/:cart_id', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM shopping_cart WHERE cart_id = ? AND user_id = ?',
            [req.params.cart_id, req.user.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '购物车商品不存在' });
        }

        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除购物车商品错误:', error);
        res.status(500).json({ message: '删除失败' });
    }
});

// 获取所有商品（排除自己的商品和已购买的商品）
router.get('/all', authenticateToken, async (req, res) => {
    try {
        const [products] = await pool.query(
            `SELECT p.*, u.username as seller 
             FROM products p 
             JOIN users u ON p.created_by = u.user_id 
             WHERE p.created_by != ? AND p.purchase_status = 0
             ORDER BY p.product_id DESC`,
            [req.user.userId]
        );
        res.json(products || []);
    } catch (error) {
        console.error('获取所有商品错误:', error);
        res.status(500).json({ message: '获取商品失败' });
    }
});

// 搜索商品（排除自己的商品）
router.get('/all/search', authenticateToken, async (req, res) => {
    try {
        const searchQuery = `%${req.query.q || ''}%`;
        const [products] = await pool.query(
            `SELECT p.*, u.username as seller 
             FROM products p 
             JOIN users u ON p.created_by = u.user_id 
             WHERE p.created_by != ? AND (p.name LIKE ? OR p.description LIKE ?)
             ORDER BY p.product_id DESC`,
            [req.user.userId, searchQuery, searchQuery]
        );
        res.json(products || []);
    } catch (error) {
        console.error('搜索商品错误:', error);
        res.status(500).json({ message: '搜索失败' });
    }
});

// 获取当前用户的商品列表
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [products] = await pool.query(
            'SELECT * FROM products WHERE created_by = ? ORDER BY product_id DESC',
            [req.user.userId]
        );
        res.json(products);
    } catch (error) {
        console.error('获取商品列表失败:', error);
        res.status(500).json({ message: '获取商品列表失败' });
    }
});

// 添加商品
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, price, description, image_url } = req.body;

        // 验证必填字段
        if (!name || price === undefined) {
            return res.status(400).json({
                message: '商品名称和价格是必填项'
            });
        }

        // 内容审核
        console.log('正在进行内容审核...', {
            name,
            description,
            image_url,
            price
        });

        try {
            const moderationResult = await moderateContent(name, description, image_url);

            if (!moderationResult.passed) {
                console.log('内容审核未通过:', moderationResult.reason);
                return res.status(400).json({
                    message: '商品内容审核未通过',
                    reason: moderationResult.reason
                });
            }
            console.log('内容审核通过');
        } catch (moderationError) {
            console.error('内容审核错误:', {
                error: moderationError,
                message: moderationError.message,
                stack: moderationError.stack
            });
            return res.status(500).json({
                message: '内容审核服务暂时不可用，请稍后重试',
                details: moderationError.message
            });
        }

        const [result] = await pool.query(
            'INSERT INTO products (name, price, description, image_url, created_by) VALUES (?, ?, ?, ?, ?)',
            [name, price, description, image_url, req.user.userId]
        );
        res.json({ id: result.insertId, message: '添加成功' });
    } catch (error) {
        console.error('添加商品失败:', {
            error: error,
            message: error.message,
            stack: error.stack,
            sql: error.sql,
            sqlMessage: error.sqlMessage
        });

        // 根据错误类型返回不同的错误信息
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(500).json({
                message: '系统错误：数据表不存在',
                details: error.sqlMessage
            });
        } else if (error.code === 'ER_BAD_FIELD_ERROR') {
            res.status(500).json({
                message: '系统错误：数据表结构不正确',
                details: error.sqlMessage
            });
        } else {
            res.status(500).json({
                message: '添加商品失败',
                details: error.message
            });
        }
    }
});

// 更新商品
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, price, description, image_url } = req.body;

        // 内容审核
        console.log('正在进行内容审核...');
        const moderationResult = await moderateContent(name, description, image_url);

        if (!moderationResult.passed) {
            console.log('内容审核未通过:', moderationResult.reason);
            return res.status(400).json({
                message: '商品内容审核未通过',
                reason: moderationResult.reason
            });
        }
        console.log('内容审核通过');

        await pool.query(
            'UPDATE products SET name = ?, price = ?, description = ?, image_url = ? WHERE product_id = ? AND created_by = ?',
            [name, price, description, image_url, req.params.id, req.user.userId]
        );
        res.json({ message: '更新成功' });
    } catch (error) {
        console.error('更新商品失败:', error);
        res.status(500).json({
            message: '更新商品失败',
            details: error.message
        });
    }
});

// 删除商品
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM products WHERE product_id = ? AND created_by = ?',
            [req.params.id, req.user.userId]
        );
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除商品失败:', error);
        res.status(500).json({ message: '删除商品失败' });
    }
});

// 购买商品
router.post('/purchase', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { items } = req.body; // items: [{product_id, quantity, cart_id?}]
        const buyer_id = req.user.userId;

        console.log('=== 开始购买流程 ===');
        console.log('请求体:', req.body);
        console.log('用户ID:', buyer_id);

        // 获取买家信息
        const [buyers] = await connection.query(
            'SELECT username FROM users WHERE user_id = ?',
            [buyer_id]
        );

        if (!buyers || buyers.length === 0) {
            throw new Error('买家信息不存在');
        }

        const buyer_name = buyers[0].username;
        console.log('买家信息:', { buyer_name });

        // 计算订单总金额并创建订单
        let totalPrice = 0;
        const productIds = items.map(item => item.product_id);
        console.log('商品IDs:', productIds);

        // 修改查询方式，使用参数化查询
        const placeholders = productIds.map(() => '?').join(',');
        const productQuery = `
            SELECT p.*, u.username as seller_name 
            FROM products p 
            JOIN users u ON p.created_by = u.user_id 
            WHERE p.product_id IN (${placeholders})
        `;
        console.log('商品查询SQL:', productQuery);
        console.log('商品查询参数:', productIds);

        const [products] = await connection.query(productQuery, productIds);
        console.log('查询到的商品:', products);

        if (products.length !== items.length) {
            await connection.rollback();
            return res.status(404).json({ message: '部分商品不存在' });
        }

        const productMap = products.reduce((map, product) => {
            map[product.product_id] = product;
            return map;
        }, {});

        // 计算总金额
        for (const item of items) {
            const product = productMap[item.product_id];
            if (!product) {
                await connection.rollback();
                return res.status(404).json({ message: '商品不存在' });
            }
            totalPrice += product.price * item.quantity;
        }
        console.log('订单总金额:', totalPrice);

        // 创建主订单记录
        const orderInsertSql = 'INSERT INTO orders (user_id, total_price, order_status) VALUES (?, ?, ?)';
        const orderInsertParams = [buyer_id, totalPrice, '已支付'];
        console.log('订单插入SQL:', orderInsertSql);
        console.log('订单插入参数:', orderInsertParams);

        const [orderResult] = await connection.query(orderInsertSql, orderInsertParams);
        const orderId = orderResult.insertId;
        console.log('创建订单成功:', orderId);

        // 创建订单商品记录
        for (const item of items) {
            const product = productMap[item.product_id];

            // 添加订单-商品关联记录
            const orderProductSql = 'INSERT INTO order_products (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';
            const orderProductParams = [orderId, item.product_id, item.quantity, product.price];
            console.log('订单商品关联SQL:', orderProductSql);
            console.log('订单商品关联参数:', orderProductParams);

            await connection.query(orderProductSql, orderProductParams);
            console.log('添加订单商品记录成功:', { orderId, product_id: item.product_id });

            // 更新商品购买状态
            await connection.query(
                'UPDATE products SET purchase_status = 1 WHERE product_id = ?',
                [item.product_id]
            );
            console.log('更新商品购买状态成功:', { product_id: item.product_id });

            // 发送通知给卖家
            const notificationMessage = `买家 ${buyer_name} 已购买您的商品"${product.name}"
商品数量: ${item.quantity}
订单金额: ¥${(product.price * item.quantity).toFixed(2)}
订单编号: ${orderId}
下单时间: ${new Date().toLocaleString('zh-CN')}
订单状态: 已支付`;

            const notificationSql = 'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, 0)';
            const notificationParams = [product.created_by, notificationMessage];
            console.log('通知插入SQL:', notificationSql);
            console.log('通知插入参数:', notificationParams);

            await connection.query(notificationSql, notificationParams);
            console.log('发送通知成功:', { seller_id: product.created_by });

            // 如果是从购物车购买，删除购物车项
            if (item.cart_id) {
                const cartDeleteSql = 'DELETE FROM shopping_cart WHERE cart_id = ?';
                console.log('购物车删除SQL:', cartDeleteSql);
                console.log('购物车删除参数:', [item.cart_id]);

                await connection.query(cartDeleteSql, [item.cart_id]);
                console.log('删除购物车项成功:', { cart_id: item.cart_id });
            }
        }

        await connection.commit();
        console.log('=== 购买流程完成 ===');
        res.json({ message: '购买成功', orderId });
    } catch (error) {
        await connection.rollback();
        console.error('购买商品错误:', error);
        // 添加更详细的错误信息
        console.error('错误详情:', {
            message: error.message,
            stack: error.stack,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState,
            sql: error.sql
        });
        res.status(500).json({
            message: '购买失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

module.exports = router 