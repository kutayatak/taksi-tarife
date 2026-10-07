// Development-only browser verification for the mobile PWA workflow.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = resolve(new URL('..', import.meta.url).pathname);
let updateAvailable = false, requests = [];
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server = createServer(async (req, res) => {
  const path = new URL(req.url,'http://localhost').pathname; requests.push(path);
  let relative = decodeURIComponent(path).replace(/^\/taksi-tarife\//,'/');
  if (relative.endsWith('/')) relative += 'index.html';
  const file = resolve(root,'.'+relative);
  try {
    if (!file.startsWith(root+sep)) throw Error();
    let data = await readFile(file);
    if (updateAvailable && file.endsWith('service-worker.js')) data = Buffer.from(data.toString().replace("'v1.5.0'","'v1.5.1-test'"));
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
  for (const prefix of ['/', '/taksi-tarife/']) {
    updateAvailable=false; requests=[];
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,acceptDownloads:true,permissions:['geolocation'],geolocation:{latitude:35.129723,longitude:33.9285231}});
    const page=await context.newPage(), errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+prefix); await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await page.waitForFunction(()=>document.querySelector('#gps-message').textContent.includes('ÇEMBER')&&!document.querySelector('#locate').disabled);
    assert.match(await page.locator('#gps-message').innerText(),/ÇEMBER/);
    await page.locator('#locate').click(); await page.waitForFunction(()=>!document.querySelector('#locate').disabled); assert.equal(await page.locator('#origin').inputValue(),'cember');
    assert.equal(await page.locator('#origin option').count(),64);

    await page.locator('#origin').selectOption('pop-art');
    assert.equal(await page.locator('#place-favorites [data-destination]').count(),3);
    await page.locator('#destination').fill('kale ici');
    assert.equal(await page.locator('#home-results [data-destination="kale-ici"]').count(),1);
    await page.locator('#home-results [data-destination="kale-ici"]').click();
    assert.match(await page.locator('#fare-result').innerText(),/POP ART[\s\S]*KALE İÇİ[\s\S]*500 ₺/);
    await page.getByRole('button',{name:'Yol tarifini aç',exact:true}).click();
    assert.ok((await page.locator('#google-link').getAttribute('href')).includes('destination=35.125%2C33.94167'));
    const popup=page.waitForEvent('popup').catch(()=>null); await page.locator('#google-link').click(); await popup;
    assert.equal(await page.locator('#origin').inputValue(),'kale-ici');

    await page.locator('#destination').fill('pop art'); await page.locator('#home-results [data-destination="pop-art"]').click();
    assert.match(await page.locator('#fare-result').innerText(),/Ücret kaydı yok[\s\S]*Tutar uydurulmadı/);
    await page.getByRole('button',{name:'Sık gidilenlerden çıkar',exact:true}).click();
    assert.equal(await page.locator('#place-favorites [data-destination="pop-art"]').count(),0);

    await page.locator('#save-current').click(); await page.locator('#save-location-dialog').waitFor({state:'visible'}); await page.locator('#save-location-name').fill('Ev');
    await page.locator('#save-location-radius').selectOption('1000'); await page.locator('#save-location-form button[type="submit"]').click();
    assert.match(await page.locator('#origin').inputValue(),/^custom-ev-/); assert.equal(await page.locator('#origin option').count(),65);
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('taksi-tarife:v1'))), saved=stored.customLocations.find(l=>l.name==='EV');
    assert.equal(saved.matchRadius,1000); assert.ok(stored.favoriteLocations.includes(saved.id));
    await page.locator('#locate').click(); await page.waitForFunction(()=>!document.querySelector('#locate').disabled); assert.equal(await page.locator('#origin').inputValue(),saved.id);

    await page.locator('#origin').selectOption('prime'); await page.locator('#destination').fill('citymall');
    await page.locator('#home-results [data-destination="citymall"]').click(); assert.match(await page.locator('#fare-result').innerText(),/375 ₺/);
    for (const viewport of [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:412,height:915}]) {
      await page.setViewportSize(viewport); assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    }
    await page.setViewportSize({width:390,height:844});
    if (prefix !== '/') {
      await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';document.querySelector('#toast').hidden=true;scrollTo(0,0);});
      await page.waitForFunction(()=>scrollY===0);
      await page.screenshot({path:resolve(root,'review/yeni-akis.png')});
      await page.locator('#fare-result').scrollIntoViewIfNeeded();
      await page.screenshot({path:resolve(root,'review/yeni-akis-sonuc.png')});
    }

    await page.locator('[data-tab="settings"]').click(); await page.locator('#edit-route').selectOption('pop-art--citymall');
    await page.locator('#edit-price').fill('500'); await page.locator('#edit-form button').click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('taksi-tarife:v1')).overrides['pop-art--citymall']),500);
    await page.locator('[data-tab="home"]').click(); await page.locator('#origin').selectOption('pop-art');
    await page.locator('#destination').fill('citymall'); await page.locator('#home-results [data-destination="citymall"]').click(); assert.match(await page.locator('#fare-result').innerText(),/500 ₺/);

    await context.setOffline(true); await page.reload(); await page.locator('#destination').fill('kale ici');
    await page.locator('#home-results [data-destination="kale-ici"]').click(); assert.match(await page.locator('#fare-result').innerText(),/500 ₺/);
    await context.setOffline(false); updateAvailable=true;
    await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
    await page.locator('#update-banner').waitFor({state:'visible'}); await page.locator('#update-button').click();
    await page.waitForFunction(async()=> (await caches.keys()).some(k=>k.endsWith('v1.5.1-test')) && document.querySelector('#update-banner').hidden);
    assert.equal(errors.length,0,JSON.stringify(errors)); if(prefix!=='/') assert.ok(requests.every(p=>p.startsWith(prefix)||p==='/favicon.ico'));
    console.log(`PASS ${prefix}: destination loop, directional fare, flexible saved place, offline and update lifecycle`); await context.close();
  }

  for (const failure of [1,2,3,'poor','far','invalid']) {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await context.addInitScript(mode=>{navigator.geolocation.getCurrentPosition=(ok,fail)=>setTimeout(()=>typeof mode==='number'?fail({code:mode}):ok({coords:{latitude:mode==='far'?35.339629:mode==='invalid'?NaN:35.129723,longitude:mode==='far'?33.320529:33.9285231,accuracy:mode==='poor'?1000:5},timestamp:Date.now()}),50);},failure);
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/taksi-tarife/');
    await page.waitForFunction(()=>!document.querySelector('#locate').disabled); assert.equal(await page.locator('#gps-suggestion').isHidden(),true);
    const message=await page.locator('#gps-details').innerText();
    assert.match(message,failure===1?/Konum izni kapalı/:failure===3?/zaman aşımı/:failure==='poor'?/Hassasiyet düşük/:failure==='far'?/Eşleşme alanının dışında/:/Telefon konumu belirleyemedi/);
    assert.deepEqual(errors,[]); await context.close();
  }
} finally { await browser?.close(); await new Promise(r=>server.close(r)); }
