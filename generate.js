// === PROMPT ENGINE PRO — api/generate.js ===
// Vercel Serverless Function — Node 18+ (CommonJS)

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'arcee-ai/trinity-large-preview:free',
  'z-ai/glm-4.5-air:free',
  'openai/gpt-oss-120b:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'minimax/minimax-m2.5:free',
  'google/gemma-4-31b-it:free',
  'qwen/qwen3-coder:free',
  'openrouter/auto',
];

const TIMEOUT_MS = 10000;

const SYSTEM_PROMPT = 'Kamu adalah asisten AI untuk UMKM Indonesia yang ahli dalam komunikasi bisnis dan analisis percakapan pelanggan. Kamu hanya boleh membalas dengan JSON valid, tanpa teks tambahan apapun.';

function buildUserPrompt(input) {
  return (
    'Perbaiki teks chat ini agar terlihat profesional dan sopan, buat ringkasan percakapan, deteksi emosi customer, buat 3 versi balasan otomatis, dan buat 3 versi closing pendek yang meningkatkan kemungkinan penjualan.\n\n' +
    'TEKS CHAT:\n' + input + '\n\n' +
    'WAJIB output JSON valid tanpa teks tambahan. Jangan tambahkan penjelasan apapun. Jangan gunakan markdown code fence.\n\n' +
    'Format output WAJIB persis seperti ini:\n' +
    '{\n' +
    '  "cleaned": "versi chat yang sudah diperbaiki menjadi profesional dan sopan",\n' +
    '  "summary": "rangkuman percakapan dalam poin-poin singkat",\n' +
    '  "emotion": "deteksi emosi customer beserta penjelasan singkat",\n' +
    '  "reply_formal": "balasan formal dan resmi yang siap dikirim",\n' +
    '  "reply_semi": "balasan semi-formal yang ramah dan profesional",\n' +
    '  "reply_casual": "balasan santai dan akrab yang tetap sopan",\n' +
    '  "closings": ["closing 1", "closing 2", "closing 3"]\n' +
    '}'
  );
}

const FALLBACK_RESPONSE = {
  cleaned: 'Gagal memproses. Coba lagi.',
  summary: 'Gagal memproses.',
  emotion: 'Tidak terdeteksi.',
  reply_formal: 'Mohon maaf, sistem sedang tidak tersedia. Silakan coba beberapa saat lagi.',
  reply_semi: 'Maaf kak, lagi ada gangguan sebentar. Boleh coba lagi ya?',
  reply_casual: 'Ups, ada gangguan nih. Coba lagi ya kak!',
  closings: [
    'Terima kasih atas perhatiannya. Kami siap membantu!',
    'Jangan ragu untuk menghubungi kami kembali.',
    'Semoga bisa segera kami bantu ya, kak!',
  ],
};

// Robust JSON extraction — strip semua variasi code fence + extract via brace matching
function extractJSON(raw) {
  if (!raw || typeof raw !== 'string') throw new Error('Empty response');
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(text);
}

// Validasi dan isi missing keys dengan fallback
function sanitizeResult(result) {
  const required = ['cleaned', 'summary', 'emotion', 'reply_formal', 'reply_semi', 'reply_casual', 'closings'];
  for (const key of required) {
    if (!result[key] || (typeof result[key] === 'string' && !result[key].trim())) {
      result[key] = FALLBACK_RESPONSE[key];
    }
  }
  if (!Array.isArray(result.closings) || result.closings.length === 0) {
    result.closings = FALLBACK_RESPONSE.closings;
  }
  result.closings = result.closings.map(function(c) {
    return (typeof c === 'string' && c.trim()) ? c.trim() : '—';
  });
  delete result.error;
  return result;
}

// === CALL SINGLE MODEL ===
async function callModel(modelName, input) {
  const controller = new AbortController();
  const timer = setTimeout(function() { controller.abort(); }, TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'HTTP-Referer': 'https://promptenginepro.vercel.app',
        'X-Title': 'Prompt Engine Pro',
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(input) },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errBody = await response.text().catch(function() { return ''; });
      throw new Error('HTTP ' + response.status + ' from ' + modelName + ': ' + errBody.slice(0, 100));
    }

    const data = await response.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error('Empty content from ' + modelName);

    const parsed = extractJSON(content);
    if (!parsed.cleaned && !parsed.reply_formal && !parsed.summary) {
      throw new Error('Invalid JSON structure from ' + modelName);
    }

    return parsed;

  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// CommonJS export — wajib untuk Vercel Node 18 tanpa package.json type:module
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const input = body.input;

  if (!input || typeof input !== 'string' || input.trim().length < 5) {
    return res.status(400).json({ error: 'Input tidak valid atau terlalu pendek.' });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY belum dikonfigurasi di server.' });
  }

  const trimmedInput = input.trim().slice(0, 4000);

  try {
    const result = await Promise.any(
      MODELS.map(function(model) { return callModel(model, trimmedInput); })
    );
    const sanitized = sanitizeResult(result);
    return res.status(200).json(sanitized);

  } catch (err) {
    console.error('All models failed:', err);
    return res.status(200).json(Object.assign({}, FALLBACK_RESPONSE));
  }
};
