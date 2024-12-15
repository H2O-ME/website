async function queryWhois() {
    const urlInput = document.getElementById('urlInput');
    const result = document.getElementById('result');
    const url = urlInput.value.trim();

    if (!url) {
        result.textContent = '请输入要查询的域名';
        return;
    }

    try {
        result.textContent = '正在查询中...';
        
        // Whois 查询
        const whoisResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.52vmy.cn/api/query/whois?url=${url}`)}`);
        const whoisData = await whoisResponse.json();

        // 初始化基础数据
        let qualityData = {
            page_performance: {
                page_weight: { page_size: 0 },
                page_requests: { request_count: '检测中' },
                page_requests_time: { load_time: 0 }
            },
            seo: {
                seo_title: { title: '检测中' },
                seo_description: { description_length: '检测中' },
                seo_sitemap: { sitemap_url: `${url}/sitemap.xml` }
            },
            suggestion: [{ status: 0 }],
            ping: {
                ip: '检测中',
                location: '检测中',
                min: '检测中',
                max: '检测中',
                average: '检测中'
            },
            ssl: {
                valid: '检测中',
                valid_from: '检测中',
                valid_to: '检测中',
                issuer_name: '检测中',
                subject_name: '检测中'
            }
        };

        // 首次显示结果
        result.innerHTML = formatCombinedResult(whoisData, qualityData);

        // 异步更新各项指标
        const startTime = Date.now();

        // Ping 测速
        const domain = url.replace(/^https?:\/\//, '');
        pingWebsite(domain).then(pingData => {
            if (pingData && pingData.data) {
                qualityData.ping = pingData.data;
                updateResult();
            }
        });

        // 状态检测
        checkStatus(url).then(status => {
            qualityData.suggestion[0].status = status;
            updateResult();
        });

        // 页面大小检测
        getPageSize(url).then(size => {
            qualityData.page_performance.page_weight.page_size = size;
            updateResult();
        });

        // 页面标题检测
        getPageTitle(url).then(title => {
            qualityData.seo.seo_title.title = title;
            updateResult();
        });

        // 更新加载时间
        setTimeout(() => {
            qualityData.page_performance.page_requests_time.load_time = (Date.now() - startTime) / 1000;
            updateResult();
        }, 1000);

        // 添加 SSL 检测函数
        const cleanDomain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        checkSSL(cleanDomain).then(sslData => {
            if (sslData) {
                qualityData.ssl = sslData;
                updateResult();
            }
        });

        function updateResult() {
            if (result.innerHTML.includes('网站综合信息')) {  // 确保还在显示结果页面
                result.innerHTML = formatCombinedResult(whoisData, qualityData);
            }
        }

    } catch (error) {
        result.textContent = '查询失败，请稍后重试';
        console.error('Error:', error);
    }
}

// 检查网站状态
async function checkStatus(url) {
    try {
        const response = await fetch(`https://cors.eu.org/${url}`, {
            method: 'HEAD',
            mode: 'cors'
        });
        return response.status;
    } catch (e) {
        return 0;
    }
}

// 获取页面大小
async function getPageSize(url) {
    try {
        const response = await fetch(`https://cors.eu.org/${url}`);
        const text = await response.text();
        return new Blob([text]).size;
    } catch (e) {
        return 0;
    }
}

// 获取页面标题
async function getPageTitle(url) {
    try {
        const response = await fetch(`https://cors.eu.org/${url}`);
        const text = await response.text();
        const match = text.match(/<title>(.*?)<\/title>/i);
        return match ? match[1] : '未知';
    } catch (e) {
        return '无法获取';
    }
}

// 添加 Ping 测速函数
async function pingWebsite(domain) {
    try {
        const response = await fetch('https://tools.mgtv100.com/external/v1/pear/websitePing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `domain=${encodeURIComponent(domain)}`
        });
        return await response.json();
    } catch (e) {
        console.error('Ping测速失败:', e);
        return null;
    }
}

// 添加 SSL 检测函数
async function checkSSL(domain) {
    try {
        const response = await fetch(`https://api.ahfi.cn/api/checkssl?url=${encodeURIComponent(domain)}`);
        const data = await response.json();
        return data.data || null;
    } catch (e) {
        console.error('SSL检测失败:', e);
        return null;
    }
}

