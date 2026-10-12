"""Purpose-specific presentation for the career portfolio and services website.

Uses only the standard library; existing project facts and USD starting prices
are supplied by the builder rather than duplicated here.
"""
from html import escape
import json
import re
from urllib.parse import urlencode

E = lambda value: escape(str(value), quote=True)


def element_at(text, start, tag):
    depth = 0
    for match in re.finditer(r'</?' + tag + r'\b[^>]*>', text[start:]):
        depth += -1 if match.group().startswith('</') else 1
        if depth == 0:
            return text[start:start + match.end()]
    raise ValueError(f'Unclosed {tag}')


def section(text, section_id):
    match = re.search(r'<section\b[^>]*\bid="' + re.escape(section_id) + r'"[^>]*>', text)
    return element_at(text, match.start(), 'section') if match else ''


def quote_url(prefix, service='', template='', approach='custom'):
    query = urlencode({key: value for key, value in {
        'service': service, 'template': template, 'approach': approach
    }.items() if value})
    return f'{prefix}index.html?{E(query)}#contact'


def contact(ar, services, career=False):
    t = lambda en, arab: arab if ar else en
    heading = t('Let’s discuss<br>your next hire.', 'نتكلم عن<br>فرصة العمل.') if career else t('Tell me about<br>your project.', 'نتكلم عن<br>مشروعك.')
    intro = t('Looking for a WordPress developer or a team lead? Share the role, your team, and the work you need help with.', 'تبحث عن مطوّر ووردبريس أو قائد فريق؟ أرسل تفاصيل الوظيفة والفريق وطبيعة العمل.') if career else t('Choose a service, a starting design, or a custom build. I’ll review your requirements and reply with the scope and quote.', 'اختار الخدمة ونموذجًا للتخصيص أو تنفيذًا خاصًا. هراجع متطلباتك وأرد عليك بالنطاق وعرض السعر.')
    extra = ''
    if career:
        extra = f'<label>{t("Company / team (optional)", "الشركة / الفريق (اختياري)")}<input name="company" maxlength="150" autocomplete="organization"></label>'
        message = t('Role, team and what you’d like to discuss', 'تفاصيل الوظيفة والفريق وما تحب نناقشه')
    else:
        options = ''.join(f'<option value="{E(s[0])}" data-starting-price="{s[3]}">{E(s[1][int(ar)])}</option>' for s in services)
        extra = f'''<div class="form-row"><label>{t('Service', 'الخدمة')}<select name="service" id="quote-service" required><option value="">{t('Choose a service', 'اختار الخدمة')}</option>{options}</select></label><label>{t('Starting point', 'طريقة التنفيذ')}<select name="approach" id="quote-approach"><option value="custom">{t('A custom build for my business', 'تنفيذ خاص لنشاطي')}</option><option value="template">{t('Customize a previous-work template', 'تخصيص نموذج من الأعمال السابقة')}</option><option value="advice">{t('Help me choose', 'ساعدني أختار')}</option></select></label></div><label>{t('Selected template (optional)', 'النموذج المختار (اختياري)')}<input name="template" id="quote-template" maxlength="150" placeholder="{t('Choose from a service’s templates or leave blank', 'اختار نموذجًا من صفحة الخدمة أو اتركه فارغًا')}"></label><p id="quote-summary" class="quote-summary" role="status" aria-live="polite">{t('Select a service to see its starting price.', 'اختار الخدمة لعرض سعرها المبدئي.')}</p>'''
        message = t('Your business, pages and features', 'نشاطك والصفحات والخصائص المطلوبة')
    return f'''<section id="contact" class="contact"><div class="wrap contact-layout"><div><h2>{heading}</h2><p>{intro}</p><p>{t('Available for full-time, part-time and remote opportunities.', 'متاح لفرص العمل بدوام كامل أو جزئي وعن بُعد.') if career else t('Starting prices are in USD. The final scope and timeline are agreed before work begins.', 'الأسعار المبدئية بالدولار. نتفق على النطاق والمدة قبل بدء التنفيذ.')}</p><a class="email-link" href="mailto:islamnashaat03@gmail.com" dir="ltr">islamnashaat03@gmail.com</a><div class="contact-links"><a href="https://wa.me/201558631631" target="_blank" rel="noopener">WhatsApp</a><a href="https://www.linkedin.com/in/islam-nashaat03/" target="_blank" rel="noopener">LinkedIn</a></div></div><form id="contact-form" action="https://formspree.io/f/xwlpaegk" method="POST"><div class="form-row"><label>{t('Your name', 'اسمك')}<input name="name" autocomplete="name" required maxlength="100"></label><label>{t('Email address', 'البريد الإلكتروني')}<input name="email" type="email" autocomplete="email" required maxlength="254" dir="ltr"></label></div>{extra}<label>{message}<textarea name="message" rows="5" required minlength="10" maxlength="5000"></textarea></label><div class="honeypot" aria-hidden="true"><label>Leave empty<input name="_gotcha" tabindex="-1" autocomplete="off"></label></div><input type="hidden" name="_subject" value="Islam Nashaat — {'Career opportunity' if career else 'Project quote request'}"><input type="hidden" name="form_type" value="{'career_enquiry' if career else 'service_quote'}"><button class="button light" type="submit">{t('Send opportunity', 'إرسال فرصة العمل') if career else t('Request a quote', 'اطلب عرض سعر')}</button><p class="form-note">{t('Your details are used to reply to your enquiry. Please don’t include passwords or sensitive information.', 'تُستخدم بياناتك للرد على طلبك. لا تكتب كلمات مرور أو معلومات حساسة.')}</p><p id="form-status" role="status" aria-live="polite"></p></form></div></section>'''


