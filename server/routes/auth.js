const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')
const authenticateToken = require('../middleware/auth')

// 注册路由
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空' })
        }

        // 检查用户是否已存在
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username])
        if (users.length > 0) {
            return res.status(400).json({ message: '用户名已存在' })
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10)

        // 创建新用户
        const [result] = await pool.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        )

        console.log('注册成功，插入结果:', result)
        res.json({ success: true, message: '注册成功' })
    } catch (error) {
        console.error('注册错误:', error)
        res.status(500).json({ message: '服务器错误: ' + error.message })
    }
})

// 登录路由
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空' })
        }

        console.log('尝试登录:', username)

        // 查找用户
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username])
        if (users.length === 0) {
            return res.status(401).json({ message: '用户名或密码错误' })
        }

        const user = users[0]

        // 验证密码
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(401).json({ message: '用户名或密码错误' })
        }

        // 生成 JWT token
        const token = jwt.sign(
            { userId: user.user_id, username: user.username },
            'your-secret-key',
            { expiresIn: '24h' }
        )

        console.log('登录成功:', username)
        res.json({ token, username: user.username })
    } catch (error) {
        console.error('登录错误:', error)
        res.status(500).json({ message: '服务器错误: ' + error.message })
    }
})

// 添加修改密码路由
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body

        // 获取用户信息
        const [users] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.user.userId])
        if (users.length === 0) {
            return res.status(404).json({ message: '用户不存在' })
        }

        const user = users[0]

        // 验证当前密码
        const validPassword = await bcrypt.compare(currentPassword, user.password)
        if (!validPassword) {
            return res.status(400).json({ message: '当前密码错误' })
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // 更新密码
        await pool.query(
            'UPDATE users SET password = ? WHERE user_id = ?',
            [hashedPassword, req.user.userId]
        )

        res.json({ message: '密码修改成功' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: '服务器错误' })
    }
})

module.exports = router 