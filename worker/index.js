const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // 静态前端
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // API 路由
    if (request.method === 'POST' && url.pathname === '/api/remove-bg') {
      return handleRemoveBg(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleRemoveBg(request, env) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return jsonError('请上传图片', 'MISSING_FILE', 400);
    }

    // 大小限制 10MB
    const arrayBuffer = await imageFile.arrayBuffer();
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      return jsonError('图片不能超过 10MB', 'FILE_TOO_LARGE', 400);
    }

    // 转发给 remove.bg
    const body = new FormData();
    body.append('image_file', new Blob([arrayBuffer], { type: imageFile.type }), imageFile.name || 'image.png');
    body.append('size', 'auto');

    const resp = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': env.REMOVE_BG_API_KEY },
      body,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      const msg = err?.errors?.[0]?.title || 'Remove.bg 请求失败';
      if (resp.status === 402) return jsonError('API 额度已用完', 'RATE_LIMIT', 402);
      return jsonError(msg, 'API_ERROR', resp.status);
    }

    const resultBuffer = await resp.arrayBuffer();
    return new Response(resultBuffer, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="removed-bg.png"',
      },
    });
  } catch (e) {
    return jsonError('服务器内部错误', 'SERVER_ERROR', 500);
  }
}

function jsonError(message, code, status) {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Picture Deal - 智能抠图</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f0f;color:#eee;min-height:100vh}
  header{padding:24px 40px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #222}
  header h1{font-size:1.4rem;font-weight:700;color:#fff}
  header span{font-size:0.8rem;background:#7c3aed;color:#fff;padding:2px 8px;border-radius:20px}
  .container{max-width:900px;margin:0 auto;padding:48px 24px}
  .hero{text-align:center;margin-bottom:48px}
  .hero h2{font-size:2.2rem;font-weight:800;margin-bottom:12px;background:linear-gradient(135deg,#a78bfa,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .hero p{color:#888;font-size:1rem}
  .upload-zone{border:2px dashed #333;border-radius:16px;padding:60px 24px;text-align:center;cursor:pointer;transition:all .2s;background:#161616}
  .upload-zone:hover,.upload-zone.drag-over{border-color:#7c3aed;background:#1a1030}
  .upload-zone svg{width:48px;height:48px;color:#555;margin-bottom:16px}
  .upload-zone p{color:#666;font-size:0.95rem}
  .upload-zone strong{color:#a78bfa}
  #fileInput{display:none}
  .result{display:none;margin-top:40px}
  .compare{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  @media(max-width:600px){.compare{grid-template-columns:1fr}}
  .img-card{background:#161616;border-radius:12px;overflow:hidden;border:1px solid #222}
  .img-card .label{padding:12px 16px;font-size:0.8rem;color:#888;border-bottom:1px solid #222}
  .img-card img{width:100%;display:block;background:repeating-conic-gradient(#222 0% 25%,#1a1a1a 0% 50%) 0 0/20px 20px}
  .actions{margin-top:20px;display:flex;gap:12px;justify-content:center}
  .btn{padding:12px 28px;border-radius:8px;border:none;cursor:pointer;font-size:0.95rem;font-weight:600;transition:all .2s}
  .btn-primary{background:#7c3aed;color:#fff}
  .btn-primary:hover{background:#6d28d9}
  .btn-secondary{background:#222;color:#ccc;border:1px solid #333}
  .btn-secondary:hover{background:#2a2a2a}
  .loading{display:none;text-align:center;padding:40px}
  .spinner{width:40px;height:40px;border:3px solid #333;border-top-color:#7c3aed;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading p{color:#888}
  .error{display:none;background:#2d1515;border:1px solid #7f1d1d;border-radius:10px;padding:16px 20px;color:#fca5a5;margin-top:20px;font-size:0.9rem}
  footer{text-align:center;padding:32px;color:#444;font-size:0.8rem;border-top:1px solid #1a1a1a;margin-top:60px}
</style>
</head>
<body>
<header>
  <h1>Picture Deal</h1>
  <span>AI 抠图</span>
</header>
<div class="container">
  <div class="hero">
    <h2>一键去除图片背景</h2>
    <p>上传图片，秒级处理，下载透明 PNG</p>
  </div>

  <div class="upload-zone" id="uploadZone">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
    </svg>
    <p><strong>点击上传</strong>或拖拽图片到此处</p>
    <p style="margin-top:8px;font-size:0.8rem">支持 JPG、PNG、WebP · 最大 10MB</p>
    <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp">
  </div>

  <div class="loading" id="loading">
    <div class="spinner"></div>
    <p>正在处理，请稍候...</p>
  </div>

  <div class="error" id="errorBox"></div>

  <div class="result" id="result">
    <div class="compare">
      <div class="img-card">
        <div class="label">原图</div>
        <img id="originalImg" alt="原图">
      </div>
      <div class="img-card">
        <div class="label">去背景结果</div>
        <img id="resultImg" alt="结果">
      </div>
    </div>
    <div class="actions">
      <button class="btn btn-primary" id="downloadBtn">⬇ 下载 PNG</button>
      <button class="btn btn-secondary" id="resetBtn">重新上传</button>
    </div>
  </div>
</div>
<footer>Powered by <a href="https://www.remove.bg" style="color:#7c3aed">Remove.bg</a> · Picture Deal</footer>

<script>
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  const errorBox = document.getElementById('errorBox');
  let resultBlob = null;

  zone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => e.target.files[0] && processFile(e.target.files[0]));

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  });

  document.addEventListener('paste', e => {
    const f = [...e.clipboardData.files].find(f => f.type.startsWith('image/'));
    if (f) processFile(f);
  });

  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!resultBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(resultBlob);
    a.download = 'removed-bg.png';
    a.click();
  });

  async function processFile(file) {
    if (file.size > 10 * 1024 * 1024) { showError('图片不能超过 10MB'); return; }
    reset(false);
    document.getElementById('originalImg').src = URL.createObjectURL(file);
    zone.style.display = 'none';
    loading.style.display = 'block';

    try {
      const fd = new FormData();
      fd.append('image', file);
      const resp = await fetch('/api/remove-bg', { method: 'POST', body: fd });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || '处理失败');
      }

      resultBlob = await resp.blob();
      document.getElementById('resultImg').src = URL.createObjectURL(resultBlob);
      loading.style.display = 'none';
      result.style.display = 'block';
    } catch (e) {
      loading.style.display = 'none';
      zone.style.display = 'block';
      showError(e.message);
    }
  }

  function showError(msg) {
    errorBox.textContent = '⚠ ' + msg;
    errorBox.style.display = 'block';
  }

  function reset(showZone = true) {
    result.style.display = 'none';
    errorBox.style.display = 'none';
    loading.style.display = 'none';
    if (showZone) zone.style.display = 'block';
    resultBlob = null;
    fileInput.value = '';
  }
</script>
</body>
</html>`;
