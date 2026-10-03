/* ============ 寸印 CUNYIN · 证件照排版打印（纯本地处理） ============ */
(function(){
"use strict";
var $=function(s){return document.querySelector(s)};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var DPI=300, PXMM=DPI/25.4;

/* ---------- 规格库 ---------- */
var SIZES=[
 {name:"一寸",     w:25,h:35, cat:"常用", use:"简历 · 报名 · 工作证"},
 {name:"小一寸",   w:22,h:32, cat:"常用", use:"驾驶证 · 医保卡"},
 {name:"大一寸",   w:33,h:48, cat:"常用", use:"护照 · 签证申请"},
 {name:"二寸",     w:35,h:49, cat:"常用", use:"学生证 · 结婚证"},
 {name:"小二寸",   w:35,h:45, cat:"常用", use:"港澳台通行证"},
 {name:"教师资格", w:25,h:35, cat:"考试", use:"教资认定 · 白底"},
 {name:"四六级",   w:25,h:35, cat:"考试", use:"CET 报名"},
 {name:"普通话",   w:25,h:35, cat:"考试", use:"普测报名"},
 {name:"二代身份证",w:26,h:32,cat:"考试", use:"身份证 · 社保卡"},
 {name:"公务员考试",w:25,h:35,cat:"考试", use:"国考 · 省考报名"},
 {name:"美国签证", w:51,h:51, cat:"签证", use:"美签 · DV 抽签"},
 {name:"日本签证", w:45,h:45, cat:"签证", use:"日签申请"},
 {name:"申根签证", w:35,h:45, cat:"签证", use:"欧洲申根 · 英国"},
 {name:"加拿大签证",w:50,h:70,cat:"签证", use:"加签 · 旅签"},
 {name:"新西兰签证",w:35,h:45,cat:"签证", use:"NZ 旅游签"}
];
var CATS=["常用","考试","签证"];
var PAPERS=[
 {id:"r6", name:"6寸相纸", w:152.4, h:101.6},
 {id:"a6", name:"A6",      w:148,   h:105},
 {id:"a5", name:"A5",      w:210,   h:148},
 {id:"a4", name:"A4",      w:297,   h:210}
];

/* ---------- 状态 ---------- */
var st={img:null,rot:0,zoom:1,pan:{x:0,y:0},flip:false,
  size:0,paper:0,gap:1.5,cut:true,fmt:"png",
  adj:{bri:1,con:1,sat:1},cat:"常用",kw:"",view:"single"};

/* ---------- 工具 ---------- */
function toast(msg){var t=$("#toast");t.textContent=msg;t.classList.add("show");
 clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},2000)}
function fmt(n){return (Math.round(n*10)/10).toString().replace(/\.0$/,"")}
function curSize(){return SIZES[st.size]}
function curPaper(){return PAPERS[st.paper]}
function status(txt,live){var s=$("#barStatus");s.childNodes[1].nodeValue=txt;s.classList.toggle("live",!!live)}
function filterStr(){return "brightness("+st.adj.bri+") contrast("+st.adj.con+") saturate("+st.adj.sat+")"}

/* ---------- 取景器 ---------- */
var finder=$("#finderCanvas"),fctx=finder.getContext("2d");
function effDims(){var im=st.img;
 if(st.rot%2===0)return {w:im.naturalWidth,h:im.naturalHeight};
 return {w:im.naturalHeight,h:im.naturalWidth}}
function baseScale(fw,fh){var d=effDims();
 return Math.max(fw/d.w,fh/d.h)}
function drawFinder(){
 var s=curSize();
 var fw=finder.parentElement.clientWidth-2, fh=Math.round(fw*s.h/s.w);
 finder.width=fw;finder.height=fh;
 fctx.fillStyle="#000";fctx.fillRect(0,0,fw,fh);
 var sc=baseScale(fw,fh)*st.zoom;
 fctx.save();
 fctx.translate(fw/2+st.pan.x,fh/2+st.pan.y);
 fctx.rotate(st.rot*Math.PI/2);
 fctx.scale(sc*(st.flip?-1:1),sc);
 fctx.filter=filterStr();
 fctx.drawImage(st.img,-st.img.naturalWidth/2,-st.img.naturalHeight/2);
 fctx.restore();
}

