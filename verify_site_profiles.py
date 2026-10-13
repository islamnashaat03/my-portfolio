"""Check the public contract of the independent websites, not their templates."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs
import json
import re
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent
career = "SITE_PROFILE = 'career'" in (root/'build_portfolio.py').read_text(encoding='utf-8')

class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.nodes=[]
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag,dict(attrs)))

homepages=[]
allowed_services=set()
for locale in ['', 'ar/']:
    text=(root/(locale+'index.html')).read_text(encoding='utf-8')
    doc=Document(text)
    homepages.append(doc)
    ids={a.get('id') for tag,a in doc.nodes}
    anchors=[a for tag,a in doc.nodes if tag=='a']
    assert {'work','about','contact'} <= ids
    assert sum(tag=='h1' for tag,a in doc.nodes)==1
    if career:
        assert {'skills','experience','impact'} <= ids
        assert sum(tag=='article' and a.get('id','').startswith('project-') for tag,a in doc.nodes)==25
        assert any('download' in a for a in anchors)
        assert not any('services/' in a.get('href','') for a in anchors)
        assert not re.search(r'\$\d+',text)
        assert any(a.get('value')=='career_enquiry' for tag,a in doc.nodes if tag=='input')
    else:
        assert {'services','process','quote-service','quote-template','quote-approach'} <= ids
        assert not any('download' in a or a.get('href','').endswith('CV.pdf') for a in anchors)
        assert sum('area-item' in a.get('class','').split() for tag,a in doc.nodes)==3
        assert sum('price-item' in a.get('class','').split() for tag,a in doc.nodes)==14
        allowed_services.update(a['value'] for tag,a in doc.nodes if tag=='option' and a.get('data-starting-price'))
        assert len(allowed_services)==14

paths=[root/'index.html',root/'review.html',root/'performance.html',*sorted((root/'projects').glob('*.html')),*sorted((root/'services').glob('*.html')),*sorted((root/'ar').rglob('*.html'))]
quote_links=0
for page in paths:
    text=page.read_text(encoding='utf-8')
    doc=Document(text)
    if career and page.name!='index.html' or career and page.parent.name in ('projects','services'):
        assert any(tag=='meta' and a.get('name')=='robots' and a.get('content')=='noindex,follow' for tag,a in doc.nodes),str(page)
        assert any(tag=='meta' and a.get('http-equiv')=='refresh' for tag,a in doc.nodes),str(page)
        assert not re.search(r'\$\d+',text),str(page)
    if not career:
        for tag,a in doc.nodes:
            if tag!='a':continue
            assert 'download' not in a and not a.get('href','').endswith('CV.pdf'),str(page)
            parsed=urlparse(a.get('href',''))
            params=parse_qs(parsed.query)
            if params.get('approach') and params.get('service'):
                assert params['service'][0] in allowed_services,(str(page),params)
                assert parsed.fragment=='contact',(str(page),params)
                if params['approach']==['template']:
                    assert params.get('template'),str(page)
                    quote_links+=1

locations=[node.text for node in ET.parse(root/'sitemap.xml').getroot().iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(locations)==(2 if career else 98)
if not career:assert quote_links>=20
print(json.dumps({'profile':'career' if career else 'services','pages':len(paths),'sitemap_urls':len(locations),'valid_template_quote_links':quote_links,'passed':True},indent=2))
