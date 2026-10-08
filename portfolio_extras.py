import json
from pathlib import Path
from html import escape as esc
import re

ROOT = Path(__file__).parent

def footer_controls(page, cv, ar=False):
    svg=lambda path:f'<svg viewBox="0 0 24 24" aria-hidden="true">{path}</svg>'
    linkedin=svg('<g fill="currentColor" stroke="none"><circle cx="5" cy="5" r="2"/><path d="M3.3 8.5h3.4V21H3.3zM9 8.5h3.3v1.7c.7-1.2 1.9-2 3.7-2 3.7 0 4.7 2.3 4.7 5.5V21h-3.4v-6.5c0-1.8-.3-3.1-2.2-3.1-2 0-2.7 1.4-2.7 3.1V21H9z"/></g>')
    github=svg('<path d="M9 20c-5 1-5-3-7-3m14 5v-4c0-1-.3-2-1-2 4-.5 7-2 7-6a6 6 0 0 0-2-4c.3-1 0-3 0-3s-2 0-4 2a15 15 0 0 0-8 0C6 3 4 3 4 3s-.3 2 0 3a6 6 0 0 0-2 4c0 4 3 5.5 7 6-.7.5-1 1-1 2v4"/>')
    download=svg('<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>')
    links=f'<div class="footer-controls"><a class="social-icon" href="https://www.linkedin.com/in/islam-nashaat03/" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn">{linkedin}</a><a class="social-icon" href="https://github.com/islamnashaat03" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">{github}</a><a class="footer-cv" href="{cv}" download>{download}<span>{"تحميل السيرة الذاتية" if ar else "Download CV"}</span></a></div>'
    return re.sub(r'(<footer\b[^>]*>.*?<p>.*?</p>)<div>.*?</div>(</footer>)',lambda m:m[1]+links+m[2],page,flags=re.S)

def evidence(slug, ar=False, prefix='../'):
    manifest = ROOT/'images/performance/supplied/manifest.json'
    entries = json.loads(manifest.read_text(encoding='utf-8')) if manifest.exists() else []
    item = next((x for x in entries if x['slug'] == {'legal-pillars-law':'legal-pillars','menarat-ebdaa':'menarat'}.get(slug,slug)),None)
    handoff = bool(item)
    if not item:
        current_path=ROOT/'images/performance/current/manifest.json'
        current=json.loads(current_path.read_text(encoding='utf-8')) if current_path.exists() else []
        item=next((x for x in current if x['slug']==slug and x.get('status')=='captured'),None)
        if not item:return ''
    title = 'أداء نسخة التسليم قبل نقل الدومين' if ar else 'Performance of the handoff version'
    note = 'اختبارات PageSpeed بتاريخ ٨ أكتوبر ٢٠٢٦ لنسخة ما قبل النقل وتعديلات العميل. تختلف الاستضافة عن النسخة الحالية؛ هذه قياسات معملية وليست مقارنة تحسين قبل وبعد.' if ar else 'PageSpeed lab tests dated 8 October 2026, for the version before domain migration and client edits. Hosting differs from the current site; these are measured results, not a controlled optimization before/after comparison.'
    if not handoff:
        title='أداء النسخة المقاسة' if ar else 'Performance of the measured version'
        note='قياس PageSpeed معملي بتاريخ ٨ أكتوبر ٢٠٢٦ للرابط الموضّح في التقرير. قد تشمل النسخة تغييرات لاحقة من العميل. النتائج ليست ضمانًا لسرعة جميع الصفحات أو مقارنة تحسين قبل وبعد.' if ar else 'PageSpeed lab measurements dated 8 October 2026 for the URL shown in the report. The version may include later client changes. These scores are not a guarantee for every page or a before/after optimization comparison.'
    cards=''
    title=f'{item["name"]} — {title}'
    for d in item['devices']:
        label=('الموبايل' if d['device']=='Mobile' else 'الكمبيوتر') if ar else d['device']
        score=d['score'].split()[0]
        image=prefix+'images/performance/supplied/'+d['file'] if handoff else prefix+d['screenshot'].replace('\\','/')
        cards+=f'<article><h3>{label} <strong dir="ltr">{score}/100</strong></h3><a href="{image}" target="_blank" rel="noopener"><img src="{image}" alt="{esc(item["name"])} — {label} PageSpeed report" width="1440" height="1400" loading="lazy"></a><a class="text-link" href="{esc(d["report"])}" target="_blank" rel="noopener">{"التقرير الأصلي" if ar else "Original report"}</a></article>'
    return f'<section class="wrap section performance-evidence"><h2>{title}</h2><p class="evidence-note">{note}</p><div class="evidence-grid">{cards}</div></section>'

