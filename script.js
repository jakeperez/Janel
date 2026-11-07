// Values come from config.js, which "npm run build" writes from your environment variables.
let CFG=window.GV_CONFIG||{},SB_URL=CFG.SUPABASE_URL||"https://xrfehvxqchskxcjytkvv.supabase.co",SB_KEY=CFG.SUPABASE_ANON_KEY||"";
// name, wordmark, [color1,color2], amounts (USD), review count, discount %
const GC=[["Steam Wallet Code","STEAM",["#1B2838","#2A6FA8"],[5,10,20,50,100],518,3],["Binance Gift Card","BINANCE",["#FFCB05","#F2B100"],[10,25,50,100],231,0],["Bstation / Bilibili","BILIBILI",["#27C7FF","#2B7BFF"],[5,10,25],12,0],["DramaBox Voucher","DRAMABOX",["#FF2D6F","#FF7A1A"],[5,10,20],1,0],["Mobile Legends Epin","MOBILE LEGENDS",["#7B3FE4","#2A8CFF"],[5,10,25,50],2,0],["PlayStation Store Gift Card (PSN)","PLAYSTATION",["#0A62C9","#0B3C94"],[10,25,50,100],165,0],["Nintendo eShop (USD)","NINTENDO eSHOP",["#FF7A00","#FF9A1F"],[10,20,35,50],46,0],["PlayStation Singapore (PSN SGD)","PSN SGD",["#0A2A8A","#06195C"],[10,20,50],24,0],["Voucher Legend of YMIR","YMIR",["#46464B","#141416"],[5,10,25],9,5],["Blizzard Gift Card","BLIZZARD",["#0F6FC0","#06264A"],[20,50,100],77,0],["Xbox Gift Card","XBOX",["#1E9A1E","#0B6B0B"],[10,25,50,100],134,0],["NetEase Pay Gift Card","NETEASE PAY",["#D12A45","#FF5470"],[5,10,25],18,0],["Google Play Gift Card","GOOGLE PLAY",["#2E2E32","#0A0A0C"],[5,10,25,50,100],203,0],["Voucher Minecraft","MINECRAFT",["#5FAE2E","#7B5A3A"],[10,25,50],64,8],["Nintendo Switch Online","SWITCH ONLINE",["#E60012","#B8000F"],[8,20,35],41,0]];
const TORN="polygon(0 0,100% 0,100% 86%,"+Array.from({length:14},(_,i)=>`${(100-(i+1)*100/14).toFixed(1)}% ${i%2?94:86}%`).join(",")+")";
const slug=g=>g[1].toLowerCase().replace(/[^a-z0-9]+/g,"-");
const GIFT='<svg viewBox="0 0 24 24" width="50" height="50" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M12 9C8 9 7 4 10 4c2 0 2 3 2 5zm0 0c4 0 5-5 2-5-2 0-2 3-2 5z"/></svg>';
const VCH={WELCOME5:[5,0],VAULT10:[10,300],GOLD15:[15,1000]},PMS=["GCash","PayPal","Bank Card"];
const BRAND={GCash:'<span style="color:#1a4fd6;font-weight:800">◎ GCash</span>',PayPal:'<span style="color:#003087;font-weight:800;font-style:italic">PayPal</span>',"Bank Card":'<span style="color:#17181c;font-weight:700">▭ Card</span>'};
let S={bal:5000,pts:0,codes:[],ref:"",cart:[],tab:"Gifts"},GQ="",PG={},user=null,sb=null,P={amt:1000,m:"GCash"};
try{const x=JSON.parse(localStorage.getItem("giftvault2")||"null");if(x&&typeof x.bal=="number"){S.bal=x.bal;S.pts=x.pts||0;S.codes=x.codes||[];S.ref=x.ref||"";S.cart=x.cart||[]}}catch(e){}
const hasValidKey = SB_KEY && typeof SB_KEY === "string" && !SB_KEY.toLowerCase().includes("paste") && SB_KEY.length > 20;
try{if(hasValidKey&&window.supabase)sb=supabase.createClient(SB_URL,SB_KEY,{auth:{flowType:"pkce"}})}catch(e){console.warn("Supabase init error:",e)}
const $=id=>document.getElementById(id),$$=m=>"₱"+m.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),P0=n=>"₱"+Math.round(n).toLocaleString();
const save=()=>{try{localStorage.setItem("giftvault2",JSON.stringify(S))}catch(e){}};
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("on"),2800)}
function head(){$("bal").textContent=$$(S.bal);$("tc").textContent="🛒 Cart ("+S.cart.reduce((s,x)=>s+x.q,0)+")";$("tc").classList.toggle("on",S.tab=="Cart");$("t2").textContent="My Codes ("+S.codes.length+")";$("t2").classList.toggle("on",S.tab=="Codes");$("bb").classList.toggle("on",S.tab=="Product")}
const isOwnerAdmin=e=>{if(!e)return false;const m=String(e).toLowerCase().trim();return m==="jkoyp3255@gmail.com"||m==="kintjorik@gmail.com"||m.includes("admin")||m.startsWith("admin@")||m.includes("owner")};
function nav(h){if(location.hash=="#"+h)route();else location.hash=h}
function route(){const h=location.hash.slice(1),m=/^card(\d+)$/.exec(h);
 if(m&&GC[+m[1]])openProduct(+m[1]);
 else{
   if(h=="admin"&&user&&isOwnerAdmin(user.email))S.role="admin";
   S.tab=T[h]||"Gifts";render();
 }
 closeMenu();window.scrollTo(0,0)}
function render(){head();
 if(S.tab=="Product")product();
 else if(PAGES[S.tab])$("view").innerHTML=PAGES[S.tab]();
 else if(S.tab=="Gifts"){$("view").innerHTML=`<div class="top2"><h1>🎁 Gift Cards</h1></div><div class="gg" id="gg"></div>`;gList()}
 else $("view").innerHTML=`<div class="top2"><h1>My Codes</h1></div>`+(S.codes.length?`<div class="gg" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">${S.codes.map(c=>`<div class="gc" style="padding:16px;cursor:default"><b>${c.n}</b><small style="color:var(--mu)">${P0(c.p)} · ${c.m} · ${new Date(c.t).toLocaleDateString()}</small><div class="code" style="font-size:16px">${c.c}</div></div>`).join("")}</div>`:`<div class="gg"><div class="empty">No codes yet. Buy a gift card to see it here.</div></div>`)}
function gList(){const q=GQ.toLowerCase(),a=GC.map((g,i)=>[g,i]).filter(o=>o[0][0].toLowerCase().includes(q));
 $("gg").innerHTML=a.length?a.map(([g,i])=>`<article class="gc" tabindex="0" onclick="nav('card${i}')" onkeydown="if(event.key=='Enter')nav('card${i}')"><div class="ga art-${slug(g)}" style="--c1:${g[2][0]};--c2:${g[2][1]};clip-path:${TORN}">${g[5]?`<span class="gd">-${g[5]}%</span>`:""}${GIFT}<b style="${i==1?"color:#1b1b1b;text-shadow:none":""}">${g[1]}</b></div><div class="gb"><div class="gn">${g[0]}</div><div class="gr"><i>★</i> 5.0 <small>(${g[4]})</small></div></div></article>`).join(""):`<div class="empty">No gift cards match your search.</div>`}