/* ---------- 渲染输出 ---------- */
function renderPhoto(dpi){
 var s=curSize(),pmm=dpi/25.4;
 var w=Math.round(s.w*pmm),h=Math.round(s.h*pmm);
 var c=document.createElement("canvas");c.width=w;c.height=h;
 var ctx=c.getContext("2d");
 ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);
 var sc=baseScale(w,h)*st.zoom;
 ctx.save();
 ctx.translate(w/2+st.pan.x*(w/finder.width),h/2+st.pan.y*(w/finder.width));
 ctx.rotate(st.rot*Math.PI/2);
 ctx.scale(sc*(st.flip?-1:1),sc);
 ctx.filter=filterStr();
 ctx.drawImage(st.img,-st.img.naturalWidth/2,-st.img.naturalHeight/2);
 ctx.restore();
 return c;
}
function layout(paper,size,gap,pad){
 var cols=Math.floor((paper.w-2*pad+gap)/(size.w+gap));
 var rows=Math.floor((paper.h-2*pad+gap)/(size.h+gap));
 if(cols<1||rows<1)return null;
 return {cols:cols,rows:rows,
  x0:(paper.w-(cols*size.w+(cols-1)*gap))/2,
  y0:(paper.h-(rows*size.h+(rows-1)*gap))/2,
  n:cols*rows};
}
function renderSheet(canvas,pmm){
 var p=curPaper(),s=curSize();
 var L=layout(p,s,st.gap,1.5);
 if(!L)return null;
 canvas.width=Math.round(p.w*pmm);canvas.height=Math.round(p.h*pmm);
 var ctx=canvas.getContext("2d");
 ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
 var photo=renderPhoto(pmm*25.4);
 for(var r=0;r<L.rows;r++)for(var c=0;c<L.cols;c++){
  var x=(L.x0+c*(s.w+st.gap))*pmm, y=(L.y0+r*(s.h+st.gap))*pmm;
  ctx.drawImage(photo,Math.round(x),Math.round(y));
  if(st.cut){ctx.strokeStyle="rgba(0,0,0,.35)";ctx.lineWidth=Math.max(1,pmm*0.15);
   ctx.strokeRect(Math.round(x)+.5,Math.round(y)+.5,Math.round(s.w*pmm)-1,Math.round(s.h*pmm)-1)}
 }
 return L;
}

/* ---------- 预览渲染 ---------- */
var sheet=$("#sheetCanvas"),single=$("#singleCanvas");
function renderAll(){
 var s=curSize(),p=curPaper();
 drawFinder();
 var L=layout(p,s,st.gap,1.5);
 $("#ebMeta").textContent=L?("×"+L.n+" 张 · "+p.name):"";
 if(!L){$("#sheetCaption").innerHTML="该规格超出 <b>"+p.name+"</b> 版面";return}
 /* 视图 */
 if(st.view==="sheet"){
  var pmm=2.4;
  renderSheet(sheet,pmm);
  sheet.style.width=Math.min(p.w*2.4,700)+"px";
  buildRulers(pmm);
  $("#sheetWrap").hidden=false;$("#singleWrap").hidden=true;
 }else{
  var sc2=renderPhoto(8);
  single.width=sc2.width;single.height=sc2.height;
  single.getContext("2d").drawImage(sc2,0,0);
  single.style.height="300px";single.style.width="auto";
  var pw=Math.round(s.w*PXMM),ph=Math.round(s.h*PXMM);
  $("#singleCaption").innerHTML=s.name+" · <b>"+pw+" × "+ph+"</b> px @300DPI";
  $("#sheetWrap").hidden=true;$("#singleWrap").hidden=false;
 }
 $("#sheetCaption").innerHTML=
  "<b>"+s.name+"</b> "+s.w+"×"+s.h+" mm → "+p.name+" "+fmt(p.w)+"×"+fmt(p.h)+" mm · "+
  L.cols+" 列 × "+L.rows+" 行 · <b>"+L.n+" 张/版</b> · 300 DPI";
 $("#sheetBadge").textContent=L.n+" PCS";
 $("#specRead").innerHTML="输出像素 <b>"+pw2()+" × "+ph2()+"</b> px（300 DPI）<br>适用："+s.use+" · 底色建议以官方要求为准";
 $("#btnExportTop").disabled=false;$("#btnPrintTop").disabled=false;
 $("#exportBar").classList.add("show");
 status("READY · "+L.n+" PCS",true);
}
function pw2(){return Math.round(curSize().w*PXMM)}
function ph2(){return Math.round(curSize().h*PXMM)}

