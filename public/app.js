/* ============ 寸印 CUNYIN · 证件照排版打印（纯本地处理） ============ */
(function(){
"use strict";
var $=function(s){return document.querySelector(s)};
var DPI=300, PXMM=DPI/25.4;

/* ---------- 数据 ---------- */
var SIZES=[
 {id:"yicun",   name:"一寸",   w:25,  h:35,  use:"简历 · 报名 · 工作证"},
 {id:"xyicun",  name:"小一寸", w:22,  h:32,  use:"驾驶证 · 医保"},
 {id:"ercun",   name:"二寸",   w:35,  h:49,  use:"学生证 · 结婚证"},
 {id:"xercun",  name:"小二寸", w:35,  h:45,  use:"港澳通行证"},
 {id:"dayicun", name:"大一寸", w:33,  h:48,  use:"护照 · 签证申请"},
 {id:"fang51",  name:"51×51",  w:51,  h:51,  use:"美国签证 · DV"}
];
var PAPERS=[
 {id:"r6", name:"6寸相纸", w:152.4, h:101.6},
 {id:"a6", name:"A6",      w:148,   h:105},
 {id:"a5", name:"A5",      w:210,   h:148},
 {id:"a4", name:"A4",      w:297,   h:210}
];

/* ---------- 状态 ---------- */
var st={img:null,rot:0,zoom:1,pan:{x:0,y:0},size:0,paper:0,gap:1.5,cut:true};

/* ---------- 工具 ---------- */
function toast(msg){var t=$("#toast");t.textContent=msg;t.classList.add("show");
 clearTimeout(t._h);t._h=setTimeout(function(){t.classList.remove("show")},2000)}
function fmt(n){return (Math.round(n*10)/10).toString().replace(/\.0$/,"")}
function curSize(){return SIZES[st.size]}
function curPaper(){return PAPERS[st.paper]}

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
 fctx.scale(sc,sc);
 fctx.drawImage(st.img,-st.img.naturalWidth/2,-st.img.naturalHeight/2);
 fctx.restore();
}
/* 单张照片 → canvas（按输出分辨率） */
function renderPhoto(dpi){
 var s=curSize();
 var pmm=dpi/25.4;
 var w=Math.round(s.w*pmm),h=Math.round(s.h*pmm);
 var c=document.createElement("canvas");c.width=w;c.height=h;
 var ctx=c.getContext("2d");
 ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);
 var sc=baseScale(w,h)*st.zoom;
 ctx.save();
 ctx.translate(w/2+st.pan.x*(w/finder.width),h/2+st.pan.y*(w/finder.width));
 ctx.rotate(st.rot*Math.PI/2);
 ctx.scale(sc,sc);
 ctx.drawImage(st.img,-st.img.naturalWidth/2,-st.img.naturalHeight/2);
 ctx.restore();
 return c;
}