def career_project(project, cases, ar):
    t = lambda en, arab: arab if ar else en
    i = int(ar)
    p, c = project, cases.get(project['slug'])
    prefix = '../' if ar else ''
    details = ''
    if c:
        details = f'<p><strong>{t("My role", "دوري")}:</strong> {E(c["role"][i])}</p><p><strong>{t("Delivery context", "سياق التنفيذ")}:</strong> {E(c["time"][i])}</p>'
        details += ''.join(f'<h4>{E(item[1] if ar else item[0])}</h4><p>{E(item[3] if ar else item[2])}</p>' for item in c['sections'])
    else:
        details = f'<p>{E(p["summary"][i])}</p><p>{t("The preview and live link show the delivered project. Detailed delivery timings are not documented for this earlier work.", "تعرض المعاينة والرابط المشروع المسلّم. لا تتوفر تفاصيل موثّقة عن مدة تنفيذ هذا العمل السابق.")}</p>'
    details += f'<p class="project-tools" dir="ltr">{E(" · ".join(p["tags"]))}</p>'
    return f'''<article id="project-{E(p['slug'])}" class="project filter-project" data-category="{E(p['category'])}{' selected' if c else ''}"><a class="project-preview" href="{E(p['links'][0])}" target="_blank" rel="noopener" aria-label="{E(p['name'])} — {t('view live project', 'زيارة المشروع')}"><img src="{prefix}{E(p['image'])}" alt="{E(p['name'])}" width="900" height="520" loading="lazy" decoding="async"></a><div class="project-caption"><div><p class="project-type">{E(' / '.join(p['tags'][:2]))}</p><h3>{E(p['name'])}</h3></div></div><p class="project-summary">{E(p['summary'][i])}</p>{f'<p class="project-role">{E(c["role"][i])}</p>' if c else ''}<details class="project-case"><summary>{t('My role & implementation', 'دوري وتفاصيل التنفيذ')}</summary><div>{details}<a class="text-link" href="{E(p['links'][0])}" target="_blank" rel="noopener">{t('View live project', 'زيارة المشروع')}</a></div></details></article>'''


