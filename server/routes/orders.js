const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

// 获取用户的订单列表
router.get('/', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // 1. 获取当前用户的订单基本信息
        const [orders] = await connection.query(
            `SELECT o.* 
             FROM orders o 
             WHERE o.user_id = ? 
             ORDER BY o.created_at DESC`,
            [req.user.userId]
        );

        // 2. 获取每个订单的商品信息
        const processedOrders = await Promise.all(orders.map(async (order) => {
            const [products] = await connection.query(
                `SELECT op.*, p.name, p.image_url, u.username as seller_name
                 FROM order_products op
                 JOIN products p ON op.product_id = p.product_id
                 JOIN users u ON p.created_by = u.user_id
                 WHERE op.order_id = ?`,
                [order.order_id]
            );

            // 计算订单总金额（确保与数据库中的一致）
            const totalPrice = products.reduce((sum, product) => {
                return sum + (product.price * product.quantity);
            }, 0);

            return {
                ...order,
                products: products,
                total_price: totalPrice
            };
        }));

        res.json(processedOrders);
    } catch (error) {
        console.error('获取订单列表失败:', error);
        res.status(500).json({ message: '获取订单列表失败' });
    } finally {
        connection.release();
    }
});

module.exports = router; 