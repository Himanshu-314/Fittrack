/* FITTRACK 12 - Smart nutrition tracker. Depends on foods.js (FoodDB) and app.js (data, persist, helpers). */
"use strict";

const NUTS=FoodDB.NUTS,NKEYS=FoodDB.NKEYS;
const TARGET_KEY={calories:"calorieTarget",protein:"proteinTarget",carbs:"carbTarget",fat:"fatTarget",fibre:"fibreTarget",calcium:"calciumTarget",iron:"ironTarget",potassium:"potassiumTarget",sodium:"sodiumLimit",magnesium:"magnesiumTarget",vitC:"vitCTarget"};
const MEALS=["Breakfast","Lunch","Snack","Dinner","Other"];
const nutLabel=k=>NUTS.find(n=>n[0]===k);
let nutUI={view:"today",date:today(),method:"photo",range:"week"};
let draft=newDraft();
function newDraft(){return {active:false,items:[],replaceId:null,replaceDate:null,mid:null,meal:"",date:null,photo:null,aiBusy:false}}
function guessMeal(){const h=new Date().getHours();return h<11?"Breakfast":h<15?"Lunch":h<18?"Snack":"Dinner"}

/* ---------- totals ---------- */
function dayEntries(date){return (data.foods[date]||[])}
function sumEntries(list){const t={};NKEYS.forEach(k=>t[k]=0);list.forEach(e=>NKEYS.forEach(k=>t[k]+=num(e[k])));return t}
function dayTotals(date){return sumEntries(dayEntries(date))}

/* ---------- init ---------- */
function initNutrition(){
 $("foodlist").innerHTML=FoodDB.FOODS.map(f=>`<option value="${esc(f.name)}"></option>`).join("");
 $("quickMeal").innerHTML=MEALS.map(m=>`<option>${m}</option>`).join("");
 window.addEventListener("online",refreshAIState);window.addEventListener("offline",refreshAIState);
}
function aiReady(){return !!(data.settings.aiEndpoint&&data.settings.aiEndpoint.trim())&&navigator.onLine!==false}
function refreshAIState(){
 const has=!!(data.settings.aiEndpoint||"").trim(),on=navigator.onLine!==false;
 ["aiPhotoBtn","aiTextBtn"].forEach(id=>{const b=$(id);if(b){b.disabled=!(has&&on)}});
 const ps=$("photoStatus");
 if(ps&&!draft.aiBusy&&!ps.dataset.sticky){ps.textContent=!has?"AI photo analysis isn't set up, so use “Build meal manually” below: search the foods you can see and set portion sizes. (Setup guide: Settings → Smart nutrition.)":!on?"You're offline — AI analysis is paused. You can still build the meal manually.":"Pick a photo, then tap Analyse. You can correct everything before saving."}
 const ts=$("textStatus");if(ts&&!ts.dataset.sticky){ts.textContent=has&&!on?"Offline: the built-in estimator still works. “Refine with AI” needs internet.":"Works offline using the built-in food list. You can correct everything before saving."}
}

/* ---------- views ---------- */
function setNutView(v){nutUI.view=v;renderNutrition()}
function setMethod(m){nutUI.method=m;renderNutrition()}
function setNutDate(d){if(d){nutUI.date=d;renderNutrition()}}
function shiftNutDate(n){nutUI.date=addDays(nutUI.date,n);renderNutrition()}
function setHistRange(r){nutUI.range=r;renderNutrition()}
function renderNutrition(){
 document.querySelectorAll("#nutSeg button").forEach(b=>b.classList.toggle("active",b.dataset.v===nutUI.view));
 $("nToday").hidden=nutUI.view!=="today";$("nAdd").hidden=nutUI.view!=="add";$("nHistory").hidden=nutUI.view!=="history";
 if(nutUI.view==="today")renderDay();
 else if(nutUI.view==="add"){
  document.querySelectorAll("#methodBtns button").forEach(b=>b.classList.toggle("active",b.dataset.m===nutUI.method));
  $("mPhoto").hidden=nutUI.method!=="photo";$("mText").hidden=nutUI.method!=="text";$("mQuick").hidden=nutUI.method!=="quick";
  $("quickDate").value=$("quickDate").value||nutUI.date;if(!$("quickMeal").value||$("quickMeal").dataset.set!=="1"){$("quickMeal").value=guessMeal();$("quickMeal").dataset.set="1"}
  refreshAIState();renderEditor();
 }else renderHistory();
}