def portfolio_evidence(ar=False, prefix='../'):
    t=lambda en,arab: arab if ar else en
    report='https://pagespeed.web.dev/analysis/https-islamnashaat03-github-io-my-portfolio/0bbamicop0'
    cards=''
    for device in ('mobile','desktop'):
        label=t('Mobile','الموبايل') if device=='mobile' else t('Desktop','الكمبيوتر')
        image=f'{prefix}images/performance/latest/my-portfolio-{device}-optimized.jpg'
        cards+=f'<article><h3>{label} <strong dir="ltr">100/100</strong></h3><a href="{image}" target="_blank" rel="noopener"><img src="{image}" alt="{label} — Islam Nashaat portfolio PageSpeed report" width="413" height="1800" loading="lazy"></a><a class="text-link" href="{report}?form_factor={device}" target="_blank" rel="noopener">{t("Original report","التقرير الأصلي")}</a></article>'
    return f'<section class="wrap section performance-evidence"><h2>{t("My portfolio: measured performance improvement","البورتفليو الخاص بي: تحسين أداء بقياس موثّق")}</h2><p>{t("Mobile performance improved from 76 to 100, and Largest Contentful Paint from 4.7 to 0.9 seconds. I removed render-blocking font and CSS requests, compressed and self-hosted fonts, and replaced the mobile canvas with a static background. Desktop recorded 100/100.","تحسّن أداء الموبايل من 76 إلى 100، ووقت ظهور أكبر محتوى من 4.7 إلى 0.9 ثانية. أزلت طلبات الخطوط وCSS التي تؤخر الرسم، وضغطت الخطوط واستضفتها محليًا، واستبدلت الكانفاس على الموبايل بخلفية ثابتة. سجّل الكمبيوتر 100/100.")}</p><p class="evidence-note">{t("Lighthouse lab tests on 8 October 2026, on the same URL. Mobile: emulated Moto G Power / Slow 4G. Individual test results vary; these are not real-user measurements.","اختبارات Lighthouse بتاريخ 8 أكتوبر 2026 على نفس الرابط. الموبايل: محاكاة Moto G Power واتصال Slow 4G. تتغير النتائج بين التشغيلات، وهذه ليست قياسات مستخدمين فعلية.")}</p><a class="text-link" href="https://pagespeed.web.dev/analysis/https-islamnashaat03-github-io-my-portfolio/7p7xmq05vt?form_factor=mobile" target="_blank" rel="noopener">{t("Before optimization report","تقرير ما قبل التحسين")}</a><div class="evidence-grid">{cards}</div></section>'

