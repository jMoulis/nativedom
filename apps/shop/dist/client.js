var U=e=>{throw TypeError(e)};var V=(e,t,n)=>t.has(e)||U("Cannot "+n);var p=(e,t,n)=>(V(e,t,"read from private field"),n?n.call(e):t.get(e)),E=(e,t,n)=>t.has(e)?U("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,n);var z=(e,t,n)=>(V(e,t,"access private method"),n);let k=null,j=0;const D=new Set;function $(e){let t=e;const n=new Set;return{get(){return k!==null&&(n.add(k),k.deps.add(n)),t},set(r){console.log(r),!Object.is(t,r)&&(t=r,de(n))},peek(){return t}}}function A(e){let t=null;const n=()=>{r();const a=k;k=n,n.deps=new Set;try{const i=e();typeof i=="function"&&(t=i)}finally{k=a}};n.deps=new Set;function r(){t!==null&&(t(),t=null),n.deps.forEach(a=>{a.delete(n)}),n.deps.clear()}return n(),{dispose(){r()}}}function O(e){const t=$(le(e));return A(()=>{t.set(e())}),{get:()=>t.get(),peek:()=>t.peek()}}function ce(e){j++;try{e()}finally{if(j--,j===0){const t=new Set(D);D.clear(),t.forEach(n=>{n()})}}}function le(e){const t=k;k=null;try{return e()}finally{k=t}}function de(e){e.size!==0&&(j>0?e.forEach(t=>{D.add(t)}):[...e].forEach(t=>{t()}))}const G=Symbol("nf.ref");function Y(){return{[G]:!0,el:null}}function fe(e){return typeof e=="object"&&e!==null&&e[G]===!0}const F=Symbol("nf.directive");function Z(e){return typeof e=="object"&&e!==null&&F in e&&e[F]===!0}const J="__NF__",ue=/^__NF__(\d+)$/,_=/__NF__(\d+)/g,B="@",H=".",K=new WeakMap;let I=null;function ee(e,t){I=e;try{return t()}finally{I=null}}function pe(){return I}function te(e,...t){return typeof window>"u"?ne(e,t):he(e,t)}function he(e,t){let n=K.get(e);n===void 0&&(n=me(e),K.set(e,n));const r=n.content.cloneNode(!0),a=ge(r);for(const i of a){const o=t[i.index];o!==void 0&&be(i,o)}return r}function me(e){let t="";for(let r=0;r<e.length;r++)if(t+=e[r],r<e.length-1){const a=t.lastIndexOf("<"),i=t.lastIndexOf(">");a>i?t+=`${J}${r}`:t+=`<!--${J}${r}-->`}const n=document.createElement("template");return n.innerHTML=t,n}function ge(e){const t=[],n=document.createTreeWalker(e,NodeFilter.SHOW_COMMENT|NodeFilter.SHOW_ELEMENT);let r;for(;(r=n.nextNode())!==null;)if(r.nodeType===Node.COMMENT_NODE){const a=ue.exec(r.nodeValue??"");a!==null&&t.push({type:"content",node:r,index:parseInt(a[1]??"0",10)})}else if(r.nodeType===Node.ELEMENT_NODE){const a=r;for(const i of[...a.attributes])if(i.name.startsWith(B)){const o=_.exec(i.value);_.lastIndex=0,o!==null&&t.push({type:"event",node:a,index:parseInt(o[1]??"0",10),eventName:i.name.slice(B.length)})}else if(i.name.startsWith(H)){const o=_.exec(i.value);_.lastIndex=0,o!==null&&t.push({type:"prop",node:a,index:parseInt(o[1]??"0",10),propName:i.name.slice(H.length)})}else if(i.name==="ref"){const o=_.exec(i.value);_.lastIndex=0,o!==null&&t.push({type:"ref",node:a,index:parseInt(o[1]??"0",10)})}else{const o=_.exec(i.value);_.lastIndex=0,o!==null&&t.push({type:"attr",node:a,index:parseInt(o[1]??"0",10),attrName:i.name})}}return t}function be(e,t){const n=I??A;switch(e.type){case"event":{typeof t=="function"&&e.node.addEventListener(e.eventName,t),e.node.removeAttribute(`${B}${e.eventName}`);break}case"prop":{e.node.removeAttribute(`${H}${e.propName}`);const r=a=>{e.node[e.propName]=a};typeof t=="function"?n(()=>{r(t())}):r(t);break}case"content":{const r=e.node;if(Z(t)){t._apply(r,n);break}let a=[];const i=o=>{var c,u;for(const h of a)(c=h.parentNode)==null||c.removeChild(h);a=[];for(const h of re(o))(u=r.parentNode)==null||u.insertBefore(h,r),a.push(h)};typeof t=="function"?n(()=>i(t())):i(t);break}case"ref":{e.node.removeAttribute("ref"),fe(t)&&(t.el=e.node);break}case"attr":{typeof t=="function"?n(()=>{e.node.setAttribute(e.attrName,R(t()))}):e.node.setAttribute(e.attrName,R(t));break}}}function ne(e,t){let n="";for(let r=0;r<e.length;r++){const a=e[r]??"";if(r<t.length){const i=t[r];if(/\s([@.][\w:-]+|ref)=["']?$/.test(a.trimEnd())){n+=a.replace(/\s([@.][\w:-]+|ref)=["']?$/,"");continue}n+=a;const c=typeof i=="function"?i():i;Z(c)?n+=c._ssr():Array.isArray(c)?n+=c.map(u=>typeof u=="string"?u:Q(R(u))).join(""):n+=Q(R(c))}else n+=a}return n}function re(e){return e instanceof DocumentFragment?[...e.childNodes]:e instanceof Node?[e]:Array.isArray(e)?e.flatMap(re):[document.createTextNode(R(e))]}function R(e){return e==null?"":String(e)}function Q(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function ye(e){return{[F]:!0,_apply(t){var r;const n=document.createElement("template");n.innerHTML=e,(r=t.parentNode)==null||r.insertBefore(n.content,t)},_ssr(){return e}}}const L=new WeakMap,oe=new Map;function P(e,t,n={}){if(!e.includes("-"))throw new Error(`[nativeframe] Component name "${e}" must contain a hyphen (Custom Elements spec).`);const r={name:e,fn:t,options:{shadow:n.shadow??!0,shadowMode:n.shadowMode??"open",observedAttrs:n.observedAttrs??[],island:n.island??!1,onError:n.onError,styles:n.styles}};return oe.set(e,r),typeof window<"u"&&xe(r),_e(e)}function we(e,t={}){const n=oe.get(e);if(n===void 0)throw new Error(`[nativeframe] Unknown component: "${e}". Did you forget to import it?`);const r=ke(),i=ee(c=>({dispose:()=>{}}),()=>n.fn(t,r)),o=Ee(t,n.options.island);return n.options.shadow?`<${e}${o}><template shadowrootmode="${n.options.shadowMode}">`+(n.options.styles?`<style>${n.options.styles}</style>`:"")+String(i)+`</template></${e}>`:`<${e}${o}>${String(i)}</${e}>`}function ve(e,t){if(document.querySelector(`style[data-nf="${e}"]`)!==null)return;const n=document.createElement("style");n.dataset.nf=e,n.textContent=`@scope (${e}) {
${t}
}`,document.head.appendChild(n)}function xe(e){var o,c,u,h,m,W,ae,se;const{name:t,fn:n,options:r}=e;if(customElements.get(t)!==void 0)return;!r.shadow&&r.styles!==void 0&&ve(t,r.styles);let a;if(r.shadow&&r.styles!==void 0)try{a=new CSSStyleSheet,a.replaceSync(r.styles)}catch{}class i extends HTMLElement{constructor(){super(...arguments);E(this,m);E(this,o,[]);E(this,c,[]);E(this,u,[]);E(this,h,[])}static get observedAttributes(){return r.observedAttrs}connectedCallback(){if(a!==void 0){const f=this.shadowRoot??this.attachShadow({mode:r.shadowMode});f.adoptedStyleSheets.includes(a)||(f.adoptedStyleSheets=[a,...f.adoptedStyleSheets])}z(this,m,W).call(this),p(this,c).forEach(f=>{f()})}disconnectedCallback(){p(this,o).forEach(f=>{f.dispose()}),p(this,o).length=0,p(this,u).forEach(f=>{f()});for(const f of p(this,h))f.el=null;p(this,h).length=0}attributeChangedCallback(f,s,d){s!==d&&z(this,m,W).call(this)}}o=new WeakMap,c=new WeakMap,u=new WeakMap,h=new WeakMap,m=new WeakSet,W=function(){var b;const f=r.shadow?this.shadowRoot??this.attachShadow({mode:r.shadowMode}):this;if(f.childNodes.length>0&&this.hasAttribute("nf-ssr")){this.removeAttribute("nf-ssr");return}for(const g of p(this,h))g.el=null;p(this,h).length=0;const s=z(this,m,se).call(this),d=z(this,m,ae).call(this);if(r.shadow&&r.styles!==void 0&&a===void 0&&f.querySelector("style[data-nf]")===null){const g=document.createElement("style");g.dataset.nf=t,g.textContent=r.styles,f.appendChild(g)}const l=p(this,o).length;try{const g=ee(s.effect,()=>n(d,s));f.replaceChildren(g)}catch(g){for(let y=l;y<p(this,o).length;y++)(b=p(this,o)[y])==null||b.dispose();if(p(this,o).length=l,r.onError!==void 0){console.error(`[nativeframe] <${this.tagName.toLowerCase()}>:`,g);try{const y=r.onError(g);y instanceof DocumentFragment?f.replaceChildren(y):f.innerHTML=typeof y=="string"?y:String(y??"")}catch{f.innerHTML=""}}else throw g}},ae=function(){const f={};for(const d of this.attributes)if(d.name!=="nf-ssr")try{f[d.name]=JSON.parse(d.value)}catch{f[d.name]=d.value}const s=this._nfProps;return s!==void 0&&Object.assign(f,s),f},se=function(){const f=this;return{signal(s){return $(s)},computed(s){return O(s)},batch:ce,effect(s){const d=r.onError!==void 0?A(()=>{try{s()}catch(l){console.error(`[nativeframe] effect error in <${f.tagName.toLowerCase()}>:`,l)}}):A(s);return p(f,o).push(d),d},watch(s,d){let l,b=!1;const g=A(()=>{const y=s();if(!b){b=!0,l=y;return}d(y,l),l=y});p(f,o).push(g)},html:te,onMount(s){p(f,c).push(s)},onUnmount(s){p(f,u).push(s)},provide(s,d){let l=L.get(f);l===void 0&&(l=new Map,L.set(f,l)),l.set(s._id,d)},inject(s){let d=f.parentElement;for(;d!==null;){const l=L.get(d);if(l!==void 0&&l.has(s._id))return l.get(s._id);d=d.parentElement}return s._defaultValue},ref(){const s=Y();return p(f,h).push(s),s}}},customElements.define(t,i)}function ke(){return{signal(e){return{get:()=>e,peek:()=>e,set:()=>{}}},computed(e){const t=e();return{get:()=>t,peek:()=>t}},batch(e){e()},effect(e){return{dispose:()=>{}}},watch:()=>{},html:(e,...t)=>ne(e,t),onMount:()=>{},onUnmount:()=>{},provide:()=>{},inject:e=>e._defaultValue,ref:()=>Y()}}function _e(e){return t=>{if(typeof window>"u")return{[F]:!0,_apply(){},_ssr(){return`<${e}${$e(t)}></${e}>`}};const n=document.createElement(e);if(t){const r={};let a=!1;for(const[i,o]of Object.entries(t))o!=null&&(typeof o=="object"||typeof o=="function"?(r[i]=o,a=!0):n.setAttribute(i,String(o)));a&&(n._nfProps=r)}return n}}function $e(e){if(!e)return"";let t="";for(const[n,r]of Object.entries(e))r!=null&&(typeof r=="object"||typeof r=="function"||(t+=` ${n}="${String(r).replace(/"/g,"&quot;")}"`));return t}function Ee(e,t){let n=t?" nf-ssr":"";for(const[r,a]of Object.entries(e)){if(typeof a=="function")continue;const i=typeof a=="object"?JSON.stringify(a):String(a);n+=` ${r}="${i.replace(/"/g,"&quot;")}"`}return n}function ie(e,t={}){const n=t.initialValue!==void 0,r=$(t.initialValue),a=$(!n),i=$(void 0);let o=0,c=t.lazy??n;const u=()=>{if(c){c=!1;return}const m=++o;a.set(!0),i.set(void 0),e().then(w=>{m===o&&(r.set(w),a.set(!1))},w=>{m===o&&(i.set(w instanceof Error?w:new Error(String(w))),a.set(!1))})};return(pe()??A)(u),{data:r,loading:a,error:i,refetch:u}}P("shop-header",(e,{html:t})=>t`
    <header class="shop-header">
      <a class="logo" href="/">NativeFrame Shop</a>
      <nav class="nav">
        <a href="/">Shop</a>
        <a href="/admin">Admin</a>
      </nav>
    </header>
  `,{shadow:!1,styles:`
      :scope {
        display: block;
        background: #1a1a2e;
        padding: 0 2rem;
      }
      .shop-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 56px;
        max-width: 1100px;
        margin: 0 auto;
      }
      .logo {
        color: #fff;
        text-decoration: none;
        font-size: 1.2rem;
        font-weight: 700;
        letter-spacing: 0.03em;
      }
      .nav {
        display: flex;
        gap: 1.5rem;
      }
      .nav a {
        color: #ccc;
        text-decoration: none;
        font-size: 0.9rem;
        transition: color 0.15s;
      }
      .nav a:hover {
        color: #fff;
      }
    `});var x;class Se{constructor(){E(this,x,new Map)}find(t){const n=Array.from(p(this,x).values());return t?n.filter(r=>Object.keys(t).every(a=>r[a]===t[a])):n}findById(t){return p(this,x).get(t)??null}findOne(t){return this.find(t)[0]??null}insertOne(t){const n=crypto.randomUUID(),r={...t,_id:n};return p(this,x).set(n,r),r}updateOne(t,n){const r=p(this,x).get(t);if(!r)return null;const a={...r,...n};return p(this,x).set(t,a),a}deleteOne(t){return p(this,x).delete(t)}count(){return p(this,x).size}}x=new WeakMap;function Ne(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}const q=new Se,Ce=[{name:"Wireless Headphones",description:"Premium over-ear headphones with active noise cancellation and 30-hour battery life.",price:7999,category:"Electronics",stock:42,featured:!0},{name:"Mechanical Keyboard",description:"Compact 75% layout mechanical keyboard with tactile brown switches and RGB backlight.",price:12999,category:"Electronics",stock:18,featured:!1},{name:"Classic Crew Tee",description:"100% organic cotton crew-neck tee in a relaxed fit. Available in 8 colours.",price:2999,category:"Apparel",stock:120,featured:!0},{name:"Merino Wool Beanie",description:"Soft and warm merino wool beanie, one size fits all. Machine washable.",price:1999,category:"Apparel",stock:65,featured:!1},{name:"Clean Code",description:"Robert C. Martin's guide to writing readable, maintainable software. A must-read for every developer.",price:3499,category:"Books",stock:30,featured:!1},{name:"The Pragmatic Programmer",description:"From journeyman to master — timeless advice on crafting software and growing as a developer.",price:3999,category:"Books",stock:25,featured:!0}],Ae=new Date().toISOString();for(const e of Ce)q.insertOne({...e,slug:Ne(e.name),createdAt:Ae});function Pe(e){return`$${(e/100).toFixed(2)}`}P("product-card",({id:e})=>{const t=q.findById(e);if(!t)return'<div class="product-card product-card--missing">Product not found</div>';const n=t.description.length>100?t.description.slice(0,97)+"…":t.description;return`
      <article class="product-card">
        <div class="product-card__badge">${t.category}</div>
        <h2 class="product-card__name">${t.name}</h2>
        <p class="product-card__desc">${n}</p>
        <div class="product-card__footer">
          <span class="product-card__price">${Pe(t.price)}</span>
          <a class="product-card__link" href="/product/${t.slug}">View →</a>
        </div>
      </article>
    `},{shadow:!1,island:!0,styles:`
      :scope {
        display: block;
      }
      .product-card {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        height: 100%;
        box-sizing: border-box;
        transition: box-shadow 0.15s;
      }
      .product-card:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      }
      .product-card__badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #6366f1;
        background: #eef2ff;
        border-radius: 4px;
        padding: 2px 8px;
        align-self: flex-start;
      }
      .product-card__name {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        color: #111;
      }
      .product-card__desc {
        font-size: 0.85rem;
        color: #555;
        line-height: 1.5;
        margin: 0;
        flex: 1;
      }
      .product-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 0.5rem;
      }
      .product-card__price {
        font-size: 1.1rem;
        font-weight: 700;
        color: #111;
      }
      .product-card__link {
        font-size: 0.85rem;
        color: #6366f1;
        text-decoration: none;
        font-weight: 600;
      }
      .product-card__link:hover {
        text-decoration: underline;
      }
    `});P("product-grid",()=>`
      <section class="product-grid">
        <h2 class="product-grid__title">All Products</h2>
        <div class="product-grid__grid">${q.find().map(n=>we("product-card",{id:n._id})).join("")}</div>
      </section>
    `,{shadow:!1,island:!0,styles:`
      :scope {
        display: block;
      }
      .product-grid {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }
      .product-grid__title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111;
        margin: 0 0 1.25rem;
      }
      .product-grid__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 1.25rem;
      }
    `});function Me(e,t){if(e==="*")return{};const n=o=>o.split("/").filter(Boolean),r=n(e),a=n(t);if(r.length!==a.length)return null;const i={};for(let o=0;o<r.length;o++){const c=r[o]??"",u=a[o]??"";if(c.startsWith(":"))i[c.slice(1)]=decodeURIComponent(u);else if(c!==u)return null}return i}function ze(e,t){for(const n of e){const r=Me(n.path,t);if(r!==null)return{route:n,params:r}}return null}function T(e){const t={};return new URLSearchParams(e).forEach((n,r)=>{t[r]=n}),t}function Oe(e,t={}){const n=t.mode??"history",r=typeof window<"u",a=()=>r?n==="hash"?window.location.hash.slice(1)||"/":window.location.pathname:t.ssrPath??"/",i=()=>r?T(window.location.search):{},o=$(a()),c=$(i()),u=O(()=>o.get()),h=O(()=>c.get()),m=O(()=>ze(e,o.get())),w=O(()=>{var d;return((d=m.get())==null?void 0:d.params)??{}}),M=$(0),N=new Set,v=new Set,C=d=>{if(!r)return;const l=d.indexOf("?"),b=l>=0?d.slice(0,l):d,g=l>=0?d.slice(l):"";n==="hash"?window.location.hash=b:history.pushState(null,"",d),o.set(b),c.set(T(g))};return r&&(n==="hash"?window.addEventListener("hashchange",()=>{o.set(window.location.hash.slice(1)||"/"),c.set(T(window.location.search))}):window.addEventListener("popstate",()=>{o.set(window.location.pathname),c.set(T(window.location.search))})),r&&t.interceptLinks===!0&&document.addEventListener("click",d=>{const l=d.target.closest("a[href]");if(l===null)return;const b=l.getAttribute("href");b===null||b.startsWith("http")||b.startsWith("//")||b.startsWith("mailto:")||l.target!==""&&l.target!=="_self"||(d.preventDefault(),C(b))}),{outlet:()=>{const d=m.get();if(d===null)return null;const{route:l,params:b}=d;return l.load!==void 0&&(M.get(),!N.has(l))?(v.has(l)||(v.add(l),l.load().then(()=>{N.add(l),v.delete(l),M.set(M.peek()+1)},()=>{v.delete(l)})),null):l.render(b)},navigate:C,link:d=>{d.preventDefault();const l=d.currentTarget.getAttribute("href");l!==null&&C(l)},currentPath:u,currentParams:w,currentQuery:h}}function Re(e){return`$${(e/100).toFixed(2)}`}const Te=P("admin-products",(e,{html:t})=>{const{data:n,loading:r,error:a,refetch:i}=ie(()=>fetch("/api/products").then(c=>c.json()));async function o(c){await fetch(`/api/products/${c}`,{method:"DELETE"}),i()}return t`
      <div class="ap-wrap">
        <div class="ap-header">
          <h1 class="ap-title">Products</h1>
          <a class="ap-btn" href="/admin/new" @click=${S.link}
            >+ New Product</a
          >
        </div>
        ${()=>a.get()?t`<p class="ap-error">Failed to load products.</p>`:r.get()?t`<p class="ap-loading">Loading…</p>`:t`
                  <table class="ap-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${()=>(n.get()??[]).map(c=>t`
                            <tr>
                              <td>${c.name}</td>
                              <td>${c.category}</td>
                              <td>${Re(c.price)}</td>
                              <td>${c.stock}</td>
                              <td class="ap-actions">
                                <a
                                  class="ap-edit"
                                  href="${`/admin/edit/${c._id}`}"
                                  @click=${S.link}
                                  >Edit</a
                                >
                                <button
                                  class="ap-delete"
                                  @click=${()=>void o(c._id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          `)}
                    </tbody>
                  </table>
                `}
      </div>
    `},{shadow:!1,styles:`
      :scope {
        display: block;
      }
      .ap-wrap {
        max-width: 900px;
      }
      .ap-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
      }
      .ap-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111;
        margin: 0;
      }
      .ap-btn {
        display: inline-block;
        background: #6366f1;
        color: #fff;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 600;
        transition: background 0.15s;
      }
      .ap-btn:hover { background: #4f46e5; }
      .ap-error { color: #dc2626; }
      .ap-loading { color: #6b7280; }
      .ap-table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      }
      .ap-table th,
      .ap-table td {
        text-align: left;
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
      }
      .ap-table th {
        background: #f9fafb;
        font-weight: 600;
        color: #374151;
        border-bottom: 1px solid #e5e7eb;
      }
      .ap-table td {
        border-bottom: 1px solid #f3f4f6;
        color: #111;
      }
      .ap-table tbody tr:last-child td {
        border-bottom: none;
      }
      .ap-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .ap-edit {
        color: #6366f1;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .ap-edit:hover { text-decoration: underline; }
      .ap-delete {
        background: none;
        border: 1px solid #fca5a5;
        color: #dc2626;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: background 0.15s;
      }
      .ap-delete:hover { background: #fee2e2; }
    `}),X=P("admin-form",({"product-id":e},{html:t,signal:n,computed:r,watch:a})=>{const i=!!e,o=n(""),c=n(""),u=n(""),h=n("Electronics"),m=n("0"),w=n(!1),M=r(()=>o.get().trim()!==""&&Number(c.get())>0),N=n(null),v=i?ie(()=>fetch(`/api/products/${e}`).then(s=>s.json())):null;v&&a(()=>v.data.get(),s=>{s&&(o.set(s.name),c.set(String(s.price)),u.set(s.description),h.set(s.category),m.set(String(s.stock)),w.set(s.featured))});async function C(s){s.preventDefault(),N.set(null);const d={name:o.get().trim(),price:Number(c.get()),description:u.get().trim(),category:h.get().trim(),stock:Number(m.get()),featured:w.get()},l=i?`/api/products/${e}`:"/api/products",g=await fetch(l,{method:i?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});if(!g.ok){const y=await g.text();throw new Error(`Server error: ${y}`)}S.navigate("/admin")}const f=["Electronics","Apparel","Books","Other"];return t`
      <div class="af-wrap">
        <h1 class="af-title">${i?"Edit Product":"New Product"}</h1>
        ${()=>N.get()?t`<p class="af-error">${()=>N.get()}</p>`:""}
        ${v?t`${()=>v.loading.get()?t`<p class="af-loading">Loading product…</p>`:""}`:""}
        <form class="af-form" @submit=${s=>void C(s)}>
          <div class="af-field">
            <label class="af-label" for="af-name">Name</label>
            <input
              id="af-name"
              class="af-input"
              type="text"
              .value="${()=>o.get()}"
              @input=${s=>o.set(s.target.value)}
              required
            />
          </div>
          <div class="af-field">
            <label class="af-label" for="af-price">Price (cents)</label>
            <input
              id="af-price"
              class="af-input"
              type="number"
              min="1"
              .value="${()=>c.get()}"
              @input=${s=>c.set(s.target.value)}
              required
            />
            <small class="af-hint">e.g. 2999 = $29.99</small>
          </div>
          <div class="af-field">
            <label class="af-label" for="af-desc">Description</label>
            <textarea
              id="af-desc"
              class="af-input af-textarea"
              rows="4"
              .value="${()=>u.get()}"
              @input=${s=>u.set(s.target.value)}
            ></textarea>
          </div>
          <div class="af-field">
            <label class="af-label" for="af-cat">Category</label>
            <select
              id="af-cat"
              class="af-input"
              .value="${()=>h.get()}"
              @change=${s=>h.set(s.target.value)}
            >
              ${ye(f.map(s=>`<option value="${s}">${s}</option>`).join(""))}
            </select>
          </div>
          <div class="af-field">
            <label class="af-label" for="af-stock">Stock</label>
            <input
              id="af-stock"
              class="af-input"
              type="number"
              min="0"
              .value="${()=>m.get()}"
              @input=${s=>m.set(s.target.value)}
            />
          </div>
          <div class="af-field af-field--check">
            <input
              id="af-featured"
              type="checkbox"
              .checked="${()=>w.get()}"
              @change=${s=>w.set(s.target.checked)}
            />
            <label class="af-label" for="af-featured">Featured product</label>
          </div>
          <div class="af-actions">
            <button
              class="af-submit"
              type="submit"
              .disabled="${()=>!M.get()}"
            >
              ${i?"Save Changes":"Create Product"}
            </button>
            <a class="af-cancel" href="/admin" @click=${S.link}
              >Cancel</a
            >
          </div>
        </form>
      </div>
    `},{shadow:!1,onError:e=>(console.error("AdminForm error:",e),`<p class="af-error">Something went wrong: ${String(e instanceof Error?e.message:e)}</p>`),styles:`
      :scope {
        display: block;
      }
      .af-wrap {
        max-width: 560px;
      }
      .af-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #111;
        margin: 0 0 1.5rem;
      }
      .af-error {
        background: #fee2e2;
        border: 1px solid #fca5a5;
        color: #991b1b;
        border-radius: 6px;
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
        margin-bottom: 1rem;
      }
      .af-loading {
        color: #6b7280;
        margin-bottom: 1rem;
      }
      .af-form {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .af-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .af-field--check {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
      }
      .af-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #374151;
      }
      .af-input {
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
        font-family: inherit;
        color: #111;
        outline: none;
        transition: border-color 0.15s;
        width: 100%;
        box-sizing: border-box;
      }
      .af-input:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
      }
      .af-textarea {
        resize: vertical;
      }
      .af-hint {
        font-size: 0.75rem;
        color: #9ca3af;
      }
      .af-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding-top: 0.5rem;
      }
      .af-submit {
        background: #6366f1;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 0.6rem 1.25rem;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }
      .af-submit:hover:not(:disabled) { background: #4f46e5; }
      .af-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      .af-cancel {
        color: #6b7280;
        text-decoration: none;
        font-size: 0.9rem;
      }
      .af-cancel:hover { text-decoration: underline; }
    `}),S=Oe([{path:"/admin",render:()=>Te({})},{path:"/admin/new",render:()=>X({})},{path:"/admin/edit/:id",render:e=>X({"product-id":e.id??""})},{path:"*",render:()=>te`<p class="not-found">Page not found</p>`}]);P("admin-app",(e,{html:t})=>{const n=()=>S.outlet();return t`
      <div class="admin-layout">
        <aside class="admin-sidebar">
          <div class="admin-sidebar__logo">NF Admin</div>
          <nav class="admin-sidebar__nav">
            <a href="/admin" @click=${S.link}>Products</a>
            <a href="/admin/new" @click=${S.link}>New Product</a>
          </nav>
        </aside>
        <main class="admin-main">
          ${n}
        </main>
      </div>
    `},{shadow:!1,styles:`
      :scope {
        display: block;
        min-height: 100vh;
      }
      .admin-layout {
        display: flex;
        min-height: 100vh;
      }
      .admin-sidebar {
        width: 220px;
        background: #1a1a2e;
        color: #fff;
        display: flex;
        flex-direction: column;
        padding: 1.5rem 1rem;
        gap: 2rem;
        flex-shrink: 0;
      }
      .admin-sidebar__logo {
        font-size: 1.1rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        color: #a5b4fc;
      }
      .admin-sidebar__nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .admin-sidebar__nav a {
        color: #d1d5db;
        text-decoration: none;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        font-size: 0.9rem;
        transition: background 0.15s, color 0.15s;
      }
      .admin-sidebar__nav a:hover {
        background: rgba(255,255,255,0.1);
        color: #fff;
      }
      .admin-main {
        flex: 1;
        padding: 2rem;
        overflow: auto;
      }
      .not-found {
        color: #6b7280;
      }
    `});
