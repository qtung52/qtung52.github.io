// ========== CONFIGURATION ==========
const CONFIG = {
    API_ENDPOINT: 'YOUR_API_ENDPOINT_HERE', // Placeholder for backend API if needed
    MIN_CONTENT_LENGTH: 50,
    BASE_SCORE: 50
};

// ========== UTILITY FUNCTIONS ==========
function formatScore(score) {
    return Math.round(score);
}

function showResult(message, level, resultBox) {
    resultBox.innerHTML = message;
    resultBox.className = `result-box ${level}`;
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ========== ADVICE GENERATOR ==========


// ========== CONTENT QUALITY ANALYZER ==========
const ContentAnalyzer = {
    patterns: {
        // 1. Logic & Clarity Patterns
        logic_transitions: [
            /tuy nhiên/i, /mặc dù/i, /do đó/i, /kết luận là/i, /bởi vì/i,
            /cụ thể là/i, /ví dụ như/i, /thứ nhất/i, /thứ hai/i, /tóm lại/i
        ],

        // 2. Evidence & Sources
        specific_sources: [
            /theo (báo|tạp chí|nghiên cứu|số liệu) [A-Z]/i, // Capitalized source naming
            /tiến sĩ [A-Z]/i, /giáo sư [A-Z]/i,
            /bộ [A-Z]/i, /cơ quan [A-Z]/i,
            /published in/i, /research by/i
        ],
        vague_sources: [
            /theo một số nguồn tin/i, /nghe nói/i, /như mọi người đã biết/i,
            /các chuyên gia cho rằng/i, /nguồn tin giấu tên/i, /nhiều người/i
        ],
        data_points: [
            /\d+(\.|,)?\d*\s?%/i,
            /\d{4}/i, // Years 
            /\d+\s?(triệu|tỷ|ngàn|usd|vnd)/i
        ],

        // 3. Objectivity & Bias
        absolute_claims: [
            /chắc chắn 100%/i, /tuyệt đối/i, /hoàn toàn/i, /luôn luôn/i,
            /không bao giờ/i, /ai cũng biết/i, /sự thật là/i
        ],
        emotional_language: [
            /sốc/i, /kinh hoàng/i, /rùng mình/i, /thảm họa/i, /bi kịch/i,
            /đáng sợ/i, /cực kỳ/i, /khủng khiếp/i, /tuyệt vời/i, /thần kỳ/i
        ]
    },

    analyze(text) {
        let stats = {
            logicScore: 0,
            evidenceScore: 0,
            objectivityScore: 0,
            details: {
                transitionCount: 0,
                specificSources: 0,
                vagueSources: 0,
                dataPoints: 0,
                absoluteClaims: 0,
                emotionalWords: 0
            }
        };

        const words = text.split(/\s+/).length;

        // 1. Analyze Logic (0-10)
        stats.details.transitionCount = this.patterns.logic_transitions.filter(p => p.test(text)).length;
        // Basic logic score: roughly 1 transition per 100 words is good
        stats.logicScore = Math.min(10, (stats.details.transitionCount / (words / 100)) * 5);
        if (words < 100) stats.logicScore = 2; // Too short = bad logic structure

        // 2. Analyze Evidence (0-10)
        stats.details.specificSources = this.patterns.specific_sources.filter(p => p.test(text)).length;
        stats.details.vagueSources = this.patterns.vague_sources.filter(p => p.test(text)).length;
        stats.details.dataPoints = this.patterns.data_points.filter(p => p.test(text)).length;

        let evidenceRaw = (stats.details.specificSources * 3) + (stats.details.dataPoints * 2) - (stats.details.vagueSources * 2);
        stats.evidenceScore = Math.max(0, Math.min(10, evidenceRaw));

        // 3. Analyze Objectivity (0-10)
        stats.details.absoluteClaims = this.patterns.absolute_claims.filter(p => p.test(text)).length;
        stats.details.emotionalWords = this.patterns.emotional_language.filter(p => p.test(text)).length;

        let biasPenalties = (stats.details.absoluteClaims * 3) + (stats.details.emotionalWords * 2);
        stats.objectivityScore = Math.max(0, 10 - biasPenalties);

        // Overall Score Calculation (Weighted)
        // Logic: 20%, Evidence: 50%, Objectivity: 30%
        let totalScore = (stats.logicScore * 20) + (stats.evidenceScore * 50) + (stats.objectivityScore * 30);
        totalScore = Math.max(0, Math.min(100, (totalScore / 100) * 100)); // Normalize to 0-100 check

        return {
            score: Math.round(totalScore),
            stats: stats
        };
    }
};

// ========== ADVICE GENERATOR ==========
function getStudentAdvice(analysis) {
    const { score, stats } = analysis;
    let reliability = '';
    let usage = [];
    let conclusions = [];
    let logicText = '';
    let evidenceText = '';
    let objectivityText = '';
    let warnings = [];
    let actions = [];

    // --- 1. KẾT LUẬN CHO SINH VIÊN ---
    if (score >= 75) {
        reliability = 'Cao';
        usage = [
            '✅ Bài tập / Tiểu luận: Phù hợp để trích dẫn.',
            '✅ Báo cáo nhóm: Có thể sử dụng làm bằng chứng chính.',
            '✅ Dự án cá nhân: Nguồn tham khảo chất lượng.'
        ];
        conclusions.push('Bài viết có cấu trúc tốt, dẫn chứng cụ thể và giọng văn khách quan.');
    } else if (score >= 50) {
        reliability = 'Trung bình';
        usage = [
            '⚠️ Bài tập / Tiểu luận: Cần tìm thêm nguồn khác để đối chiếu.',
            '⚠️ Báo cáo nhóm: Chỉ dùng để tham khảo ý tưởng, hạn chế trích dẫn trực tiếp.',
            '⚠️ Dự án cá nhân: Cẩn trọng, cần xác minh lại số liệu.'
        ];
        conclusions.push('Nội dung tạm được nhưng còn thiếu bằng chứng xác thực hoặc hơi mang tính chủ quan.');
    } else {
        reliability = 'Thấp';
        usage = [
            '❌ Bài tập / Tiểu luận: Không nên sử dụng.',
            '❌ Báo cáo nhóm: Không phù hợp làm tài liệu học thuật.',
            '❌ Dự án cá nhân: Chỉ đọc để biết quan điểm trái chiều.'
        ];
        conclusions.push('Nội dung mang tính quan điểm cá nhân nhiều, thiếu dẫn chứng khoa học.');
    }

    // --- 2. PHÂN TÍCH NỘI DUNG ---

    // Logic
    if (stats.logicScore > 7) logicText = 'Mạch lạc, có sử dụng các từ ngữ liên kết câu hợp lý.';
    else if (stats.logicScore > 4) logicText = 'Tương đối dễ hiểu, nhưng đôi khi lập luận chưa chặt chẽ.';
    else logicText = 'Rời rạc, thiếu tính liên kết giữa các đoạn.';

    // Evidence
    if (stats.details.specificSources > 0) {
        evidenceText = `Tốt. Có trích dẫn ${stats.details.specificSources} nguồn tin/chuyên gia cụ thể và ${stats.details.dataPoints} số liệu.`;
    } else if (stats.details.vagueSources > 0) {
        evidenceText = 'Khá mơ hồ. Sử dụng các cụm từ chung chung như "theo một số nguồn tin" thay vì nêu tên cụ thể.';
    } else {
        evidenceText = 'Yếu. Hầu như không có dẫn chứng hoặc số liệu nào để kiểm chứng.';
    }

    // Objectivity
    if (stats.objectivityScore > 8) {
        objectivityText = 'Khách quan. Sử dụng ngôn ngữ trung lập, tôn trọng sự thật.';
    } else {
        objectivityText = `Hạn chế. Có sử dụng ${stats.details.emotionalWords + stats.details.absoluteClaims} từ ngữ mang tính cảm xúc/khẳng định tuyệt đối.`;
    }

    // --- 3. SINH VIÊN NÊN LƯU Ý ---
    if (stats.details.vagueSources > 0) warnings.push('⚠️ Lưu ý các nguồn tin không được nêu tên cụ thể (ẩn danh, chung chung).');
    if (stats.details.emotionalWords > 0) warnings.push('⚠️ Cẩn thận với các từ ngữ "giật gân" nhằm thao túng cảm xúc người đọc.');
    if (score < 50) warnings.push('⚠️ Đây có thể là bài viết nêu quan điểm cá nhân (Op-Ed) hơn là bài báo đưa tin.');

    // --- 4. GỢI Ý HÀNH ĐỘNG ---
    if (score >= 75) {
        actions.push('Lưu link và ngày truy cập để làm tài liệu tham khảo (References).');
        actions.push('Tìm thêm 1 bài viết cùng chủ đề để có cái nhìn đa chiều.');
    } else if (score >= 50) {
        actions.push('Copy tên sự kiện/nhân vật chính và tìm trên Google Scholar hoặc Google News.');
        actions.push('Không dùng bài này làm nguồn dẫn chứng duy nhất.');
    } else {
        actions.push('Tìm kiếm từ khóa chính của bài trên các trang báo chính thống (Tuổi Trẻ, VnExpress...).');
        actions.push('Tuyệt đối không đưa vào bài làm học thuật.');
    }

    return {
        score,
        reliability,
        class: score >= 75 ? 'safe' : score >= 50 ? 'warning' : 'danger',
        usage,
        analysis: {
            logic: logicText,
            evidence: evidenceText,
            objectivity: objectivityText
        },
        warnings: warnings.length > 0 ? warnings : ['Không có lưu ý đặc biệt.'],
        actions
    };
}

// ========== NEWS CHECKER (LINK) ==========
// Technical analysis is disabled to focus on content quality
function checkNews() {
    const newsLink = document.getElementById('newsLink').value.trim();
    const resultBox = document.getElementById('result');

    if (!newsLink) {
        showResult('⚠️ Vui lòng nhập đường dẫn bài báo!', 'warning', resultBox);
        return;
    }

    try {
        // Since we cannot scrape in this static enviroment, and technical analysis is disabled,
        // we guide the user to the Content Checker.
        const resultMessage = `
            <div style="font-family: 'Segoe UI', sans-serif; padding: 15px; background-color: #e3f2fd; border-radius: 8px; border-left: 5px solid #2196F3;">
                <h3 style="margin-top: 0; color: #0d47a1;">ℹ️ Yêu cầu phân tích nội dung</h3>
                <p>Hệ thống hiện đang hoạt động ở chế độ <strong>"Chỉ tập trung vào Nội Dung"</strong> (Bỏ qua các yếu tố kỹ thuật như tên miền, HTTPS...).</p>
                <p>Để đảm bảo đánh giá chính xác chất lượng thông tin, vui lòng:</p>
                <ol style="margin-left: 20px;">
                    <li>Truy cập bài báo tại: <a href="${newsLink}" target="_blank">${newsLink}</a></li>
                    <li>Copy toàn bộ nội dung bài viết.</li>
                    <li>Dán vào ô <strong>"Kiểm Tra Nội Dung Bài Báo"</strong> bên dưới.</li>
                </ol>
                <p style="margin-bottom: 0;"><em>(Hệ thống sẽ phân tích trích dẫn, giọng văn và số liệu thay vì chỉ kiểm tra tên miền)</em></p>
                
                <div style="margin-top: 15px;">
                    <button onclick="document.getElementById('newsContent').focus()" style="padding: 8px 15px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        👇 Xuống phần Kiểm Tra Nội Dung
                    </button>
                </div>
            </div>
        `;

        showResult(resultMessage, 'safe', resultBox);

    } catch (error) {
        showResult('❌ Có lỗi xảy ra. Hãy thử dán nội dung vào bên dưới.', 'danger', resultBox);
        console.error('News Check Error:', error);
    }
}

// ========== CONTENT CHECKER (TEXT) ==========
function checkContent() {
    const newsContent = document.getElementById('newsContent').value.trim();
    const resultBox = document.getElementById('contentResult');

    if (!newsContent) {
        showResult('⚠️ Vui lòng nhập nội dung!', 'warning', resultBox);
        return;
    }

    if (newsContent.length < 50) {
        showResult('⚠️ Nội dung chưa đủ để đánh giá độ tin cậy cho mục đích học tập.', 'warning', resultBox);
        return;
    }

    try {
        const analysis = ContentAnalyzer.analyze(newsContent);
        const advice = getStudentAdvice(analysis);

        const resultMessage = `
            <div style="font-family: 'Segoe UI', sans-serif;">
                
                <!-- 1. KẾT LUẬN -->
                <div style="margin-bottom: 20px; padding: 20px; background: #fff; border-radius: 8px; border-left: 6px solid ${advice.class === 'safe' ? '#28a745' : advice.class === 'warning' ? '#ffc107' : '#dc3545'}; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <h3 style="margin-top: 0; color: #333;">[KẾT LUẬN CHO SINH VIÊN]</h3>
                    <p style="font-size: 1.1em; margin: 10px 0;">
                        <strong>Độ tin cậy nội dung: 
                            <span style="color: ${advice.class === 'safe' ? '#28a745' : advice.class === 'warning' ? '#d39e00' : '#dc3545'};">
                                ${advice.reliability}
                            </span>
                        </strong> (${advice.score}/100)
                    </p>
                    <div style="margin-top: 10px;">
                        <strong>Khuyến nghị sử dụng:</strong>
                        <ul style="list-style: none; padding-left: 0; margin-top: 5px;">
                            ${advice.usage.map(u => `<li style="margin-bottom: 5px;">${u}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <!-- 2. PHÂN TÍCH -->
                <div style="margin-bottom: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <h3 style="margin-top: 0; color: #333;">[PHÂN TÍCH NỘI DUNG]</h3>
                    <ul style="list-style: none; padding-left: 0;">
                        <li style="margin-bottom: 10px;">
                            <strong>1. Tính rõ ràng và logic:</strong><br>
                            ${advice.analysis.logic}
                        </li>
                        <li style="margin-bottom: 10px;">
                            <strong>2. Dẫn chứng và nguồn thông tin:</strong><br>
                            ${advice.analysis.evidence}
                        </li>
                        <li>
                            <strong>3. Tính khách quan:</strong><br>
                            ${advice.analysis.objectivity}
                        </li>
                    </ul>
                </div>

                <!-- 3. LƯU Ý -->
                <div style="margin-bottom: 20px; padding: 20px; background: #e3f2fd; border-radius: 8px;">
                    <h3 style="margin-top: 0; color: #0d47a1;">[SINH VIÊN NÊN LƯU Ý]</h3>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        ${advice.warnings.map(w => `<li style="margin-bottom: 5px;">${w}</li>`).join('')}
                    </ul>
                </div>

                <!-- 4. GỢI Ý -->
                <div style="padding: 20px; background: #e8f5e9; border-radius: 8px;">
                    <h3 style="margin-top: 0; color: #1b5e20;">[GỢI Ý HÀNH ĐỘNG]</h3>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                         ${advice.actions.map(a => `<li style="margin-bottom: 5px;">${a}</li>`).join('')}
                    </ul>
                </div>

            </div>
        `;

        showResult(resultMessage, advice.class, resultBox);

    } catch (error) {
        console.error(error);
        showResult('❌ Có lỗi xảy ra trong quá trình phân tích.', 'danger', resultBox);
    }
}
