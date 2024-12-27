const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const OSS = require('ali-oss');

// 从环境变量获取敏感信息
const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;

console.log('OSS配置信息:', {
    accessKeyId: accessKeyId ? '已设置' : '未设置',
    accessKeySecret: accessKeySecret ? '已设置' : '未设置'
});

if (!accessKeyId || !accessKeySecret) {
    console.error('错误: OSS 配置信息未正确设置，请检查环境变量');
    process.exit(1);
}

const ossConfig = {
    region: 'oss-cn-beijing',
    accessKeyId: accessKeyId,
    accessKeySecret: accessKeySecret,
    bucket: 'decentralizedmall',
    secure: true,
    timeout: 60000 // 60秒超时
};

// 创建 OSS 客户端
const client = new OSS(ossConfig);

// 测试 OSS 连接
async function testOSSConnection() {
    try {
        await client.getBucketInfo();
        console.log('OSS 连接测试成功');
    } catch (error) {
        console.error('OSS 连接测试失败:', error);
        process.exit(1);
    }
}

// 执行连接测试
testOSSConnection();

module.exports = client;