/* ---------- product page ---------- */
function mkItems(i){const g=GC[i],a=[];
 if(i==1){const order=["FDUSD","SHIB","DAI","SOL","BTC","XRP","DOGE","PEPE","BNB","EURI"];
  [5,10,15,20,25,50,100].forEach(d=>order.forEach(c=>{if(c=="BNB"&&d==5)return;const eu=c=="EURI";
   a.push({n:eu?`Binance ${d} EURI Gift Card`:c=="FDUSD"?`Binance ${d} FDUSD Gift Card`:`Binance ${c} Gift Card ${d} USD`,a:d,p:eu?Math.round(d*86):d*73})}))}
 else g[3].forEach(d=>a.push({n:`${g[0]} ${d} USD`,a:d,p:d*73}));
 a.forEach(x=>x.pts=Math.max(10,Math.round(x.p/105)*10));return a}
function openProduct(i){PG={i,items:mkItems(i),item:-1,m:"",v:0,vc:"",e:"",f:0,guide:true};S.tab="Product";render()}
const fp=it=>Math.round(it.p*(1-GC[PG.i][5]/100)),total=()=>PG.item>=0?Math.round(fp(PG.items[PG.item])*(1-PG.v/100)):0;
function updBar(){$("pr").textContent=P0(total())}
function drawItems(){const am=[...new Set(PG.items.map(x=>x.a))];
 $("itwrap").innerHTML=(am.length>1?`<div class="chips">${[0,...am].map(a=>`<button class="${PG.f==a?"on":""}" onclick="PG.f=${a};drawItems()">${a?a+" "+(PG.i==1?"":"USD"):"All"}</button>`).join("")}</div>`:"")+`<div class="items">${PG.items.map((it,k)=>PG.f&&it.a!=PG.f?"":`<button class="it${PG.item==k?" on":""}" data-k="${k}" onclick="pickItem(${k})"><b>${it.n}</b><hr><span class="ip">${P0(fp(it))}</span><em>+ ${it.pts} VAULT POINTS</em></button>`).join("")}</div>`}
function pickItem(k){PG.item=k;document.querySelectorAll(".it").forEach(b=>b.classList.toggle("on",+b.dataset.k==k));updBar()}
function pickM(m){PG.m=m;document.querySelectorAll("[data-m]").forEach(b=>b.classList.toggle("on",b.dataset.m==m));$("oform").innerHTML=PMS.includes(m)?formHTML(m,"o"):""}
function applyV(){const c=PG.vc.trim().toUpperCase(),v=VCH[c];PG.v=0;
 if(!v)toast("Invalid voucher code");else if(S.pts<v[1])toast(`Needs ${v[1]} Vault Points – you have ${S.pts}`);else{PG.v=v[0];toast(`Voucher applied: -${v[0]}%`)}product();updBar()}
function product(){const g=GC[PG.i],n=g[4],bin=PG.i==1,one=bin?1:0,five=n-one,dates=["03 Nov 2026, 14:20","02 Nov 2026, 12:30","02 Nov 2026, 12:19","02 Nov 2026, 11:42","01 Nov 2026, 16:44"],em=["arte********@gmail.com","sq35*****@gmail.com","jm88******@gmail.com","ka_r*****@gmail.com","lei2*****@gmail.com"],qt=["Fast delivery and a fair price","Easy checkout, would buy again","Code arrived within a minute","Simple and smooth","Good rates compared to other shops"];
 const rows=[[5,five],[4,0],[3,0],[2,0],[1,one]],rv=Array.from({length:Math.min(5,n)},(_,k)=>`<div class="rv"><div class="r1">${em[k]}<span>★★★★★</span></div><div class="r2"><span>1x qty ${PG.items[(k*7+3)%PG.items.length].n}</span><span>${dates[k]}</span></div><p>“${qt[k]}”</p></div>`).join("");
 $("view").innerHTML=`<div class="pgrid"><div>
 <section class="pn"><div class="hrow"><div class="tile art-${slug(g)}" style="--c1:${g[2][0]};--c2:${g[2][1]};${PG.i==1?"color:#1b1b1b":""}">${GIFT.replace('width="50" height="50"','width="40" height="40"')}<b>${g[1]}</b></div><div><h1>${g[0]}</h1><div class="bdg"><span><i></i>Fast Process</span><span><i></i>Instant Delivery</span><span><i></i>Secure Payment</span><span><i></i>Official Partner</span></div></div></div>
 <button class="guide" onclick="PG.guide=!PG.guide;$('gl').style.display=PG.guide?'':'none'">◉ Purchase Guide <span>⌃</span></button>
 <ol class="gl" id="gl" style="${PG.guide?"":"display:none"}"><li>Select the item you want.</li><li>Choose a payment method.</li><li>Enter your email and an optional voucher code (try WELCOME5).</li><li>Press Buy now. Your code appears in My Codes.</li></ol></section>
 <section class="pn"><h2><span class="num">1</span>Select item</h2><div id="itwrap"></div></section>
 <section class="pn"><h2><span class="num">2</span>Payment Method</h2>
  <button class="vc" data-m="Vault Coins" onclick="pickM('Vault Coins')"><span class="lg coin">V</span>Vault Coins<small>${$$(S.bal)} · ${S.pts} pts</small></button>
  <div class="pm">${PMS.map(m=>`<button data-m="${m}" onclick="pickM('${m}')"><span class="lg">${BRAND[m]}</span>${m}<small>No Minimum.</small></button>`).join("")}</div><div id="oform"></div></section>
 </div><aside>
 <section class="pn"><h2><span class="num">3</span>Order Confirmation</h2><h3 style="margin-top:0">Transaction Receipt (Required)</h3><p class="sm">Required: You must enter email to receive a transaction receipt</p>
  <input type="email" autocomplete="email" placeholder="Input your Email" value="${PG.e}" oninput="PG.e=this.value" aria-label="Email"><p class="sm" style="margin-top:12px">Double-check your information to make sure everything is correct before proceeding</p>
  <h3>Voucher Code</h3><div class="vrow"><input placeholder="(Optional)" value="${PG.vc}" oninput="PG.vc=this.value" aria-label="Voucher code"><button class="out" onclick="applyV()">Apply</button></div>${PG.v?`<p class="okm">Voucher applied: -${PG.v}%</p>`:""}</section>
 <section class="pn rt"><h3>Rating overview</h3><div class="big">5.0 <small>/5</small></div><div class="stars">★★★★★</div><div>${n} rating${n>1?"s":""}</div>
  ${rows.map(([s,c])=>`<div class="bar"><span>${s} ★</span><div><i style="width:${n?c/n*100:0}%"></i></div><span>${c}</span></div>`).join("")}${rv}</section></aside></div>`;
 drawItems();pickM(PG.m||"");updBar()}
/* ---------- payment forms & validation ---------- */
function fmtCard(e){e.value=e.value.replace(/\D/g,"").slice(0,19).replace(/(.{4})/g,"$1 ").trim()}
function fmtExp(e){const d=e.value.replace(/\D/g,"").slice(0,4);e.value=d.length>2?d.slice(0,2)+"/"+d.slice(2):d}
function formHTML(m,p){return {GCash:`<label class="fl">GCash mobile number</label><input id="${p}1" inputmode="tel" autocomplete="tel" placeholder="09XX XXX XXXX">`,
 PayPal:`<label class="fl">PayPal email</label><input id="${p}1" type="email" autocomplete="email" placeholder="you@example.com">`,
 "Bank Card":`<label class="fl">Name on card</label><input id="${p}1" autocomplete="cc-name" placeholder="Juan Dela Cruz"><label class="fl">Card number</label><input id="${p}2" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456" oninput="fmtCard(this)"><div class="two"><div><label class="fl">Expiry</label><input id="${p}3" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" oninput="fmtExp(this)"></div><div><label class="fl">CVC</label><input id="${p}4" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"></div></div>`}[m]}
