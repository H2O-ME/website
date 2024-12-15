const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

app.get('/api/whois', async (req, res) => {
    try {
        const url = req.query.url;
        const response = await axios.get(`https://api.52vmy.cn/api/query/whois?url=${url}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: '查询失败' });
    }
});

app.listen(3000, () => {
    console.log('代理服务器运行在 http://localhost:3000');
}); 