/* ---------- 排版 ---------- */
function layout(paper,size,gap,pad){
 var cols=Math.floor((paper.w-2*pad+gap)/(size.w+gap));
 var rows=Math.floor((paper.h-2*pad+gap)/(size.h+gap));
 if(cols<1||rows<1)return null;
 var x0=(paper.w-(cols*size.w+(cols-1)*gap))/2;
 var y0=(paper.h-(rows*size.h+(rows-1)*gap))/2;
 return {cols:cols,rows:rows,x0:x0,y0:y0,n:cols*rows};
}
function renderSheet(canvas,pmm){
 var p=curPaper(),s=curSize();
 var L=layout(p,s,st.gap,1.5);
 if(!L)return false;
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

/* ---------- 预览区渲染 ---------- */
var sheet=$("#sheetCanvas");
function renderAll(){
 var s=curSize(),p=curPaper();
 /* 取景器 */
 drawFinder();
 /* 相纸预览（低分辨率） */
 var pmm=2.4; /* 预览用像素密度 */
 var L=layout(p,s,st.gap,1.5);
 if(!L){toast("当前相纸放不下该规格，换一张试试");
  $("#sheetCaption").innerHTML="该规格超出 <b>"+p.name+"</b> 版面";return}
 renderSheet(sheet,pmm);
 sheet.style.width=Math.min(p.w*2.4,720)+"px";
 /* 标尺 */
 buildRulers(pmm);
 /* 说明 */
 $("#sheetCaption").innerHTML=
  "<b>"+s.name+"</b> "+s.w+"×"+s.h+" mm → "+p.name+" "+fmt(p.w)+"×"+fmt(p.h)+" mm · "+
  L.cols+" 列 × "+L.rows+" 行 · <b>"+L.n+" 张/版</b> · 300 DPI";
 /* 规格 readout */
 var pw=Math.round(s.w*PXMM),ph=Math.round(s.h*PXMM);
 $("#specRead").innerHTML="输出像素 <b>"+pw+" × "+ph+"</b> px（300 DPI）<br>适用："+s.use;
 $("#btnDownload").disabled=false;$("#btnPrint").disabled=false;
 $("#barMeta").textContent="READY · "+L.n+" PCS";
}
/* 标尺（厘米刻度） */
function buildRulers(pmm){
 var p=curPaper();
 var rt=$("#rulerTop"),rl=$("#rulerLeft");
 var Wpx=p.w*pmm,Hpx=p.h*pmm;
 rt.style.width=Wpx+"px";rl.style.height=Hpx+"px";
 var html="",i;
 for(i=0;i<=Math.ceil(p.w);i++){var x=Math.min(i,Wpx);
  html+='<i class="'+(i%10===0?"maj":"")+'" style="left:'+Math.min(i*10*pmm,Wpx-1)+'px"></i>'}
 for(i=1;i<Math.ceil(p.w/10);i++)
  html+='<b style="left:'+(i*100*pmm)+'px">'+i*10+'</b>';
 rt.innerHTML=html;html="";
 for(i=0;i<=Math.ceil(p.h);i++){var y=Math.min(i*10*pmm,Hpx);
  html+='<i class="'+(i%10===0?"maj":"")+'" style="top:'+Math.min(y,Hpx-1)+'px"></i>'}
 for(i=1;i<Math.ceil(p.h/10);i++)
  html+='<b style="top:'+(i*100*pmm)+'px">'+i*10+'</b>';
 rl.innerHTML=html;
}

/* ---------- 交互：取景 ---------- */
function bindFinder(){
 var drag=null;
 finder.parentElement.addEventListener("pointerdown",function(e){
  drag={x:e.clientX,y:e.clientY,px:st.pan.x,py:st.pan.y};
  this.setPointerCapture(e.pointerId)});
 finder.parentElement.addEventListener("pointermove",function(e){
  if(!drag)return;
  var sc=finder.width/(finder.getBoundingClientRect().width||1);
  st.pan.x=drag.px+(e.clientX-drag.x)*sc;
  st.pan.y=drag.py+(e.clientY-drag.y)*sc;
  drawFinder()});
 window.addEventListener("pointerup",function(){
  if(drag&&st.img){drag=null;renderAll();return}
  drag=null});
 finder.parentElement.addEventListener("wheel",function(e){
  e.preventDefault();
  st.zoom=Math.min(4,Math.max(.3,st.zoom*(e.deltaY<0?1.08:1/1.08)));
  $("#zoomRange").value=Math.min(1,st.zoom);
  drawFinder();syncSoon()},{passive:false});
}
var _rz=null;
function syncSoon(){clearTimeout(_rz);_rz=setTimeout(renderAll,280)}
function setZoom(z){st.zoom=z;drawFinder();syncSoon()}

/* ---------- 事件 ---------- */
function init(){
 /* 上传 */
 var dz=$("#dropZone"),fi=$("#fileInput");
 dz.onclick=function(){fi.click()};
 dz.addEventListener("dragover",function(e){e.preventDefault();dz.classList.add("drag")});
 dz.addEventListener("dragleave",function(){dz.classList.remove("drag")});
 dz.addEventListener("drop",function(e){e.preventDefault();dz.classList.remove("drag");
  if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0])});
 fi.onchange=function(){if(this.files[0])loadFile(this.files[0])};
 function loadFile(f){
  if(!/^image\//.test(f.type)){toast("请选择图片文件");return}
  var url=URL.createObjectURL(f);
  var im=new Image();
  im.onload=function(){
   st.img=im;st.rot=0;st.zoom=1;st.pan={x:0,y:0};
   $("#dropZone").style.display="none";$("#workbench").hidden=false;
   $("#fName").textContent=f.name;
   $("#barMeta").textContent="LOADED · "+im.naturalWidth+"×"+im.naturalHeight;
   $("#zoomRange").value=Math.min(1,1);st.zoom=1;
   renderAll();toast("照片已载入，拖动取景");
  };
  im.onerror=function(){toast("图片读取失败")};
  im.src=url;
 }
 /* 取景控制 */
 $("#zoomRange").oninput=function(){setZoom(parseFloat(this.value))};
 $("#btnZoomIn").onclick=function(){setZoom(Math.min(4,st.zoom*1.15))};
 $("#btnZoomOut").onclick=function(){setZoom(Math.max(.3,st.zoom/1.15))};
 $("#btnRot").onclick=function(){st.rot=(st.rot+1)%4;st.pan={x:0,y:0};renderAll()};
 $("#btnRePick").onclick=function(){fi.click()};
 bindFinder();
 /* 规格网格 */
 var sg=$("#sizeGrid");
 sg.innerHTML=SIZES.map(function(s,i){
  return '<button class="size-opt'+(i===st.size?" on":"")+'" data-i="'+i+'">'+
   '<div class="sn">'+s.name+'</div><div class="sd">'+s.w+'×'+s.h+' mm</div></button>'}).join("");
 sg.querySelectorAll(".size-opt").forEach(function(el){
  el.onclick=function(){st.size=+el.dataset.i;
   sg.querySelectorAll(".size-opt").forEach(function(x){x.classList.remove("on")});
   el.classList.add("on");st.pan={x:0,y:0};renderAll()}});
 /* 相纸网格 */
 var pg=$("#paperGrid");
 pg.innerHTML=PAPERS.map(function(p,i){
  return '<button class="size-opt'+(i===st.paper?" on":"")+'" data-i="'+i+'">'+
   '<div class="sn">'+p.name+'</div><div class="sd">'+fmt(p.w)+'×'+fmt(p.h)+' mm</div></button>'}).join("");
 pg.querySelectorAll(".size-opt").forEach(function(el){
  el.onclick=function(){st.paper=+el.dataset.i;
   pg.querySelectorAll(".size-opt").forEach(function(x){x.classList.remove("on")});
   el.classList.add("on");renderAll()}});
 /* 间距 / 裁切线 */
 $("#gapRange").oninput=function(){st.gap=parseFloat(this.value);
  $("#gapVal").textContent=fmt(st.gap)+" mm";renderAll()};
 $("#btnCutOn").onclick=function(){st.cut=true;
  this.classList.add("on");$("#btnCutOff").classList.remove("on");renderAll()};
 $("#btnCutOff").onclick=function(){st.cut=false;
  this.classList.add("on");$("#btnCutOn").classList.remove("on");renderAll()};
 /* 下载 */
 $("#btnDownload").onclick=function(){
  var c=document.createElement("canvas");
  renderSheet(c,PXMM);
  var s=curSize(),p=curPaper();
  c.toBlob(function(blob){
   var a=document.createElement("a");
   a.href=URL.createObjectURL(blob);
   a.download="cunyin_"+s.name+"_"+p.name+"_300dpi.png";
   a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},4000);
   toast("已导出 300 DPI 相纸")},"image/png");
 };
 /* 打印 */
 $("#btnPrint").onclick=function(){
  var p=curPaper();
  var c=document.createElement("canvas");
  renderSheet(c,PXMM);
  var style=document.createElement("style");
  style.textContent="@page{size:"+fmt(p.w)+"mm "+fmt(p.h)+"mm;margin:0}";
  document.head.appendChild(style);
  $("#printArea").innerHTML="";
  var img=document.createElement("img");
  img.src=c.toDataURL("image/png");
  $("#printArea").appendChild(img);
  setTimeout(function(){window.print();setTimeout(function(){style.remove()},600)},120);
 };
 window.addEventListener("resize",function(){if(st.img)drawFinder()});
}
init();
})();
