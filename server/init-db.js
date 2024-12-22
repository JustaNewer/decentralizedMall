const fs = require('fs').promises
const path = require('path')
const mysql = require('mysql2/promise')

async function initDatabase() {
    // 创建数据库连接
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'jky',
        password: '011312'
    })

    try {
        // 读取并执行SQL文件
        const sql = await fs.readFile(path.join(__dirname, '../mysql/init.sql'), 'utf8')

        // 按语句分割并执行
        const statements = sql.split(';').filter(statement => statement.trim())
        for (let statement of statements) {
            await connection.query(statement)
        }

        console.log('数据库初始化成功')
    } catch (error) {
        console.error('数据库初始化失败:', error)
    } finally {
        await connection.end()
    }
}

initDatabase() 