def career_home(original, ar, projects, recent, cases, services):
    t = lambda en, arab: arab if ar else en
    prefix = '../' if ar else ''
    hero = f'''<section class="hero"><div class="hero-content wrap"><div class="hero-main"><h1>{t('Islam Nashaat', 'إسلام نشأت')}</h1><h2>{t('Senior Web Developer', 'مطوّر ويب بخبرة واسعة')}<span class="hero-specialty">{t('WordPress & Frontend Expert', 'خبير ووردبريس والواجهات الأمامية')}</span></h2><p class="hero-intro">{t('5+ years building WordPress websites, ecommerce stores and custom solutions. Former WordPress team lead, with hands-on frontend development and agency delivery experience.', 'أكثر من ٥ سنوات في تطوير مواقع ووردبريس والمتاجر والحلول المخصّصة. خبرة في قيادة فريق ووردبريس، وتطوير الواجهات الأمامية وتنفيذ مشاريع الوكالات.')}</p><div class="actions"><a class="button" href="{prefix}files/Islam-Nashaat-CV.pdf" download>{t('Download CV', 'تحميل السيرة الذاتية')}</a><a class="button secondary" href="#work">{t('View projects', 'شاهد المشاريع')}</a><a class="quote-link" href="#contact">{t('Discuss a role', 'نتكلم عن فرصة عمل')}</a></div><p class="availability">{t('Available for full-time, part-time and remote opportunities.', 'متاح لفرص العمل بدوام كامل أو جزئي وعن بُعد.')}</p></div><div class="stats hero-stats">'''
    hero += ''.join(f'<div><strong dir="ltr">{value}</strong><span>{t(en, arab)}</span></div>' for value,en,arab in [('5+','years of experience','سنوات خبرة'),('50+','websites & stores delivered at AAIT','موقع ومتجر تم تسليمه في AAIT'),('20+','client websites maintained at AAIT','موقع عميل تولّيت صيانته في AAIT')])
    hero += '</div></div></section>'
    filters = [('selected','Selected work','أعمال مختارة'),('all','All projects','كل المشاريع'),('wordpress','WordPress','ووردبريس'),('ecommerce','Ecommerce','متاجر'),('plugin-development','Plugins','إضافات'),('frontend','Frontend','واجهات أمامية'),('salla','Salla','سلة')]
    work = f'<section id="work" class="section wrap career-work"><div class="section-head"><div><h2>{t("Projects & contributions", "المشاريع ودوري في التنفيذ")}</h2><p>{t("Explore the work, my contribution and the technical decisions behind it.", "شاهد المشاريع ودوري فيها والقرارات التقنية وراء التنفيذ.")}</p></div><a class="text-link" href="#experience">{t("View experience", "شاهد الخبرة")}</a></div><div class="filters" role="group" aria-label="{t("Project categories", "تصنيفات المشاريع")}">'+''.join(f'<button type="button" data-filter="{key}" aria-pressed="{str(key == "selected").lower()}">{t(en,arab)}</button>' for key,en,arab in filters)+'</div><p id="project-count" class="muted" aria-live="polite"></p><div class="project-grid career-grid">'
    ordered = recent + [p for p in projects if p not in recent]
    work += ''.join(career_project(p,cases,ar) for p in ordered) + '</div></section>'
    impact = f'''<section id="impact" class="section wrap"><div class="section-head"><div><h2>{t('Measured technical results', 'نتائج تقنية موثّقة')}</h2><p>{t('Performance work backed by original lab reports.', 'تحسينات أداء تدعمها تقارير القياس الأصلية.')}</p></div></div><div class="impact-rows"><article><h3>{t('ESDF website performance', 'تحسين أداء موقع ESDF')}</h3><p>{t('Mobile: 75 → 98. LCP: 5.4 → 1.8 seconds. Responsive images, reduced render-blocking CSS and deferred below-the-fold images.', 'الموبايل: 75 ← 98. وقت ظهور أكبر محتوى: 5.4 ← 1.8 ثانية. تحسين الصور المتجاوبة وCSS الذي يؤخر العرض وتحميل الصور أسفل الصفحة.')}</p><a class="text-link" href="https://pagespeed.web.dev/analysis/https-esdf-eg-com-home/acsfijfyyi?form_factor=mobile" target="_blank" rel="noopener">{t('Original report', 'التقرير الأصلي')}</a></article><article><h3>{t('Portfolio performance', 'تحسين أداء البورتفليو')}</h3><p>{t('Mobile: 76 → 100. LCP: 4.7 → 0.9 seconds. Self-hosted fonts, compressed assets and fewer render-blocking requests.', 'الموبايل: 76 ← 100. وقت ظهور أكبر محتوى: 4.7 ← 0.9 ثانية. استضافة الخطوط محليًا وضغط الملفات وتقليل الطلبات التي تؤخر العرض.')}</p><a class="text-link" href="https://pagespeed.web.dev/analysis/https-islamnashaat03-github-io-my-portfolio/0bbamicop0?form_factor=mobile" target="_blank" rel="noopener">{t('Original report', 'التقرير الأصلي')}</a></article></div><p class="muted">{t('Recorded lab tests from 8–9 October 2026, before this portfolio restructure. Results vary between runs and are not real-user measurements.', 'اختبارات معملية موثّقة بتاريخ ٨–٩ أكتوبر ٢٠٢٦، قبل إعادة تقسيم البورتفليو. تختلف النتائج بين التشغيلات، وهذه ليست قياسات مستخدمين فعلية.')}</p></section>'''
    return hero + work + section(original,'about') + section(original,'experience') + impact + contact(ar,services,True)


