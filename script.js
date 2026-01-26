// ========== AI ANALYSIS MODEL ==========
// Mô hình phân tích AI cho tin giả

// Danh sách các trang web tin tức đáng tin cậy (cơ sở dữ liệu)
const trustedSites = [
    'vnexpress.net',
    'tuoitre.vn',
    'dantri.com.vn',
    'thanhnien.vn',
    'bbc.com',
    'reuters.com',
    'apnews.com',
    'bbc.co.uk',
    'theguardian.com',
    'nytimes.com',
    'cnn.com',
    'economist.com',
    'washingtonpost.com',
    'theverge.com',
    'techcrunch.com'
];

// Danh sách các trang web chứa tin giả phổ biến
const fakeNewsSites = [
    'fake-news-site.com',
    'hoax-news.net',
    'misinformation-daily.com',
    'sensational-news.org'
];

// AI Model: Pattern Recognition cho tin giả
const aiModel = {
    // Mẫu nhận dạng tên miền
    domainPatterns: {
        // Dấu hiệu của trang tin tức chính thức
        legitimatePatterns: [
            /news/i, /times/i, /press/i, /media/i, /tribune/i, /herald/i, /telegraph/i, /post/i,
            /daily/i, /journal/i, /gazette/i, /chronicle/i, /dispatch/i
        ],
        // Dấu hiệu của trang có vấn đề
        suspiciousPatterns: [
            /fake|hoax|spoof|clickbait|viral/i,
            /truth|exposed|shocking|secret/i,
            /fake[-_]?news/i,
            /-ful\.com$|buzz-score/i
        ],
        // Mẫu miền giả mạo (giả mạo CNN, BBC, etc)
        impersonationPatterns: [
            /bbc[\w]*\.(?!co\.uk|com)/i,
            /cnn[\w]*\.(?!com)/i,
            /reuters[\w]*\.(?!com)/i,
            /news\.(?!bbc|guardian|times)/i
        ]
    },

    // Phân tích cấu trúc URL
    analyzeURLStructure: function(urlString) {
        const url = new URL(urlString);
        const domain = url.hostname;
        const pathname = url.pathname;
        let score = 0;

        // 1. Phân tích số lượng dấu gạch ngang (mô phỏng complexity)
        const hyphenCount = domain.split('-').length - 1;
        if (hyphenCount > 4) score -= 15;
        else if (hyphenCount > 2) score -= 5;
        else score += 3;

        // 2. Phân tích độ dài tên miền
        const domainLength = domain.length;
        if (domainLength > 60) score -= 20;
        else if (domainLength > 40) score -= 10;
        else if (domainLength < 10) score -= 5;
        else score += 5;

        // 3. Phân tích subdomain (www.test.test.com = nghi ngờ)
        const subdomainCount = domain.split('.').length;
        if (subdomainCount > 4) score -= 10;
        else if (subdomainCount <= 2) score += 5;

        // 4. Phân tích số trong tên miền
        const numberCount = (domain.match(/\d/g) || []).length;
        if (numberCount > 5) score -= 12;
        else if (numberCount > 2) score -= 5;

        // 5. Phân tích pathway (đường dẫn)
        if (pathname.length > 100) score -= 5;
        if (pathname.includes('utm_')) score -= 8; // Tracking URL

        return score;
    },

    // AI phân tích độ tin cậy nguồn
    analyzeSourceCredibility: function(domain) {
        let score = 0;
        let reason = '';

        // Kiểm tra whitelist
        if (trustedSites.some(site => domain.includes(site))) {
            score += 40;
            reason = 'Nguồn được công nhân trong danh sách tin tức uy tín';
            return { score, reason };
        }

        // Kiểm tra blacklist
        if (fakeNewsSites.some(site => domain.includes(site))) {
            score -= 50;
            reason = 'Nguồn được biết là phát tán tin giả';
            return { score, reason };
        }

        // Phân tích mẫu tên miền
        const hasLegitimate = this.domainPatterns.legitimatePatterns.some(p => p.test(domain));
        const hasSuspicious = this.domainPatterns.suspiciousPatterns.some(p => p.test(domain));
        const hasImpersonation = this.domainPatterns.impersonationPatterns.some(p => p.test(domain));

        if (hasImpersonation) {
            score -= 35;
            reason = 'Có dấu hiệu giả mạo tên miền của trang tin tức nổi tiếng';
        } else if (hasLegitimate) {
            score += 15;
            reason = 'Tên miền chứa từ khóa chính thức của ngành báo chí';
        }

        if (hasSuspicious) {
            score -= 20;
            reason = 'Tên miền chứa từ khóa cảnh báo liên quan đến tin giả';
        }

        // Phân tích domain age proxy (TLD)
        const tld = domain.split('.').pop();
        if (['com', 'org', 'net', 'co.uk', 'gov', 'edu'].includes(tld)) {
            score += 5;
        } else if (tld.length > 3) {
            score -= 3;
        }

        return { score, reason };
    },

    // AI phân tích bảo mật & công nghệ
    analyzeTechSignals: function(urlString) {
        const url = new URL(urlString);
        let score = 0;
        let signals = [];

        // HTTPS check
        if (url.protocol === 'https:') {
            score += 12;
            signals.push('✓ Sử dụng HTTPS (bảo mật)');
        } else {
            score -= 15;
            signals.push('✗ Không sử dụng HTTPS (nguy hiểm)');
        }

        // Subdomain check (www vs subdomain lạ)
        const hostname = url.hostname;
        if (hostname.startsWith('www.')) {
            score += 5;
            signals.push('✓ Sử dụng subdomain chuẩn (www)');
        } else if (hostname.includes('.') && !['localhost', 'test'].includes(hostname.split('.')[0])) {
            score -= 5;
            signals.push('? Sử dụng subdomain không chuẩn');
        }

        // IP address check (thay vì domain)
        if (/^\d+\.\d+\.\d+\.\d+/.test(hostname)) {
            score -= 30;
            signals.push('✗ Sử dụng địa chỉ IP thay vì tên miền (dấu hiệu tin giả)');
        }

        return { score, signals };
    },

    // AI phân tích URL pattern (Machine Learning heuristic)
    analyzeURLPatterns: function(urlString) {
        const url = new URL(urlString);
        const fullURL = urlString.toLowerCase();
        let score = 0;
        let patterns = [];

        // Pattern 1: Redirect chain (url?redirect=...)
        if (fullURL.includes('redirect') || fullURL.includes('skip') || fullURL.includes('continue')) {
            score -= 25;
            patterns.push('⚠️ Phát hiện redirect chain (thường dùng trong phishing)');
        }

        // Pattern 2: URL shortener
        if (/bit\.ly|tinyurl|short\.link|ow\.ly|goo\.gl/i.test(fullURL)) {
            score -= 15;
            patterns.push('⚠️ Sử dụng URL shortener (khó kiểm tra thực tế)');
        }

        // Pattern 3: Suspicious parameter
        if (fullURL.includes('utm_') && fullURL.split('utm_').length > 3) {
            score -= 10;
            patterns.push('⚠️ Quá nhiều tham số tracking');
        }

        // Pattern 4: Cache or archive (wayback machine)
        if (/archive|cache|wayback/i.test(fullURL)) {
            score -= 5;
            patterns.push('ℹ️ Đây là phiên bản lưu trữ (có thể là bài cũ)');
        }

        // Pattern 5: News aggregator hoặc mirror
        if (/aggregat|mirror|repost|share-link/i.test(fullURL)) {
            score -= 8;
            patterns.push('ℹ️ Có thể là bài viết được chia sẻ từ nguồn khác');
        }

        return { score, patterns };
    }
};

