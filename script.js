// ========== CONFIG & CONSTANTS ==========
const CONFIG = {
    BASE_SCORE: 50,
    MIN_CONTENT_LENGTH: 50,
    URL_VALIDATION_TIMEOUT: 5000
};

// ========== DATABASE ==========
const TRUSTED_SITES = new Set([
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
    'techcrunch.com',
    'ft.com',
    'bloomberg.com'
]);

const FAKE_SITES = new Set([
    'fake-news-site.com',
    'hoax-news.net',
    'misinformation-daily.com',
    'sensational-news.org'
]);

// ========== PATTERN DEFINITIONS ==========
const PATTERNS = {
    legitimate: [
        /news/i, /times/i, /press/i, /media/i, /tribune/i, /herald/i, /telegraph/i, /post/i,
        /daily/i, /journal/i, /gazette/i, /chronicle/i, /dispatch/i, /report/i, /bureau/i
    ],
    suspicious: [
        /fake|hoax|spoof|clickbait|viral/i,
        /truth|exposed|shocking|secret/i,
        /fake[-_]?news/i,
        /-ful\.com$|buzz-score/i,
        /unmasked|coverup|hidden/i
    ],
    impersonation: [
        /bbc[\w]*\.(?!co\.uk|com)/i,
        /cnn[\w]*\.(?!com)/i,
        /reuters[\w]*\.(?!com)/i,
        /bbc[\w-]*news/i,
        /cnn[\w-]*report/i
    ]
};

const HIGH_RISK_PHRASES = [
    'they don\'t want you to know',
    'experts shocked',
    'shocking truth',
    'doctors hate this',
    'you won\'t believe',
    'one weird trick',
    'health officials warn',
    'government conspiracy',
    'banned by',
    'will be deleted',
    'before it\'s too late',
    'spread this before',
    'don\'t share',
    'illuminati',
    'new world order',
    'big pharma',
    'deep state',
    'sự thật bị che giấu',
    'bạn sẽ sốc',
    'đừng chia sẻ',
    'trước khi bị xóa',
    'họ không muốn',
    'các nhà chức trách che giấu',
    'sự kiện được kiểm duyệt'
];

const MEDIUM_RISK_PHRASES = [
    'exclusive',
    'breaking',
    'shocking',
    'unbelievable',
    'must watch',
    'must read',
    'urgent',
    'alert',
    'warning',
    'scandal',
    'không thể tin',
    'độc quyền',
    'khẩn cấp',
    'bất ngờ',
    'động trời'
];

const LEGITIMATE_PHRASES = [
    'according to',
    'research shows',
    'study found',
    'data indicates',
    'evidence suggests',
    'official statement',
    'spokesperson said',
    'analysis shows',
    'investigation reveals',
    'sources confirm',
    'theo nghiên cứu',
    'dữ liệu cho thấy',
    'bằng chứng',
    'thống kê',
    'theo các chuyên gia'
];

