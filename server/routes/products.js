const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const authenticateToken = require('../middleware/auth')

// 获取通知列表
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const [notifications] = await pool.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.userId]
        );
        res.json(notifications || []);
    } catch (error) {
        console.error('获取通知错误:', error);
        res.status(500).json({ message: '获取通知失败' });
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

// 购买商品并发送通知
router.post('/cart/purchase', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { cart_ids } = req.body;
        const user_id = req.user.userId;

        if (!cart_ids || !Array.isArray(cart_ids) || cart_ids.length === 0) {
            return res.status(400).json({ message: '请选择要购买的商品' });
        }

        // 获取购物车商品信息
        const [cartItems] = await connection.query(
            `SELECT sc.*, p.name, p.created_by as seller_id, u.username as buyer_username
             FROM shopping_cart sc
             JOIN products p ON sc.product_id = p.product_id
             JOIN users u ON sc.user_id = u.user_id
             WHERE sc.cart_id IN (?) AND sc.user_id = ?`,
            [cart_ids, user_id]
        );

        if (cartItems.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: '未找到选中的商品' });
        }

        // 为每个卖家创建通知
        for (const item of cartItems) {
            await connection.query(
                'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                [item.seller_id, `用户 ${item.buyer_username} 已购买您的商品: ${item.name}，数量: ${item.quantity}`]
            );
        }

        // 清空已购买的购物车商品
        await connection.query(
            'DELETE FROM shopping_cart WHERE cart_id IN (?) AND user_id = ?',
            [cart_ids, user_id]
        );

        await connection.commit();
        res.json({ message: '购买成功' });
    } catch (error) {
        await connection.rollback();
        console.error('购买错误:', error);
        res.status(500).json({ message: '购买失败' });
    } finally {
        connection.release();
    }
});

// 获取所有商品
router.get('/all', authenticateToken, async (req, res) => {
    try {
        const [products] = await pool.query(
            `SELECT p.*, u.username as seller 
             FROM products p 
             JOIN users u ON p.created_by = u.user_id 
             ORDER BY p.product_id DESC`
        );
        res.json(products || []);
    } catch (error) {
        console.error('获取所有商品错误:', error);
        res.status(500).json({ message: '获取商品失败' });
    }
});

// 搜索商品
router.get('/all/search', authenticateToken, async (req, res) => {
    try {
        const searchQuery = `%${req.query.q || ''}%`;
        const [products] = await pool.query(
            `SELECT p.*, u.username as seller 
             FROM products p 
             JOIN users u ON p.created_by = u.user_id 
             WHERE p.name LIKE ? OR p.description LIKE ? 
             ORDER BY p.product_id DESC`,
            [searchQuery, searchQuery]
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
        )
        res.json(products)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: '服务器错误' })
    }
})

// 添加商品
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, price, description } = req.body
        const [result] = await pool.query(
            'INSERT INTO products (name, price, description, created_by) VALUES (?, ?, ?, ?)',
            [name, price, description, req.user.userId]
        )
        res.json({ id: result.insertId, message: '添加成功' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: '服务器错误' })
    }
})

// 更新商品
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, price, description } = req.body
        await pool.query(
            'UPDATE products SET name = ?, price = ?, description = ? WHERE product_id = ? AND created_by = ?',
            [name, price, description, req.params.id, req.user.userId]
        )
        res.json({ message: '更新成功' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: '服务器错误' })
    }
})

// 删除商品
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM products WHERE product_id = ? AND created_by = ?',
            [req.params.id, req.user.userId]
        )
        res.json({ message: '删除成功' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: '服务器错误' })
    }
})

module.exports = router 