function buildRulers(pmm){
 var p=curPaper();
 var rt=$("#rulerTop"),rl=$("#rulerLeft");
 var Wpx=p.w*pmm,Hpx=p.h*pmm;
 rt.style.width=Wpx+"px";rl.style.height=Hpx+"px";
 var html="",i;
 for(i=0;i<=Math.ceil(p.w);i++)
  html+='<i class="'+(i%10===0?"maj":"")+'" style="left:'+Math.min(i*10*pmm,Wpx-1)+'px"></i>';
 for(i=1;i<Math.ceil(p.w/10);i++)
  html+='<b style="left:'+(i*100*pmm)+'px">'+i*10+'</b>';
 rt.innerHTML=html;html="";
 for(i=0;i<=Math.ceil(p.h);i++)
  html+='<i class="'+(i%10===0?"maj":"")+'" style="top:'+Math.min(i*10*pmm,Hpx-1)+'px"></i>';
 for(i=1;i<Math.ceil(p.h/10);i++)
  html+='<b style="top:'+(i*100*pmm)+'px">'+i*10+'</b>';
 rl.innerHTML=html;
}

/* ---------- 自动对位（人脸检测） ---------- */
function autoAlign(){
 if(!st.img){toast("先导入照片");return}
 if(!("FaceDetector" in window)){toast("当前浏览器不支持自动对位");return}
 toast("检测人脸中…");
 st.rot=0;st.flip=false;st.pan={x:0,y:0};
 var det=new window.FaceDetector({fastMode:true,maxDetectedFaces:1});
 det.detect(st.img).then(function(faces){
  if(!faces.length){toast("未检测到人脸，请手动取景");drawFinder();syncViews();return}
  var b=faces[0].boundingBox;
  var s=curSize();
  var fw=finder.parentElement.clientWidth-2, fh=fw*s.h/s.w;
  var d=effDims();
  var sc=baseScale(fw,fh);
  var fx=fw/2, fy=fh*0.42;                    /* 脸中心目标：水平居中、上 42% */
  var targetFaceH=fh*0.58;                    /* 脸高约占框高 58% */
  st.zoom=Math.min(2.2,Math.max(0.3,targetFaceH/(b.height*sc)));
  sc*=st.zoom;
  st.pan.x=fx-(b.x+b.width/2)*sc;
  st.pan.y=fy-(b.y+b.height/2)*sc;
  $("#zoomRange").value=st.zoom;
  drawFinder();syncViews();
  toast("已对位，可微调后导出");
 }).catch(function(){toast("自动对位失败，请手动取景")});
}

/* ---------- 视图同步 ---------- */
var _rz=null;
function syncSoon(){clearTimeout(_rz);_rz=setTimeout(syncViews,280)}
function syncViews(){if(st.img)renderAll()}
function setZoom(z){st.zoom=Math.min(2.2,Math.max(0.3,z));$("#zoomRange").value=st.zoom;drawFinder();syncSoon()}

/* ---------- 交互：取景 ---------- */
function bindFinder(){
 var drag=null;
 var host=$("#finder");
 host.addEventListener("pointerdown",function(e){
  drag={x:e.clientX,y:e.clientY,px:st.pan.x,py:st.pan.y};
  host.setPointerCapture(e.pointerId)});
 host.addEventListener("pointermove",function(e){
  if(!drag)return;
  var sc=finder.width/(finder.getBoundingClientRect().width||1);
  st.pan.x=drag.px+(e.clientX-drag.x)*sc;
  st.pan.y=drag.py+(e.clientY-drag.y)*sc;
  drawFinder()});
 window.addEventListener("pointerup",function(){
  if(drag&&st.img){drag=null;syncViews();return}
  drag=null});
 host.addEventListener("wheel",function(e){
  e.preventDefault();
  setZoom(st.zoom*(e.deltaY<0?1.08:1/1.08))},{passive:false});
 window.addEventListener("resize",function(){if(st.img){drawFinder();syncSoon()}});
}