// ========== URL ANALYZER ==========
const URLAnalyzer = {
    analyzeStructure(urlString) {
        try {
            const url = new URL(urlString);
            const domain = url.hostname;
            const pathname = url.pathname;
            let score = 0;

            // 1. Analyze hyphens (too many = suspicious)
            const hyphenCount = domain.split('-').length - 1;
            score += hyphenCount > 4 ? -15 : hyphenCount > 2 ? -5 : 3;

            // 2. Analyze domain length
            const domainLength = domain.length;
            score += domainLength > 60 ? -20 : domainLength > 40 ? -10 : domainLength < 10 ? -5 : 5;

            // 3. Analyze subdomain count
            const subdomainCount = domain.split('.').length;
            score += subdomainCount > 4 ? -10 : subdomainCount <= 2 ? 5 : 0;

            // 4. Analyze numbers in domain
            const numberCount = (domain.match(/\d/g) || []).length;
            score += numberCount > 5 ? -12 : numberCount > 2 ? -5 : 0;

            // 5. Analyze path length
            if (pathname.length > 100) score -= 5;
            if (pathname.includes('utm_')) score -= 8;

            return Math.max(-35, Math.min(35, score));
        } catch (error) {
            console.error('URL Structure Analysis Error:', error);
            return -10;
        }
    },

    analyzeCredibility(domain) {
        let score = 0;
        let reason = '';

        // Check trusted sites
        if ([...TRUSTED_SITES].some(site => domain.includes(site))) {
            return { score: 40, reason: '✅ Nguồn được công nhân trong danh sách tin tức uy tín' };
        }

        // Check fake sites
        if ([...FAKE_SITES].some(site => domain.includes(site))) {
            return { score: -50, reason: '❌ Nguồn được biết là phát tán tin giả' };
        }

        // Analyze domain patterns
        const hasLegitimate = PATTERNS.legitimate.some(p => p.test(domain));
        const hasSuspicious = PATTERNS.suspicious.some(p => p.test(domain));
        const hasImpersonation = PATTERNS.impersonation.some(p => p.test(domain));

        if (hasImpersonation) {
            score -= 35;
            reason = '⚠️ Có dấu hiệu giả mạo tên miền của trang tin tức nổi tiếng';
        } else if (hasLegitimate) {
            score += 15;
            reason = '✓ Tên miền chứa từ khóa chính thức của ngành báo chí';
        }

        if (hasSuspicious) {
            score -= 20;
            reason = '⚠️ Tên miền chứa từ khóa cảnh báo liên quan đến tin giả';
        }

        // Check TLD
        const tld = domain.split('.').pop();
        const trustedTLDs = ['com', 'org', 'net', 'co.uk', 'gov', 'edu', 'ac.uk', 'co.nz'];
        score += trustedTLDs.includes(tld) ? 5 : tld.length > 3 ? -3 : 0;

        return { 
            score: Math.max(-40, Math.min(40, score)), 
            reason: reason || '⚪ Không xác định' 
        };
    },

    analyzeTechSignals(urlString) {
        const url = new URL(urlString);
        let score = 0;
        let signals = [];

        // HTTPS check
        if (url.protocol === 'https:') {
            score += 12;
            signals.push('✅ Sử dụng HTTPS (bảo mật)');
        } else {
            score -= 15;
            signals.push('⚠️ Không sử dụng HTTPS (nguy hiểm)');
        }

        // Subdomain check
        const hostname = url.hostname;
        if (hostname.startsWith('www.')) {
            score += 5;
            signals.push('✅ Sử dụng subdomain chuẩn (www)');
        } else if (hostname.includes('.') && !['localhost', 'test'].includes(hostname.split('.')[0])) {
            score -= 5;
            signals.push('⚠️ Sử dụng subdomain không chuẩn');
        }

        // IP address check
        if (/^\d+\.\d+\.\d+\.\d+/.test(hostname)) {
            score -= 30;
            signals.push('🚨 Sử dụng địa chỉ IP thay vì tên miền (dấu hiệu tin giả)');
        }

        return { 
            score: Math.max(-15, Math.min(15, score)), 
            signals 
        };
    },

    analyzePatterns(urlString) {
        const fullURL = urlString.toLowerCase();
        let score = 0;
        let patterns = [];

        // Redirect chain detection
        if (/redirect|skip|continue/i.test(fullURL)) {
            score -= 25;
            patterns.push('🚨 Phát hiện redirect chain (thường dùng trong phishing)');
        }

        // URL shortener detection
        if (/bit\.ly|tinyurl|short\.link|ow\.ly|goo\.gl|is\.gd/i.test(fullURL)) {
            score -= 15;
            patterns.push('⚠️ Sử dụng URL shortener (khó kiểm tra thực tế)');
        }

        // Suspicious parameters
        if (fullURL.includes('utm_') && fullURL.split('utm_').length > 3) {
            score -= 10;
            patterns.push('⚠️ Quá nhiều tham số tracking');
        }

        // Archive/cache detection
        if (/archive|cache|wayback/i.test(fullURL)) {
            score -= 5;
            patterns.push('ℹ️ Đây là phiên bản lưu trữ (có thể là bài cũ)');
        }

        // Aggregator/mirror detection
        if (/aggregat|mirror|repost|share-link/i.test(fullURL)) {
            score -= 8;
            patterns.push('ℹ️ Có thể là bài viết được chia sẻ từ nguồn khác');
        }

        return { 
            score: Math.max(-20, Math.min(20, score)), 
            patterns 
        };
    }
};

