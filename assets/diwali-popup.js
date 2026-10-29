/* Diwali offer popup: shows the two supplied pictures as they are
   (web: images/offers/diwali-web.jpg, mobile: images/offers/diwali-mobile.jpg).
   Only the close (X) and "Grab This Offer Now" areas of the picture are made clickable.
   Grab -> WhatsApp 99444 42061. */
(function(){
  var WA='919944442061';
  var TEXT='Hi EntraBuild, I saw the Diwali Special Offer: flat 70% off on all software products. I would like to grab this offer.';
  var KEY='eb-diwali-seen';
  function seen(){try{return sessionStorage.getItem(KEY)==='1'}catch(e){return false}}
  function mark(){try{sessionStorage.setItem(KEY,'1')}catch(e){}}
  var css='.dw-ov{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(5,8,16,.62);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);opacity:0;transition:opacity .25s}'+
  '.dw-ov.on{opacity:1}'+
  '.dw-box{position:relative;line-height:0;border-radius:22px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.45);transform:translateY(14px) scale(.97);transition:transform .3s cubic-bezier(.2,.8,.2,1);max-width:100%}'+
  '.dw-ov.on .dw-box{transform:none}'+
  '.dw-box picture,.dw-box img{display:block}'+
  '.dw-box img{width:min(92vmin,640px);height:auto;max-height:92vh;object-fit:contain}'+
  '.dw-hit{position:absolute;display:block;background:transparent;border:0;padding:0;margin:0;cursor:pointer;text-decoration:none;-webkit-tap-highlight-color:transparent;border-radius:999px}'+
  '.dw-hit:focus-visible{outline:3px solid #F5B03C;outline-offset:2px}'+
  '.dw-x{left:91.2%;top:2%;width:6.8%;height:6.8%}'+
  '.dw-go{left:25.3%;top:86.1%;width:49.5%;height:8.2%}'+
  '.dw-m{display:none}'+
  '@media (max-width:700px){'+
  '.dw-box img{width:min(92vw,calc(88vh * .563));max-height:none}'+
  '.dw-w{display:none}.dw-m{display:block}'+
  '.dw-x{left:87.5%;top:2.6%;width:8.6%;height:4.8%}'+
  '.dw-go{left:17%;top:89.2%;width:66.2%;height:6.9%}}'+
  '@media (prefers-reduced-motion:reduce){.dw-ov,.dw-box{transition:none}}';
  function build(){
    var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    var ov=document.createElement('div');ov.className='dw-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Diwali Special Offer: flat 70% off on all software products');
    var url='https://wa.me/'+WA+'?text='+encodeURIComponent(TEXT);
    ov.innerHTML='<div class="dw-box"><picture>'+
      '<source media="(max-width:700px)" srcset="images/offers/diwali-mobile.jpg">'+
      '<img src="images/offers/diwali-web.jpg" alt="Diwali Special Offer. Flat 70% off on all software products. Offer ends near Diwali." width="1254" height="1254" decoding="async"></picture>'+
      '<button type="button" class="dw-hit dw-x" aria-label="Close offer"></button>'+
      '<a class="dw-hit dw-go" href="'+url+'" target="_blank" rel="noopener" aria-label="Grab this offer now on WhatsApp"></a></div>';
    document.body.appendChild(ov);
    var last=document.activeElement;
    function close(){mark();ov.classList.remove('on');document.removeEventListener('keydown',key);setTimeout(function(){ov.remove();st.remove();try{last&&last.focus&&last.focus()}catch(e){}},260)}
    function key(e){if(e.key==='Escape')close()}
    ov.addEventListener('click',function(e){if(e.target===ov||e.target.closest('.dw-x'))close();else if(e.target.closest('.dw-go'))mark()});
    document.addEventListener('keydown',key);
    requestAnimationFrame(function(){ov.classList.add('on');var b=ov.querySelector('.dw-go');try{b.focus({preventScroll:true})}catch(e){}});
  }
  function start(){if(seen())return;setTimeout(build,900)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