/* ---------- dashboard ---------- */
function pct(v,t){return t>0?Math.min(100,v/t*100):0}
function renderDay(){
 const date=nutUI.date,isToday=date===today(),t=dayTotals(date),S=data.settings;
 $("nutDate").value=date;
 $("dayLabel").textContent=isToday?"Today":new Date(date+"T12:00:00").toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"short"});
 $("logTitle").textContent=isToday?"Today's food log":"Food log · "+fmtDate(date);
 const kt=S.calorieTarget;$("kcalBig").textContent=fmtN(t.calories)+" / "+fmtN(kt)+" kcal";
 $("kcalBar").style.width=pct(t.calories,kt)+"%";$("kcalBarWrap").className="progressbar"+(t.calories>kt*1.1?" over":"");
 $("kcalHint").textContent=t.calories<=kt?fmtN(kt-t.calories)+" kcal remaining":fmtN(t.calories-kt)+" kcal over target";
 const pt=S.proteinTarget;
 $("mProtein").textContent=fmtN(t.protein,1)+" g";$("mProteinT").textContent="Protein · target "+pt+" g";$("proteinBar").style.width=pct(t.protein,pt)+"%";
 $("mCarbs").textContent=fmtN(t.carbs,1)+" g";$("mCarbsT").textContent="Carbs · target "+S.carbTarget+" g";$("carbBar").style.width=pct(t.carbs,S.carbTarget)+"%";
 $("mFat").textContent=fmtN(t.fat,1)+" g";$("mFatT").textContent="Fat · target "+S.fatTarget+" g";$("fatBar").style.width=pct(t.fat,S.fatTarget)+"%";
 $("proteinBig").textContent=fmtN(t.protein,1)+" / "+pt+" g";
 $("proteinHint").textContent=t.protein>=pt?"Daily protein target reached.":fmtN(pt-t.protein,1)+" g protein to target.";
 $("microList").innerHTML=["fibre","calcium","iron","potassium","sodium","magnesium","vitC"].map(k=>{
  const n=nutLabel(k),tg=S[TARGET_KEY[k]],v=t[k],limit=k==="sodium",p=pct(v,tg);
  const cls=limit?(v>tg?"over":v>tg*0.8?"warn":""):"";
  return `<div class="micro"><span>${n[1]}</span><div class="progressbar ${cls}"><i style="width:${p}%"></i></div><span class="v">${fmtN(v,n[2]==="g"?1:0)} / ${limit?"≤ ":""}${fmtN(tg)} ${n[2]}</span></div>`}).join("");
 const list=dayEntries(date);
 $("foodCount").textContent=list.length+" item"+(list.length===1?"":"s");
 if(!list.length){$("foodList").className="empty";$("foodList").textContent=isToday?"Nothing logged today.":"Nothing logged on this day.";return}
 $("foodList").className="";
 const groups={};list.forEach(e=>{(groups[e.meal||""]=groups[e.meal||""]||[]).push(e)});
 const order=[...MEALS,""];let h="";
 order.forEach(m=>{const g=groups[m];if(!g)return;const s=sumEntries(g);
  h+=`<div class="mealhead">${esc(m||"Logged items")}<span>${fmtN(s.calories)} kcal · ${fmtN(s.protein,1)} g protein</span></div>`;
  g.forEach(e=>{
   const est=e.est;const qtxt=e.qty?` · ${esc(e.qty)} ${esc(e.unit||"")}${e.grams&&e.unit!=="g"&&e.unit!=="ml"?" (≈"+e.grams+" g)":""}`:"";
   const bits=[(est?"≈ ":"")+fmtN(e.calories)+" kcal","P "+fmtN(e.protein,1)];if(e.carbs||e.fat){bits.push("C "+fmtN(e.carbs,1));bits.push("F "+fmtN(e.fat,1))}if(e.fibre)bits.push("Fibre "+fmtN(e.fibre,1));
   h+=`<div class="entry"><div><div class="nm">${esc(e.name)}${est?` <span class="est">ESTIMATE</span>`:""}</div><div class="sub">${bits.join(" · ")}${qtxt}</div></div><div class="btns"><button class="secondary" onclick="editEntry('${date}','${esc(e.id)}')" aria-label="Edit">✎</button><button class="danger" onclick="deleteEntry('${date}','${esc(e.id)}')" aria-label="Delete">×</button></div></div>`});
 });
 $("foodList").innerHTML=h;
}
function deleteEntry(date,id){if(!confirm("Delete this entry?"))return;data.foods[date]=(data.foods[date]||[]).filter(e=>e.id!==id);if(!data.foods[date].length)delete data.foods[date];persist();renderNutrition();renderHome()}
function deleteFood(i){const d=today();if(data.foods[d]&&data.foods[d][i]){deleteEntry(d,data.foods[d][i].id)}}   /* kept for backward compatibility */

