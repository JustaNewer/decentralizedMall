const express = require('express');
const router = express.Router();
const multer = require('multer');
const ossClient = require('../config/oss');
const path = require('path');
const crypto = require('crypto');

// 配置 multer 用于处理文件上传
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 限制文件大小为 5MB
    },
    fileFilter: (req, file, cb) => {
        console.log('文件类型检查:', file.mimetype);
        // 只允许上传图片
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件！'));
        }
    },
}).single('image');

// 生成文件名
function generateFileName(originalname) {
    const hash = crypto.createHash('md5')
        .update(originalname + Date.now().toString())
        .digest('hex');
    return hash;
}

// 处理图片上传
router.post('/', (req, res) => {
    console.log('收到上传请求，请求头:', req.headers);

    upload(req, res, async (err) => {
        try {
            if (err) {
                console.error('Multer 错误:', err);
                return res.status(400).json({
                    message: err.message,
                    type: 'MULTER_ERROR'
                });
            }

            if (!req.file) {
                console.error('没有文件被上传');
                return res.status(400).json({
                    message: '请选择要上传的图片',
                    type: 'NO_FILE_ERROR'
                });
            }

            const file = req.file;
            console.log('接收到文件:', {
                originalName: file.originalname,
                size: file.size,
                mimeType: file.mimetype,
                buffer: file.buffer ? '存在' : '不存在',
                bufferLength: file.buffer ? file.buffer.length : 0
            });

            // 生成文件名
            const fileName = generateFileName(file.originalname);
            const ext = path.extname(file.originalname);
            const objectName = `${fileName}${ext}`;

            console.log('准备上传到 OSS:', {
                objectName,
                mimeType: file.mimetype,
                bufferLength: file.buffer.length
            });

            try {
                // 上传到阿里云 OSS
                const result = await ossClient.put(objectName, file.buffer, {
                    mime: file.mimetype,
                    headers: {
                        'Content-Type': file.mimetype,
                        'x-oss-object-acl': 'public-read'
                    }
                });

                console.log('OSS 上传结果:', {
                    name: result.name,
                    url: result.url,
                    status: result.res && result.res.status,
                    requestId: result.res && result.res.requestId
                });

                if (!result.url) {
                    throw new Error('上传成功但未获取到URL');
                }

                // 返回正确格式的 URL
                const imageUrl = `https://decentralizedmall.oss-cn-beijing.aliyuncs.com/${objectName}`;
                console.log('最终图片URL:', imageUrl);

                res.json({
                    url: imageUrl,
                    message: '上传成功'
                });
            } catch (ossError) {
                console.error('OSS 上传错误:', {
                    name: ossError.name,
                    message: ossError.message,
                    code: ossError.code,
                    requestId: ossError.requestId,
                    hostId: ossError.hostId,
                    region: ossError.region,
                    stack: ossError.stack
                });
                res.status(500).json({
                    message: '图片上传到OSS失败',
                    error: ossError.message,
                    details: {
                        code: ossError.code,
                        requestId: ossError.requestId
                    }
                });
            }
        } catch (error) {
            console.error('图片上传失败:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            res.status(500).json({
                message: '图片上传失败',
                error: error.message,
                details: error.stack
            });
        }
    });
});

module.exports = router; 