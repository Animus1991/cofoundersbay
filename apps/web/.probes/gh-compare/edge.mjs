import { createRequire } from 'node:module';
const { chromium } = createRequire(new URL('../../package.json', import.meta.url))('@playwright/test');
const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{width:1440,height:900} });
await ctx.addCookies([{name:'cfb_session',value:'probe',domain:'localhost',path:'/'},{name:'cfb_primary_role',value:'founder',domain:'localhost',path:'/'}]);
await ctx.addInitScript(({theme})=>{localStorage.setItem('user',JSON.stringify({id:'u_1',email:'a@b.test',role:'founder'}));localStorage.setItem('cfb_demo_data','1');localStorage.setItem('cfb_cookie_consent','true');if(theme)localStorage.setItem('theme',theme);},{theme:process.env.THEME||''});
const p = await ctx.newPage(); await p.goto('http://localhost:3001/opportunities',{waitUntil:'networkidle'}); await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{
  const cs=getComputedStyle(document.documentElement);
  const out={border:cs.getPropertyValue('--border').trim(),input:cs.getPropertyValue('--input').trim(),card:cs.getPropertyValue('--card').trim()};
  const pick=(sel,label)=>{const el=[...document.querySelectorAll(sel)].find(e=>e.textContent.trim().startsWith(label));if(!el)return 'n/a';const s=getComputedStyle(el);return {cls:el.className.split(' ').filter(c=>/border/.test(c)).join(' '),bw:s.borderTopWidth,bc:s.borderTopColor,bg:s.backgroundColor}};
  out.writeNeed=pick('button','Write a need card'); out.category=pick('button','Category'); out.card=pick('[data-surface="card"]','');
  const c=document.querySelector('[data-surface="card"]');out.cardEdge=c&&{bw:getComputedStyle(c).borderTopWidth,bc:getComputedStyle(c).borderTopColor,bg:getComputedStyle(c).backgroundColor};
  return out;}));
await b.close();