/* ---------- quick add (original behaviour, extended) ---------- */
function addFood(){
 const name=$("foodName").value.trim(),protein=num($("foodProtein").value),calories=num($("foodCalories").value);
 if(!name||protein<=0){alert("Enter a food name and protein amount.");return}
 const date=$("quickDate").value||today();
 const e={id:uid(),meal:$("quickMeal").value,name,protein,calories,carbs:num($("foodCarbs").value),fat:num($("foodFat").value),src:"manual",est:false,t:Date.now()};
 (data.foods[date]=data.foods[date]||[]).push(e);persist();
 ["foodName","foodProtein","foodCalories","foodCarbs","foodFat"].forEach(id=>$(id).value="");
 nutUI.date=date;nutUI.view="today";renderNutrition();renderHome();toast("Added to your log");
}

/* ---------- editor (shared by photo / description / manual / edit) ---------- */
function activateEditor(){draft.active=true;draft.meal=draft.meal||guessMeal();draft.date=draft.date||nutUI.date;draft.mid=draft.mid||uid()}
function startManualMeal(){activateEditor();renderEditor();setTimeout(()=>{const e=$("foodSearch");if(e)e.focus()},50)}
function cancelDraft(){draft=newDraft();$("photoPrev").hidden=true;$("photoTools").hidden=true;const ps=$("photoStatus");if(ps)delete ps.dataset.sticky;renderNutrition()}
function itemUnitsHtml(it){
 const food=it.fid?FoodDB.FOOD_BY_ID[it.fid]:null;
 let units=FoodDB.availableUnits(food);if(!units.includes(it.unit))units.push(it.unit);
 return units.map(u=>`<option value="${u}" ${u===it.unit?"selected":""}>${esc(FoodDB.DEFAULT_UNIT_LABELS[u]||u)}</option>`).join("");
}
function itemNutText(it){
 const n=FoodDB.roundNut(FoodDB.itemNutrients(it)),g=Math.round(FoodDB.itemGrams(it));
 return `<b>≈ ${fmtN(n.calories)} kcal</b> · P ${n.protein} g · C ${n.carbs} g · F ${n.fat} g · Fibre ${n.fibre} g${it.unit!=="g"&&it.unit!=="ml"&&!it.fixed?` · ≈${g} g`:""}`;
}
function itemDetailsHtml(it){
 const n=FoodDB.roundNut(FoodDB.itemNutrients(it));
 return `<div class="kv">${NUTS.map(x=>`<span>${x[1]}</span><span>${n[x[0]]} ${x[2]}</span>`).join("")}</div>`;
}
function itemHtml(it,k){
 const sizeOn=it.unit!=="g"&&it.unit!=="ml"&&!it.fixed;
 let h=`<div class="item" id="it-${k}"><div class="row"><input list="foodlist" value="${esc(it.name)}" onchange="itemName(${k},this.value)" aria-label="Food name" placeholder="Food name"><button class="danger small" onclick="removeItem(${k})" aria-label="Remove item">×</button></div>`;
 h+=`<div class="itgrid"><input type="number" inputmode="decimal" min="0" step="any" value="${esc(it.qty)}" oninput="itemQty(${k},this.value)" aria-label="Quantity"><select onchange="itemUnit(${k},this.value)" aria-label="Unit">${itemUnitsHtml(it)}</select>${sizeOn?`<select onchange="itemSize(${k},this.value)" aria-label="Size"><option value="small" ${it.size==="small"?"selected":""}>Small</option><option value="medium" ${it.size==="medium"||!it.size?"selected":""}>Medium</option><option value="large" ${it.size==="large"?"selected":""}>Large</option></select>`:`<span></span>`}</div>`;
 if(it.fixed){
  h+=`<div class="custom">${["calories","protein","carbs","fat"].map(f=>`<div><label>${nutLabel(f)[1].slice(0,7)} (${nutLabel(f)[2]})</label><input type="number" inputmode="decimal" min="0" step="any" value="${it.fixed[f]||""}" oninput="itemFixed(${k},'${f}',this.value)"></div>`).join("")}</div><div class="hint">These are your own values for the whole quantity entered.</div>`;
 }
 h+=`<div class="itnut" id="itnut-${k}">${itemNutText(it)}</div>`;
 if(!it.matched&&!it.fixed&&!it.per100)h+=``;
 if(it.flag==="default")h+=`<div class="hint">No quantity given — a typical serving was assumed. Please check.</div>`;
 if(it.flag==="unit")h+=`<div class="hint">That unit isn't defined for this food, so a default weight was used. Please check or switch to grams.</div>`;
 if(it.src==="ai")h+=`<div class="hint" style="color:var(--muted)">AI estimate${it.conf?" ("+esc(it.conf)+" confidence)":""} — please verify.</div>`;
 h+=`<details><summary>All nutrients</summary><div id="itdet-${k}">${itemDetailsHtml(it)}</div></details>`;
 if(!it.fixed)h+=`<div style="margin-top:6px"><button class="secondary small" onclick="useOwnValues(${k})">Enter my own values</button></div>`;
 return h+`</div>`;
}
function totalsHtml(){
 const t=sumEntries(draft.items.map(it=>FoodDB.roundNut(FoodDB.itemNutrients(it))));
 return `<b>≈ ${fmtN(t.calories)} kcal</b> · Protein ${fmtN(t.protein,1)} g · Carbs ${fmtN(t.carbs,1)} g · Fat ${fmtN(t.fat,1)} g · Fibre ${fmtN(t.fibre,1)} g <span class="est">ESTIMATE</span>`;
}
function renderEditor(){
 const box=$("mealEditor");
 if(!draft.active){box.hidden=true;box.innerHTML="";return}
 box.hidden=false;
 const editing=!!draft.replaceId;
 box.innerHTML=`<div class="row"><h3>${editing?"Edit entry":"Review &amp; edit your meal"}</h3><span class="pill">≈ estimates</span></div><div class="sub">Correct names and quantities — values update instantly. They are estimates, not lab measurements.</div>
 <div style="margin-top:10px" id="itemsBox">${draft.items.length?draft.items.map(itemHtml).join(""):`<div class="empty" style="padding:14px">No items yet. Search below to add foods.</div>`}</div>
 <label class="field">Add a food</label><input id="foodSearch" placeholder="Search e.g. roti, paneer, banana…" oninput="foodSearchInput(this.value)" onkeydown="if(event.key==='Enter'){foodSearchEnter(this.value)}" autocomplete="off">
 <div class="suggestions" id="foodSuggest"></div>
 <div class="totalsbar" id="draftTotals">${totalsHtml()}</div>
 <div class="grid"><div><label class="field">Meal</label><select id="mealType">${MEALS.map(m=>`<option ${m===draft.meal?"selected":""}>${m}</option>`).join("")}</select></div><div><label class="field">Date</label><input id="mealDate" type="date" value="${esc(draft.date||nutUI.date)}"></div></div>
 <div class="actions" style="margin-top:12px"><button class="secondary" onclick="cancelDraft()">Cancel</button><button onclick="saveMeal()">${editing?"Save changes":"Save meal"}</button></div>`;
}
function refreshItem(k){
 const it=draft.items[k];if(!it)return;
 const a=$("itnut-"+k);if(a)a.innerHTML=itemNutText(it);
 const d=$("itdet-"+k);if(d)d.innerHTML=itemDetailsHtml(it);
 const t=$("draftTotals");if(t)t.innerHTML=totalsHtml();
}
function itemQty(k,v){const it=draft.items[k];it.qty=num(v);it.flag="";refreshItem(k)}
function itemSize(k,v){draft.items[k].size=v;refreshItem(k)}
function itemUnit(k,u){
 const it=draft.items[k],g=FoodDB.itemGrams(it);
 if(it.fixed){it.unit=u;renderEditor();return}
 const food=it.fid?FoodDB.FOOD_BY_ID[it.fid]:null,per=(u==="g"||u==="ml")?1:FoodDB.unitGrams(food,u)*(FoodDB.SIZE_MULT[it.size||"medium"]||1);
 it.unit=u;it.qty=Math.round(g/per*100)/100;it.flag="";renderEditor();   /* keep the same total amount when switching unit */
}
function itemFixed(k,f,v){const it=draft.items[k];it.fixed[f]=num(v);refreshItem(k)}
function useOwnValues(k){const it=draft.items[k],n=FoodDB.roundNut(FoodDB.itemNutrients(it));it.fixed=n;it.src="manual";it.matched=false;renderEditor()}
function itemName(k,v){
 const it=draft.items[k];v=(v||"").trim();if(!v)return;
 const m=FoodDB.matchFood(v);
 if(m&&m.id!==it.fid){
  const g=FoodDB.itemGrams(it);
  Object.assign(it,{name:m.name,fid:m.id,matched:true,per100:Object.fromEntries(NKEYS.map((x,i)=>[x,m.v[i]])),fixed:null,src:"db",flag:""});
  if(!FoodDB.unitKnown(m,it.unit)){it.unit="g";it.qty=Math.round(g)}
 }else if(!m){
  it.name=v;if(!it.per100&&!it.fixed){it.fixed=Object.fromEntries(NKEYS.map(x=>[x,0]));it.src="manual"}
 }
 renderEditor();
}
function removeItem(k){draft.items.splice(k,1);renderEditor()}
function foodSearchInput(v){
 const res=v.trim()?FoodDB.searchFoods(v,8):[];
 $("foodSuggest").innerHTML=res.map(f=>`<button class="secondary small" onclick="addFoodById('${f.id}')">${esc(f.name)}</button>`).join("")+(v.trim()&&!res.length?`<button class="secondary small" onclick="addCustomItem(document.getElementById('foodSearch').value)">＋ Add “${esc(v.trim())}” with my own values</button>`:"");
}
function foodSearchEnter(v){const r=FoodDB.searchFoods(v,1);if(r.length)addFoodById(r[0].id);else if(v.trim())addCustomItem(v)}
function addFoodById(id){
 const f=FoodDB.FOOD_BY_ID[id];if(!f)return;
 draft.items.push({name:f.name,fid:f.id,matched:true,qty:f.d[0],unit:f.d[1],size:"medium",flag:"",src:"db",per100:Object.fromEntries(NKEYS.map((x,i)=>[x,f.v[i]])),fixed:null});
 renderEditor();setTimeout(()=>{const e=$("foodSearch");if(e)e.focus()},30);
}
function addCustomItem(name){
 draft.items.push({name:(name||"Custom food").trim(),fid:null,matched:false,qty:1,unit:"serving",size:"medium",flag:"",src:"manual",per100:null,fixed:Object.fromEntries(NKEYS.map(x=>[x,0]))});
 renderEditor();
}
function itemToEntry(it,id,mid,meal){
 const n=FoodDB.roundNut(FoodDB.itemNutrients(it)),e={id,mid,meal,name:it.name,qty:it.qty,unit:it.unit,size:it.size,grams:Math.round(FoodDB.itemGrams(it)),fid:it.fid||null,src:it.src,est:it.src==="db"||it.src==="ai",t:Date.now(),...n};
 if(it.src==="ai"&&it.per100)e.per100=it.per100;
 if(it.fixed)e.fixed=it.fixed;
 return e;
}
function saveMeal(){
 const items=draft.items.filter(it=>it.name&&num(it.qty)>0);
 if(!items.length){alert("Add at least one food item with a quantity.");return}
 const date=$("mealDate").value||today(),meal=$("mealType").value;
 if(draft.replaceId){
  const it=items[0],oldDate=draft.replaceDate,list=data.foods[oldDate]||[],idx=list.findIndex(e=>e.id===draft.replaceId);
  const e=itemToEntry(it,draft.replaceId,draft.mid,meal);
  if(date===oldDate&&idx>=0)list[idx]=e;
  else{if(idx>=0)list.splice(idx,1);if(!list.length)delete data.foods[oldDate];(data.foods[date]=data.foods[date]||[]).push(e)}
 }else{
  const list=data.foods[date]=data.foods[date]||[];
  items.forEach(it=>list.push(itemToEntry(it,uid(),draft.mid||uid(),meal)));
 }
 persist();draft=newDraft();$("photoPrev").hidden=true;$("photoTools").hidden=true;$("mealText").value="";
 nutUI.date=date;nutUI.view="today";renderNutrition();renderHome();toast("Meal saved (estimated values)");
}
function editEntry(date,id){
 const e=(data.foods[date]||[]).find(x=>x.id===id);if(!e)return;
 const food=e.fid?FoodDB.FOOD_BY_ID[e.fid]:null;
 let per100=e.per100||(food?Object.fromEntries(NKEYS.map((x,i)=>[x,food.v[i]])):null);
 const it={name:e.name,fid:e.fid||null,matched:!!per100,qty:e.qty||1,unit:e.unit||"serving",size:e.size||"medium",flag:"",src:e.src||"manual",per100,fixed:null};
 if(!per100||e.fixed){it.fixed=e.fixed||Object.fromEntries(NKEYS.map(x=>[x,num(e[x])]));it.src="manual";it.matched=false;if(!e.qty){it.qty=1;it.unit="serving"}}
 draft=newDraft();draft.items=[it];draft.replaceId=id;draft.replaceDate=date;draft.mid=e.mid||uid();draft.meal=e.meal||guessMeal();draft.date=date;draft.active=true;
 nutUI.view="add";renderNutrition();window.scrollTo(0,document.body.scrollHeight);
}

