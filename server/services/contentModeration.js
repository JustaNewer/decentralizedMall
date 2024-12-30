const axios = require('axios');

const XAI_API_KEY = 'xai-LXVuJ9wM50hfB3znwYCwAllliYkE7VKuzmYWNhthzefiB0BnSB9Njm5EJcg4CEEdWdandpQYPzjyGjLv';
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

// 创建自定义的 axios 实例
const axiosInstance = axios.create({
    timeout: 30000,  // 30秒超时
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
    }
});

// 清理AI返回的内容，移除markdown格式
function cleanAIResponse(content) {
    // 移除markdown代码块标记
    content = content.replace(/```json\n/g, '').replace(/```/g, '');
    // 移除可能的空行
    content = content.trim();
    return content;
}

async function moderateContent(name, description, imageUrl) {
    try {
        console.log('开始内容审核...', {
            name,
            description,
            imageUrl
        });

        // 审核文本内容
        const textPrompt = `
请审核以下商品信息是否存在违规内容：
商品名称：${name}
商品描述：${description}

只返回如下格式的JSON（不要包含其他文字）：
{
    "isViolation": false,
    "reason": "通过"
}
不用检测拼写错误的问题
如果发现违规，则返回：
{
    "isViolation": true,
    "reason": "具体违规原因"
}`;

        console.log('发送文本审核请求');

        const textResponse = await axiosInstance.post(XAI_API_URL, {
            model: 'grok-beta',
            messages: [
                {
                    role: 'system',
                    content: '你是一个内容审核专家，只返回JSON格式的审核结果。'
                },
                {
                    role: 'user',
                    content: textPrompt
                }
            ],
            stream: false,
            temperature: 0
        });

        console.log('API原始响应:', textResponse.data);

        let textResult;
        try {
            const content = textResponse.data.choices[0].message.content;
            console.log('API返回内容:', content);

            // 清理并解析内容
            const cleanedContent = cleanAIResponse(content);
            console.log('清理后的内容:', cleanedContent);

            textResult = JSON.parse(cleanedContent);
            console.log('解析后的结果:', textResult);
        } catch (parseError) {
            console.error('解析API响应失败:', parseError);
            throw new Error('内容审核服务返回格式错误');
        }

        if (textResult.isViolation) {
            return {
                passed: false,
                reason: textResult.reason
            };
        }

        // 如果有图片，审核图片内容
        if (imageUrl) {
            const imagePrompt = `
请审核此图片链接是否合规：${imageUrl}

只返回如下格式的JSON（不要包含其他文字）：
{
    "isViolation": false,
    "reason": "通过"
}

如果发现违规，则返回：
{
    "isViolation": true,
    "reason": "具体违规原因"
}`;

            console.log('发送图片审核请求');

            const imageResponse = await axiosInstance.post(XAI_API_URL, {
                model: 'grok-beta',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个图片审核专家，只返回JSON格式的审核结果。'
                    },
                    {
                        role: 'user',
                        content: imagePrompt
                    }
                ],
                stream: false,
                temperature: 0
            });

            console.log('图片审核API原始响应:', imageResponse.data);

            let imageResult;
            try {
                const content = imageResponse.data.choices[0].message.content;
                console.log('图片审核API返回内容:', content);

                // 清理并解析内容
                const cleanedContent = cleanAIResponse(content);
                console.log('清理后的内容:', cleanedContent);

                imageResult = JSON.parse(cleanedContent);
                console.log('解析后的结果:', imageResult);
            } catch (parseError) {
                console.error('解析图片审核API响应失败:', parseError);
                throw new Error('图片审核服务返回格式错误');
            }

            if (imageResult.isViolation) {
                return {
                    passed: false,
                    reason: imageResult.reason
                };
            }
        }

        return {
            passed: true,
            reason: '内容审核通过'
        };
    } catch (error) {
        console.error('内容审核失败:', {
            error: error,
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });

        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            throw new Error('内容审核服务暂时不可用，请稍后重试');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            throw new Error('内容审核服务响应超时，请稍后重试');
        } else if (error.response?.status === 401) {
            throw new Error('内容审核服务认证失败');
        } else if (error.response?.status === 429) {
            throw new Error('请求过于频繁，请稍后重试');
        } else {
            throw new Error('内容审核失败: ' + (error.response?.data?.error?.message || error.message));
        }
    }
}

module.exports = {
    moderateContent
}; 