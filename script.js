const CONFIG = {
    MIN_CONTENT_LENGTH: 50,
    BACKEND_REVIEW_ENDPOINT: '/api/openrouter/review',
    DEFAULT_OPENROUTER_MODEL: 'openai/gpt-4o-mini'
};

function getById(id) {
    return document.getElementById(id);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function showResult(message, level, resultBox) {
    resultBox.innerHTML = message;
    resultBox.className = `result-box ${level}`;
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearResultBox(resultBox) {
    resultBox.innerHTML = '';
    resultBox.className = 'result-box hidden';
}

function clearAllFields() {
    getById('newsLink').value = '';
    getById('newsContent').value = '';
    clearResultBox(getById('result'));
    clearResultBox(getById('contentResult'));
}

function validateNewsUrl(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function renderPlainList(items) {
    return items.map((item) => `<li style="margin-bottom: 5px;">${escapeHtml(item)}</li>`).join('');
}

const ContentAnalyzer = {
    patterns: {
        logicTransitions: [
            /tuy nhiên/i, /mặc dù/i, /do đó/i, /kết luận là/i, /bởi vì/i,
            /cụ thể là/i, /ví dụ như/i, /thứ nhất/i, /thứ hai/i, /tóm lại/i
        ],
        specificSources: [
            /theo (báo|tạp chí|nghiên cứu|số liệu) [A-ZÀ-Ỹ]/i,
            /tiến sĩ [A-ZÀ-Ỹ]/i, /giáo sư [A-ZÀ-Ỹ]/i,
            /bộ [A-ZÀ-Ỹ]/i, /cơ quan [A-ZÀ-Ỹ]/i,
            /published in/i, /research by/i
        ],
        vagueSources: [
            /theo một số nguồn tin/i, /nghe nói/i, /như mọi người đã biết/i,
            /các chuyên gia cho rằng/i, /nguồn tin giấu tên/i, /nhiều người/i
        ],
        dataPoints: [
            /\d+([.,]\d+)?\s?%/i,
            /\b(19|20)\d{2}\b/i,
            /\d+\s?(triệu|tỷ|ngàn|usd|vnd)/i
        ],
        absoluteClaims: [
            /chắc chắn 100%/i, /tuyệt đối/i, /hoàn toàn/i, /luôn luôn/i,
            /không bao giờ/i, /ai cũng biết/i, /sự thật là/i
        ],
        emotionalLanguage: [
            /sốc/i, /kinh hoàng/i, /rùng mình/i, /thảm họa/i, /bi kịch/i,
            /đáng sợ/i, /cực kỳ/i, /khủng khiếp/i, /tuyệt vời/i, /thần kỳ/i
        ]
    },

    analyze(text) {
        const stats = {
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

        const words = text.split(/\s+/).filter(Boolean).length;

        stats.details.transitionCount = this.patterns.logicTransitions.filter((p) => p.test(text)).length;
        stats.logicScore = Math.min(10, (stats.details.transitionCount / Math.max(words / 100, 1)) * 5);
        if (words < 100) {
            stats.logicScore = 2;
        }

        stats.details.specificSources = this.patterns.specificSources.filter((p) => p.test(text)).length;
        stats.details.vagueSources = this.patterns.vagueSources.filter((p) => p.test(text)).length;
        stats.details.dataPoints = this.patterns.dataPoints.filter((p) => p.test(text)).length;

        const evidenceRaw =
            (stats.details.specificSources * 3) +
            (stats.details.dataPoints * 2) -
            (stats.details.vagueSources * 2);
        stats.evidenceScore = Math.max(0, Math.min(10, evidenceRaw));

        stats.details.absoluteClaims = this.patterns.absoluteClaims.filter((p) => p.test(text)).length;
        stats.details.emotionalWords = this.patterns.emotionalLanguage.filter((p) => p.test(text)).length;

        const biasPenalties = (stats.details.absoluteClaims * 3) + (stats.details.emotionalWords * 2);
        stats.objectivityScore = Math.max(0, 10 - biasPenalties);

        const totalScore = Math.max(
            0,
            Math.min(100, (stats.logicScore * 20) + (stats.evidenceScore * 50) + (stats.objectivityScore * 30))
        );

        return {
            score: Math.round(totalScore / 10),
            stats
        };
    }
};

function getStudentAdvice(analysis) {
    const { score, stats } = analysis;
    let reliability = '';
    let usage = [];
    let logicText = '';
    let evidenceText = '';
    let objectivityText = '';
    const warnings = [];
    const actions = [];

    if (score >= 75) {
        reliability = 'Cao';
        usage = [
            'Bài tập / Tiểu luận: Phù hợp để trích dẫn.',
            'Báo cáo nhóm: Có thể dùng làm bằng chứng chính.',
            'Dự án cá nhân: Nguồn tham khảo chất lượng.'
        ];
    } else if (score >= 50) {
        reliability = 'Trung bình';
        usage = [
            'Bài tập / Tiểu luận: Cần tìm thêm nguồn khác để đối chiếu.',
            'Báo cáo nhóm: Chỉ dùng để tham khảo ý tưởng.',
            'Dự án cá nhân: Cần xác minh lại số liệu.'
        ];
    } else {
        reliability = 'Thấp';
        usage = [
            'Bài tập / Tiểu luận: Không nên sử dụng.',
            'Báo cáo nhóm: Không phù hợp làm tài liệu học thuật.',
            'Dự án cá nhân: Chỉ đọc để biết quan điểm trái chiều.'
        ];
    }

    if (stats.logicScore > 7) {
        logicText = 'Mạch lạc, có sử dụng các từ ngữ liên kết câu hợp lý.';
    } else if (stats.logicScore > 4) {
        logicText = 'Tương đối dễ hiểu, nhưng lập luận chưa chặt chẽ ở một số điểm.';
    } else {
        logicText = 'Rời rạc, thiếu tính liên kết giữa các đoạn.';
    }

    if (stats.details.specificSources > 0) {
        evidenceText = `Có ${stats.details.specificSources} nguồn/chuyên gia cụ thể và ${stats.details.dataPoints} dữ liệu định lượng.`;
    } else if (stats.details.vagueSources > 0) {
        evidenceText = 'Nguồn còn mơ hồ, có dùng cụm chung chung thay vì nêu rõ tên nguồn.';
    } else {
        evidenceText = 'Hầu như không có dẫn chứng hoặc số liệu để kiểm chứng.';
    }

    if (stats.objectivityScore > 8) {
        objectivityText = 'Khá khách quan, dùng ngôn ngữ trung lập.';
    } else {
        objectivityText = `Có ${stats.details.emotionalWords + stats.details.absoluteClaims} dấu hiệu cảm xúc/khẳng định tuyệt đối.`;
    }

    if (stats.details.vagueSources > 0) {
        warnings.push('Có nguồn tin không nêu tên cụ thể (ẩn danh, chung chung).');
    }
    if (stats.details.emotionalWords > 0) {
        warnings.push('Có dấu hiệu dùng từ giật gân để tác động cảm xúc.');
    }
    if (score < 50) {
        warnings.push('Nội dung này có thể thiên về quan điểm cá nhân hơn là đưa tin.');
    }

    if (score >= 75) {
        actions.push('Lưu link và ngày truy cập để đưa vào phần tài liệu tham khảo.');
        actions.push('Đối chiếu thêm tối thiểu 1 nguồn cùng chủ đề.');
    } else if (score >= 50) {
        actions.push('Tìm lại thông tin bằng từ khóa chính trên Google Scholar/Google News.');
        actions.push('Không dùng bài này làm nguồn duy nhất.');
    } else {
        actions.push('Tra cứu cùng sự kiện trên các báo chính thống.');
        actions.push('Không dùng trực tiếp cho bài học thuật.');
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
        warnings: warnings.length ? warnings : ['Không có lưu ý đặc biệt.'],
        actions
    };
}

function getOpenRouterConfig() {
    const model = getById('openRouterModel')?.value?.trim() || CONFIG.DEFAULT_OPENROUTER_MODEL;
    const enabled = getById('useOpenRouter')?.checked || false;
    return { enabled, model };
}

async function getOpenRouterReview(content, advice, openRouterConfig) {
    const response = await fetch(CONFIG.BACKEND_REVIEW_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: openRouterConfig.model,
            advice,
            content
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Backend ${response.status}: ${errorBody.slice(0, 200)}`);
    }

    const payload = await response.json();
    const parsed = payload?.data;
    if (!parsed) {
        throw new Error('Backend response is missing data.');
    }

    return {
        summary: parsed.summary || 'Không có tóm tắt.',
        trustLevel: parsed.trustLevel || 'Trung bình',
        keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks.slice(0, 3) : [],
        verificationSteps: Array.isArray(parsed.verificationSteps) ? parsed.verificationSteps.slice(0, 3) : []
    };
}

function renderAiSection(aiReview) {
    return `
        <div style="margin-top: 20px; padding: 20px; background: #f3f7ff; border-radius: 8px; border-left: 6px solid #3f51b5;">
            <h3 style="margin-top: 0; color: #1a237e;">[DANH GIA BO SUNG BANG AI - OpenRouter]</h3>
            <p><strong>Muc do tin cay (AI):</strong> ${escapeHtml(aiReview.trustLevel)}</p>
            <p><strong>Tom tat:</strong> ${escapeHtml(aiReview.summary)}</p>
            <div style="margin-top: 10px;">
                <strong>Rui ro chinh:</strong>
                <ul style="margin-top: 6px; padding-left: 20px;">
                    ${renderPlainList(aiReview.keyRisks.length ? aiReview.keyRisks : ['Khong co ghi chu bo sung.'])}
                </ul>
            </div>
            <div style="margin-top: 10px;">
                <strong>Buoc xac minh de xuat:</strong>
                <ul style="margin-top: 6px; padding-left: 20px;">
                    ${renderPlainList(aiReview.verificationSteps.length ? aiReview.verificationSteps : ['Khong co de xuat bo sung.'])}
                </ul>
            </div>
        </div>
    `;
}

function checkNews() {
    const newsLink = getById('newsLink').value.trim();
    const resultBox = getById('result');

    if (!newsLink) {
        showResult('⚠️ Vui lòng nhập đường dẫn bài báo!', 'warning', resultBox);
        return;
    }

    const validatedUrl = validateNewsUrl(newsLink);
    if (!validatedUrl) {
        showResult('⚠️ Đường dẫn không hợp lệ. Chỉ hỗ trợ http/https.', 'warning', resultBox);
        return;
    }

    const safeUrl = escapeHtml(validatedUrl.href);
    const resultMessage = `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 15px; background-color: #e3f2fd; border-radius: 8px; border-left: 5px solid #2196F3;">
            <h3 style="margin-top: 0; color: #0d47a1;">ℹ️ Yêu cầu phân tích nội dung</h3>
            <p>Hệ thống đang chạy theo hướng phân tích nội dung bài viết. Vui lòng:</p>
            <ol style="margin-left: 20px;">
                <li>Mở bài báo tại: <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a></li>
                <li>Copy toàn bộ nội dung bài viết.</li>
                <li>Dán vào ô "Kiểm Tra Nội Dung Bài Báo" bên dưới để phân tích.</li>
            </ol>
        </div>
    `;

    showResult(resultMessage, 'safe', resultBox);
}

function buildBaseResultMessage(advice) {
    return `
        <div style="font-family: 'Segoe UI', sans-serif;">
            <div style="margin-bottom: 20px; padding: 20px; background: #fff; border-radius: 8px; border-left: 6px solid ${advice.class === 'safe' ? '#28a745' : advice.class === 'warning' ? '#ffc107' : '#dc3545'}; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #333;">[KET LUAN CHO SINH VIEN]</h3>
                <p style="font-size: 1.1em; margin: 10px 0;">
                    <strong>Độ tin cậy nội dung:
                        <span style="color: ${advice.class === 'safe' ? '#28a745' : advice.class === 'warning' ? '#d39e00' : '#dc3545'};">
                            ${escapeHtml(advice.reliability)}
                        </span>
                    </strong> (${advice.score}/100)
                </p>
                <div style="margin-top: 10px;">
                    <strong>Khuyến nghị sử dụng:</strong>
                    <ul style="list-style: none; padding-left: 0; margin-top: 5px;">
                        ${renderPlainList(advice.usage)}
                    </ul>
                </div>
            </div>

            <div style="margin-bottom: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #333;">[PHAN TICH NOI DUNG]</h3>
                <ul style="list-style: none; padding-left: 0;">
                    <li style="margin-bottom: 10px;"><strong>1. Tính rõ ràng và logic:</strong><br>${escapeHtml(advice.analysis.logic)}</li>
                    <li style="margin-bottom: 10px;"><strong>2. Dẫn chứng và nguồn thông tin:</strong><br>${escapeHtml(advice.analysis.evidence)}</li>
                    <li><strong>3. Tính khách quan:</strong><br>${escapeHtml(advice.analysis.objectivity)}</li>
                </ul>
            </div>

            <div style="margin-bottom: 20px; padding: 20px; background: #e3f2fd; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #0d47a1;">[SINH VIEN NEN LUU Y]</h3>
                <ul style="margin-top: 5px; padding-left: 20px;">
                    ${renderPlainList(advice.warnings)}
                </ul>
            </div>

            <div style="padding: 20px; background: #e8f5e9; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #1b5e20;">[GOI Y HANH DONG]</h3>
                <ul style="margin-top: 5px; padding-left: 20px;">
                    ${renderPlainList(advice.actions)}
                </ul>
            </div>
        </div>
    `;
}

async function checkContent() {
    const newsContent = getById('newsContent').value.trim();
    const resultBox = getById('contentResult');

    if (!newsContent) {
        showResult('⚠️ Vui lòng nhập nội dung!', 'warning', resultBox);
        return;
    }

    if (newsContent.length < CONFIG.MIN_CONTENT_LENGTH) {
        showResult('⚠️ Nội dung chưa đủ để đánh giá độ tin cậy cho mục đích học tập.', 'warning', resultBox);
        return;
    }

    try {
        const heuristicAnalysis = ContentAnalyzer.analyze(newsContent);
        const advice = getStudentAdvice(heuristicAnalysis);

        let resultMessage = buildBaseResultMessage(advice);
        let resultLevel = advice.class;

        const openRouterConfig = getOpenRouterConfig();
        if (openRouterConfig.enabled) {
            try {
                const aiReview = await getOpenRouterReview(newsContent, advice, openRouterConfig);
                resultMessage += renderAiSection(aiReview);
            } catch (apiError) {
                resultMessage += `
                    <div style="margin-top: 20px; padding: 14px; border-radius: 8px; background: #f8d7da; border-left: 5px solid #dc3545;">
                        ❌ Gọi OpenRouter thất bại: ${escapeHtml(apiError.message)}
                    </div>
                `;
                resultLevel = 'warning';
            }
        }

        showResult(resultMessage, resultLevel, resultBox);
    } catch (error) {
        console.error(error);
        showResult('❌ Có lỗi xảy ra trong quá trình phân tích.', 'danger', resultBox);
    }
}

function init() {
    const linkInput = getById('newsLink');
    const contentInput = getById('newsContent');
    const clearBtn = getById('clearBtn');

    if (linkInput) {
        linkInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                checkNews();
            }
        });
    }

    if (contentInput) {
        contentInput.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                checkContent();
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllFields);
    }
}

window.checkNews = checkNews;
window.checkContent = checkContent;
window.clearAllFields = clearAllFields;
window.addEventListener('DOMContentLoaded', init);