/* ---------- describe meal ---------- */
function estimateText(){
 const t=$("mealText").value.trim();if(!t){alert("Describe what you ate first.");return}
 const items=FoodDB.parseMeal(t);if(!items.length){alert("Couldn't find any food in that text. Try “2 rotis, 1 bowl dal”.");return}
 draft.items=items;activateEditor();renderEditor();
 const un=items.filter(i=>!i.matched).length;
 const ts=$("textStatus");ts.dataset.sticky="1";ts.textContent=un?`${items.length-un} of ${items.length} items recognised. Please fill in values for the others below.`:`All ${items.length} items recognised — check the quantities below.`;
 $("mealEditor").scrollIntoView({behavior:"smooth",block:"start"});
}
async function estimateTextAI(){
 const t=$("mealText").value.trim();if(!t){alert("Describe what you ate first.");return}
 const ts=$("textStatus");ts.dataset.sticky="1";ts.textContent="Asking the AI service…";
 try{const j=await callAI({type:"text",text:t});draft.items=aiItems(j);if(!draft.items.length)throw new Error("empty");activateEditor();renderEditor();ts.textContent="AI estimate ready — please review the items below.";$("mealEditor").scrollIntoView({behavior:"smooth",block:"start"})}
 catch(err){estimateText();ts.dataset.sticky="1";ts.textContent=aiErrorText(err)+" Used the built-in estimator instead — please check the items below."}
}

