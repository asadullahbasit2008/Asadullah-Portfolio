const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* name letters + hero entrance */
const nm=$('#name');nm.setAttribute('aria-label',nm.textContent);
nm.innerHTML=[...nm.textContent].map((c,i)=>`<span aria-hidden="true" style="--i:${i}">${c}</span>`).join('');
requestAnimationFrame(()=>setTimeout(()=>document.body.classList.add('ready'),80));

/* typing roles */
const roles=['Software Engineering Student','Front-End Developer & Designer','Web Developer'],tp=$('#typed');
let ri=0,ci=0,del=false;
(function type(){
  if(reduce){tp.textContent=roles[0];return}
  const w=roles[ri];ci+=del?-1:1;tp.textContent=w.slice(0,ci);let d=del?35:75;
  if(!del&&ci===w.length){del=true;d=1700}else if(del&&ci===0){del=false;ri=(ri+1)%roles.length;d=350}
  setTimeout(type,d);
})();

/* scroll reveal */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
$$('.rv').forEach(el=>io.observe(el));

/* 3D tilt + spotlight */
$$('[data-tilt]').forEach(el=>{
  const m=+el.dataset.tilt||8;
  el.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'||reduce)return;
    const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
    el.style.setProperty('--ry',(x-.5)*m*2+'deg');el.style.setProperty('--rx',(.5-y)*m*2+'deg');
    el.style.setProperty('--mx',x*100+'%');el.style.setProperty('--my',y*100+'%');el.classList.add('hot');
  });
  el.addEventListener('pointerleave',()=>{el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg');el.classList.remove('hot')});
});

/* nav, progress, timeline */
const nav=$('#nav'),menu=$('#menu'),burger=$('#burger'),links=$$('#menu a'),secs=$$('main section'),tl=$('#tl');
burger.onclick=()=>{const o=menu.classList.toggle('open');burger.setAttribute('aria-expanded',o)};
links.forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');burger.setAttribute('aria-expanded',false)}));
let lastY=0;
function onScroll(){
  const y=scrollY,max=document.documentElement.scrollHeight-innerHeight;
  document.body.style.setProperty('--sp',max>0?y/max:0);
  nav.classList.toggle('hide',y>lastY&&y>200&&!menu.classList.contains('open'));lastY=y;
  const cur=secs.filter(s=>s.offsetTop-innerHeight/2<=y).pop();
  links.forEach(a=>a.classList.toggle('on',cur&&a.hash==='#'+cur.id));
  const r=tl.getBoundingClientRect();
  tl.style.setProperty('--p',Math.min(1,Math.max(0,(innerHeight*.7-r.top)/r.height)));
}
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* ===== 3D scene: crystal that travels with the scroll + particle field ===== */
if(window.THREE){
  const T=THREE,cv=$('#bg'),R=new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true});
  R.setPixelRatio(Math.min(devicePixelRatio,1.75));
  const S=new T.Scene(),C=new T.PerspectiveCamera(45,1,.1,100);C.position.z=6;
  const ice=new T.PointLight(0x5cc8ff,2.2,24),gold=new T.PointLight(0xe9c27a,2.2,24);
  ice.position.set(-3,2,4);gold.position.set(3,-2,3);
  S.add(ice,gold,new T.AmbientLight(0x6688aa,.7));
  const G=new T.Group();S.add(G);
  const core=new T.Mesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:0x1d3557,metalness:.85,roughness:.28,flatShading:true,emissive:0x0b2a4a}));
  const wire=new T.Mesh(new T.IcosahedronGeometry(1.4,1),new T.MeshBasicMaterial({color:0x5cc8ff,wireframe:true,transparent:true,opacity:.35}));
  const r1=new T.Mesh(new T.TorusGeometry(2,.012,8,200),new T.MeshBasicMaterial({color:0xe9c27a}));
  const r2=new T.Mesh(new T.TorusGeometry(2.4,.01,8,200),new T.MeshBasicMaterial({color:0x5cc8ff}));
  r1.rotation.x=1.2;r2.rotation.set(.4,1.1,0);
  const s1=new T.Mesh(new T.SphereGeometry(.08,16,16),new T.MeshBasicMaterial({color:0xe9c27a})),
        s2=new T.Mesh(new T.SphereGeometry(.07,16,16),new T.MeshBasicMaterial({color:0x5cc8ff}));
  r1.add(s1);r2.add(s2);G.add(core,wire,r1,r2);

  const N=innerWidth<800?500:1400,pos=new Float32Array(N*3),col=new Float32Array(N*3);
  for(let i=0;i<N;i++){
    pos.set([(Math.random()-.5)*20,(Math.random()-.5)*14,(Math.random()-.5)*14-2],i*3);
    const c=new T.Color(Math.random()<.2?0xe9c27a:0x5cc8ff);col.set([c.r,c.g,c.b],i*3);
  }
  const pg=new T.BufferGeometry();
  pg.setAttribute('position',new T.BufferAttribute(pos,3));pg.setAttribute('color',new T.BufferAttribute(col,3));
  const pts=new T.Points(pg,new T.PointsMaterial({size:.035,vertexColors:true,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending}));
  S.add(pts);

  const ids=['home','about','skills','projects','education','contact'],
        kf=[{x:2.2,y:0,s:1.6,o:1},{x:-3.4,y:0,s:.8,o:.6},{x:3.5,y:0,s:.8,o:.6},{x:-3.7,y:0,s:.7,o:.5},{x:3.6,y:0,s:.8,o:.6},{x:0,y:0,s:1.3,o:.4}],
        els=ids.map(i=>document.getElementById(i));
  let mids=[],mx=0,my=0,cur={...kf[0]};
  const calc=()=>{mids=els.map(e=>e.offsetTop+e.offsetHeight/2)};
  function target(){
    const y=scrollY+innerHeight/2,n=innerWidth<800;let i=0;
    while(i<mids.length-2&&y>mids[i+1])i++;
    let t=Math.min(1,Math.max(0,(y-mids[i])/(mids[i+1]-mids[i])));t=t*t*(3-2*t);
    const o={};for(const k in kf[0])o[k]=kf[i][k]+(kf[i+1][k]-kf[i][k])*t;
    if(n){o.x=0;o.y=i===0&&t<.5?1.7:0;o.o*=.5;o.s*=.8}
    return o;
  }
  function size(){R.setSize(innerWidth,innerHeight,false);C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix();calc()}
  addEventListener('resize',size);addEventListener('load',()=>{calc();if(reduce)draw(0)});
  addEventListener('pointermove',e=>{mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1});
  function draw(t){
    const k=target();for(const a in cur)cur[a]+=(k[a]-cur[a])*(reduce?1:.06);
    G.position.set(cur.x,cur.y,0);G.scale.setScalar(cur.s*(1+.03*Math.sin(t*1.5)));
    G.rotation.y=t*.25+mx*.6;G.rotation.x=my*.4+scrollY*.0006;
    wire.rotation.y=-t*.3;wire.rotation.x=t*.15;r1.rotation.z=t*.4;r2.rotation.z=-t*.3;
    s1.position.set(Math.cos(t*1.4)*2,Math.sin(t*1.4)*2,0);s2.position.set(Math.cos(-t*1.1)*2.4,Math.sin(-t*1.1)*2.4,0);
    ice.position.x=mx*6;ice.position.y=-my*4;
    pts.rotation.y=t*.02+mx*.05;pts.position.y=scrollY*.0008;
    cv.style.opacity=cur.o;R.render(S,C);
  }
  size();
  if(reduce)draw(0);else(function loop(ms){draw(ms*.001);requestAnimationFrame(loop)})(0);
}
