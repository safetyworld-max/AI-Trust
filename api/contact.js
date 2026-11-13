const allowedTopics = new Set([
  "AI 安全评测", "研究合作", "报告交流", "产业线索", "媒体采访", "其他"
]);
const recentSubmissions = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const DESTINATION = "xman212zjp@gmail.com";

const clean = (value, max) => String(value || "").trim().slice(0, max);
const dns = require("dns").promises;

function senderDomain(from) {
  const match = String(from || "").match(/@([^>\\s]+)/);
  return match ? match[1].replace(/[;,]$/, "").toLowerCase() : "";
}

async function senderRecordsReady(domain) {
  if (!domain) return false;
  try {
    const [dkim, spf, mx] = await Promise.all([
      dns.resolveTxt("resend._domainkey." + domain),
      dns.resolveTxt("send." + domain),
      dns.resolveMx("send." + domain)
    ]);
    const hasDkim = dkim.some(parts => parts.join("").startsWith("p="));
    const hasSpf = spf.some(parts => parts.join("").includes("v=spf1") && parts.join("").includes("amazonses.com"));
    const hasMx = mx.some(record => String(record.exchange || "").toLowerCase().endsWith(".amazonses.com"));
    return hasDkim && hasSpf && hasMx;
  } catch {
    return false;
  }
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  const configured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  if (req.method === "GET") {
    const domainReady = configured ? await senderRecordsReady(senderDomain(process.env.RESEND_FROM_EMAIL)) : false;
    return res.status(200).json({ ready: configured && domainReady });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "该请求方式暂不支持。" });
  }

  const origin = req.headers.origin;
  if (origin) {
    try {
      const host = new URL(origin).hostname.toLowerCase();
      if (host !== "safetyworld.online" && host !== "www.safetyworld.online") {
        return res.status(403).json({ error: "请求来源无法验证，请刷新页面后重试。" });
      }
    } catch {
      return res.status(403).json({ error: "请求来源无法验证，请刷新页面后重试。" });
    }
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > 10000) return res.status(413).json({ error: "提交内容过长。" });

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) body = {};

  // Honeypot: silently accept automated submissions without forwarding data.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const now = Date.now();
  for (const [key, record] of recentSubmissions) {
    if (now - record.startedAt > WINDOW_MS) recentSubmissions.delete(key);
  }
  const record = recentSubmissions.get(ip);
  if (record && now - record.startedAt < WINDOW_MS && record.count >= MAX_PER_WINDOW) {
    return res.status(429).json({ error: "提交次数较多，请稍后再试。" });
  }
  if (!record || now - record.startedAt >= WINDOW_MS) recentSubmissions.set(ip, { startedAt: now, count: 1 });
  else record.count += 1;

  const name = clean(body.name, 80);
  const email = clean(body.email, 254);
  const company = clean(body.company, 120);
  const position = clean(body.position, 100);
  const topic = clean(body.topic, 40);
  const message = clean(body.message, 2000);
  const consent = body.consent === true || body.consent === "true";

  if (!name || !email || !topic || !message || !consent) {
    return res.status(400).json({ error: "请补全必填信息并勾选信息使用说明。" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "请填写有效的邮箱地址。" });
  }
  if (!allowedTopics.has(topic) || message.length < 8) {
    return res.status(400).json({ error: "请检查合作方向和需求说明后重试。" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return res.status(503).json({ error: "邮件服务尚未配置，请稍后再试。" });

  const rows = [
    ["姓名", name], ["工作邮箱", email], ["公司 / 机构", company || "未填写"],
    ["职位", position || "未填写"], ["合作方向", topic], ["需求说明", message]
  ];
  const text = rows.map(([label, value]) => label + "：\n" + value).join("\n\n");
  const html = rows.map(([label, value]) =>
    '<tr><th style="padding:10px 12px;text-align:left;vertical-align:top;color:#66715f;font-size:13px;border-bottom:1px solid #e0e5dc;white-space:nowrap">' +
    escapeHtml(label) +
    '</th><td style="padding:10px 12px;color:#1d271f;font-size:14px;line-height:1.7;border-bottom:1px solid #e0e5dc;white-space:pre-wrap">' +
    escapeHtml(value) + '</td></tr>'
  ).join("");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [DESTINATION],
        reply_to: email,
        subject: "[SafetyWorld 合作留资] " + topic + " · " + name,
        text,
        html: '<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#1d271f"><p style="font-size:11px;letter-spacing:.12em;color:#66715f">SAFETYWORLD / NEW INQUIRY</p><h2 style="font-size:22px;margin:8px 0 20px">收到一条合作意向</h2><table style="width:100%;border-collapse:collapse">' + html + '</table><p style="margin-top:18px;font-size:12px;color:#758071">可直接回复此邮件联系提交者。</p></div>'
      })
    });
    if (!response.ok) {
      const providerResult = await response.json().catch(() => ({}));
      const providerCode = clean(providerResult.name || providerResult.code || "", 80);
      console.error("SafetyWorld lead email delivery failed", response.status, providerCode || "unknown");
      let message = "邮件服务未能接受请求，请检查 Resend 配置。";
      if (response.status === 401) message = "Resend API Key 无效或没有发送权限，请检查密钥和权限设置。";
      else if (response.status === 403) message = "Resend 拒绝了发件请求，请检查发件域名验证、账号状态和 API Key 权限。";
      else if (response.status === 422) message = "发件地址格式或域名验证未通过，请检查 RESEND_FROM_EMAIL 和 Resend Domains 状态。";
      else if (response.status === 429) message = "邮件服务触发限流，请稍后再试。";
      return res.status(502).json({ error: message, providerStatus: response.status, providerCode: providerCode || "unknown" });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("SafetyWorld lead email delivery error", error && error.name ? error.name : "unknown");
    return res.status(502).json({ error: "邮件发送暂时失败，请稍后重试。" });
  }
};