/* ---------- photo ---------- */
function prepImage(file,max=1024){
 return new Promise((res,rej)=>{
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{
   const s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.width*s));c.height=Math.max(1,Math.round(img.height*s));
   c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
   const dataUrl=c.toDataURL("image/jpeg",0.8);res({dataUrl,b64:dataUrl.split(",")[1]});
  };
  img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error("bad image"))};img.src=url;
 });
}
async function onPhotoPicked(ev){
 const f=ev.target.files&&ev.target.files[0];ev.target.value="";if(!f)return;
 try{
  const p=await prepImage(f);draft.photo=p;activateEditor();
  $("photoPrev").src=p.dataUrl;$("photoPrev").hidden=false;$("photoTools").hidden=false;
  const ps=$("photoStatus");delete ps.dataset.sticky;refreshAIState();renderEditor();
 }catch(e){alert("Could not read that image. Please try another photo.")}
}
async function analysePhoto(){
 if(!draft.photo)return;
 const ps=$("photoStatus");ps.dataset.sticky="1";draft.aiBusy=true;$("aiPhotoBtn").disabled=true;ps.textContent="Analysing photo…";
 try{
  const j=await callAI({type:"photo",image:draft.photo.b64,mime:"image/jpeg",note:$("photoNote").value.trim()});
  const items=aiItems(j);if(!items.length)throw new Error("empty");
  draft.items=items;ps.textContent=`Found ${items.length} item${items.length>1?"s":""}. Please check names and portions below — AI estimates can be wrong.`;
 }catch(err){ps.textContent=aiErrorText(err)+" You can still add foods manually below."}
 draft.aiBusy=false;refreshAIState();renderEditor();
}