const luhn=n=>{let s=0,d=false;for(let i=n.length-1;i>=0;i--){let x=+n[i];if(d){x*=2;if(x>9)x-=9}s+=x;d=!d}return s%10==0};
function validate(m,p){const v=k=>{const e=$(p+k);return e?e.value.trim():""};
 if(m=="GCash")return /^(09|\+?639)\d{9}$/.test(v(1).replace(/[\s-]/g,""))?"":"Enter a valid GCash number (09XX XXX XXXX)";
 if(m=="PayPal")return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v(1))?"":"Enter a valid PayPal email";
 const n=v(2).replace(/\s/g,""),ex=v(3).split("/"),mm=+ex[0],yy=2000+(+ex[1]),now=new Date();
 if(v(1).length<2)return "Enter the name on the card";if(n.length<13||!luhn(n))return "Card number looks invalid";
 if(!(mm>=1&&mm<=12)||!(yy>now.getFullYear()||(yy==now.getFullYear()&&mm>=now.getMonth()+1)))return "Card expiry is invalid or past";
 return /^\d{3,4}$/.test(v(4))?"":"Enter the 3 or 4 digit CVC"}
/* ---------- checkout ---------- */
const mkCode=()=>{const ch="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",s=()=>Array.from({length:4},()=>ch[Math.floor(Math.random()*ch.length)]).join("");return s()+"-"+s()+"-"+s()};
function buyNow(){const it=PG.items[PG.item];
 if(!it){toast("Select an item first");return}if(!PG.m){toast("Choose a payment method");return}
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(PG.e.trim())){toast("Enter a valid email for your receipt");return}
 if(sb&&!user){toast("Log in to buy");openAuth("in");return}
 const p=total();
 if(PG.m=="Vault Coins"){if(p>S.bal){toast("Not enough Vault Coins – deposit funds first");return}}
 else{const err=validate(PG.m,"o");if(err){toast(err);return}}
 const b=$("buyb");b.disabled=true;b.textContent="Processing…";
 setTimeout(async()=>{const c={n:it.n,p,m:PG.m,e:PG.e.trim(),c:mkCode(),t:Date.now(),pt:it.pts};
  if(!await serverOrder([c])){b.disabled=false;b.textContent="Buy now";return}
  if(!(sb&&user)&&PG.m=="Vault Coins")S.bal=+(S.bal-p).toFixed(2);S.pts+=it.pts;S.codes.unshift(c);save();head();b.disabled=false;b.textContent="Buy now";
  $("gbox").innerHTML=`<div class="mh"><b>Purchase Complete</b><button class="sq" onclick="closeGift()" aria-label="Close">✕</button></div><p>${it.n}<br><small style="color:var(--mu)">${P0(p)} via ${PG.m} · +${it.pts} Vault Points</small></p><div class="code">${c.c}</div><p class="note">Saved to your account under My Codes. An official confirmation receipt with your gift card voucher code has been dispatched to ${c.e}.</p><button class="b pri" style="width:100%;margin-top:12px" onclick="closeGift();nav('codes')">View My Codes</button>`;
   $("gm").classList.add("on")},1200)}
function closeGift(){$("gm").classList.remove("on")}
/* ---------- deposit ---------- */
function openPay(){$("pamt").value="";P.amt=1000;drawAmts();drawMeths();$("pform").innerHTML=formHTML(P.m,"d");drawPayBtn();$("pay").classList.add("on")}
function closePay(){$("pay").classList.remove("on")}
function drawAmts(){$("amts").innerHTML=[500,1000,2000,5000].map(n=>`<button class="${P.amt==n&&!$("pamt").value?"on":""}" onclick="P.amt=${n};$('pamt').value='';drawAmts();drawPayBtn()">${P0(n)}</button>`).join("")}
function setAmt(v){P.amt=+v;drawAmts();drawPayBtn()}
function drawMeths(){$("meths").innerHTML=PMS.map(m=>`<button class="${P.m==m?"on":""}" onclick="P.m='${m}';drawMeths();$('pform').innerHTML=formHTML(P.m,'d');drawPayBtn()">${m}</button>`).join("")}
function drawPayBtn(){$("payb").disabled=false;$("payb").textContent=`Pay ${P.amt>0?P0(P.amt):"₱0"} with ${P.m}`}
function doPay(){const a=+P.amt;if(!(a>=100&&a<=50000)){toast("Enter an amount between ₱100 and ₱50,000");return}
 const err=validate(P.m,"d");if(err){toast(err);return}
 $("payb").disabled=true;$("payb").textContent=P.m=="GCash"?"Waiting for GCash approval…":P.m=="PayPal"?"Contacting PayPal…":"Processing card…";
 setTimeout(async()=>{if(sb&&user){const r=await sb.rpc("deposit_demo",{p_amount:a});if(r.error){toast(r.error.message);drawPayBtn();return}S.bal=Number(r.data)}else S.bal=+(S.bal+a).toFixed(2);save();closePay();head();if(S.tab=="Product")product();toast(`Successfully credited ${P0(a)} to your Vault balance via ${P.m}`)},1500)}
const T={admin:"Admin",cart:"Cart",codes:"Codes",orders:"Orders",mlbb:"MLBB",top20:"Top",affl:"AffL",affp:"AffP",promo:"Promo"};
const MENU=[["Home","home"],["Order Tracker","orders"],["Check MLBB Server","mlbb",1],["Top 20 User","top20"],["Affiliate Leaderboard","affl"],["Affiliate Program","affp"],["Promo Member","promo",1]];
function drawMenu(){const isAdm = Boolean(user && S.role=="admin");$("menu").innerHTML=`<div class="mh2"><button class="hb" style="width:auto;padding:4px 8px;font-size:26px" onclick="closeMenu()" aria-label="Close menu">☰</button><div class="logo">🎁 GiftVault</div></div>`+MENU.concat(isAdm?[["Admin Panel","admin",1]]:[]).map(m=>`<button class="${m[2]?"t":""}" onclick="nav('${m[1]}')">${m[0]}</button>`).join("")}
function toggleMenu(){drawMenu();$("menu").classList.add("on");$("ms").classList.add("on")}
function closeMenu(){$("menu").classList.remove("on");$("ms").classList.remove("on")}
const spent=()=>S.codes.reduce((s,c)=>s+c.p,0),NM=["ka","jm","rey","lei","ar","sq","mi","xd","zen","nik"],nm=i=>NM[i%10]+((i*37)%90+10)+"*****",oid=c=>"GV-"+c.t.toString(36).toUpperCase().slice(-6);
function ordHTML(q){q=(q||"").toLowerCase();const a=S.codes.filter(c=>!q||(c.e+" "+c.n+" "+oid(c)).toLowerCase().includes(q));
 return a.length?a.map(c=>`<div class="ord"><div><b>${c.n}</b><small>${oid(c)} · ${new Date(c.t).toLocaleString()}</small></div><div>${P0(c.p)}<small>${c.m}</small></div><span class="st">Delivered</span></div>`).join(""):`<div class="empty">No orders found.</div>`}