def service_areas(ar, by_slug):
    t = lambda en, arab: arab if ar else en
    prefix = '../' if ar else ''
    areas = [
        ('stores','Online stores','المتاجر الإلكترونية','WooCommerce from $300 · Salla from $200','ووكومرس من 300$ · سلة من 200$','Product catalogs, checkout and a storefront adapted to your brand.','كتالوج منتجات وخطوات شراء وواجهة متجر مناسبة لهويتك.','new-concept','services/stores.html'),
        ('business','Business websites','المواقع التعريفية','From $225','من 225$','Present your business, services and contact channels clearly.','اعرض نشاطك وخدماتك ووسائل التواصل بشكل واضح.','menarat-ebdaa','services/business-website.html'),
        ('landing','Landing pages','صفحات الهبوط','From $65','من 65$','One offer, a focused message and a clear contact action.','عرض واحد ورسالة مركّزة وخطوة واضحة للتواصل.','dr-elias-filimban','services/landing-page.html')
    ]
    content = f'<section id="work" class="section wrap work-areas"><div class="section-head"><div><h2>{t("Find your starting point", "مجالات الأعمال")}</h2><p>{t("Choose your website type, explore previous-work templates, then customize one or request your own build.", "اختار نوع موقعك، وشاهد نماذج من الأعمال السابقة، ثم خصّص نموذجًا أو اطلب تنفيذًا خاصًا.")}</p></div></div><div class="area-list">'
    for key,en,arab,price_en,price_ar,desc_en,desc_ar,example,link in areas:
        p = by_slug[example]
        content += f'<article class="area-item"><a class="area-preview" href="{link}" aria-label="{t(en,arab)}"><img src="{prefix}{E(p["image"])}" alt="{E(p["name"])} — {t("previous work example", "نموذج من تنفيذ سابق")}" width="900" height="520" loading="lazy" decoding="async"></a><div class="area-content"><h3><a href="{link}">{t(en,arab)}</a></h3><p class="area-price" dir="{t("ltr","rtl")}">{t(price_en,price_ar)}</p><p>{t(desc_en,desc_ar)}</p><a class="button secondary" href="{link}">{t("Explore templates & scope", "شاهد النماذج ونطاق الخدمة")}</a></div></article>'
    return content+'</div><p class="pricing-note">'+t('Starting prices are in USD for the published scope. Hosting, paid themes/plugins and platform fees are separate.','الأسعار المبدئية بالدولار للنطاق الموضّح. الاستضافة والقوالب والإضافات المدفوعة ورسوم المنصات منفصلة.')+'</p></section>'