/* ---------- optional secure AI backend ----------
   The app only talks to a URL YOU deploy (see backend/README.md). The API key stays on that server. */
async function callAI(payload){
 const url=(data.settings.aiEndpoint||"").trim();
 if(!url)throw new Error("no-endpoint");
 if(navigator.onLine===false)throw new Error("offline");
 const ctrl=new AbortController(),to=setTimeout(()=>ctrl.abort(),45000);
 try{
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:ctrl.signal});
  if(!r.ok)throw new Error("http-"+r.status);
  return await r.json();
 }finally{clearTimeout(to)}
}
function aiErrorText(err){
 const m=String(err&&err.message||err);
 if(m==="no-endpoint")return "AI service isn't set up.";
 if(m==="offline")return "You're offline.";
 if(err&&err.name==="AbortError")return "The AI service took too long.";
 if(m.startsWith("http-"))return "The AI service returned an error ("+m.slice(5)+").";
 return "Couldn't get a usable AI answer.";
}
function clampNum(v,max){v=num(v);return v<0?0:Math.min(v,max)}
/* turn the service's JSON into editable draft items; never trust the numbers blindly */
function aiItems(j){
 const arr=j&&Array.isArray(j.items)?j.items.slice(0,25):[];
 return arr.map(x=>{
  const grams=clampNum(x.grams,3000)||100;
  const per=NKEYS.reduce((o,k)=>{const v=clampNum(x[k]!==undefined?x[k]:(k==="vitC"?x.vitaminC:undefined),k==="calories"?5000:k==="sodium"||k==="potassium"||k==="calcium"?20000:2000);o[k]=v*100/grams;return o},{});
  return {name:String(x.name||"Food item").slice(0,80),fid:null,matched:true,qty:Math.round(grams),unit:"g",size:"medium",flag:"",src:"ai",conf:["low","medium","high"].includes(x.confidence)?x.confidence:"",per100:per,fixed:null};
 }).filter(it=>it.name);
}
async function testAI(){
 const s=$("aiStatus"),url=($("aiEndpoint").value||"").trim();
 if(!url){s.textContent="Enter your AI service URL first.";return}
 data.settings.aiEndpoint=url;persist();s.textContent="Testing…";
 try{const j=await callAI({type:"ping"});s.textContent=j&&j.ok?"✓ Connected"+(j.provider?" ("+j.provider+")":"")+(j.model?" · model: "+j.model:""):"Reached the URL but it didn't answer like the FITTRACK service.";}
 catch(e){s.textContent="✗ "+aiErrorText(e)+" Check the URL, and that ALLOWED_ORIGIN matches your site."}
}