function checkNews() {
    const newsLink = document.getElementById('newsLink').value.trim();
    const resultBox = document.getElementById('result');

    // Kiểm tra xem người dùng có nhập link không
    if (!newsLink) {
        showResult('Vui lòng nhập đường dẫn bài báo!', 'warning', resultBox);
        return;
    }

    // Kiểm tra định dạng URL
    try {
        new URL(newsLink);
    } catch (e) {
        showResult('Đường dẫn không hợp lệ! Vui lòng nhập một URL hợp lệ.', 'danger', resultBox);
        return;
    }

    // ========== AI ANALYSIS ==========
    const url = new URL(newsLink);
    const domain = url.hostname.toLowerCase();

    // Bắt đầu với điểm base
    let baseScore = 50;

    // 1. AI phân tích nguồn (40 điểm tối đa)
    const sourceAnalysis = aiModel.analyzeSourceCredibility(domain);
    const sourceScore = Math.max(-40, Math.min(40, sourceAnalysis.score));

    // 2. AI phân tích cấu trúc URL (35 điểm tối đa)
    const urlStructureScore = Math.max(-35, Math.min(35, aiModel.analyzeURLStructure(newsLink)));

    // 3. AI phân tích tín hiệu công nghệ (15 điểm tối đa)
    const techAnalysis = aiModel.analyzeTechSignals(newsLink);
    const techScore = Math.max(-15, Math.min(15, techAnalysis.score));

    // 4. AI phân tích mẫu URL (20 điểm tối đa)
    const patternAnalysis = aiModel.analyzeURLPatterns(newsLink);
    const patternScore = Math.max(-20, Math.min(20, patternAnalysis.score));

    // Tính tổng điểm
    let credibilityScore = baseScore + sourceScore + urlStructureScore + techScore + patternScore;
    credibilityScore = Math.max(0, Math.min(100, credibilityScore));

    // Xác định mức độ tin cậy
    let level = 'danger';
    let levelText = '🚫 Không đáng tin cậy';

    if (credibilityScore >= 75) {
        level = 'safe';
        levelText = '✅ Đáng tin cậy';
    } else if (credibilityScore >= 50) {
        level = 'warning';
        levelText = '⚠️ Cần kiểm tra thêm';
    }

    // Tạo báo cáo chi tiết
    const resultMessage = `
        <div style="margin-bottom: 20px; padding: 15px; background-color: rgba(255,255,255,0.7); border-radius: 8px;">
            <div style="margin-bottom: 10px;">
                <strong style="font-size: 1.3em;">Kết Quả: ${levelText}</strong>
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Điểm tin cậy: ${credibilityScore}/100</strong>
                <div style="background-color: #e9ecef; border-radius: 5px; overflow: hidden; margin-top: 8px; height: 25px;">
                    <div style="width: ${credibilityScore}%; height: 100%; background: linear-gradient(90deg, #dc3545, #ffc107, #28a745); transition: width 0.5s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-weight: bold;">
                        ${credibilityScore}%
                    </div>
                </div>
            </div>
        </div>

        <div style="margin-top: 20px;">
            <strong style="font-size: 1.1em;">🤖 Phân Tích AI:</strong>
            <div style="margin-top: 15px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
                <div style="background: #e3f2fd; padding: 12px; border-radius: 5px; border-left: 4px solid #2196F3;">
                    <strong style="color: #1565c0;">📌 Độ Tin Cậy Nguồn:</strong>
                    <div style="color: #1565c0; font-size: 1.2em; margin-top: 5px;">${sourceScore > 0 ? '+' : ''}${sourceScore}</div>
                    <div style="font-size: 0.9em; color: #0d47a1; margin-top: 5px;">${sourceAnalysis.reason}</div>
                </div>

                <div style="background: #e8f5e9; padding: 12px; border-radius: 5px; border-left: 4px solid #4CAF50;">
                    <strong style="color: #2e7d32;">🔗 Cấu Trúc URL:</strong>
                    <div style="color: #2e7d32; font-size: 1.2em; margin-top: 5px;">${urlStructureScore > 0 ? '+' : ''}${urlStructureScore}</div>
                    <div style="font-size: 0.9em; color: #1b5e20; margin-top: 5px;">Phân tích độ phức tạp và bất thường</div>
                </div>

                <div style="background: #fff3e0; padding: 12px; border-radius: 5px; border-left: 4px solid #FF9800;">
                    <strong style="color: #e65100;">🔐 Tín Hiệu Bảo Mật:</strong>
                    <div style="color: #e65100; font-size: 1.2em; margin-top: 5px;">${techScore > 0 ? '+' : ''}${techScore}</div>
                    <div style="font-size: 0.9em; color: #bf360c; margin-top: 5px;">HTTPS, subdomain, địa chỉ IP</div>
                </div>

                <div style="background: #fce4ec; padding: 12px; border-radius: 5px; border-left: 4px solid #E91E63;">
                    <strong style="color: #880e4f;">⚠️ Mẫu Phát Hiện:</strong>
                    <div style="color: #880e4f; font-size: 1.2em; margin-top: 5px;">${patternScore > 0 ? '+' : ''}${patternScore}</div>
                    <div style="font-size: 0.9em; color: #ad1457; margin-top: 5px;">Redirect, URL shortener, tracking</div>
                </div>
            </div>
        </div>

        ${techAnalysis.signals.length > 0 ? `
        <div style="margin-top: 20px;">
            <strong style="font-size: 1.1em;">🔍 Chi Tiết Tín Hiệu Bảo Mật:</strong>
            <ul style="margin-top: 10px; padding-left: 0; list-style: none;">
                ${techAnalysis.signals.map(signal => `<li style="padding: 8px; margin-bottom: 6px; background-color: #f8f9fa; border-radius: 5px; border-left: 3px solid #667eea; font-size: 0.95em;">${signal}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${patternAnalysis.patterns.length > 0 ? `
        <div style="margin-top: 20px;">
            <strong style="font-size: 1.1em;">🎯 Mẫu URL Phát Hiện:</strong>
            <ul style="margin-top: 10px; padding-left: 0; list-style: none;">
                ${patternAnalysis.patterns.map(pattern => `<li style="padding: 8px; margin-bottom: 6px; background-color: #f8f9fa; border-radius: 5px; border-left: 3px solid #667eea; font-size: 0.95em;">${pattern}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 5px solid #667eea;">
            <strong>💡 Khuyến Nghị:</strong>
            <p style="margin-top: 10px; line-height: 1.7;">${getRecommendation(credibilityScore)}</p>
        </div>

        <div style="margin-top: 15px; padding: 10px; background-color: #e8eaf6; border-radius: 5px; font-size: 0.9em; color: #3f51b5;">
            <strong>ℹ️ Ghi chú:</strong> Công cụ này sử dụng AI phân tích mẫu URL, cấu trúc domain, và tín hiệu bảo mật. Luôn kiểm tra nội dung bài viết và xác minh từ nhiều nguồn để đảm bảo độ chính xác hoàn toàn.
        </div>
    `;

    showResult(resultMessage, level, resultBox);
}

function isTrustedSite(domain) {
    return trustedSites.some(site => domain.includes(site));
}

function isFakeSite(domain) {
    return fakeNewsSites.some(site => domain.includes(site));
}

function getRecommendation(score) {
    let recommendations = [];
    
    if (score >= 75) {
        recommendations.push('✅ Bài báo này đến từ một nguồn đáng tin cậy');
        recommendations.push('👍 Tuy nhiên, luôn tốt khi kiểm tra thêm từ các nguồn khác để đảm bảo độ chính xác');
        recommendations.push('🔗 Tìm các bài báo liên quan từ các trang tin tức chính thức khác');
    } else if (score >= 50) {
        recommendations.push('⚠️ Bài báo này có một số dấu hiệu cần chú ý');
        recommendations.push('🔍 Kiểm tra xem tác giả là ai và bài báo có nguồn tham khảo không');
        recommendations.push('📰 Tìm các bài báo tương tự từ các nguồn tin tức chính thức');
        recommendations.push('❓ Xem ngày đăng - bài viết này có phải là tin cũ được chia sẻ lại không?');
        recommendations.push('⏸️ Không chia sẻ bài báo này cho đến khi xác minh thêm');
    } else {
        recommendations.push('🚨 CẢNH BÁO! Bài báo này có nhiều dấu hiệu đáng ngờ');
        recommendations.push('🚫 Không nên tin tưởng hoặc chia sẻ bài báo này');
        recommendations.push('❌ Có thể đây là tin giả hoặc bài viết từ một nguồn không đáng tin cậy');
        recommendations.push('🔎 Kiểm tra nguồn gốc bài báo này trước khi quyết định');
        recommendations.push('📱 Báo cáo bài viết nếu nó vi phạm các chính sách của nền tảng');
    }
    
    return recommendations.join('<br/>');
}

function showResult(message, level, resultBox) {
    resultBox.innerHTML = message;
    resultBox.className = `result-box ${level}`;
}

// Xử lý sự kiện Enter khi nhập link
document.addEventListener('DOMContentLoaded', function() {
    const newsLink = document.getElementById('newsLink');
    if (newsLink) {
        newsLink.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkNews();
            }
        });
    }
});