function formatCombinedResult(whoisData, qualityData) {
    if (!whoisData || !whoisData.data) {
        return `查询失败：无法获取数据`;
    }

    const whoisInfo = whoisData.data;
    
    return `
        <div class="whois-result">
            <h3>网站综合信息</h3>
            <table>
                <tr>
                    <td class="label">域名：</td>
                    <td>${whoisInfo.DomainName || '未知'}</td>
                </tr>
                <tr>
                    <td class="label">网站状态：</td>
                    <td>
                        <div class="status-wrapper">
                            <span class="status-code ${getStatusClass(qualityData.suggestion[0].status)}">
                                ${qualityData.suggestion[0].status || '检测中'} ${getStatusText(qualityData.suggestion[0].status)}
                            </span>
                            <span class="response-time">响应时间：${qualityData.page_performance.page_requests_time.load_time.toFixed(2)}s</span>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td class="label">页面性能：</td>
                    <td>
                        <div class="performance-info">
                            <p>页面大小：${formatSize(qualityData.page_performance.page_weight.page_size)}</p>
                            <p>请求数量：${qualityData.page_performance.page_requests.request_count}</p>
                            <p>加载时间：${qualityData.page_performance.page_requests_time.load_time.toFixed(2)}s</p>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td class="label">SEO信息：</td>
                    <td>
                        <div class="seo-info">
                            <p>标题：${qualityData.seo.seo_title.title}</p>
                            <p>描述长度：${qualityData.seo.seo_description.description_length}</p>
                            <p>网站地图：${qualityData.seo.seo_sitemap.sitemap_url}</p>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td class="label">Ping测速：</td>
                    <td>
                        <div class="ping-info">
                            <p>服务器：${qualityData.ping.location || '未知'}</p>
                            <p>延迟：${qualityData.ping.average || '未知'} (最小: ${qualityData.ping.min || '未知'}, 最大: ${qualityData.ping.max || '未知'})</p>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td class="label">注册人：</td>
                    <td>${whoisInfo.Registrant || '未知'}</td>
                </tr>
                <tr>
                    <td class="label">注册商：</td>
                    <td>${whoisInfo.SponsoringRegistrar || '未知'}</td>
                </tr>
                <tr>
                    <td class="label">注册时间：</td>
                    <td>${whoisInfo.RegistrationTime || '未知'}</td>
                </tr>
                <tr>
                    <td class="label">到期时间：</td>
                    <td>${whoisInfo.ExpirationTime || '未知'}</td>
                </tr>
                <tr>
                    <td class="label">DNS服务器：</td>
                    <td>${Array.isArray(whoisInfo.NameServer) ? whoisInfo.NameServer.join('<br>') : '未知'}</td>
                </tr>
                <tr>
                    <td class="label">SSL证书：</td>
                    <td>
                        <div class="ssl-info">
                            <p class="ssl-status ${qualityData.ssl.valid ? 'ssl-valid' : 'ssl-invalid'}">
                                证书状态：${qualityData.ssl.valid ? '有效' : '无效'}
                            </p>
                            <p>颁发者：${qualityData.ssl.issuer_name || '未知'}</p>
                            <p>证书域名：${qualityData.ssl.subject_name || '未知'}</p>
                            <p>有效期：${formatDate(qualityData.ssl.valid_from)} 至 ${formatDate(qualityData.ssl.valid_to)}</p>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    `;
}

// 格式化文件大小
function formatSize(bytes) {
    if (!bytes) return '未知';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// 获取状态码对应的类名
function getStatusClass(code) {
    code = parseInt(code);
    if (isNaN(code)) return 'status-unknown';
    
    if (code >= 200 && code < 300) return 'status-success';
    if (code >= 300 && code < 400) return 'status-redirect';
    if (code >= 400 && code < 500) return 'status-client-error';
    if (code >= 500) return 'status-server-error';
    if (code === 0) return 'status-server-error';
    return 'status-unknown';
}

// 获取状态码对应的文本说明
function getStatusText(code) {
    code = parseInt(code);
    if (isNaN(code)) return '未知状态';
    
    const statusTexts = {
        200: '正常访问',
        301: '永久重定向',
        302: '临时重定向',
        400: '请求错误',
        403: '访问被禁止',
        404: '页面不存在',
        500: '服务器错误',
        502: '网关错误',
        503: '服务不可用',
        504: '网关超时',
        0: '无法访问'
    };
    return statusTexts[code] || '未知状态';
}

// 添加日期格式化函数
function formatDate(dateStr) {
    if (!dateStr) return '未知';
    try {
        const date = new Date(dateStr);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateStr;
    }
}

// 添加回车键触发查询
document.getElementById('urlInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        queryWhois();
    }
}); 