def services_home(original, ar, projects, services):
    t = lambda en, arab: arab if ar else en
    by_slug = {p['slug']:p for p in projects}
    hero = f'''<section class="hero"><div class="hero-content wrap"><div class="hero-main"><h1>{t('Websites & stores.<br>Built around you.', 'موقع يناسب نشاطك.<br>ويعبّر عنك.')}</h1><h2>{t('Islam Nashaat', 'إسلام نشأت')}<span class="hero-specialty">{t('WordPress & Frontend Developer', 'مطوّر ووردبريس وواجهات أمامية')}</span></h2><p class="hero-intro">{t('Business websites, WooCommerce and Salla stores, and landing pages. Start with a previous-work template or choose a custom build for your business.', 'مواقع تعريفية ومتاجر ووكومرس وسلة وصفحات هبوط. ابدأ بنموذج من أعمالي السابقة أو اختار تنفيذًا خاصًا لنشاطك.')}</p><div class="actions"><a class="button" href="#contact">{t('Request a quote', 'اطلب عرض سعر')}</a><a class="button secondary" href="#work">{t('Explore services & templates', 'شاهد الخدمات والنماذج')}</a></div><p class="availability">{t('Clear starting prices. A scope agreed together. A website made for your business.', 'أسعار مبدئية واضحة. نطاق نتفق عليه معًا. وموقع مناسب لنشاطك.')}</p></div><div class="stats hero-stats price-starts">'''
    hero += ''.join(f'<a href="services/{slug}.html"><strong dir="ltr">${price}</strong><span>{t(en,arab)}</span></a>' for slug,price,en,arab in [('landing-page',65,'Landing pages from','صفحات هبوط تبدأ من'),('business-website',225,'Business websites from','مواقع تعريفية تبدأ من'),('stores',200,'Online stores from','متاجر تبدأ من')])
    hero += '</div></div></section>'
    prices = f'<section id="services" class="section wrap home-pricing"><div class="section-head"><div><h2>{t("Services & starting prices", "الخدمات والأسعار المبدئية")}</h2><p>{t("Build a new website or improve the one you already have.", "ابنِ موقعًا جديدًا أو طوّر موقعك الحالي.")}</p></div><a class="text-link" href="services/index.html">{t("Compare scopes", "قارن نطاق الخدمات")}</a></div><div class="price-list">'
    for slug,title,desc,cost,scope,examples in services:
        prices += f'<a class="price-item" href="services/{slug}.html"><span><strong>{E(title[int(ar)])}</strong><span>{E(desc[int(ar)])}</span></span><span class="price-value">{t("From", "من")} <strong dir="ltr">${cost}</strong>{t(" / month", " / شهر") if slug=="maintenance" else ""}</span></a>'
    prices += '</div><p class="pricing-note">'+t('The final quote depends on your requirements. Extra pages, larger catalogs and custom functionality are scoped before work begins.','عرض السعر النهائي حسب متطلباتك. نتفق على الصفحات الإضافية والكتالوجات الأكبر والوظائف المخصّصة قبل بدء التنفيذ.')+'</p></section>'
    about = f'''<section id="about" class="section wrap service-about"><div><h2>{t('One developer.<br>From idea to launch.', 'مطوّر واحد.<br>من الفكرة للإطلاق.')}</h2><p>{t('I’m Islam Nashaat, a web developer with 5+ years of WordPress, ecommerce and frontend experience. I work remotely with businesses and agencies on Arabic and English websites.', 'أنا إسلام نشأت، مطوّر ويب بخبرة أكثر من ٥ سنوات في ووردبريس والمتاجر والواجهات الأمامية. أعمل عن بُعد مع الأنشطة والوكالات على مواقع بالعربية والإنجليزية.')}</p></div><div><h3>{t('Built around your business', 'تنفيذ يناسب نشاطك')}</h3><p>{t('Responsive implementation, manageable content, payment and API integrations, multilingual setup and performance work—according to your agreed scope.', 'تنفيذ متجاوب ومحتوى يمكنك إدارته وربط الدفع والأنظمة وتعدد اللغات وتحسين الأداء، حسب نطاق العمل المتفق عليه.')}</p><a class="text-link" href="#contact">{t('Tell me what you need', 'احكي لي ما تحتاجه')}</a></div></section>'''
    process = f'<section id="process" class="section wrap"><div class="section-head"><h2>{t("How we work together", "كيف نعمل معًا؟")}</h2></div><ol class="build-process">'+''.join(f'<li><h3>{t(en,arab)}</h3><p>{t(desc_en,desc_ar)}</p></li>' for en,arab,desc_en,desc_ar in [('Choose a starting point','نختار البداية','Select a service and template, or describe the custom website you want.','اختار الخدمة والنموذج أو وضّح الموقع الخاص الذي تحتاجه.'),('Agree & build','نتفق وننفّذ','We confirm the scope, quote and timeline. I build and share the work for review.','نتفق على النطاق والسعر والمدة، ثم أنفّذ وأشاركك العمل للمراجعة.'),('Review & launch','نراجع ونطلق','We finish the agreed adjustments, check the result and prepare the handover.','نكمل التعديلات المتفق عليها، ونراجع النتيجة ونجهّز التسليم.')])+'</ol></section>'
    return hero+service_areas(ar,by_slug)+prices+about+process+contact(ar,services)


