const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const APP_ORIGIN = process.env.APP_ORIGIN || `http://localhost:${PORT}`;
const APP_TITLE = process.env.APP_TITLE || 'Tro Ly Tin Tuc Sinh Vien';
const PUBLIC_DIR = __dirname;
const MAX_BODY_SIZE = 1024 * 1024;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body)
    });
    res.end(body);
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];

        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > MAX_BODY_SIZE) {
                reject(new Error('Payload too large'));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });

        req.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf8'));
        });

        req.on('error', (err) => reject(err));
    });
}

async function handleOpenRouterReview(req, res) {
    if (!OPENROUTER_API_KEY) {
        sendJson(res, 500, { error: 'Missing OPENROUTER_API_KEY in backend environment.' });
        return;
    }

    let parsedBody;
    try {
        const raw = await readRequestBody(req);
        parsedBody = JSON.parse(raw || '{}');
    } catch {
        sendJson(res, 400, { error: 'Invalid JSON body.' });
        return;
    }

    const content = String(parsedBody.content || '').trim();
    const advice = parsedBody.advice || {};
    const model = String(parsedBody.model || DEFAULT_MODEL).trim();

    if (!content) {
        sendJson(res, 400, { error: 'content is required.' });
        return;
    }

    const systemPrompt = [
        'Ban la tro ly danh gia do tin cay thong tin.',
        'Tra ve DUY NHAT JSON hop le voi schema:',
        '{"summary":"string","trustLevel":"Cao|Trung bình|Thấp","keyRisks":["string"],"verificationSteps":["string"]}',
        'Khong markdown. Khong text bo sung ngoai JSON.'
    ].join(' ');

    const userPrompt = [
        `Diem heuristic hien tai: ${advice.score || 'N/A'}/100 (${advice.reliability || 'N/A'}).`,
        'Hay danh gia bo sung ngan gon dua tren noi dung ben duoi.',
        'Noi dung:',
        content
    ].join('\n\n');

    let upstreamRes;
    try {
        upstreamRes = await fetch(OPENROUTER_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': APP_ORIGIN,
                'X-Title': APP_TITLE
            },
            body: JSON.stringify({
                model,
                temperature: 0.2,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            })
        });
    } catch (error) {
        sendJson(res, 502, { error: `OpenRouter request failed: ${error.message}` });
        return;
    }

    if (!upstreamRes.ok) {
        const errText = await upstreamRes.text();
        sendJson(res, 502, { error: `OpenRouter ${upstreamRes.status}: ${errText.slice(0, 500)}` });
        return;
    }

    const upstreamPayload = await upstreamRes.json();
    const rawContent = upstreamPayload?.choices?.[0]?.message?.content?.trim();
    if (!rawContent) {
        sendJson(res, 502, { error: 'OpenRouter response is empty.' });
        return;
    }

    let aiJson;
    try {
        aiJson = JSON.parse(rawContent);
    } catch {
        sendJson(res, 502, { error: 'OpenRouter returned non-JSON content.' });
        return;
    }

    const normalized = {
        summary: aiJson.summary || '',
        trustLevel: aiJson.trustLevel || 'Trung bình',
        keyRisks: Array.isArray(aiJson.keyRisks) ? aiJson.keyRisks.slice(0, 5) : [],
        verificationSteps: Array.isArray(aiJson.verificationSteps) ? aiJson.verificationSteps.slice(0, 5) : []
    };

    sendJson(res, 200, { data: normalized });
}

function resolveStaticFile(urlPathname) {
    const normalized = decodeURIComponent(urlPathname === '/' ? '/index.html' : urlPathname);
    const safePath = path.normalize(normalized).replace(/^(\.\.[/\\])+/, '');
    return path.join(PUBLIC_DIR, safePath);
}

function serveStaticFile(req, res, parsedUrl) {
    const filePath = resolveStaticFile(parsedUrl.pathname);
    if (!filePath.startsWith(PUBLIC_DIR)) {
        sendJson(res, 403, { error: 'Forbidden' });
        return;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    if (parsedUrl.pathname === '/api/openrouter/review' && req.method === 'POST') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        await handleOpenRouterReview(req, res);
        return;
    }

    if (req.method === 'GET') {
        serveStaticFile(req, res, parsedUrl);
        return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