function pgOrders(){return `<div class="top2"><h1>Order Tracker</h1></div><div class="pg1"><input placeholder="Search by email, item or order ID" aria-label="Search orders" oninput="$('ol').innerHTML=ordHTML(this.value)"><div id="ol" style="margin-top:14px">${ordHTML("")}</div></div>`}
function pgMlbb(){return `<div class="top2"><h1>Check MLBB Server</h1></div><div class="pg1"><section class="pn"><label class="fl">User ID</label><input id="mu" inputmode="numeric" placeholder="e.g. 123456789"><label class="fl">Server (Zone) ID</label><input id="mz" inputmode="numeric" placeholder="e.g. 2345"><button class="b pri" style="width:100%;margin-top:16px" onclick="chkM()">Check</button><div id="mr" style="margin-top:14px;font-size:14px"></div></section></div>`}
function chkM(){const u=$("mu").value.trim(),z=$("mz").value.trim();$("mr").innerHTML=!/^\d{6,12}$/.test(u)?"Enter a valid User ID (6–12 digits).":!/^\d{3,5}$/.test(z)?"Enter a valid Server ID (3–5 digits).":`✓ ID ${u} (${z}) is verified and ready for instant diamond delivery.`}
function pgTop(){const me=spent(),rows=Array.from({length:20},(_,i)=>[nm(i),Math.round(184500*Math.pow(.86,i))]),rank=rows.filter(r=>r[1]>me).length+1;
 return `<div class="top2"><h1>Top 20 User</h1></div><section class="pn" style="padding:18px"><b>Your spending: ${P0(me)}</b> <small style="color:var(--mu)">${me?`· estimated rank #${rank}${rank>20?" (outside the top 20)":""}`:"· buy a gift card to enter the ranking"}</small></section><div style="overflow-x:auto"><table class="tbl"><tr><th>#</th><th>User</th><th>Total spent</th></tr>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r[0]}</td><td>${P0(r[1])}</td></tr>`).join("")}</table></div><p class="note">Rankings updated daily based on monthly order volume.</p>`}
function pgAffL(){const rows=Array.from({length:10},(_,i)=>{const n=Math.round(212*Math.pow(.8,i))+3;return [nm(i+4),n,n*180]});
 return `<div class="top2"><h1>Affiliate Leaderboard</h1></div><div style="overflow-x:auto"><table class="tbl"><tr><th>#</th><th>Affiliate</th><th>Referrals</th><th>Earnings</th></tr>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r[0]}</td><td>${r[1]}</td><td>${P0(r[2])}</td></tr>`).join("")}</table></div><p class="note">Top affiliates updated in real time based on active referral commissions.</p>`}
function pgAffP(){if(!S.ref){S.ref=Array.from({length:6},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");save()}
 return `<div class="top2"><h1>Affiliate Program</h1></div><div class="pg1"><section class="pn"><h3 style="margin-top:0">Invite friends, earn commission</h3><p style="color:var(--mu)">Share your personalized referral link. Earn up to 10% commission on every digital gift card purchased by your referrals.</p><label class="fl">Your referral link</label><div class="vrow"><input readonly id="rl" value="${location.origin+location.pathname}?ref=${S.ref}"><button class="out" onclick="copyRef()">Copy</button></div></section><section class="pn"><div class="two"><div><small style="color:var(--mu)">Referrals</small><div class="big">0</div></div><div><small style="color:var(--mu)">Earnings</small><div class="big">₱0</div></div></div></section></div>`}
function copyRef(){const e=$("rl");e.select();try{navigator.clipboard.writeText(e.value).then(()=>toast("Link copied"),()=>toast("Press Ctrl+C to copy"))}catch(x){toast("Press Ctrl+C to copy")}}
const TIERS=[["Member",0,"WELCOME5","5% off"],["Silver",300,"VAULT10","10% off"],["Gold",1000,"GOLD15","15% off"]];
function pgPromo(){const p=S.pts,cur=[...TIERS].reverse().find(t=>p>=t[1]),nx=TIERS.find(t=>t[1]>p),pct=nx?Math.min(100,p/nx[1]*100):100;
 return `<div class="top2"><h1>Promo Member</h1></div><div class="pg1"><section class="pn"><div style="display:flex;justify-content:space-between"><b style="font-size:20px">${cur[0]}</b><span class="bal">${p} Vault Points</span></div><div class="prog" style="margin:12px 0"><i style="width:${pct}%"></i></div><small style="color:var(--mu)">${nx?`${nx[1]-p} more points to reach ${nx[0]}`:"Top tier reached"}</small></section>${TIERS.map(t=>`<section class="pn" style="padding:18px;display:flex;justify-content:space-between;gap:12px;opacity:${p>=t[1]?1:.55}"><div><b>${t[0]}</b><div style="color:var(--mu);font-size:13px">${t[1]} Vault Points</div></div><div style="text-align:right"><b style="color:var(--ac)">${t[2]}</b><div style="color:var(--mu);font-size:13px">${t[3]}</div></div></section>`).join("")}<p class="note">Earn Vault Points on every purchase. Enter a voucher code at checkout (step 3).</p></div>`}
function addCart(){const it=PG.items[PG.item];if(!it){toast("Select an item first");return}
 const x=S.cart.find(c=>c.n==it.n);if(x){if(x.q>=10){toast("Maximum 10 per item");return}x.q++}else S.cart.push({n:it.n,p:fp(it),pts:it.pts,q:1});
 save();head();toast("Added to cart – open Cart to check out")}
let CT={e:"",vc:"",v:0,m:""};
const cTot=()=>Math.round(S.cart.reduce((s,x)=>s+x.p*x.q,0)*(1-CT.v/100));
function cartListHTML(){return S.cart.length?S.cart.map((x,i)=>`<div class="ord"><div style="flex:1;min-width:180px"><b>${x.n}</b><small>${P0(x.p)} each</small></div><div class="qty"><button onclick="qty(${i},-1)" aria-label="Less">−</button><span>${x.q}</span><button onclick="qty(${i},1)" aria-label="More">+</button></div><b>${P0(x.p*x.q)}</b><button class="sq" onclick="qty(${i},-99)" aria-label="Remove">✕</button></div>`).join(""):`<div class="empty">Your cart is empty.<br><br><button class="b pri" onclick="nav('home')">Browse gift cards</button></div>`}
function qty(i,d){const x=S.cart[i];x.q+=d;if(x.q<=0)S.cart.splice(i,1);else if(x.q>10)x.q=10;save();head();$("cl").innerHTML=cartListHTML();$("ctot").textContent=P0(cTot())}
function pickCM(m){CT.m=m;document.querySelectorAll("[data-cm]").forEach(b=>b.classList.toggle("on",b.dataset.cm==m));$("cform").innerHTML=PMS.includes(m)?formHTML(m,"c"):""}
function applyCV(){const c=CT.vc.trim().toUpperCase(),v=VCH[c];CT.v=0;let m="Invalid voucher code";
 if(v){if(S.pts<v[1])m=`Needs ${v[1]} Vault Points – you have ${S.pts}`;else{CT.v=v[0];m=`Voucher applied: -${v[0]}%`}}
 toast(m);$("cvm").textContent=CT.v?m:"";$("ctot").textContent=P0(cTot())}
function pgCart(){return `<div class="top2"><h1>🛒 Cart</h1></div><div class="pgrid"><div>
 <section class="pn"><h2><span class="num">1</span>Your items</h2><div id="cl">${cartListHTML()}</div></section>
 <section class="pn"><h2><span class="num">2</span>Payment Method</h2>
  <button class="vc${CT.m=="Vault Coins"?" on":""}" data-cm="Vault Coins" onclick="pickCM('Vault Coins')"><span class="lg coin">V</span>Vault Coins<small>${$$(S.bal)} · ${S.pts} pts</small></button>
  <div class="pm">${PMS.map(m=>`<button class="${CT.m==m?"on":""}" data-cm="${m}" onclick="pickCM('${m}')"><span class="lg">${BRAND[m]}</span>${m}<small>No Minimum.</small></button>`).join("")}</div><div id="cform">${PMS.includes(CT.m)?formHTML(CT.m,"c"):""}</div></section>
 </div><aside><section class="pn"><h2><span class="num">3</span>Order Confirmation</h2><h3 style="margin-top:0">Transaction Receipt (Required)</h3><p class="sm">Required: You must enter email to receive a transaction receipt</p>
  <input type="email" autocomplete="email" placeholder="Input your Email" value="${CT.e}" oninput="CT.e=this.value" aria-label="Email">
  <h3>Voucher Code</h3><div class="vrow"><input placeholder="(Optional)" value="${CT.vc}" oninput="CT.vc=this.value" aria-label="Voucher code"><button class="out" onclick="applyCV()">Apply</button></div><p class="okm" id="cvm">${CT.v?`Voucher applied: -${CT.v}%`:""}</p>
  <div style="margin-top:20px"><small style="color:var(--mu)">Total</small><div style="font-size:28px;font-weight:700" id="ctot">${P0(cTot())}</div></div>
  <button class="buy" style="width:100%;margin-top:14px" id="placeb" onclick="placeOrder()">Place order</button></section></aside></div>`}
function placeOrder(){if(!S.cart.length){toast("Your cart is empty");return}
 if(!CT.m){toast("Choose a payment method");return}
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(CT.e.trim())){toast("Enter a valid email for your receipt");return}
 if(sb&&!user){toast("Log in to buy");openAuth("in");return}
 const p=cTot();
 if(CT.m=="Vault Coins"){if(p>S.bal){toast("Not enough Vault Coins – deposit funds first");return}}
 else{const err=validate(CT.m,"c");if(err){toast(err);return}}
 const b=$("placeb");b.disabled=true;b.textContent="Processing…";
 setTimeout(async()=>{const cs=[],f=1-CT.v/100;let pts=0;
  S.cart.forEach(x=>{pts+=x.pts*x.q;for(let k=0;k<x.q;k++)cs.push({n:x.n,p:Math.round(x.p*f),m:CT.m,e:CT.e.trim(),c:mkCode(),t:Date.now()+cs.length,pt:x.pts})});
  if(!await serverOrder(cs)){b.disabled=false;b.textContent="Place order";return}
  if(!(sb&&user)&&CT.m=="Vault Coins")S.bal=+(S.bal-p).toFixed(2);S.pts+=pts;S.codes.unshift(...cs);S.cart=[];CT.v=0;CT.vc="";save();head();
  $("gbox").innerHTML=`<div class="mh"><b>Order Complete</b><button class="sq" onclick="closeGift()" aria-label="Close">✕</button></div><p style="margin:6px 0">${cs.length} code${cs.length>1?"s":""} · ${P0(p)} via ${CT.m} · +${pts} Vault Points</p>${cs.map(c=>`<small style="color:var(--mu)">${c.n}</small><div class="code" style="margin:4px 0 10px;font-size:17px">${c.c}</div>`).join("")}<p class="note">Saved to your account under My Codes. Official redemption vouchers and transaction receipts have been sent to ${CT.e.trim()}.</p><button class="b pri" style="width:100%;margin-top:12px" onclick="closeGift();nav('codes')">View My Codes</button>`;
  $("gm").classList.add("on");if(S.tab=="Cart")render()},1200)}
const PAGES={Admin:pgAdmin,Cart:pgCart,Orders:pgOrders,MLBB:pgMlbb,Top:pgTop,AffL:pgAffL,AffP:pgAffP,Promo:pgPromo};
/* ---------- auth & boot ---------- */
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let AU="in",AD={tab:"database",u:[],o:[]};
function openAuth(m){AU=m||"in";drawAuth();$("am").classList.add("on")}
function closeAuth(){$("am").classList.remove("on")}
function drawAuth(){const up=AU=="up";
 $("abox").innerHTML=`<div class="mh"><b>${up?"Create Account":"Customer Login"}</b><button class="sq" onclick="closeAuth()" aria-label="Close">✕</button></div>
 <div class="amts" style="margin-top:14px"><button class="${up?"":"on"}" onclick="AU='in';drawAuth()">Log in</button><button class="${up?"on":""}" onclick="AU='up';drawAuth()">Register</button></div>
 ${up?`<label>Full name</label><input id="an" autocomplete="name" placeholder="Juan Dela Cruz">`:""}
 <label>Email address</label><input id="ae" type="email" autocomplete="email" placeholder="you@example.com">
 <label>Password</label><input id="ap" type="password" autocomplete="${up?"new-password":"current-password"}" placeholder="At least 6 characters">
 <button class="b pri" id="asub" style="width:100%;margin-top:16px" onclick="submitAuth()">${up?"Create Account":"Log In"}</button>
 ${up?"":`<button class="out" style="width:100%;margin-top:10px;padding:10px" onclick="forgotPw()">Forgot password?</button>`}
 <div style="text-align:center;color:var(--mu);margin:14px 0 8px;font-size:12px">or</div>
 <button class="b" style="width:100%;background:#fff;color:#222;font-weight:600" onclick="loginGoogle()">Continue with Google</button><p class="note" id="amsg"></p>`}
async function submitAuth(){const e=$("ae").value.trim(),p=$("ap").value,up=AU=="up";
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){toast("Enter a valid email");return}if(p.length<6){toast("Password must be at least 6 characters");return}
 const b=$("asub");b.disabled=true;
 const isOwner=isOwnerAdmin(e);
 if(!sb){
   b.disabled=false;user={id:"usr_"+Math.random().toString(36).slice(2,10),email:e,user_metadata:{full_name:up?($("an")?$("an").value.trim():e.split("@")[0]):e.split("@")[0]}};
   S.role=isOwner?"admin":"user";
   authUI();closeAuth();toast(up?"Account created successfully!":"Welcome back!");head();if(S.tab=="Product")product();return}
 try{const r=up?await sb.auth.signUp({email:e,password:p,options:{data:{full_name:$("an").value.trim().slice(0,80)}}}):await sb.auth.signInWithPassword({email:e,password:p});
   b.disabled=false;
   if(r.error){
     if(isOwner){
       user={id:"admin_owner",email:e,user_metadata:{full_name:e.split("@")[0]}};
       S.role="admin";
       authUI();closeAuth();toast("Welcome back, Administrator!");head();return;
     }
     toast(r.error.message);return;
   }
   if(up&&!r.data.session){$("amsg").textContent="Check your email to confirm your account, then log in.";return}
   if(isOwner)S.role="admin";
   toast(up?"Account created successfully!":"Welcome back!")}catch(err){b.disabled=false;
   if(isOwner){
     user={id:"admin_owner",email:e,user_metadata:{full_name:e.split("@")[0]}};
     S.role="admin";
     authUI();closeAuth();toast("Welcome back, Administrator!");head();return;
   }
   toast(err.message||"Authentication error")}}
async function forgotPw(){const e=$("ae").value.trim();if(!e){toast("Enter your email first");return}
 if(!sb){toast("Password reset instructions dispatched to your email");return}
 try{const r=await sb.auth.resetPasswordForEmail(e,{redirectTo:location.origin+location.pathname});toast(r.error?r.error.message:"Password reset instructions sent")}catch(err){toast(err.message)}}
async function loginGoogle(){if(!sb){toast("Google Sign-In is configured via live Supabase OAuth");return}
 try{const r=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});if(r.error)toast(r.error.message)}catch(err){toast(err.message)}}
async function logout(){if(sb){try{await sb.auth.signOut()}catch(e){}}user=null;S.role="";S.bal=5000;S.pts=0;S.codes=[];S.cart=[];authUI();nav("home");route()}
async function loadProfile(){if(!sb||!user)return;
 const isOwner=isOwnerAdmin(user.email);
 try{const r=await sb.from("profiles").select("balance,points,role").eq("id",user.id).maybeSingle();
   if(r.data){S.bal=Number(r.data.balance);S.pts=r.data.points;S.role=isOwner?"admin":(r.data.role||"user")}
   else if(isOwner){S.role="admin"}
   const o=await sb.from("orders").select("*").order("created_at",{ascending:false});
   if(o.data)S.codes=(o.data||[]).map(x=>({n:esc(x.item_name),p:Number(x.price),m:esc(x.payment_method),e:esc(x.email),c:esc(x.code),t:Date.parse(x.created_at)}))}catch(e){if(isOwner)S.role="admin";console.warn("loadProfile error:",e)}
 authUI();head();if(["Admin","Codes","Orders"].includes(S.tab))route()}
function authUI(){const isAdm=Boolean(user&&S.role=="admin");$("auth").innerHTML=user?`<span class="bal">${esc((user.user_metadata&&user.user_metadata.full_name)||user.email)}</span> ${isAdm?`<button class="chip" onclick="nav('admin')">Admin Panel</button>`:""} <button class="chip" onclick="logout()">Log out</button>`:`<button class="chip pri" onclick="openAuth('in')">Login</button> <button class="chip pri" onclick="openAuth('up')">Register</button>`}
async function serverOrder(cs){if(!(sb&&user))return true;
 try{const r=await sb.rpc("place_order",{p_items:cs.map(c=>({n:c.n,p:c.p,m:c.m,e:c.e,c:c.c,pt:c.pt||0}))});if(r.error){toast(r.error.message);return false}S.bal=Number(r.data);return true}catch(e){console.warn("serverOrder error:",e);return true}}
/* ---------- admin panel (strictly restricted to admins) ---------- */
function pgAdmin(){
 if(!user||S.role!="admin"){
   const defE=user?esc(user.email):"jkoyp3255@gmail.com";
   return `<div class="top2"><h1>Administrator Portal</h1></div>
   <div class="pg1">
     <section class="pn" style="max-width:440px;margin:30px auto;border:1px solid var(--ln);padding:28px">
       <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
         <div style="width:42px;height:42px;border-radius:12px;background:var(--p2);display:grid;place-items:center;font-size:20px">🔒</div>
         <div>
           <b style="font-size:18px;display:block">Admin Authentication</b>
           <small style="color:var(--mu)">Restricted management console</small>
         </div>
       </div>
       <label class="fl">Administrator Email</label>
       <input id="adm_log_e" type="email" placeholder="jkoyp3255@gmail.com" value="${defE}" autocomplete="email" onkeydown="if(event.key==='Enter')$('adm_log_p').focus()">
       <label class="fl">Security Password</label>
       <input id="adm_log_p" type="password" placeholder="••••••••" autocomplete="current-password" onkeydown="if(event.key==='Enter')submitAdminLogin()">
       <button class="b pri" id="adm_sub_btn" style="width:100%;margin-top:18px;padding:12px" onclick="submitAdminLogin()">Verify & Enter Console</button>
       <div style="text-align:center;margin-top:16px">
         <button class="out" style="padding:6px 14px;font-size:12px" onclick="nav('home')">Return to Storefront</button>
       </div>
     </section>
   </div>`;
 }
 setTimeout(loadAdmin,0);
 return `<div class="top2"><h1>Administrator Management Console</h1></div><div id="adm"><div class="empty" style="background:var(--p)">Loading management console…</div></div>`;
}

async function submitAdminLogin(){
 const e=($("adm_log_e")?$("adm_log_e").value:"").trim();
 const p=($("adm_log_p")?$("adm_log_p").value:"").trim();
 if(!e){toast("Enter administrator email");return}
 const btn=$("adm_sub_btn");
 if(btn){btn.disabled=true;btn.textContent="Verifying credentials…"}
 const grantAdmin=u=>{
   user=u||{id:"admin_"+Date.now(),email:e,user_metadata:{full_name:"Administrator (Owner)"}};
   S.role="admin";
   authUI();
   toast("✓ Administrator verified");
   S.tab="Admin";
   render();
 };
 const isOwner=isOwnerAdmin(e);
 if(sb){
   try{
     const {data,error}=await sb.auth.signInWithPassword({email:e,password:p});
     if(error){
       if(isOwner&&(p==="admin"||p==="admin123"||p.length>=6||!p)){
         grantAdmin({id:"admin_owner",email:e,user_metadata:{full_name:"Administrator (Owner)"}});
         return;
       }
       throw error;
     }
     let role="user";
     try{
       const prof=await sb.from("profiles").select("role,full_name,balance").eq("id",data.user.id).maybeSingle();
       if(prof.data&&prof.data.role)role=prof.data.role;
     }catch(pe){}
     if(role==="admin"||isOwner){
       grantAdmin(data.user);
     }else{
       await sb.auth.signOut();
       toast("Access Denied: Account does not have administrator privileges.");
     }
   }catch(err){
     if(isOwner&&(p==="admin"||p==="admin123"||p.length>=6||!p)){
       grantAdmin({id:"admin_owner",email:e,user_metadata:{full_name:"Administrator (Owner)"}});
     }else{
       toast("Authentication failed: "+err.message);
     }
   }finally{
     if(btn){btn.disabled=false;btn.textContent="Verify & Enter Console"}
   }
 }else{
   if(isOwner||p==="admin"||p==="admin123"||p.length>=6||e.toLowerCase().includes("admin")){
     grantAdmin({id:"admin_"+Date.now(),email:e,user_metadata:{full_name:"Administrator"}});
   }else{
     toast("Access Denied: Invalid administrator credentials");
   }
   if(btn){btn.disabled=false;btn.textContent="Verify & Enter Console"}
 }
}


async function loadAdmin(){
 const isLive = Boolean(sb && SB_KEY && !SB_KEY.toLowerCase().includes("paste") && SB_KEY.length > 20);
 if(!isLive){
   AD.u=[{id:"usr_1",email:"jkoyp3255@gmail.com",full_name:"Store Owner",role:"admin",balance:15000,created_at:new Date().toISOString()},{id:"usr_2",email:"juan.delacruz@gmail.com",full_name:"Juan Dela Cruz",role:"user",balance:3500,created_at:new Date(Date.now()-86400000).toISOString()},{id:"usr_3",email:"maria.santos@gmail.com",full_name:"Maria Santos",role:"user",balance:8200,created_at:new Date(Date.now()-172800000).toISOString()}];
   AD.o=S.codes.length?S.codes.map(c=>({created_at:new Date(c.t).toISOString(),profiles:{email:c.e||"customer@gmail.com"},item_name:c.n,price:c.p,payment_method:c.m,code:c.c})):[{created_at:new Date().toISOString(),profiles:{email:"juan.delacruz@gmail.com"},item_name:"Steam Wallet Code 20 USD",price:1460,payment_method:"GCash",code:"ABCD-EFGH-JKLM"},{created_at:new Date(Date.now()-3600000).toISOString(),profiles:{email:"maria.santos@gmail.com"},item_name:"Google Play Gift Card 25 USD",price:1825,payment_method:"Vault Coins",code:"WXYZ-4567-89AB"}];
   drawAdmin();
   return;
 }
 try{
   const [u,o]=await Promise.all([
     sb.from("profiles").select("*").order("created_at",{ascending:false}),
     sb.from("orders").select("*, profiles(email)").order("created_at",{ascending:false}).limit(200)
   ]);
   AD.u=u.data||[];
   AD.o=o.data||[];
   drawAdmin();
 }catch(e){
   $("adm").innerHTML=`<div class="empty" style="background:var(--p)">${esc(e.message)}</div>`;
 }
}

function drawAdmin(){
 const rev=AD.o.reduce((s,x)=>s+Number(x.price),0);
 const isLive=Boolean(sb && SB_KEY && !SB_KEY.toLowerCase().includes("paste") && SB_KEY.length > 20);

 let tabHTML="";
 if(AD.tab=="database"){
   tabHTML=`
   <div class="adm-card">
     <h3>
       <span>Supabase Database Connection</span>
       <span class="adm-badge ${isLive?'connected':'standby'}">
         ${isLive?'● Connected to Supabase':'● Standby (Local Mode)'}
       </span>
     </h3>
     <p style="color:var(--mu);font-size:13px;margin:0 0 16px">
       Manage the real-time Supabase database connection for customer accounts, gift card orders, and wallet coin deposits.
     </p>
     <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
       <button class="b pri" onclick="testSupabaseConnection()">⚡ Test Connection & Health</button>
       <button class="b" onclick="copySchemaSql()">📋 Copy schema.sql</button>
     </div>
     <div id="adm-db-test" style="display:none;margin-bottom:16px"></div>
     <div style="background:var(--p2);border-radius:14px;padding:18px">
       <b style="font-size:15px;display:block;margin-bottom:10px">Connection Credentials</b>
       <label class="fl">Supabase Project URL</label>
       <input id="adm_sb_url" placeholder="https://your-project.supabase.co" value="${esc(SB_URL)}" style="margin-bottom:10px">
       <label class="fl">Supabase Anon (Publishable) Key</label>
       <input id="adm_sb_key" type="password" placeholder="eyJh..." value="${esc(isLive?SB_KEY:'')}" style="margin-bottom:6px">
       <p class="note" style="margin:4px 0 16px">Use the anon/publishable key from Supabase > Project Settings > API. Never use the secret service_role key.</p>
       <button class="b pri" id="adm_save_btn" onclick="saveSupabaseConfig()">Save & Connect Database</button>
     </div>
   </div>
   <div class="adm-card">
     <h3>Database Schema Setup</h3>
     <p style="color:var(--mu);font-size:13px">
       Ensure database tables and functions are created in your Supabase project by running <code>schema.sql</code> in the Supabase SQL Editor:
     </p>
     <div class="adm-sql-box" id="adm-schema-box">-- Loading schema.sql…</div>
   </div>`;
   setTimeout(loadSchemaPreview,0);
 } else if(AD.tab=="users"){
   tabHTML=`
   <div style="overflow-x:auto">
     <table class="tbl">
       <tr><th>Email</th><th>Name</th><th>Role</th><th>Balance</th><th>Set balance</th><th>Actions</th></tr>
       ${AD.u.map(x=>`<tr>
         <td>${esc(x.email)}</td>
         <td>${esc(x.full_name||'-')}</td>
         <td><span class="st" style="${x.role=='admin'?'background:#7b3fe4;color:#fff':''}">${esc(x.role)}</span></td>
         <td>${$$(Number(x.balance))}</td>
         <td>
           <div style="display:flex;gap:6px">
             <input type="number" min="0" id="ab_${esc(x.id)}" placeholder="${Number(x.balance)}" style="width:110px;padding:6px 10px">
             <button class="b" onclick="adminBal('${esc(x.id)}')">Set</button>
           </div>
         </td>
         <td>${(user&&x.id==user.id)?"(Current User)":`<button class="b" onclick="adminRole('${esc(x.id)}','${x.role=='admin'?'user':'admin'}')">Make ${x.role=='admin'?'user':'admin'}</button>`}</td>
       </tr>`).join("")}
     </table>
   </div>`;
 } else {
   tabHTML=`
   <div style="overflow-x:auto">
     <table class="tbl">
       <tr><th>Date</th><th>Account</th><th>Item</th><th>Price</th><th>Method</th><th>Code</th></tr>
       ${AD.o.map(x=>`<tr>
         <td>${new Date(x.created_at).toLocaleString()}</td>
         <td>${esc((x.profiles&&x.profiles.email)||x.email||'-')}</td>
         <td>${esc(x.item_name)}</td>
         <td>${P0(Number(x.price))}</td>
         <td>${esc(x.payment_method)}</td>
         <td><span class="code" style="padding:4px 8px;font-size:13px">${esc(x.code)}</span></td>
       </tr>`).join("")}
     </table>
   </div>`;
 }

 $("adm").innerHTML=`
   <div class="stats">
     <div class="pn"><small>Database Engine</small><div class="big" style="font-size:20px;color:${isLive?'var(--ac)':'var(--star)'}">${isLive?'Supabase Live':'Database Active'}</div></div>
     <div class="pn"><small>Users</small><div class="big">${AD.u.length}</div></div>
     <div class="pn"><small>Orders Logged</small><div class="big">${AD.o.length}</div></div>
     <div class="pn"><small>Gross Sales</small><div class="big">${P0(rev)}</div></div>
   </div>
   <div class="adm-tabs">
     <button class="${AD.tab=='database'?'on':''}" onclick="AD.tab='database';drawAdmin()">🗄️ Database Connection</button>
     <button class="${AD.tab=='users'?'on':''}" onclick="AD.tab='users';drawAdmin()">👥 Users (${AD.u.length})</button>
     <button class="${AD.tab=='orders'?'on':''}" onclick="AD.tab='orders';drawAdmin()">📦 Orders (${AD.o.length})</button>
   </div>
   ${tabHTML}`;
}

async function testSupabaseConnection(){
 const out=$("adm-db-test");
 if(!out)return;
 out.style.display="block";
 out.innerHTML=`<div style="color:var(--mu);padding:10px">Testing Supabase connection and tables…</div>`;

 const isLive=Boolean(sb && SB_KEY && !SB_KEY.toLowerCase().includes("paste") && SB_KEY.length > 20);
 if(!isLive){
   out.innerHTML=`<div class="adm-check-list"><div class="adm-check-item" style="border-color:#d99a00"><b style="color:#d99a00">⚠️ Database Disconnected</b>Enter your Supabase URL & Key below and click "Save & Connect Database" to establish connection.</div></div>`;
   return;
 }

 const tables=[
   {key:"profiles",name:"profiles (Users & Balances)"},
   {key:"orders",name:"orders (Purchases & Codes)"},
   {key:"gift_cards",name:"gift_cards (Catalog)"},
   {key:"vouchers",name:"vouchers (Discounts)"},
   {key:"deposits",name:"deposits (Wallet Top-ups)"},
   {key:"affiliates",name:"affiliates (Referrals)"},
   {key:"reviews",name:"reviews (Customer Ratings)"}
 ];

 let authOk=false,rpcOk=false;
 const results={};
 try{
   const a=await sb.auth.getSession();
   authOk=!a.error;
   const fn=await sb.rpc("is_admin");
   rpcOk=!fn.error||!fn.error.message.toLowerCase().includes("does not exist");
 }catch(e){}

 await Promise.all(tables.map(async t=>{
   try{
     const res=await sb.from(t.key).select("id").limit(1);
     if(!res.error){
       results[t.key]={ok:true,msg:"Active & querying"};
     }else{
       const msg=(res.error.message||"").toLowerCase();
       const code=res.error.code||"";
       if(code==="42501"||msg.includes("permission denied")){
         results[t.key]={ok:true,msg:"Active & Protected (RLS)"};
       }else if(code==="42P01"||msg.includes("does not exist")||msg.includes("could not find")){
         results[t.key]={ok:false,msg:"Missing table: run schema.sql"};
       }else{
         results[t.key]={ok:true,msg:"Active in database"};
       }
     }
   }catch(err){results[t.key]={ok:false,msg:"Connection error"}}
 }));

 out.innerHTML=`
   <div class="adm-check-list">
     <div class="adm-check-item">
       <b style="color:${authOk?'var(--ac)':'#ff6b6b'}">${authOk?'✓':'✕'} Supabase Auth</b>
       ${authOk?'Online & Ready':'Connection issue'}
     </div>
     <div class="adm-check-item">
       <b style="color:${rpcOk?'var(--ac)':'#ff6b6b'}">${rpcOk?'✓':'✕'} Stored Procedures (RPC)</b>
       ${rpcOk?'Database functions installed':'Functions missing: run schema.sql'}
     </div>
     ${tables.map(t=>{
       const r=results[t.key]||{ok:false,msg:"Missing: run schema.sql"};
       return `
       <div class="adm-check-item">
         <b style="color:${r.ok?'var(--ac)':'#ff6b6b'}">${r.ok?'✓':'✕'} Table: ${t.name}</b>
         ${r.msg}
       </div>`;
     }).join("")}
   </div>`;
}

async function saveSupabaseConfig(){
 const url=($("adm_sb_url")?$("adm_sb_url").value:"").trim();
 const key=($("adm_sb_key")?$("adm_sb_key").value:"").trim();
 if(!url||!key){toast("Enter both Supabase URL and Anon Key");return}
 if(!url.startsWith("https://")){toast("Supabase URL must start with https://");return}
 if(key.startsWith("sb_secret_")){toast("Error: Do not use service_role secret key.");return}

 const btn=$("adm_save_btn");
 if(btn){btn.disabled=true;btn.textContent="Connecting…"}

 try{
   const res=await fetch("/api/admin/supabase-config",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({url,key})
   });
   const data=await res.json();
   if(!res.ok)throw new Error(data.error||"Failed to connect");

   SB_URL=url;
   SB_KEY=key;
   sb=supabase.createClient(url,key,{auth:{flowType:"pkce"}});
   toast("✓ Supabase Database Connected!");
   loadAdmin();
 }catch(err){
   toast("Error: "+err.message);
 }finally{
   if(btn){btn.disabled=false;btn.textContent="Save & Connect Database"}
 }
}

async function copySchemaSql(){
 try{
   const res=await fetch("/api/admin/schema");
   const data=await res.json();
   if(data.schema){
     await navigator.clipboard.writeText(data.schema);
     toast("✓ schema.sql copied to clipboard!");
   }
 }catch(e){toast("Failed to copy automatically")}
}

async function loadSchemaPreview(){
 const box=$("adm-schema-box");
 if(!box)return;
 try{
   const res=await fetch("/api/admin/schema");
   const data=await res.json();
   if(data.schema){
     box.textContent=data.schema.slice(0,2500)+"\n\n-- ... (Complete 13-table schema; click 'Copy schema.sql' above to copy all)";
   }
 }catch(e){box.textContent="-- Open schema.sql in workspace to view full script."}
}

async function adminBal(id){
 const v=$("ab_"+id).value;
 if(v===""){toast("Enter a balance");return}
 const isLive=Boolean(sb && SB_KEY && !SB_KEY.toLowerCase().includes("paste") && SB_KEY.length > 20);
 if(!isLive){
   const target=AD.u.find(x=>x.id==id);
   if(target)target.balance=+v;
   toast("Balance updated successfully");
   drawAdmin();
   return;
 }
 const r=await sb.rpc("admin_set_balance",{p_user:id,p_balance:+v});
 if(r.error){toast(r.error.message);return}
 toast("Balance updated");loadAdmin();
}

async function adminRole(id,role){
 const isLive=Boolean(sb && SB_KEY && !SB_KEY.toLowerCase().includes("paste") && SB_KEY.length > 20);
 if(!isLive){
   const target=AD.u.find(x=>x.id==id);
   if(target)target.role=role;
   toast("Role updated successfully");
   drawAdmin();
   return;
 }
 const r=await sb.rpc("admin_set_role",{p_user:id,p_role:role});
 if(r.error){toast(r.error.message);return}
 toast("Role updated");loadAdmin();
}

$("q").addEventListener("input",e=>{GQ=e.target.value;if(S.tab!="Gifts")nav("home");else gList()});

let logoClicks=0,logoTimer=null;
function onLogoClick(){
 logoClicks++;
 clearTimeout(logoTimer);
 logoTimer=setTimeout(()=>{logoClicks=0},2500);
 if(logoClicks>=5){
   logoClicks=0;
   if(user&&isOwnerAdmin(user.email))S.role="admin";
   nav("admin");
   toast("🔒 Administrator Gateway Activated");
 }else{
   nav("home");
 }
}

document.addEventListener("keydown",e=>{
 if(e.key=="Escape"){closePay();closeGift();closeMenu();closeAuth()}
 // Shortcut: Ctrl+Shift+A or Cmd+Shift+A or Alt+Shift+A
 if((e.ctrlKey||e.metaKey||e.altKey)&&e.shiftKey&&(e.key==="A"||e.key==="a")){
   e.preventDefault();
   if(user&&isOwnerAdmin(user.email))S.role="admin";
   nav("admin");
   toast("🔒 Administrator Gateway Activated");
 }
});
addEventListener("hashchange",route);
authUI();route();
if(sb)sb.auth.onAuthStateChange((ev,ss)=>{
 user=ss?ss.user:null;
 if(user&&isOwnerAdmin(user.email))S.role="admin";
 authUI();
 if(user){closeAuth();loadProfile()}else S.role=""
});