/* ---------- history ---------- */
function renderHistory(){
 const n=nutUI.range==="week"?7:30,end=today(),days=[];
 for(let k=n-1;k>=0;k--){const d=addDays(end,-k);days.push({date:d,t:dayTotals(d),has:dayEntries(d).length>0})}
 $("hWeek").classList.toggle("active",n===7);$("hMonth").classList.toggle("active",n===30);
 const labels=days.map(d=>fmtDate(d.date)),S=data.settings;
 chartBars($("histKcal"),labels,days.map(d=>Math.round(d.t.calories)),{target:S.calorieTarget,over:S.calorieTarget*1.1,empty:"No meals logged in this period"});
 chartBars($("histProt"),labels,days.map(d=>Math.round(d.t.protein)),{target:S.proteinTarget,empty:"No meals logged in this period"});
 const logged=days.filter(d=>d.has),avg=k=>logged.length?logged.reduce((a,d)=>a+d.t[k],0)/logged.length:0;
 $("histAvg").innerHTML=`<div><b>${logged.length}/${n}</b><span>DAYS LOGGED</span></div><div><b>${fmtN(avg("calories"))}</b><span>AVG KCAL</span></div><div><b>${fmtN(avg("protein"),0)}</b><span>AVG PROTEIN g</span></div><div><b>${fmtN(avg("fibre"),0)}</b><span>AVG FIBRE g</span></div>`;
 const box=$("histTable");
 if(!logged.length){box.className="empty";box.textContent="No meals logged in this period.";return}
 box.className="";
 box.innerHTML=`<table><thead><tr><th>Date</th><th class="r">kcal</th><th class="r">P</th><th class="r">C</th><th class="r">F</th><th class="r">Fibre</th></tr></thead><tbody>${logged.slice().reverse().map(d=>`<tr class="click" onclick="openNutDay('${d.date}')"><td>${fmtDate(d.date)}</td><td class="r">${fmtN(d.t.calories)}</td><td class="r">${fmtN(d.t.protein,0)}</td><td class="r">${fmtN(d.t.carbs,0)}</td><td class="r">${fmtN(d.t.fat,0)}</td><td class="r">${fmtN(d.t.fibre,0)}</td></tr>`).join("")}</tbody></table>`;
}
function openNutDay(d){nutUI.date=d;nutUI.view="today";renderNutrition();window.scrollTo(0,0)}
