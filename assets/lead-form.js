(()=>{'use strict';
if(document.getElementById('sw-lead-trigger'))return;
const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5h18v11H3z"/><path d="m4 7 8 6 8-6"/></svg>';
const root=document.createElement('div');
root.innerHTML=`
<button class="sw-lead-trigger" id="sw-lead-trigger" type="button" aria-haspopup="dialog" aria-controls="sw-lead-dialog">${icon}<span>合作咨询</span></button>
<div class="sw-lead-overlay" id="sw-lead-overlay" hidden>
<section class="sw-lead-dialog" id="sw-lead-dialog" role="dialog" aria-modal="true" aria-labelledby="sw-lead-title" aria-describedby="sw-lead-intro">
<button class="sw-lead-close" type="button" aria-label="关闭表单">×</button>
<aside class="sw-lead-aside"><span class="sw-lead-kicker">SAFETYWORLD / CONNECT</span><h2 id="sw-lead-title">把安全问题，带进专业讨论。</h2><p id="sw-lead-intro">欢迎交流 AI 安全评测、研究合作、报告与产业线索。请留下需求，我们会尽快与您联系。</p><div class="sw-lead-aside-foot"><span class="sw-lead-pulse"></span>AI SAFETY · TRUSTED CONVERSATION</div></aside>
<div class="sw-lead-main"><div class="sw-lead-form-head"><span>合作与研究联络</span><small>约 1 分钟填写</small></div>
<form id="sw-lead-form" novalidate>
<div class="sw-lead-fields">
<label>姓名 <em>*</em><input name="name" autocomplete="name" maxlength="80" required placeholder="您的称呼"></label>
<label>工作邮箱 <em>*</em><input name="email" type="email" autocomplete="email" maxlength="254" required placeholder="name@company.com"></label>
<label>公司 / 机构<input name="company" autocomplete="organization" maxlength="120" placeholder="选填"></label>
<label>职位<input name="position" autocomplete="organization-title" maxlength="100" placeholder="选填"></label>
<label class="sw-lead-wide">合作方向 <em>*</em><select name="topic" required><option value="">请选择沟通方向</option><option>AI 安全评测</option><option>研究合作</option><option>报告交流</option><option>产业线索</option><option>媒体采访</option><option>其他</option></select></label>
<label class="sw-lead-wide">需求说明 <em>*</em><textarea name="message" required minlength="8" maxlength="2000" rows="3" placeholder="请简要描述您关注的问题或合作需求"></textarea></label>
<label class="sw-lead-trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
</div>
<label class="sw-lead-consent"><input type="checkbox" name="consent" required><span>我同意 SafetyWorld 为回复本次需求使用所填信息。请勿填写身份证、密码等敏感信息。</span></label>
<div class="sw-lead-actions"><button class="sw-lead-submit" type="submit" disabled>邮件接收待配置</button><p class="sw-lead-status is-pending" id="sw-lead-status" role="status" aria-live="polite">邮件通道配置完成后即可提交；当前不会发送表单信息。</p></div>
</form><p class="sw-lead-privacy">信息仅用于联系与处理本次需求，不会在网站公开展示。</p></div></section></div>`;
document.body.append(root);
const trigger=document.getElementById('sw-lead-trigger'),overlay=document.getElementById('sw-lead-overlay'),dialog=document.getElementById('sw-lead-dialog'),closeBtn=dialog.querySelector('.sw-lead-close'),form=document.getElementById('sw-lead-form'),status=document.getElementById('sw-lead-status');
let prior=null;
function close(){overlay.hidden=true;document.body.classList.remove('sw-lead-open');if(prior)prior.focus()}
function open(){prior=document.activeElement;overlay.hidden=false;document.body.classList.add('sw-lead-open');dialog.querySelector('input[name="name"]').focus()}
trigger.addEventListener('click',open);closeBtn.addEventListener('click',close);
overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close()});

})();