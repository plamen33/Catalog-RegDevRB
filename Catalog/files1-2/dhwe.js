// Created by Dynamic HTML Editor V.1.9
function getLayer(n) {var o;if (isDom2) return document.getElementById(n);if (isNS) return document.layers[n];if (isIE) return document.all(n);if (o=eval('document.'+n)) return o;return null;}
function getPic(n) {var d;if (isNS) if (d=document.layers['ldhe'+n]) return d.document.images[n]; return getLayer(n);}
function jsCngPic(s,d) {var s1,d1;if ((s1=getPic(s))&&(d1=getPic(d))) d1.src=s1.src;}
function jsShow(n,b) {var o;if (o=getLayer('ldhe'+n)) {if (isNS) return (o.visibility=b?'show':'hide');else if (o.style) return (o.style.visibility=b?'visible':'hidden');}}
function jsMove(n,l,t) {var o;if (o=getLayer('ldhe'+n)) {if (isNS) {o.left=l;o.top=t;}else if (o.style) {o.style.left=l+'px';o.style.top=t+'px';}}}
function jsRoll(n,s,a) {a=eval('dheroll_'+a);if (!a) return; var o;if (o=getPic(n)) if (a[s]) o.src=a[s].src;}
function dhePreloadImgs(a,s) {if (!a) return; var i,v=s.split(';'); for (i=0;i<v.length;i++) {if (v[i].length) {a[i]=new Image();a[i].src=v[i];}}}

