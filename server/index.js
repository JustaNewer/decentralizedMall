const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/products')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// 添加请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)
    next()
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
}) 