/* ---------- 规格列表 ---------- */
function renderSpecList(){
 var list=$("#sizeList");
 var kw=st.kw.trim().toLowerCase();
 var items=SIZES.map(function(s,i){return {s:s,i:i}}).filter(function(o){
  var okCat=st.cat==="全部"||o.s.cat===st.cat;
  var okKw=!kw||(o.s.name+o.s.use+o.s.cat).toLowerCase().indexOf(kw)>=0;
  return okCat&&okKw;});
 list.innerHTML=items.length?items.map(function(o){
  var on=o.i===st.size;
  return '<button class="size-opt'+(on?" on":"")+'" data-i="'+o.i+'">'+
   '<span class="swatch" style="height:'+Math.max(20,Math.round(26*o.s.h/o.s.w))+'px"></span>'+
   '<span class="si"><span class="sn">'+o.s.name+'</span>'+
   '<span class="sd" style="display:block">'+o.s.w+' × '+o.s.h+' mm · '+Math.round(o.s.w*PXMM)+'×'+Math.round(o.s.h*PXMM)+'px</span></span>'+
   '<span class="su">'+o.s.use+'</span></button>'}).join("")
  :'<div style="padding:22px 10px;text-align:center;color:var(--faint);font-size:12.5px">没有匹配的规格</div>';
 list.querySelectorAll(".size-opt").forEach(function(el){
  el.onclick=function(){selectSize(+el.dataset.i)}});
}
function selectSize(i){
 st.size=i;
 $("#sizeList").querySelectorAll(".size-opt").forEach(function(x){x.classList.toggle("on",+x.dataset.i===i)});
 st.pan={x:0,y:0};
 renderSpecList();syncViews();
 toast("规格 · "+SIZES[i].name+" "+SIZES[i].w+"×"+SIZES[i].h+" mm");
}
function renderCats(){
 var html=CATS.map(function(c){return '<button class="cat'+(st.cat===c?" on":"")+'" data-c="'+c+'">'+c+'</button>'}).join("")
  +'<button class="cat'+(st.cat==="全部"?" on":"")+'" data-c="全部">全部</button>';
 $("#specCats").innerHTML=html;
 $$("#specCats .cat").forEach(function(el){
  el.onclick=function(){st.cat=el.dataset.c;renderCats();renderSpecList()}});
}

/* ---------- 相纸列表 ---------- */
function renderPaperList(){
 var list=$("#paperList");
 list.innerHTML=PAPERS.map(function(p,i){
  var on=i===st.paper;
  return '<button class="size-opt'+(on?" on":"")+'" data-i="'+i+'">'+
   '<span class="swatch" style="width:44px;height:'+Math.max(20,Math.round(44*p.h/p.w))+'px"></span>'+
   '<span class="si"><span class="sn">'+p.name+'</span>'+
   '<span class="sd" style="display:block">'+fmt(p.w)+' × '+fmt(p.h)+' mm</span></span></button>'}).join("");
 list.querySelectorAll(".size-opt").forEach(function(el){
  el.onclick=function(){st.paper=+el.dataset.i;
   list.querySelectorAll(".size-opt").forEach(function(x){x.classList.toggle("on",+x.dataset.i===st.paper)});
   syncViews()}});
}

/* ---------- 导出 ---------- */
function mime(){return st.fmt==="png"?"image/png":"image/jpeg"}
function ext(){return st.fmt==="png"?"png":"jpg"}
function toBlob(c,cb){c.toBlob(cb,mime(),0.92)}
function download(canvas,name){
 toBlob(canvas,function(blob){
  if(!blob){toast("导出失败");return}
  var a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=name+"."+ext();
  a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},4000);
  toast("已导出 "+name)});
}

