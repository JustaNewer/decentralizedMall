const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

// 获取用户的订单列表
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.query(
            `SELECT o.*, 
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', op.id,
                            'product_id', op.product_id,
                            'quantity', op.quantity,
                            'price', op.price,
                            'name', p.name,
                            'image_url', p.image_url
                        )
                    ) as products
             FROM orders o
             LEFT JOIN order_products op ON o.order_id = op.order_id
             LEFT JOIN products p ON op.product_id = p.product_id
             WHERE o.user_id = ?
             GROUP BY o.order_id
             ORDER BY o.created_at DESC`,
            [req.user.userId]
        );

        // 处理products字段，将字符串转换为数组
        const processedOrders = orders.map(order => ({
            ...order,
            products: order.products ? order.products.split(',').map(p => JSON.parse(p)) : []
        }));

        res.json(processedOrders);
    } catch (error) {
        console.error('获取订单列表失败:', error);
        res.status(500).json({ message: '获取订单列表失败' });
    }
});

module.exports = router; 