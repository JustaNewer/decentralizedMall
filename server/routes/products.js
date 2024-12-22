const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const authenticateToken = require('../middleware/auth')

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

// 搜索商品
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const searchQuery = `%${req.query.q}%`
        const [products] = await pool.query(
            'SELECT * FROM products WHERE created_by = ? AND (name LIKE ? OR description LIKE ?) ORDER BY product_id DESC',
            [req.user.userId, searchQuery, searchQuery]
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

// 添加全局商品搜索路由
router.get('/all/search', authenticateToken, async (req, res) => {
    try {
        const searchQuery = `%${req.query.q || ''}%`
        const [products] = await pool.query(
            `SELECT p.*, u.username as seller 
             FROM products p 
             JOIN users u ON p.created_by = u.user_id 
             WHERE p.name LIKE ? OR p.description LIKE ? 
             ORDER BY p.product_id DESC`,
            [searchQuery, searchQuery]
        )
        res.json(products)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: '服务器错误' })
    }
})

// 获取所有商品
router.get('/all', authenticateToken, async (req, res) => {
    try {
        const [products] = await pool.query(
            `SELECT p.*, u.username as seller 
             FROM products p 
             JOIN users u ON p.created_by = u.user_id 
             ORDER BY p.product_id DESC`
        );
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '服务器错误' });
    }
});

module.exports = router 