def review_page(ar=False):
    def t(en,arab): return arab if ar else en
    return f'''<section class="page-intro wrap review-intro"><h1>{t('How was working<br>with me?','كيف كانت تجربة<br>العمل معي؟')}</h1><p>{t('A short, honest review helps future clients understand what working together is like. Positive feedback and suggestions are both welcome.','تقييمك الصادق يساعد العملاء على فهم تجربة العمل معي. أرحّب بالملاحظات الإيجابية واقتراحات التحسين.')}</p><p class="muted">{t('About 3 minutes. Your review is checked before publication.','حوالي ٣ دقائق. تتم مراجعة التقييم قبل نشره.')}</p></section>
<section class="wrap section review-layout"><form id="contact-form" data-review="true" action="https://formspree.io/f/xwlpaegk" method="POST">
<input type="hidden" name="_subject" value="Client review — Islam Nashaat"><input type="hidden" name="form_type" value="client_review"><div class="honeypot" aria-hidden="true"><label>Leave empty<input name="_gotcha" tabindex="-1"></label></div>
<div class="form-row"><label>{t('Your name','اسمك')}<input name="name" required maxlength="100" autocomplete="name"></label><label>{t('Email (private, for follow-up)','البريد الإلكتروني (خاص للمتابعة)')}<input name="email" type="email" required maxlength="254" autocomplete="email" dir="ltr"></label></div>
<div class="form-row"><label>{t('Role / business (optional)','الوظيفة / النشاط (اختياري)')}<input name="role_business" maxlength="150"></label><label>{t('Project / service','المشروع / الخدمة')}<input name="project" required maxlength="150"></label></div>
<fieldset class="review-rating"><legend>{t('Overall experience','تقييم التجربة بشكل عام')}</legend><div>{''.join(f'<label><input type="radio" name="rating" value="{n}" required><span>{n}</span></label>' for n in range(1,6))}</div><p class="muted">{t('1 = poor · 5 = excellent','١ = ضعيفة · ٥ = ممتازة')}</p></fieldset>
<label>{t('What did you need, and what did we achieve together?','ما الذي كنت تحتاجه، وما الذي حققناه معًا؟')}<textarea name="review" required minlength="20" maxlength="2000" rows="5" placeholder="{t('In your own words: the challenge, the work, and what was useful to you.','بكلماتك: الاحتياج، الشغل الذي تم، وما الذي أفادك في النتيجة.')}" ></textarea></label>
<label>{t('Communication, delivery, or anything to improve? (optional)','التواصل والالتزام بالتسليم، أو أي شيء يمكن تحسينه؟ (اختياري)')}<textarea name="feedback" maxlength="1500" rows="3"></textarea></label>
<label>{t('Public website / LinkedIn (optional)','رابط الموقع / لينكدإن للنشر (اختياري)')}<input name="public_link" type="url" maxlength="500" dir="ltr"></label>
<label>{t('Publication preference','تفضيل النشر')}<select name="publication_permission" required><option value="">{t('Choose one','اختر')}</option><option value="named">{t('Publish my review with my name and role/business','أوافق على نشر التقييم باسمي والوظيفة / النشاط')}</option><option value="anonymous">{t('Publish anonymously; hide my name and business','أوافق على النشر بدون اسمي أو اسم النشاط')}</option><option value="private">{t('Private feedback only; do not publish','ملاحظات خاصة فقط؛ لا أوافق على النشر')}</option></select></label>
<p class="form-note">{t('Your email stays private. A published review may be shortened or translated without changing its meaning. Contact Islam by email to correct or withdraw your review.','بريدك يظل خاصًا. قد يُختصر التقييم أو يُترجم دون تغيير معناه. يمكنك التواصل مع إسلام بالبريد لتعديل التقييم أو سحب إذن نشره.')}</p><button class="button" type="submit">{t('Send my review','إرسال تقييمي')}</button><p id="form-status" role="status" aria-live="polite"></p></form><aside><h2>{t('What makes a useful review?','ما الذي يجعل التقييم مفيدًا؟')}</h2><p>{t('Mention the project, your experience during the work, and the result you personally observed. There is no need to claim sales or speed improvements you have not measured.','اذكر المشروع وتجربتك أثناء التنفيذ والنتيجة التي لاحظتها بنفسك. لا تحتاج لذكر تحسّن في المبيعات أو السرعة لم تقسه.')}</p><p>{t('Your feedback is valuable even if you prefer to keep it private.','ملاحظاتك مهمة حتى لو فضّلت أن تظل خاصة.')}</p></aside></section>'''

def testimonials(ar=False):
    path=ROOT/'approved-reviews.json'
    items=json.loads(path.read_text(encoding='utf-8')) if path.exists() else []
    items=[x for x in items if x.get('approved') and x.get('permission') in ('named','anonymous')]
    if not items:return ''
    cards=''
    for x in items:
        quote=x.get('quote_ar') if ar else x.get('quote_en')
        if not quote:continue
        name=('عميل' if ar else 'Client') if x['permission']=='anonymous' else x['name']
        role='' if x['permission']=='anonymous' else x.get('role','')
        cards+=f'<figure><blockquote>{esc(quote)}</blockquote><figcaption>{esc(name)}<span>{esc(role)}</span></figcaption></figure>'
    return f'<section class="wrap section"><h2>{"تجارب العملاء" if ar else "Client experiences"}</h2><div class="testimonial-grid">{cards}</div></section>' if cards else ''
