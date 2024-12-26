const OSS = require('ali-oss');

// 从环境变量获取敏感信息
const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;

const ossConfig = {
    region: 'oss-cn-beijing',
    accessKeyId: accessKeyId,
    accessKeySecret: accessKeySecret,
    bucket: 'decentralizedmall',
    endpoint: 'oss-cn-beijing.aliyuncs.com',
    secure: true,
    timeout: 60000, // 60秒超时
};

// 创建 OSS 客户端
const client = new OSS(ossConfig);

module.exports = client;