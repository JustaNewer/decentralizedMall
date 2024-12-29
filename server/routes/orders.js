const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

// 检查表是否存在
async function checkTablesExist(connection) {
    try {
        // 检查 orders 表
        const [ordersTable] = await connection.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'orders'
        `);

        // 检查 order_products 表
        const [orderProductsTable] = await connection.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'order_products'
        `);

        return {
            ordersExists: ordersTable.length > 0,
            orderProductsExists: orderProductsTable.length > 0
        };
    } catch (error) {
        console.error('检查表存在时出错:', error);
        throw error;
    }
}

// 获取用户的订单列表
router.get('/', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // 首先检查表是否存在
        const tables = await checkTablesExist(connection);
        console.log('数据库表状态:', tables);

        if (!tables.ordersExists || !tables.orderProductsExists) {
            console.error('缺少必要的数据表');
            return res.status(500).json({
                message: '系统未正确配置',
                details: `缺少表: ${!tables.ordersExists ? 'orders ' : ''}${!tables.orderProductsExists ? 'order_products' : ''}`
            });
        }

        // 检查用户认证信息
        console.log('认证信息:', {
            userId: req.user.userId,
            username: req.user.username
        });

        // 1. 获取当前用户的订单基本信息
        const orderQuery = `
            SELECT 
                o.order_id,
                o.user_id,
                o.order_status,
                o.total_price,
                o.created_at,
                o.updated_at
            FROM orders o 
            WHERE o.user_id = ? 
            ORDER BY o.created_at DESC
        `;

        console.log('执行订单查询:', {
            sql: orderQuery,
            userId: req.user.userId
        });

        const [orders] = await connection.query(orderQuery, [req.user.userId]);
        console.log('订单查询结果:', {
            count: orders.length,
            orders: orders
        });

        if (orders.length === 0) {
            console.log('该用户没有订单');
            return res.json([]);
        }

        // 2. 获取每个订单的商品信息
        const processedOrders = await Promise.all(orders.map(async (order) => {
            const productQuery = `
                SELECT 
                    op.order_id,
                    op.product_id,
                    op.quantity,
                    op.price,
                    p.name,
                    p.image_url,
                    u.username as seller_name
                FROM order_products op
                JOIN products p ON op.product_id = p.product_id
                JOIN users u ON p.created_by = u.user_id
                WHERE op.order_id = ?
            `;

            const [products] = await connection.query(productQuery, [order.order_id]);
            console.log(`订单 ${order.order_id} 的商品:`, {
                count: products.length,
                products: products
            });

            return {
                ...order,
                products: products,
                total_price: parseFloat(order.total_price)
            };
        }));

        console.log('处理完成，返回订单数据');
        res.json(processedOrders);
    } catch (error) {
        console.error('获取订单列表失败:', {
            error: error,
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage
        });

        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(500).json({
                message: '数据表不存在',
                details: error.sqlMessage
            });
        } else if (error.code === 'ER_BAD_FIELD_ERROR') {
            res.status(500).json({
                message: '数据表结构不正确',
                details: error.sqlMessage
            });
        } else {
            res.status(500).json({
                message: '获取订单列表失败',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    } finally {
        if (connection) {
            try {
                await connection.release();
                console.log('数据库连接已释放');
            } catch (err) {
                console.error('释放数据库连接时出错:', err);
            }
        }
    }
});

module.exports = router; 