def template_gallery(service_id, projects, services, ar, prefix='../'):
    t = lambda en, arab: arab if ar else en
    by_slug = {p['slug']:p for p in projects}
    service = next((s for s in services if s[0] == service_id),None)
    custom_examples = {
        'stores':['new-concept','miss-natural','the-fitnest','muhak-store'],
        'websites':['legal-pillars-law','menarat-ebdaa','alpha-food-machinery','enjaz-lines'],
        'business-website':['legal-pillars-law','menarat-ebdaa','alpha-food-machinery','enjaz-lines'],
        'landing-page':['dr-elias-filimban'],
        'woocommerce-store':['new-concept','miss-natural','the-fitnest'],
        'salla-store':['muhak-store']
    }
    group_services = {'websites':'business-website', 'stores':'woocommerce-store', 'design-implementation':'figma-to-wordpress', 'custom-solutions':'plugin-development', 'performance-fixes':'speed-optimization', 'website-care':'maintenance'}
    quote_service = group_services.get(service_id, service_id)
    representative = next((s for s in services if s[0] == quote_service), None)
    examples = custom_examples.get(service_id, (service or representative)[5] if service or representative else [])
    body = f'<section id="templates" class="section wrap template-section"><div class="section-head"><div><h2>{t("Templates from previous work", "نماذج من الأعمال السابقة") if examples else t("A solution for your website", "حل يناسب موقعك")}</h2><p>{t("Choose a previous-work design as a starting point. It will be prepared with your content, branding and agreed features.", "اختار نموذجًا من تنفيذ سابق كنقطة بداية، ويُجهّز لمشروعك بمحتواك وهويتك والخصائص المتفق عليها.") if examples else t("Tell me about your website and requirements so we can agree on the right scope.", "احكي لي عن موقعك ومتطلباتك لنتفق على النطاق المناسب.")}</p></div></div>'
    if examples:
        body += '<div class="project-grid template-grid">'
        for slug in examples:
            p = by_slug[slug]
            actual_service = 'salla-store' if service_id == 'stores' and slug == 'muhak-store' else quote_service
            price = next(s[3] for s in services if s[0] == actual_service)
            body += f'<article class="project template-card"><a class="project-preview" href="{E(p["links"][0])}" target="_blank" rel="noopener" aria-label="{E(p["name"])} — {t("preview", "معاينة")}"><img src="{prefix}{E(p["image"])}" alt="{E(p["name"])}" width="900" height="520" loading="lazy" decoding="async"></a><div class="project-caption"><div><p class="project-type">{E(" / ".join(p["tags"][:2]))}</p><h3>{E(p["name"])}</h3></div></div><p class="template-price">{t("Service starts from", "الخدمة تبدأ من")} <strong dir="ltr">${price}</strong></p><div class="template-actions"><a class="text-link" href="{E(p["links"][0])}" target="_blank" rel="noopener">{t("Preview", "معاينة")}</a><a class="button secondary" href="{quote_url(prefix,actual_service,p['name'],'template')}">{t("Customize this template", "خصّص هذا النموذج")}</a></div></article>'
        body += '</div>'
    body += f'<aside class="custom-build"><div><h3>{t("Want something of your own?", "تريد تصميمًا خاصًا بك؟")}</h3><p>{t("Share your brand, ideas or an approved design. We’ll define a custom build around your requirements.", "شارك هويتك وأفكارك أو تصميمًا معتمدًا، ونحدّد تنفيذًا خاصًا حسب احتياجاتك.")}</p></div><a class="button" href="{quote_url(prefix,quote_service,approach='custom')}">{t("Request a custom build", "اطلب تنفيذًا خاصًا")}</a></aside></section>'
    return body


