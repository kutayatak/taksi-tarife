// Development only: an HTTP file host to test GitHub Pages subpath behavior.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = resolve(new URL('..', import.meta.url).pathname);
let updateAvailable = false;
let requests = [];
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server = createServer(async (req, res) => {
  const path = new URL(req.url,'http://localhost').pathname; requests.push(path);
  let relative = decodeURIComponent(path).replace(/^\/taksi-tarife\//,'/');
  if (relative.endsWith('/')) relative += 'index.html';
  const file = resolve(root,'.'+relative);
  try {
    if (!file.startsWith(root+sep)) throw Error();
    let data = await readFile(file);
    if(updateAvailable && file.endsWith('service-worker.js')) data = Buffer.from(data.toString().replace("'v1.3.0'","'v1.3.1-test'"));
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const prefix of ['/', '/taksi-tarife/']) {
    updateAvailable=false; requests=[];
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,acceptDownloads:true,permissions:['geolocation'],geolocation:{latitude:35.129723,longitude:33.9285231}});
    context.on('console',m=>{if(m.type()==='error') console.error('CONTEXT',m.text());}); const page=await context.newPage(), errors=[]; page.on('pageerror',e=>{errors.push(e.message); console.error('PAGE ERROR',e.message);}); page.on('console',m=>{if(m.type()==='error') console.error('CONSOLE',m.text());}); page.on('requestfailed',r=>console.error('REQUEST',r.url(),r.failure()));
    await page.goto(origin+prefix); await page.waitForFunction(()=>!!navigator.serviceWorker.controller).catch(async e=>{console.error('WORKER STATE',await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {installing:r?.installing?.state,waiting:r?.waiting?.state,active:r?.active?.state,cache:await caches.keys()};}));console.error('OFFLINE STATUS',await page.locator('#offline-status').innerText());console.error('REQUEST PATHS',requests);await page.screenshot({path:'/tmp/taksi-error.png',fullPage:true});throw e;});
    await page.locator('#gps-suggestion').waitFor({state:'visible'});
    assert.equal(await page.locator('#origin').inputValue(),'pop-art'); // GPS never changes selected origin.
    assert.match(await page.locator('#gps-message').innerText(),/ÇEMBER • 0 m/);
    await page.locator('#gps-suggestion').click(); assert.equal(await page.locator('#origin').inputValue(),'cember');
    await page.locator('#origin').selectOption('pop-art');
    assert.equal(await page.locator('#origin option').count(),13);
    assert.equal(await page.locator('#home-favorites [data-route]').count(),6);
    assert.equal(await page.evaluate(()=>document.querySelector('#frequent-section').compareDocumentPosition(document.querySelector('.origin-card')) & Node.DOCUMENT_POSITION_FOLLOWING),4);
    for (const viewport of [{width:320,height:568},{width:375,height:667},{width:390,height:844},{width:412,height:915}]) {
      await page.setViewportSize(viewport);
      const layout = await page.evaluate(()=>({searchBottom:document.querySelector('#destination').getBoundingClientRect().bottom,navTop:document.querySelector('.bottom-nav').getBoundingClientRect().top,bodyWidth:document.documentElement.scrollWidth}));
      assert.ok(layout.searchBottom < layout.navTop,`Search must be visible at ${viewport.width}x${viewport.height}: ${JSON.stringify(layout)}`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator('[data-tab="home"]').click();
    await page.waitForFunction(()=>document.querySelector('#theme-label').textContent==='Gündüz');
    assert.equal(await page.locator('#theme-toggle').getAttribute('aria-label'),'Gündüz moduna geç');
    await page.screenshot({path:resolve(root,'review/gece.png')});
    await page.locator('#theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    assert.equal(await page.locator('#theme-toggle').getAttribute('aria-label'),'Gece moduna geç');
    await page.screenshot({path:resolve(root,'review/gunduz.png')});
    await page.locator('#theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.locator('#navigation-panel summary').click();
    await page.locator('#navigation-target').selectOption('kyble-onu'); await page.locator('#navigate-current').click();
    await page.waitForFunction(()=>document.querySelector('#google-link').href.includes('origin=35.129723%2C33.9285231'));
    assert.ok((await page.locator('#google-link').getAttribute('href')).includes('destination=35.1593598%2C33.90279'));
    assert.ok((await page.locator('#apple-link').getAttribute('href')).includes('saddr=35.129723%2C33.9285231'));
    await page.locator('[data-close-dialog]').click();
    await page.locator('#navigation-panel summary').click();
    await page.locator('[data-tab="home"]').click();
    assert.equal(await page.locator('#all-results [data-route]').count(),166);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:`/tmp/taksi-home${prefix==='/'?'-root':''}.png`,fullPage:true});
    await page.locator('#destination').fill('kale'); await page.locator('#home-results [data-route="pop-art--kale-ici"]').click();
    assert.match(await page.locator('#fare-result').innerText(),/500 ₺/);
    await page.waitForFunction(()=>{const p=document.querySelector('.fare-price').getBoundingClientRect();return p.top>=document.querySelector('.app-header').getBoundingClientRect().bottom && p.bottom<innerHeight-document.querySelector('.bottom-nav').offsetHeight;});
    assert.equal(await page.evaluate(()=>{const b=document.querySelector('#theme-toggle').getBoundingClientRect();return b.top>=0 && b.bottom<innerHeight && b.height>=44;}),true);
    await page.getByRole('button',{name:'Favoriye Ekle',exact:true}).click();
    assert.equal(await page.locator('#home-favorites [data-route="pop-art--kale-ici"]').count(),1);
    await page.locator('#fare-result').getByRole('button',{name:'Bulunduğum Konumdan Git',exact:true}).click(); assert.equal(await page.locator('#navigation-dialog').isVisible(),true);
    assert.ok((await page.locator('#google-link').getAttribute('href')).includes(encodeURIComponent('35.125,33.94167')));
    await page.waitForFunction(()=>document.querySelector('#google-link').href.includes('origin=35.129723%2C33.9285231'));
    assert.match(await page.locator('#navigation-start').innerText(),/Bulunduğum konum/);
    await page.locator('[data-close-dialog]').click();
    await page.locator('[data-tab="home"]').click();
    assert.equal(await page.locator('#home-favorites [data-route]').first().getAttribute('data-route'),'pop-art--kale-ici');
    assert.equal(await page.locator('#frequent-section').isVisible(),true);
    assert.equal(await page.evaluate(()=>{const list=document.querySelector('#home-favorites');return list.scrollWidth>list.clientWidth;}),true);
    await page.locator('#home-favorites').focus();
    await page.keyboard.press('End');
    await page.locator('[data-tab="home"]').click();
    await page.locator('#home-recents [data-route="pop-art--kale-ici"]').click(); assert.match(await page.locator('#fare-result').innerText(),/500 ₺/);
    await page.locator('[data-tab="settings"]').click(); await page.locator('#edit-route').selectOption('pop-art--citymall');
    await page.locator('#edit-price').fill('500'); await page.locator('#edit-form button').click();
    assert.match(await page.locator('#original-price').innerText(),/450/);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('taksi-tarife:v1')).overrides['pop-art--citymall']),500);
    await page.reload(); await page.locator('#edit-route').selectOption('pop-art--citymall'); assert.equal(await page.locator('#edit-price').inputValue(),'500');
    await page.locator('#theme').selectOption('light'); assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await page.locator('#theme').selectOption('system'); await page.emulateMedia({colorScheme:'light'}); await page.waitForFunction(()=>document.documentElement.dataset.theme==='light'); await page.emulateMedia({colorScheme:'dark'}); await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark'); assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.locator('#add-from').fill('CITYMALL'); await page.locator('#add-to').fill('POP ART'); await page.locator('#add-price').fill('520'); await page.locator('#add-form button').click();
    assert.equal(await page.locator('#edit-route').inputValue(),'citymall--pop-art');
    await page.locator('#add-from').fill('YENİ DURAK'); await page.locator('#add-to').fill('CITYMALL 2'); await page.locator('#add-price').fill('610'); await page.locator('#add-form button').click();
    assert.equal(await page.locator('#all-results [data-route]').count(),168);
    await page.locator('#coordinate-panel summary').click();
    await page.locator('#coordinate-location').selectOption('tir-parki');
    assert.equal(await page.locator('#coordinate-lat').inputValue(),'');
    await page.locator('#coordinate-use-gps').click();
    await page.waitForFunction(()=>document.querySelector('#coordinate-lat').value==='35.129723');
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('taksi-tarife:v1')).coordinateOverrides['tir-parki']),undefined);
    await page.locator('#coordinate-form button[type="submit"]').click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('taksi-tarife:v1')).coordinateOverrides['tir-parki'].lat),35.129723);
    await page.reload();
    await page.locator('#coordinate-panel summary').click();
    await page.locator('#coordinate-location').selectOption('tir-parki');
    assert.equal(await page.locator('#coordinate-lat').inputValue(),'35.129723');
    await page.locator('#coordinate-reset').click();
    assert.equal(await page.locator('#coordinate-lat').inputValue(),'');
    await page.locator('#coordinate-location').selectOption('citymall');
    await page.locator('#coordinate-lat').fill('35,125871');
    await page.locator('#coordinate-lng').fill('33,920825');
    await page.locator('#coordinate-form button[type="submit"]').click();
    await page.locator('#coordinate-panel summary').click();
    const downloadPromise=page.waitForEvent('download'); await page.locator('#export-backup').click(); const backup=JSON.parse(await readFile(await (await downloadPromise).path(),'utf8'));
    assert.equal(backup.coordinateOverrides['citymall'].lat,35.125871); assert.equal(backup.kind,'taksi-tarife-backup'); assert.equal(backup.customRoutes.length,2); assert.equal(backup.favorites.length,1);
    const modsDownload=page.waitForEvent('download'); await page.locator('#export-mods').click(); const mods=JSON.parse(await readFile(await (await modsDownload).path(),'utf8')); assert.equal(mods.overrides['pop-art--citymall'],500);
    await page.locator('#reset-all').click(); await page.locator('#confirm-accept').click(); assert.equal(await page.locator('#all-results [data-route]').count(),166);
    await page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))}); await page.locator('#confirm-accept').click(); assert.equal(await page.locator('#all-results [data-route]').count(),168);
    await page.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')}); assert.equal(await page.locator('#confirm-dialog').isVisible(),false);
    await page.locator('#edit-route').selectOption('citymall--pop-art'); await page.locator('#delete-route').click(); await page.locator('#confirm-accept').click(); assert.equal(await page.locator('#all-results [data-route]').count(),167);
    await page.locator('#import-file').setInputFiles({name:'mods.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(mods))}); await page.locator('#confirm-accept').click();
    await page.locator('[data-tab="home"]').click(); await page.locator('#destination').fill('city'); await page.locator('#home-results [data-route="pop-art--citymall"]').click(); assert.match(await page.locator('#fare-result').innerText(),/500 ₺/);
    await page.getByRole('button',{name:'Ters yön · 520 ₺',exact:true}).click(); assert.match(await page.locator('#fare-result').innerText(),/520 ₺/); assert.equal(await page.locator('#origin').inputValue(),'citymall');
    await page.locator('#home-recents [data-route="pop-art--citymall"]').click(); assert.equal(await page.locator('#origin').inputValue(),'pop-art');
    await page.locator('#city-fare').click(); assert.match(await page.locator('#fare-result').innerText(),/300 ₺/);
    await page.locator('[data-tab="fares"]').click(); await page.locator('#all-search').fill('ercan'); assert.equal(await page.locator('#all-results [data-route]').count(),2);
    await page.locator('#all-origin').selectOption('magosa'); assert.equal(await page.locator('#all-results [data-route]').count(),1);
    await context.setOffline(true); await page.reload(); await page.locator('[data-tab="home"]').click(); await page.locator('#destination').fill('KALEICI'); await page.locator('#home-results [data-route="pop-art--kale-ici"]').click(); assert.match(await page.locator('#fare-result').innerText(),/500 ₺/);
    await page.locator('#theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await page.locator('[data-tab="home"]').click();
    await page.locator('#destination').fill('KALEICI'); await page.locator('#home-results [data-route="pop-art--kale-ici"]').click();
    await page.locator('#theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    // Playwright's network emulation does not consistently change navigator.onLine across reloads.
    // The offline lookup above exercises the real worker-cached shell and fare files.
    await page.screenshot({path:`/tmp/taksi-result${prefix==='/'?'-root':''}.png`});
    await context.setOffline(false); updateAvailable=true;
    await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();}); await page.locator('#update-banner').waitFor({state:'visible'}); await page.locator('#update-button').click();
    await page.waitForFunction(async()=> (await caches.keys()).some(k=>k.endsWith('v1.3.1-test')) && document.querySelector('#update-banner').hidden);
    assert.equal(await page.evaluate(async()=>(await caches.keys()).filter(k=>k.startsWith('taksi-tarife:')).length),1);
    assert.equal(errors.length,0,JSON.stringify(errors));
    if(prefix!=='/') assert.ok(requests.every(p=>p.startsWith(prefix)||p==='/favicon.ico'));
    console.log(`PASS ${prefix}: static loading, GPS suggestion, search, overrides, favorites, recents, custom/reverse routes, JSON import/export, offline reload, update lifecycle`);
    await context.close();
  }
  updateAvailable=false;
  for (const failure of [1,2,3,'poor','far','invalid']) {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await context.addInitScript(mode=>{
      window.gpsCalls=[];
      navigator.geolocation.getCurrentPosition=(ok,fail,options)=>{
        window.gpsCalls.push(options);
        setTimeout(()=>{
          if(typeof mode==='number') fail({code:mode});
          else ok({coords:{latitude:mode==='far'?35.339629:mode==='invalid'?NaN:35.129723,longitude:mode==='far'?33.320529:33.9285231,accuracy:mode==='poor'?1000:5},timestamp:Date.now()});
        },100);
      };
    },failure);
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/taksi-tarife/');
    await page.waitForFunction(()=>!document.querySelector('#locate').disabled && window.gpsCalls?.length>0);
    assert.equal(await page.locator('#gps-suggestion').isHidden(),true);
    assert.equal(await page.locator('#origin').inputValue(),'pop-art');
    await page.setViewportSize({width:320,height:568});
    const bounds=await page.evaluate(()=>({search:document.querySelector('#destination').getBoundingClientRect().bottom,nav:document.querySelector('.bottom-nav').getBoundingClientRect().top,width:document.documentElement.scrollWidth}));
    assert.ok(bounds.search<bounds.nav,`${failure}: search hidden at 320x568: ${JSON.stringify(bounds)}`);
    assert.ok(bounds.width<=320);
    await page.setViewportSize({width:390,height:844});
    const message=await page.locator('#gps-details').innerText();
    assert.match(message,failure===1?/Konum izni kapalı/:failure===3?/zaman aşımı/:failure==='poor'?/Hassasiyet düşük/:failure==='far'?/Yakın ve kesin bir başlangıç yok/:/Telefon konumu belirleyemedi/);
    await page.locator('#destination').fill('kale');await page.locator('#home-results [data-route="pop-art--kale-ici"]').click();
    assert.match(await page.locator('#fare-result').innerText(),/500 ₺/);
    // Retry succeeds after changing the mocked sensor; it does not disturb an active fare.
    await page.evaluate(()=>{navigator.geolocation.getCurrentPosition=(ok,fail,options)=>{window.gpsCalls.push(options);setTimeout(()=>ok({coords:{latitude:35.129723,longitude:33.9285231,accuracy:5},timestamp:Date.now()}),200);};});
    await page.locator('#locate').click();
    assert.equal(await page.locator('#settings-locate').isDisabled(),true);
    await page.waitForFunction(()=>!document.querySelector('#locate').disabled);
    assert.equal(await page.locator('#gps-suggestion').isVisible(),true);
    assert.equal(await page.locator('#origin').inputValue(),'pop-art');
    assert.match(await page.locator('#fare-result').innerText(),/500 ₺/);
    assert.ok((await page.evaluate(()=>window.gpsCalls)).every(o=>o.enableHighAccuracy===true && o.maximumAge===0));
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(`PASS GPS ${failure}: fallback lookup, retry, fresh sensor options, active fare preserved`);
  }
} finally { await browser?.close(); await new Promise(r=>server.close(r)); }
