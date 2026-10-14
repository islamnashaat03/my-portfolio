"""Fixed EGP service prices and clearly separated first-year WordPress bundles."""
PRICES={'business-website':12000,'landing-page':3500,'woocommerce-store':16000,'salla-store':10500,'zid-store':10500,'shopify-store':16000,'salla-customization':2500,'figma-to-wordpress':4500,'website-redesign':6000,'plugin-development':8000,'multilingual-websites':5500,'speed-optimization':4500,'wordpress-fixes':2000,'migration-backup':2500,'maintenance':2500,'integrations':4000,'hosting-domain':5000}
HOSTING=5000
BUNDLE_DISCOUNT=2000
BUNDLE_SERVICES={'business-website','landing-page','woocommerce-store'}

def money(amount, ar=False):
    return f'{amount:,} '+('ج.م' if ar else 'EGP')

def bundle_block(service, ar=False, prefix=''):
    if service not in BUNDLE_SERVICES:return ''
    price=PRICES[service]
    title={'business-website':('Business website','موقع تعريفي'),'landing-page':('Landing page','صفحة هبوط'),'woocommerce-store':('WordPress store','متجر ووردبريس')}[service][int(ar)]
    t=lambda en,arab:arab if ar else en
    return f'''<aside class="bundle-pricing"><h3>{title}</h3><dl><div><dt>{t('Build only','التنفيذ فقط')}</dt><dd>{money(price,ar)}</dd></div><div><dt>{t('Hosting + standard domain','استضافة + دومين')} <small>{t('(standard)','(عادي)')}</small><span>{t('First year','لأول سنة')}</span></dt><dd>{money(HOSTING,ar)}</dd></div><div class="bundle-total"><dt>{t('Together from','الباقة معًا من')}</dt><dd>{money(price+HOSTING-BUNDLE_DISCOUNT,ar)}</dd></div></dl><p>{t('Save','وفّر')} {money(BUNDLE_DISCOUNT,ar)}. {t('One website, standard domain and first-year hosting. Premium domains and paid licenses are quoted separately.','لموقع واحد، وتشمل دومينًا عاديًا واستضافة أول سنة. الدومينات مرتفعة السعر والتراخيص المدفوعة تُسعّر منفصلة.')}</p><a class="text-link" href="{prefix}{'index.html' if ar else 'en.html'}?service={service}&amp;package=bundle#contact">{t('Choose this bundle','اختار الباقة')}</a></aside>'''