// ========== CONTENT ANALYZER ==========
const ContentAnalyzer = {
    countPhrases(text, phrases) {
        const textLower = text.toLowerCase();
        return phrases.filter(phrase => textLower.includes(phrase.toLowerCase())).length;
    },

    analyzeStructure(text) {
        const wordCount = text.trim().split(/\s+/).length;
        const charCount = text.length;
        let score = 0;
        let details = [];
        let warnings = [];

        // Length analysis
        if (wordCount < 20) {
            score -= 20;
            warnings.push('❌ Bài viết quá ngắn (dưới 20 từ)');
        } else if (wordCount < 50) {
            score -= 10;
            warnings.push('⚠️ Bài viết khá ngắn - thiếu chi tiết');
        } else {
            score += 5;
            details.push('✅ Độ dài bài viết hợp lý');
        }

        // High risk phrases
        const highRiskCount = this.countPhrases(text, HIGH_RISK_PHRASES);
        if (highRiskCount > 0) {
            score -= (highRiskCount * 8);
            warnings.push(`🚨 Phát hiện ${highRiskCount} cụm từ cảnh báo cao`);
        }

        // Medium risk phrases
        const mediumRiskCount = this.countPhrases(text, MEDIUM_RISK_PHRASES);
        if (mediumRiskCount > 0) {
            score -= (mediumRiskCount * 2);
            warnings.push(`⚠️ Phát hiện ${mediumRiskCount} từ khóa cảnh báo`);
        }

        // Legitimate phrases
        const legitimateCount = this.countPhrases(text, LEGITIMATE_PHRASES);
        if (legitimateCount > 0) {
            score += (legitimateCount * 4);
            details.push(`✅ Phát hiện ${legitimateCount} cụm từ chính thức`);
        }

        // Exclamation marks
        const exclamationCount = (text.match(/!/g) || []).length;
        if (exclamationCount > wordCount / 10) {
            score -= 10;
            warnings.push('⚠️ Quá nhiều dấu chấm than');
        }

        // ALL CAPS words
        const allCapsWords = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
        if (allCapsWords > wordCount / 20) {
            score -= 8;
            warnings.push('⚠️ Quá nhiều chữ hoa');
        }

        // Vague words
        const vagueWords = ['có thể', 'nghe nói', 'allegedly', 'possibly', 'maybe', 'reportedly'];
        const vagueCount = this.countPhrases(text, vagueWords);
        if (vagueCount > 3) {
            score -= 8;
            warnings.push('⚠️ Quá nhiều từ vừa hồ');
        }

        // Links
        const linkCount = (text.match(/https?:\/\//gi) || []).length;
        if (linkCount > 0) {
            score += 5;
            details.push(`✅ Có ${linkCount} liên kết tham khảo`);
        } else {
            score -= 5;
            warnings.push('❌ Không có liên kết hoặc nguồn');
        }

        // Numbers/statistics
        const hasNumbers = /\d+(%|\$|€|\.|\,\d)?/g.test(text);
        if (hasNumbers) {
            score += 3;
            details.push('✅ Có số liệu/thống kê');
        } else {
            score -= 3;
            warnings.push('❓ Không có số liệu cụ thể');
        }

        return {
            score: Math.max(0, Math.min(100, score)),
            wordCount,
            charCount,
            details,
            warnings,
            highRiskCount,
            mediumRiskCount,
            legitimateCount
        };
    }
};

// ========== UTILITY FUNCTIONS ==========
function formatScore(score) {
    return Math.round(score);
}

function getScoreLevel(score) {
    if (score >= 75) return { level: 'safe', text: '✅ Đáng tin cậy', color: '#28a745' };
    if (score >= 50) return { level: 'warning', text: '⚠️ Cần kiểm tra thêm', color: '#ffc107' };
    return { level: 'danger', text: '🚫 Không đáng tin cậy', color: '#dc3545' };
}

function showResult(message, level, resultBox) {
    resultBox.innerHTML = message;
    resultBox.className = `result-box ${level}`;
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function getRecommendation(score) {
    const recommendations = [];
    
    if (score >= 75) {
        recommendations.push('✅ Bài báo này đến từ một nguồn đáng tin cậy');
        recommendations.push('👍 Kiểm tra thêm từ các nguồn khác để đảm bảo độ chính xác');
        recommendations.push('🔗 Tìm các bài báo liên quan từ các trang tin tức chính thức khác');
    } else if (score >= 50) {
        recommendations.push('⚠️ Bài báo có một số dấu hiệu cần chú ý');
        recommendations.push('🔍 Kiểm tra tác giả và xem bài có nguồn tham khảo không');
        recommendations.push('📰 Tìm bài báo tương tự từ các nguồn tin tức chính thức');
        recommendations.push('❓ Kiểm tra ngày đăng - bài này có phải tin cũ không?');
        recommendations.push('⏸️ Không chia sẻ cho đến khi xác minh thêm');
    } else {
        recommendations.push('🚨 CẢNH BÁO! Bài báo có nhiều dấu hiệu đáng ngờ');
        recommendations.push('🚫 Không nên tin tưởng hoặc chia sẻ bài viết này');
        recommendations.push('❌ Có thể đây là tin giả hoặc từ nguồn không đáng tin cậy');
        recommendations.push('🔎 Kiểm tra nguồn gốc trước khi quyết định');
        recommendations.push('📱 Báo cáo bài viết nếu vi phạm chính sách nền tảng');
    }
    
    return recommendations.join('<br/>');
}

// ========== NEWS CHECKER ==========
function checkNews() {
    const newsLink = document.getElementById('newsLink').value.trim();
    const resultBox = document.getElementById('result');

    if (!newsLink) {
        showResult('⚠️ Vui lòng nhập đường dẫn bài báo!', 'warning', resultBox);
        return;
    }

    try {
        const url = new URL(newsLink);
        const domain = url.hostname.toLowerCase();

        // Perform analyses
        const baseScore = CONFIG.BASE_SCORE;
        const sourceAnalysis = URLAnalyzer.analyzeCredibility(domain);
        const sourceScore = Math.max(-40, Math.min(40, sourceAnalysis.score));
        
        const urlStructureScore = URLAnalyzer.analyzeStructure(newsLink);
        const techAnalysis = URLAnalyzer.analyzeTechSignals(newsLink);
        const techScore = Math.max(-15, Math.min(15, techAnalysis.score));
        
        const patternAnalysis = URLAnalyzer.analyzePatterns(newsLink);
        const patternScore = Math.max(-20, Math.min(20, patternAnalysis.score));

        // Calculate total score
        let credibilityScore = baseScore + sourceScore + urlStructureScore + techScore + patternScore;
        credibilityScore = Math.max(0, Math.min(100, credibilityScore));

        const scoreInfo = getScoreLevel(credibilityScore);

        // Build detailed report
        const resultMessage = `
            <div style="margin-bottom: 20px; padding: 15px; background-color: rgba(255,255,255,0.8); border-radius: 8px;">
                <div style="margin-bottom: 10px;">
                    <strong style="font-size: 1.3em;">${scoreInfo.text}</strong>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Điểm tin cậy: ${formatScore(credibilityScore)}/100</strong>
                    <div style="background-color: #e9ecef; border-radius: 5px; overflow: hidden; margin-top: 8px; height: 25px;">
                        <div style="width: ${credibilityScore}%; height: 100%; background: linear-gradient(90deg, #dc3545, #ffc107, #28a745); transition: width 0.5s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-weight: bold;">
                            ${formatScore(credibilityScore)}%
                        </div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px;">
                <strong style="font-size: 1.1em;">🤖 Chi Tiết Phân Tích:</strong>
                <div style="margin-top: 15px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
                    <div style="background: #e3f2fd; padding: 12px; border-radius: 5px; border-left: 4px solid #2196F3;">
                        <strong style="color: #1565c0;">📌 Độ Tin Cậy Nguồn</strong>
                        <div style="color: #1565c0; font-size: 1.2em; margin-top: 5px; font-weight: bold;">${sourceScore > 0 ? '+' : ''}${formatScore(sourceScore)}</div>
                        <div style="font-size: 0.9em; color: #0d47a1; margin-top: 5px;">${sourceAnalysis.reason}</div>
                    </div>

                    <div style="background: #e8f5e9; padding: 12px; border-radius: 5px; border-left: 4px solid #4CAF50;">
                        <strong style="color: #2e7d32;">🔗 Cấu Trúc URL</strong>
                        <div style="color: #2e7d32; font-size: 1.2em; margin-top: 5px; font-weight: bold;">${urlStructureScore > 0 ? '+' : ''}${formatScore(urlStructureScore)}</div>
                        <div style="font-size: 0.9em; color: #1b5e20; margin-top: 5px;">Độ phức tạp và tính bất thường</div>
                    </div>

                    <div style="background: #fff3e0; padding: 12px; border-radius: 5px; border-left: 4px solid #FF9800;">
                        <strong style="color: #e65100;">🔐 Tín Hiệu Bảo Mật</strong>
                        <div style="color: #e65100; font-size: 1.2em; margin-top: 5px; font-weight: bold;">${techScore > 0 ? '+' : ''}${formatScore(techScore)}</div>
                        <div style="font-size: 0.9em; color: #bf360c; margin-top: 5px;">HTTPS, subdomain, địa chỉ IP</div>
                    </div>

                    <div style="background: #fce4ec; padding: 12px; border-radius: 5px; border-left: 4px solid #E91E63;">
                        <strong style="color: #880e4f;">⚠️ Mẫu Phát Hiện</strong>
                        <div style="color: #880e4f; font-size: 1.2em; margin-top: 5px; font-weight: bold;">${patternScore > 0 ? '+' : ''}${formatScore(patternScore)}</div>
                        <div style="font-size: 0.9em; color: #ad1457; margin-top: 5px;">Redirect, URL shortener, tracking</div>
                    </div>
                </div>
            </div>

            ${techAnalysis.signals.length > 0 ? `
            <div style="margin-top: 20px;">
                <strong style="font-size: 1.1em;">🔍 Tín Hiệu Bảo Mật Chi Tiết</strong>
                <ul style="margin-top: 10px; padding-left: 0; list-style: none;">
                    ${techAnalysis.signals.map(signal => `<li style="padding: 8px; margin-bottom: 6px; background-color: #f8f9fa; border-radius: 5px; border-left: 3px solid #667eea; font-size: 0.95em;">${signal}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            ${patternAnalysis.patterns.length > 0 ? `
            <div style="margin-top: 20px;">
                <strong style="font-size: 1.1em;">🎯 Mẫu URL Phát Hiện</strong>
                <ul style="margin-top: 10px; padding-left: 0; list-style: none;">
                    ${patternAnalysis.patterns.map(pattern => `<li style="padding: 8px; margin-bottom: 6px; background-color: #f8f9fa; border-radius: 5px; border-left: 3px solid #667eea; font-size: 0.95em;">${pattern}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border-left: 5px solid #667eea;">
                <strong style="font-size: 1.05em;">💡 Khuyến Nghị:</strong>
                <p style="margin-top: 10px; line-height: 1.8; font-size: 0.95em;">${getRecommendation(credibilityScore)}</p>
            </div>

            <div style="margin-top: 15px; padding: 10px; background-color: #e8eaf6; border-radius: 5px; font-size: 0.9em; color: #3f51b5;">
                <strong>ℹ️ Ghi Chú:</strong> Công cụ sử dụng AI phân tích mẫu URL, cấu trúc domain, và tín hiệu bảo mật. Luôn kiểm tra nội dung và xác minh từ nhiều nguồn.
            </div>
        `;

        showResult(resultMessage, scoreInfo.level, resultBox);

    } catch (error) {
        showResult('❌ Đường dẫn không hợp lệ! Vui lòng nhập một URL hợp lệ (ví dụ: https://example.com)', 'danger', resultBox);
        console.error('News Check Error:', error);
    }
}

// ========== CONTENT CHECKER ==========
function checkContent() {
    const newsContent = document.getElementById('newsContent').value.trim();
    const resultBox = document.getElementById('contentResult');

    if (!newsContent) {
        showResult('⚠️ Vui lòng nhập nội dung!', 'warning', resultBox);
        return;
    }

    if (newsContent.length < CONFIG.MIN_CONTENT_LENGTH) {
        showResult(`⚠️ Nội dung quá ngắn (tối thiểu ${CONFIG.MIN_CONTENT_LENGTH} ký tự)!`, 'warning', resultBox);
        return;
    }

    try {
        const analysis = ContentAnalyzer.analyzeStructure(newsContent);
        const scoreInfo = getScoreLevel(analysis.score);

        const resultMessage = `
            <div style="margin-bottom: 20px; padding: 15px; background-color: rgba(255,255,255,0.8); border-radius: 8px;">
                <div style="margin-bottom: 10px;">
                    <strong style="font-size: 1.3em;">${scoreInfo.text}</strong>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong>Điểm: ${formatScore(analysis.score)}/100</strong>
                    <div style="background-color: #e9ecef; border-radius: 5px; overflow: hidden; margin-top: 8px; height: 25px;">
                        <div style="width: ${analysis.score}%; height: 100%; background: linear-gradient(90deg, #dc3545, #ffc107, #28a745); display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-weight: bold;">${formatScore(analysis.score)}%</div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                <div style="background: #e3f2fd; padding: 12px; border-radius: 5px; text-align: center;">
                    <div style="color: #1565c0; font-size: 0.9em; margin-bottom: 5px;">📝 Từ</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #1565c0;">${analysis.wordCount}</div>
                </div>
                <div style="background: #e8f5e9; padding: 12px; border-radius: 5px; text-align: center;">
                    <div style="color: #2e7d32; font-size: 0.9em; margin-bottom: 5px;">🔤 Ký tự</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #2e7d32;">${analysis.charCount}</div>
                </div>
                <div style="background: #fce4ec; padding: 12px; border-radius: 5px; text-align: center;">
                    <div style="color: #880e4f; font-size: 0.9em; margin-bottom: 5px;">⚠️ Cảnh báo</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #880e4f;">${analysis.highRiskCount}</div>
                </div>
            </div>

            ${analysis.details.length > 0 ? `
            <div style="margin-top: 20px;">
                <strong style="font-size: 1.1em;">✅ Điểm Tích Cực</strong>
                <ul style="margin-top: 10px; padding-left: 0; list-style: none;">
                    ${analysis.details.map(d => `<li style="padding: 8px; margin-bottom: 6px; background: #f1f8e9; border-left: 3px solid #4CAF50; border-radius: 3px;">${d}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            ${analysis.warnings.length > 0 ? `
            <div style="margin-top: 20px;">
                <strong style="font-size: 1.1em;">⚠️ Cảnh Báo</strong>
                <ul style="margin-top: 10px; padding-left: 0; list-style: none;">
                    ${analysis.warnings.map(w => `<li style="padding: 8px; margin-bottom: 6px; background: #fff8e1; border-left: 3px solid #ffc107; border-radius: 3px;">${w}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            <div style="margin-top: 20px; padding: 12px; background: #f8f9fa; border-left: 5px solid #667eea; border-radius: 5px;">
                <strong style="font-size: 1.05em;">💡 Kết Luận:</strong>
                <p style="margin: 10px 0 0 0; line-height: 1.6; font-size: 0.95em;">
                    ${analysis.score >= 75 
                        ? '✅ Bài viết có dấu hiệu chất lượng. Kiểm tra thêm từ các nguồn khác để xác nhận.' 
                        : analysis.score >= 50 
                        ? '⚠️ Nội dung có dấu hiệu đáng ngờ. Hãy kiểm tra kỹ lưỡng trước khi tin tưởng.' 
                        : '🚨 CẢNH BÁO! Nội dung có nhiều dấu hiệu tin giả. Không nên chia sẻ mà chưa xác minh.'}
                </p>
            </div>
        `;

        showResult(resultMessage, scoreInfo.level, resultBox);

    } catch (error) {
        showResult('❌ Lỗi xảy ra khi phân tích nội dung. Vui lòng thử lại.', 'danger', resultBox);
        console.error('Content Check Error:', error);
    }
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
    // News link input
    const newsLink = document.getElementById('newsLink');
    if (newsLink) {
        newsLink.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkNews();
            }
        });
    }

    // News content input
    const newsContent = document.getElementById('newsContent');
    if (newsContent) {
        newsContent.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                checkContent();
            }
        });
    }

    // Clear results
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            document.getElementById('result').className = 'result-box hidden';
            document.getElementById('contentResult').className = 'result-box hidden';
            document.getElementById('newsLink').value = '';
            document.getElementById('newsContent').value = '';
        });
    }
});