def adapt_home(original, profile, ar, projects, recent, cases, services):
    return career_home(original,ar,projects,recent,cases,services) if profile == 'career' else services_home(original,ar,projects,services)


def redirect_page(path, ar, base):
    prefix = '../'*path.count('/')
    fragment = 'skills' if path.startswith('services/') else 'impact' if path == 'performance.html' else 'contact' if path == 'review.html' else 'work'
    if path.startswith('projects/') and path != 'projects/index.html':
        fragment = 'project-'+path.rsplit('/',1)[1].removesuffix('.html')
    target = prefix+'index.html#'+fragment
    canonical = base+('ar/' if ar else '')+'index.html'
    title = 'الانتقال إلى البورتفليو' if ar else 'Continue to the portfolio'
    return f'<!doctype html><html lang="{"ar" if ar else "en"}" dir="{"rtl" if ar else "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url={E(target)}"><link rel="canonical" href="{canonical}"><title>{title} — Islam Nashaat</title></head><body><main><h1>{title}</h1><p><a href="{E(target)}">{title}</a></p></main></body></html>'


def adapt_page(page, profile, path, ar, projects, services):
    t = lambda en, arab: arab if ar else en
    prefix = '../'*path.count('/')
    items = [('work',t('Projects','المشاريع')),('skills',t('Skills','المهارات')),('experience',t('Experience','الخبرة')),('about',t('About','عنّي')),('contact',t('Discuss a role','فرصة عمل'))] if profile=='career' else [('work',t('Website types','مجالات الأعمال')),('services',t('Services & prices','الخدمات والأسعار')),('process',t('How it works','طريقة العمل')),('about',t('About','عنّي')),('contact',t('Request a quote','اطلب عرض سعر'))]
    other = ('../' if ar else 'ar/')+'index.html' if profile=='career' else ('../../' if ar and path.count('/') else '../' if ar else '../'*path.count('/')+'ar/')+path
    nav = ''.join(f'<a href="{prefix}index.html#{key}"'+(f' class="nav-contact" data-menu-cta="{E(label)}"' if key=='contact' else '')+f'>{label}</a>' for key,label in items)
    nav += f'<a class="language" lang="{"en" if ar else "ar"}" href="{other}">{"English" if ar else "العربية"}</a>'
    page = re.sub(r'(<nav id="navigation"[^>]*>).*?</nav>',lambda m:m[1]+nav+'</nav>',page,flags=re.S)
    page = page.replace('<body class="', '<body class="'+('career-site ' if profile=='career' else 'services-site '),1)
    if profile != 'career':
        page = re.sub(r'<a class="footer-cv"[^>]*>.*?</a>',f'<a class="footer-cv" href="{prefix}index.html#contact">{t("Request a quote","اطلب عرض سعر")}</a>',page,flags=re.S)
        # Replace any remaining career download action with the quote form.
        page = re.sub(r'<a\b[^>]*\bhref="[^"]*files/Islam-Nashaat-CV.pdf"[^>]*>.*?</a>',f'<a class="button secondary" href="{prefix}index.html#contact">{t("Request a quote","اطلب عرض سعر")}</a>',page,flags=re.S)
        if path.startswith('services/') and path != 'services/index.html':
            sid = path.rsplit('/',1)[1].removesuffix('.html')
            page = re.sub(r'<a class="button" href="https://wa.me/[^\"]*"[^>]*>.*?</a>',f'<a class="button" href="{quote_url(prefix,sid,approach="custom")}">{t("Request this service","اطلب هذه الخدمة")}</a>',page,count=1,flags=re.S)
            heading = '<h2>'+t('Related work','أعمال مرتبطة')+'</h2>'
            position = page.find(heading)
            if position >= 0:
                start = page.rfind('<section',0,position)
                old = element_at(page,start,'section')
                page = page[:start]+template_gallery(sid,projects,services,ar,('../' if ar else '')+prefix)+page[start+len(old):]
                # Quote links navigate within the language, not to the site root.
                page = page.replace(quote_url(('../' if ar else '')+prefix,sid,approach='custom'),quote_url(prefix,sid,approach='custom'))
            else:
                gallery = template_gallery(sid,projects,services,ar,('../' if ar else '')+prefix)
                # Separate image paths (site assets) from same-language quote links.
                gallery = gallery.replace(('href="'+('../' if ar else '')+prefix+'index.html?'),('href="'+prefix+'index.html?'))
                page = page.replace('<section class="cta-band">',gallery+'<section class="cta-band">',1)
            # For galleries replacing related work, fix all same-language form links.
            page = page.replace('href="'+('../' if ar else '')+prefix+'index.html?', 'href="'+prefix+'index.html?')
    if path=='index.html':
        title = t('Senior Web Developer | Career portfolio','مطوّر ويب | بورتفليو التوظيف') if profile=='career' else t('Websites, stores & web development services','مواقع ومتاجر وخدمات تطوير الويب')
        desc = t('Islam Nashaat — Senior Web Developer and WordPress & Frontend expert. Explore projects, technical skills, leadership experience and CV.','إسلام نشأت، مطوّر ويب وخبير ووردبريس وواجهات أمامية. المشاريع والمهارات والخبرة في قيادة الفريق والسيرة الذاتية.') if profile=='career' else t('Business websites, WooCommerce and Salla stores, landing pages and custom web services by Islam Nashaat. Explore templates and USD starting prices.','مواقع تعريفية ومتاجر ووكومرس وسلة وصفحات هبوط وخدمات ويب مخصّصة من إسلام نشأت. شاهد النماذج والأسعار المبدئية بالدولار.')
        page = re.sub(r'<title>.*?</title>',f'<title>{E(title)} — Islam Nashaat</title>',page,count=1)
        page = re.sub(r'(<meta (?:name="description"|property="og:description") content=")[^"]*',lambda m:m[1]+E(desc),page)
        page = re.sub(r'(<meta property="og:title" content=")[^"]*',lambda m:m[1]+E(title)+' — Islam Nashaat',page)
    return page
