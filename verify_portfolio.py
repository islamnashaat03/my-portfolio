from pathlib import Path
from urllib.parse import urlparse,unquote
from html.parser import HTMLParser
import json
root=Path(__file__).parent.resolve()
class Links(HTMLParser):
    def __init__(self):super().__init__();self.urls=[];self.ids=[];self.h1=0;self.lang=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        for k in ['href','src']:
            if k in a:self.urls.append(a[k])
        if 'id' in a:self.ids.append(a['id'])
        if tag=='h1':self.h1+=1
        if tag=='html':self.lang=a.get('lang')
pages=[root/'index.html',root/'review.html',root/'performance.html',*list((root/'projects').glob('*.html')),*list((root/'services').glob('*.html')),*list((root/'ar').rglob('*.html'))]
errors=[]
for p in pages:
    h=Links();h.feed(p.read_text(encoding='utf-8'))
    if h.h1!=1:errors.append((str(p),f'H1 count {h.h1}'))
    if len(h.ids)!=len(set(h.ids)):errors.append((str(p),'Duplicate IDs'))
    for u in h.urls:
        parsed=urlparse(u)
        if parsed.scheme:continue
        target=(p.parent/unquote(parsed.path)).resolve() if parsed.path else p
        if not target.exists():errors.append((str(p.relative_to(root)),u))
        elif parsed.fragment and target.suffix=='.html':
            t=Links();t.feed(target.read_text(encoding='utf-8'))
            if parsed.fragment not in t.ids:errors.append((str(p.relative_to(root)),f'Missing anchor {u}'))
print(json.dumps({'pages':len(pages),'errors':errors},indent=2))
assert not errors
