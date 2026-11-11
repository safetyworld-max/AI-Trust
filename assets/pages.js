(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));

/* mobile nav */
const menu=$('.mobile-nav-toggle'), nav=$('#main-nav');
function closeMenu(){if(!nav||!menu)return;nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','打开导航菜单')}
if(menu&&nav){
  menu.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'关闭导航菜单':'打开导航菜单')});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();if(document.activeElement&&document.activeElement.closest('#main-nav'))menu.focus()}});
  addEventListener('resize',()=>{if(innerWidth>980)closeMenu()});
}

/* scroll progress */
const progress=$('.scroll-progress');let scheduled=false;
function onScroll(){if(scheduled||!progress)return;scheduled=true;requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform='scaleX('+(max>0?scrollY/max:0)+')';scheduled=false})}
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* footer year */
const year=$('#year');if(year)year.textContent=new Date().getFullYear();

/* in-page search */
const searchToggle=$('#searchToggle'), searchPanel=$('#searchPanel'), searchForm=$('#searchForm'), searchInput=$('#siteSearch');
if(searchToggle&&searchPanel&&searchForm&&searchInput){
  searchToggle.addEventListener('click',()=>{
    const open=!searchPanel.classList.contains('open');
    searchPanel.classList.toggle('open',open);
    searchToggle.setAttribute('aria-expanded',String(open));
    if(open)searchInput.focus();
  });
  searchForm.addEventListener('submit',e=>{
    e.preventDefault();
    const q=searchInput.value.trim();
    if(!q)return;
    const needle=q.toLowerCase();
    const main=$('#main');
    const nodes=main.querySelectorAll('h1,h2,h3,p,li,td,th');
    let found=null;
    for(const n of nodes){if(n.textContent.toLowerCase().includes(needle)){found=n;break}}
    $$('.search-result').forEach(el=>el.classList.remove('search-result'));
    if(found){
      found.classList.add('search-result');
      found.scrollIntoView({behavior:'smooth',block:'center'});
    }else{
      searchInput.setAttribute('aria-invalid','true');
      searchInput.placeholder='未找到“'+q+'”，换个关键词试试';
    }
  });
  searchInput.addEventListener('input',()=>searchInput.removeAttribute('aria-invalid'));
}
})();