/* ---------- 载入照片 ---------- */
function loadFile(f){
 if(!/^image\//.test(f.type)){toast("请选择图片文件");return}
 var url=URL.createObjectURL(f);
 var im=new Image();
 im.onload=function(){
  st.img=im;st.rot=0;st.zoom=1;st.flip=false;st.pan={x:0,y:0};
  st.adj={bri:1,con:1,sat:1};
  $("#adjBri").value=1;$("#adjCon").value=1;$("#adjSat").value=1;
  $("#adjBriV").textContent=100;$("#adjConV").textContent=100;$("#adjSatV").textContent=100;
  $("#quickstart").style.display="none";
  $("#workbench").hidden=false;
  $("#fName").textContent=f.name;
  status("LOADED · "+im.naturalWidth+"×"+im.naturalHeight,true);
  $("#zoomRange").value=1;
  renderAll();
  autoAlign();
 };
 im.onerror=function(){toast("图片读取失败")};
 im.src=url;
}

/* ---------- 事件 ---------- */
function init(){
 /* 上传入口 */
 var fi=$("#fileInput");
 $("#btnPick").onclick=function(){fi.click()};
 $("#btnRePick").onclick=function(){fi.click()};
 fi.onchange=function(){if(this.files[0])loadFile(this.files[0])};
 document.body.addEventListener("dragover",function(e){e.preventDefault()});
 document.body.addEventListener("drop",function(e){
  e.preventDefault();
  if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0])});
 /* 快速规格芯片 */
 $("#quickChips").innerHTML=[0,4,8,10].map(function(i){
  var s=SIZES[i];return '<button class="chip" data-i="'+i+'">'+s.name+'<i>'+s.w+'×'+s.h+'</i></button>'}).join("");
 $$("#quickChips .chip").forEach(function(el){
  el.onclick=function(){selectSize(+el.dataset.i);fi.click()}});
 /* 取景 */
 bindFinder();
 $("#zoomRange").oninput=function(){setZoom(parseFloat(this.value))};
 $("#btnZoomIn").onclick=function(){setZoom(st.zoom*1.15)};
 $("#btnZoomOut").onclick=function(){setZoom(st.zoom/1.15)};
 $("#btnRot").onclick=function(){st.rot=(st.rot+1)%4;drawFinder();syncViews()};
 $("#btnFlip").onclick=function(){st.flip=!st.flip;drawFinder();syncViews()};
 $("#btnReset").onclick=function(){st.rot=0;st.zoom=1;st.flip=false;st.pan={x:0,y:0};
  $("#zoomRange").value=1;drawFinder();syncViews()};
 $("#btnAuto").onclick=autoAlign;
 /* 图像调整 */
 [["adjBri","bri","adjBriV"],["adjCon","con","adjConV"],["adjSat","sat","adjSatV"]].forEach(function(m){
  $("#"+m[0]).oninput=function(){st.adj[m[1]]=parseFloat(this.value);
   $("#"+m[2]).textContent=Math.round(st.adj[m[1]]*100);drawFinder();syncSoon()}});
 /* 规格搜索/分类 */
 $("#specSearch").oninput=function(){st.kw=this.value;renderSpecList()};
 renderCats();renderSpecList();
 /* 相纸 */
 renderPaperList();
 $("#gapRange").oninput=function(){st.gap=parseFloat(this.value);
  $("#gapVal").textContent=fmt(st.gap)+" mm";syncViews()};
 $("#btnCutOn").onclick=function(){st.cut=true;this.classList.add("on");
  $("#btnCutOff").classList.remove("on");syncViews()};
 $("#btnCutOff").onclick=function(){st.cut=false;this.classList.add("on");
  $("#btnCutOn").classList.remove("on");syncViews()};
 $("#fmtPng").onclick=function(){st.fmt="png";this.classList.add("on");$("#fmtJpg").classList.remove("on")};
 $("#fmtJpg").onclick=function(){st.fmt="jpg";this.classList.add("on");$("#fmtPng").classList.remove("on")};
 /* 视图切换 */
 $("#btnViewSheet").onclick=function(){st.view="sheet";
  this.classList.add("on");$("#btnViewSingle").classList.remove("on");syncViews()};
 $("#btnViewSingle").onclick=function(){st.view="single";
  this.classList.add("on");$("#btnViewSheet").classList.remove("on");syncViews()};
 /* 导出 */
 $("#btnExportSheet").onclick=$("#btnExportTop").onclick=function(){
  var c=document.createElement("canvas");
  var L=renderSheet(c,PXMM);
  if(!L){toast("当前相纸放不下该规格");return}
  var s=curSize(),p=curPaper();
  download(c,"cunyin_"+s.name+"_"+p.name+"_300dpi")};
 $("#btnExportSingle").onclick=function(){
  download(renderPhoto(DPI),"cunyin_"+curSize().name+"_single")};
 $("#btnPrintBar").onclick=$("#btnPrintTop").onclick=function(){
  var p=curPaper();
  var c=document.createElement("canvas");
  if(!renderSheet(c,PXMM)){toast("当前相纸放不下该规格");return}
  var style=document.createElement("style");
  style.textContent="@page{size:"+fmt(p.w)+"mm "+fmt(p.h)+"mm;margin:0}";
  document.head.appendChild(style);
  $("#printArea").innerHTML="";
  var img=document.createElement("img");
  img.src=c.toDataURL(mime(),0.95);
  $("#printArea").appendChild(img);
  setTimeout(function(){window.print();setTimeout(function(){style.remove()},600)},120)};
 /* Tabs */
 $$(".ptab").forEach(function(t){
  t.onclick=function(){
   $$(".ptab").forEach(function(x){x.classList.remove("on")});
   $$(".tabpane").forEach(function(x){x.classList.remove("on")});
   t.classList.add("on");$("#"+t.dataset.tab).classList.add("on")}});
 /* 快捷键 */
 $("#btnHelp").onclick=function(){$("#kbdModal").classList.add("open")};
 $("#kbdClose").onclick=function(){$("#kbdModal").classList.remove("open")};
 $("#kbdModal").onclick=function(e){if(e.target===this)this.classList.remove("open")};
 document.addEventListener("keydown",function(e){
  if(e.key==="Escape"){$("#kbdModal").classList.remove("open");return}
  if(!st.img)return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();$("#btnExportSheet").click();return}
  if(document.activeElement&&/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
  if(e.key==="r"||e.key==="R")$("#btnRot").click();
  if(e.key==="f"||e.key==="F")$("#btnFlip").click();
  if(e.key==="a"||e.key==="A")autoAlign();
 });
}
init();
})();
