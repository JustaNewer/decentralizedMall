const mysql = require('mysql2/promise')

const pool = mysql.createPool({
    host: 'localhost',
    user: 'jky',
    password: '011312',
    database: 'demall',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

// 测试连接
pool.getConnection()
    .then(connection => {
        console.log('数据库连接成功')
        connection.release()
    })
    .catch(err => {
        console.error('数据库连接失败:', err)
    })

module.exports = pool 