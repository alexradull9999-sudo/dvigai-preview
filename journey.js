/* One continuous ribbon, composed around real content rather than a side rail. */
(() => {
  'use strict';
  const main = document.querySelector('#main');
  if (!main) return;
  const ns = 'http://www.w3.org/2000/svg';
  const $ = selector => main.querySelector(selector);
  function node(tag, attributes, parent) {
    const element = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    parent?.append(element);
    return element;
  }
  const svg = node('svg', {class:'story-route','aria-hidden':'true',focusable:'false',preserveAspectRatio:'none'});
  const defs = node('defs', {}, svg);
  const clip = node('clipPath', {id:'ribbon-contact-clip',clipPathUnits:'userSpaceOnUse'}, defs);
  const contactRect = node('rect', {}, clip);
  const fill = node('path', {class:'story-fill',pathLength:'1'}, svg);
  const darkFill = node('path', {class:'story-fill story-fill-dark',pathLength:'1','clip-path':'url(#ribbon-contact-clip)'}, svg);
  const head = node('circle', {class:'story-head',r:'6'}, svg);
  const terminal = node('path', {class:'route-terminal'}, svg);
  const measure = node('path', {});
  main.prepend(svg);
  const chapters = [...main.querySelectorAll('.story-caption')].map(caption => caption.parentElement);
  const steps = [...document.querySelectorAll('.journey-step')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = document.body.classList.contains('motion-paused') || reduced.matches;
  let segments=[], total=1, mainTop=0, current=0, target=0, raf=0, layoutRaf=0;
  let contactY=Infinity, initialized=false, lastTime=0;
  const responseMs=170;
  // Offset geometry ignores entrance and hover transforms.
  function box(element) {
    if (!element) return null;
    let x=0, y=0, ancestor=element;
    while (ancestor && ancestor !== main) {x+=ancestor.offsetLeft;y+=ancestor.offsetTop;ancestor=ancestor.offsetParent;}
    return {x,y,width:element.offsetWidth,height:element.offsetHeight,bottom:y+element.offsetHeight};
  }
  function layout() {
    layoutRaf=0;
    const previousTotal=total, previousLag=target-current;
    const width=main.clientWidth;
    if (!width) return;
    const mobile=width<=760;
    const x=fraction=>Number((width*fraction).toFixed(2));
    const round=value=>Number(value.toFixed(2));
    mainTop=main.getBoundingClientRect().top+scrollY;
    const hero=box($('.hero'));
    if (!hero) return;
    let end={x:x(-.08),y:round(hero.y+hero.height*.18)};
    let d=`M${end.x} ${end.y}`, accumulated=0;
    segments=[];
    function curve(x1,y1,x2,y2,nextX,nextY) {
      const next={x:round(nextX),y:round(Math.max(end.y+1,nextY))};
      // Expanding a card or changing a breakpoint must never fold time backwards.
      const controlY1=Math.max(end.y,Math.min(next.y,y1));
      const controlY2=Math.max(controlY1,Math.min(next.y,y2));
      const command=`C${round(x1)} ${round(controlY1)} ${round(x2)} ${round(controlY2)} ${next.x} ${next.y}`;
      measure.setAttribute('d',`M${end.x} ${end.y}${command}`);
      const length=measure.getTotalLength();
      segments.push({fromY:end.y,toY:next.y,start:accumulated,length});
      accumulated+=length;d+=command;end=next;
    }
    // An actual off-canvas anchor (not just a Bézier handle) lets the ribbon
    // disappear beyond the viewport and turn back as one unbroken path.
    // Its vertical tangent keeps each exit/re-entry smooth and predictable.
    function beyond(side, turnY, returnX, returnY) {
      const outside=x(side==='right' ? 1.12 : -.12);
      const turn=Math.max(end.y+30,turnY);
      const arrival=Math.max(turn+40,returnY);
      const inSpan=turn-end.y, outSpan=arrival-turn;
      curve(end.x,end.y+inSpan*.4,outside,turn-inSpan*.38,outside,turn);
      curve(outside,turn+outSpan*.38,returnX,arrival-outSpan*.4,returnX,arrival);
    }
    curve(x(.14),hero.y+hero.height*.02,x(.74),hero.y+hero.height*.15,x(.74),hero.y+hero.height*.44);
    const approach=box($('#approach')), approachHeading=box($('.approach-heading'));
    if(approach&&approachHeading){
      beyond('right',hero.bottom-35,x(.79),approachHeading.bottom+32);
      curve(x(.79),approach.y+approach.height*.56,x(.12),approach.y+approach.height*.69,x(.16),approach.bottom-45);
    }
    const cases=box($('#cases')), caseHeading=box($('.case-heading'));
    if(cases&&caseHeading){
      beyond('left',cases.y+70,x(.76),caseHeading.bottom+24);
      curve(x(.76),caseHeading.bottom+80,x(.17),cases.y+cases.height*.35,x(.17),cases.y+cases.height*.4);
      curve(x(-.03),cases.y+cases.height*.38,x(.70),cases.y+cases.height*.38,x(.84),cases.y+cases.height*.57);
      curve(x(.99),cases.y+cases.height*.78,x(.25),cases.bottom-195,x(.21),cases.bottom-90);
    }
    const services=box($('#services')), servicesHeading=box($('.services-heading'));
    if(services&&servicesHeading){
      beyond('left',services.y+30,x(.19),servicesHeading.bottom+32);
      curve(x(.19),end.y+55,x(.91),services.y+services.height*.42,x(.91),services.y+services.height*.55);
      beyond('right',services.y+services.height*.69,x(.22),services.bottom-38);
    }
    const start=box($('#start')), startHeading=box($('.start-heading')), prioritySheet=box($('.priority-sheet'));
    if(start&&startHeading){
      curve(x(.22),start.y+45,x(.86),startHeading.y+35,x(.86),startHeading.bottom+32);
      const sheetY=prioritySheet?prioritySheet.y-25:start.y+start.height*.67;
      curve(x(.86),end.y+65,x(.16),Math.max(end.y+70,sheetY-65),x(.16),Math.max(end.y+90,sheetY));
      curve(x(.16),start.y+start.height*.79,x(.84),start.bottom-80,x(.84),start.bottom-30);
    }
    const founder=box($('#founder')), founderCopy=box($('.founder-copy'));
    if(founder){
      const crossY=founderCopy?founderCopy.y+Math.min(150,founderCopy.height*.24):founder.y+180;
      beyond('right',founder.y+20,x(.22),founder.y+Math.min(220,founder.height*.17));
      curve(x(.22),end.y+55,x(.93),Math.max(end.y+60,crossY-95),x(.86),Math.max(end.y+110,crossY+60));
      curve(x(.73),founder.y+founder.height*.71,x(.06),founder.bottom-135,x(.23),founder.bottom+25);
    }
    const work=box($('#work')), scopeIntro=box($('.scope-intro'));
    if(work&&scopeIntro){
      curve(x(.31),work.y+45,x(.84),scopeIntro.y+25,x(.88),scopeIntro.bottom);
      beyond('right',scopeIntro.bottom+55,x(.85),scopeIntro.bottom+180);
      curve(x(.69),work.y+work.height*.52,x(.09),work.bottom-130,x(.16),work.bottom+22);
    }
    const faq=box($('.faq'));
    if(faq){
      beyond('left',faq.y+85,x(.22),faq.y+Math.min(280,faq.height*.45));
      curve(x(.22),end.y+55,x(.86),Math.max(end.y+60,faq.y+faq.height*.5),x(.78),faq.y+faq.height*.72);
      curve(x(.65),faq.bottom-20,x(.12),faq.bottom-40,x(.18),faq.bottom+24);
    }
    const contact=box($('#contact')), form=box($('#contact-card'));
    let terminalPoint=end;
    if(contact&&form){
      contactY=contact.y;
      const destination={x:form.x+form.width*(mobile?.72:.54),y:form.y-(mobile?15:22)};
      if(mobile){
        curve(x(.66),contact.y+95,x(1.09),contact.y+(form.y-contact.y)*.43,x(.82),contact.y+(form.y-contact.y)*.67);
        curve(x(.56),destination.y-120,destination.x,destination.y-86,destination.x,destination.y);
      }else curve(x(.26),contact.y+80,destination.x,Math.max(contact.y+55,destination.y-65),destination.x,destination.y);
      terminalPoint=end;
      Object.entries({x:0,y:contactY,width,height:main.offsetHeight-contactY+100}).forEach(([key,value])=>contactRect.setAttribute(key,value));
    }else{contactY=Infinity;contactRect.setAttribute('width','0');contactRect.setAttribute('height','0');}
    total=Math.max(1,accumulated);
    svg.setAttribute('viewBox',`0 0 ${width} ${main.offsetHeight}`);
    svg.setAttribute('width',width);svg.setAttribute('height',main.offsetHeight);
    [fill,darkFill].forEach(path=>path.setAttribute('d',d));
    const tip=mobile?15:21;
    terminal.setAttribute('d',`M${terminalPoint.x-tip} ${terminalPoint.y-tip}L${terminalPoint.x} ${terminalPoint.y}L${terminalPoint.x+tip} ${terminalPoint.y-tip}`);
    head.setAttribute('r',mobile?'4.5':'6.5');
    chapters.forEach(section=>{section.dataset.routeY=box(section).y;});
    steps.forEach(step=>{
      const destination=box(document.getElementById(step.getAttribute('href').slice(1)));
      step.dataset.routeY=destination?destination.y:Infinity;
    });
    document.documentElement.classList.add('journey-ready');
    updateTarget();
    if(!initialized) current=Math.max(0,target-Math.min(width*.35,target));
    else if(!paused) current=Math.max(0,Math.min(total,target-previousLag*total/previousTotal));
    initialized=true;paint();
  }
  function queueLayout(){if(!layoutRaf)layoutRaf=requestAnimationFrame(layout);}
  function updateTarget(){
    const readingY=scrollY+innerHeight*.73-mainTop;
    const segment=segments.find(part=>readingY<=part.toY)||segments[segments.length-1];
    if(!segment)return;
    const fraction=Math.max(0,Math.min(1,(readingY-segment.fromY)/Math.max(1,segment.toY-segment.fromY)));
    target=Math.min(total,segment.start+segment.length*fraction);
    if(paused){current=target;paint();}
    else if(!raf&&!document.hidden){lastTime=0;raf=requestAnimationFrame(tick);}
  }
  function paint(){
    const progress=paused?1:Math.max(0,Math.min(1,current/total));
    const offset=String(1-progress);
    fill.style.strokeDashoffset=offset;darkFill.style.strokeDashoffset=offset;
    const point=fill.getPointAtLength(Math.max(0,Math.min(total,current)));
    head.setAttribute('cx',point.x.toFixed(2));head.setAttribute('cy',point.y.toFixed(2));
    head.classList.toggle('is-dark',point.y>=contactY);
    const readingY=scrollY+innerHeight*.55-mainTop;
    let active=-1;
    chapters.forEach((section,index)=>{const reached=readingY>=Number(section.dataset.routeY);section.classList.toggle('story-reached',reached);if(reached)active=index;});
    chapters.forEach((section,index)=>section.classList.toggle('story-current',index===active));
    // Navigation follows its actual anchors, so inserting chapters does not
    // prematurely mark "Команда" or "Ваш шаг" as reached.
    let group=-1;
    steps.forEach((step,index)=>{if(readingY>=Number(step.dataset.routeY))group=index;});
    steps.forEach((step,index)=>{step.classList.toggle('is-current',index===group);step.classList.toggle('is-done',index<group);if(index===group)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');});
    const complete=progress>.998;
    svg.classList.toggle('is-complete',complete);$('#contact-card')?.classList.toggle('route-arrived',complete);
  }
  function tick(time){
    raf=0;if(paused||document.hidden)return;
    const delta=lastTime?Math.min(64,time-lastTime):16;lastTime=time;
    current+=(target-current)*(1-Math.exp(-delta/responseMs));
    if(Math.abs(target-current)<.5)current=target;
    paint();if(current!==target)raf=requestAnimationFrame(tick);
  }
  window.addEventListener('scroll',updateTarget,{passive:true});
  window.addEventListener('resize',queueLayout,{passive:true});
  window.addEventListener('dvigai:layout',queueLayout);
  window.addEventListener('dvigai:motion',event=>{paused=event.detail.paused||reduced.matches;if(raf)cancelAnimationFrame(raf);raf=0;updateTarget();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}else updateTarget();});
  new ResizeObserver(queueLayout).observe(main);
  document.fonts?.ready.then(queueLayout);
  layout();
})();
