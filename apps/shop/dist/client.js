var V=e=>{throw TypeError(e)};var U=(e,t,r)=>t.has(e)||V("Cannot "+r);var p=(e,t,r)=>(U(e,t,"read from private field"),r?r.call(e):t.get(e)),E=(e,t,r)=>t.has(e)?V("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r);var z=(e,t,r)=>(U(e,t,"access private method"),r);var k=null,j=0,D=new Set;function $(e){let t=e;const r=new Set;return{get(){return k!==null&&(r.add(k),k.deps.add(r)),t},set(n){Object.is(t,n)||(t=n,le(r))},peek(){return t}}}function A(e){let t=null;const r=()=>{n();const a=k;k=r,r.deps=new Set;try{const s=e();typeof s=="function"&&(t=s)}finally{k=a}};r.deps=new Set;function n(){t!==null&&(t(),t=null),r.deps.forEach(a=>{a.delete(r)}),r.deps.clear()}return r(),{dispose(){n()}}}function O(e){const t=$(de(e));return A(()=>{t.set(e())}),{get:()=>t.get(),peek:()=>t.peek()}}function ce(e){j++;try{e()}finally{if(j--,j===0){const t=new Set(D);D.clear(),t.forEach(r=>{r()})}}}function de(e){const t=k;k=null;try{return e()}finally{k=t}}function le(e){e.size!==0&&(j>0?e.forEach(t=>{D.add(t)}):[...e].forEach(t=>{t()}))}var G=Symbol("nf.ref");function Y(){return{[G]:!0,el:null}}function fe(e){return typeof e=="object"&&e!==null&&e[G]===!0}var F=Symbol("nf.directive");function Z(e){return typeof e=="object"&&e!==null&&F in e&&e[F]===!0}var J="__NF__",ue=/^__NF__(\d+)$/,_=/__NF__(\d+)/g,B="@",H=".",K=new WeakMap,I=null;function ee(e,t){I=e;try{return t()}finally{I=null}}function pe(){return I}function te(e,...t){return typeof window>"u"?re(e,t):he(e,t)}function he(e,t){let r=K.get(e);r===void 0&&(r=me(e),K.set(e,r));const n=r.content.cloneNode(!0),a=ge(n);for(const s of a){const o=t[s.index];o!==void 0&&be(s,o)}return n}function me(e){let t="";for(let n=0;n<e.length;n++)if(t+=e[n],n<e.length-1){const a=t.lastIndexOf("<"),s=t.lastIndexOf(">");a>s?t+=`${J}${n}`:t+=`<!--${J}${n}-->`}const r=document.createElement("template");return r.innerHTML=t,r}function ge(e){const t=[],r=document.createTreeWalker(e,NodeFilter.SHOW_COMMENT|NodeFilter.SHOW_ELEMENT);let n;for(;(n=r.nextNode())!==null;)if(n.nodeType===Node.COMMENT_NODE){const a=ue.exec(n.nodeValue??"");a!==null&&t.push({type:"content",node:n,index:parseInt(a[1]??"0",10)})}else if(n.nodeType===Node.ELEMENT_NODE){const a=n;for(const s of[...a.attributes])if(s.name.startsWith(B)){const o=_.exec(s.value);_.lastIndex=0,o!==null&&t.push({type:"event",node:a,index:parseInt(o[1]??"0",10),eventName:s.name.slice(B.length)})}else if(s.name.startsWith(H)){const o=_.exec(s.value);_.lastIndex=0,o!==null&&t.push({type:"prop",node:a,index:parseInt(o[1]??"0",10),propName:s.name.slice(H.length)})}else if(s.name==="ref"){const o=_.exec(s.value);_.lastIndex=0,o!==null&&t.push({type:"ref",node:a,index:parseInt(o[1]??"0",10)})}else{const o=_.exec(s.value);_.lastIndex=0,o!==null&&t.push({type:"attr",node:a,index:parseInt(o[1]??"0",10),attrName:s.name})}}return t}function be(e,t){const r=I??A;switch(e.type){case"event":{typeof t=="function"&&e.node.addEventListener(e.eventName,t),e.node.removeAttribute(`${B}${e.eventName}`);break}case"prop":{e.node.removeAttribute(`${H}${e.propName}`);const n=a=>{e.node[e.propName]=a};typeof t=="function"?r(()=>{n(t())}):n(t);break}case"content":{const n=e.node;if(Z(t)){t._apply(n,r);break}let a=[];const s=o=>{var c,u;for(const h of a)(c=h.parentNode)==null||c.removeChild(h);a=[];for(const h of ne(o))(u=n.parentNode)==null||u.insertBefore(h,n),a.push(h)};typeof t=="function"?r(()=>s(t())):s(t);break}case"ref":{e.node.removeAttribute("ref"),fe(t)&&(t.el=e.node);break}case"attr":{typeof t=="function"?r(()=>{e.node.setAttribute(e.attrName,R(t()))}):e.node.setAttribute(e.attrName,R(t));break}}}function re(e,t){let r="";for(let n=0;n<e.length;n++){const a=e[n]??"";if(n<t.length){const s=t[n];if(/\s([@.][\w:-]+|ref)=["']?$/.test(a.trimEnd())){r+=a.replace(/\s([@.][\w:-]+|ref)=["']?$/,"");continue}r+=a;const c=typeof s=="function"?s():s;Z(c)?r+=c._ssr():Array.isArray(c)?r+=c.map(u=>typeof u=="string"?u:Q(R(u))).join(""):r+=Q(R(c))}else r+=a}return r}function ne(e){return e instanceof DocumentFragment?[...e.childNodes]:e instanceof Node?[e]:Array.isArray(e)?e.flatMap(ne):[document.createTextNode(R(e))]}function R(e){return e==null?"":String(e)}function Q(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function ye(e){return{[F]:!0,_apply(t){var n;const r=document.createElement("template");r.innerHTML=e,(n=t.parentNode)==null||n.insertBefore(r.content,t)},_ssr(){return e}}}var L=new WeakMap,oe=new Map;function P(e,t,r={}){if(!e.includes("-"))throw new Error(`[nativedom] Component name "${e}" must contain a hyphen (Custom Elements spec).`);const n={name:e,fn:t,options:{shadow:r.shadow??!0,shadowMode:r.shadowMode??"open",observedAttrs:r.observedAttrs??[],island:r.island??!1,onError:r.onError,styles:r.styles}};return oe.set(e,n),typeof window<"u"&&xe(n),_e(e)}function we(e,t={}){const r=oe.get(e);if(r===void 0)throw new Error(`[nativedom] Unknown component: "${e}". Did you forget to import it?`);const n=ke(),s=ee(c=>({dispose:()=>{}}),()=>r.fn(t,n)),o=Ee(t,r.options.island);return r.options.shadow?`<${e}${o}><template shadowrootmode="${r.options.shadowMode}">`+(r.options.styles?`<style>${r.options.styles}</style>`:"")+String(s)+`</template></${e}>`:`<${e}${o}>${String(s)}</${e}>`}function ve(e,t){if(document.querySelector(`style[data-nf="${e}"]`)!==null)return;const r=document.createElement("style");r.dataset.nf=e,r.textContent=`@scope (${e}) {
${t}
}`,document.head.appendChild(r)}function xe(e){var o,c,u,h,m,W,ae,ie;const{name:t,fn:r,options:n}=e;if(customElements.get(t)!==void 0)return;!n.shadow&&n.styles!==void 0&&ve(t,n.styles);let a;if(n.shadow&&n.styles!==void 0)try{a=new CSSStyleSheet,a.replaceSync(n.styles)}catch{}class s extends HTMLElement{constructor(){super(...arguments);E(this,m);E(this,o,[]);E(this,c,[]);E(this,u,[]);E(this,h,[])}static get observedAttributes(){return n.observedAttrs}connectedCallback(){if(a!==void 0){const f=this.shadowRoot??this.attachShadow({mode:n.shadowMode});f.adoptedStyleSheets.includes(a)||(f.adoptedStyleSheets=[a,...f.adoptedStyleSheets])}z(this,m,W).call(this),p(this,c).forEach(f=>{f()})}disconnectedCallback(){p(this,o).forEach(f=>{f.dispose()}),p(this,o).length=0,p(this,u).forEach(f=>{f()});for(const f of p(this,h))f.el=null;p(this,h).length=0}attributeChangedCallback(f,i,l){i!==l&&z(this,m,W).call(this)}}o=new WeakMap,c=new WeakMap,u=new WeakMap,h=new WeakMap,m=new WeakSet,W=function(){var b;const f=n.shadow?this.shadowRoot??this.attachShadow({mode:n.shadowMode}):this;if(f.childNodes.length>0&&this.hasAttribute("nf-ssr")){this.removeAttribute("nf-ssr");return}for(const g of p(this,h))g.el=null;p(this,h).length=0;const i=z(this,m,ie).call(this),l=z(this,m,ae).call(this);if(n.shadow&&n.styles!==void 0&&a===void 0&&f.querySelector("style[data-nf]")===null){const g=document.createElement("style");g.dataset.nf=t,g.textContent=n.styles,f.appendChild(g)}const d=p(this,o).length;try{const g=ee(i.effect,()=>r(l,i));f.replaceChildren(g)}catch(g){for(let y=d;y<p(this,o).length;y++)(b=p(this,o)[y])==null||b.dispose();if(p(this,o).length=d,n.onError!==void 0){console.error(`[nativedom] <${this.tagName.toLowerCase()}>:`,g);try{const y=n.onError(g);y instanceof DocumentFragment?f.replaceChildren(y):f.innerHTML=typeof y=="string"?y:String(y??"")}catch{f.innerHTML=""}}else throw g}},ae=function(){const f={};for(const l of this.attributes)if(l.name!=="nf-ssr")try{f[l.name]=JSON.parse(l.value)}catch{f[l.name]=l.value}const i=this._nfProps;return i!==void 0&&Object.assign(f,i),f},ie=function(){const f=this;return{signal(i){return $(i)},computed(i){return O(i)},batch:ce,effect(i){const l=n.onError!==void 0?A(()=>{try{i()}catch(d){console.error(`[nativedom] effect error in <${f.tagName.toLowerCase()}>:`,d)}}):A(i);return p(f,o).push(l),l},watch(i,l){let d,b=!1;const g=A(()=>{const y=i();if(!b){b=!0,d=y;return}l(y,d),d=y});p(f,o).push(g)},html:te,onMount(i){p(f,c).push(i)},onUnmount(i){p(f,u).push(i)},provide(i,l){let d=L.get(f);d===void 0&&(d=new Map,L.set(f,d)),d.set(i._id,l)},inject(i){let l=f.parentElement;for(;l!==null;){const d=L.get(l);if(d!==void 0&&d.has(i._id))return d.get(i._id);l=l.parentElement}return i._defaultValue},ref(){const i=Y();return p(f,h).push(i),i}}},customElements.define(t,s)}function ke(){return{signal(e){return{get:()=>e,peek:()=>e,set:()=>{}}},computed(e){const t=e();return{get:()=>t,peek:()=>t}},batch(e){e()},effect(e){return{dispose:()=>{}}},watch:()=>{},html:(e,...t)=>re(e,t),onMount:()=>{},onUnmount:()=>{},provide:()=>{},inject:e=>e._defaultValue,ref:()=>Y()}}function _e(e){return t=>{if(typeof window>"u")return{[F]:!0,_apply(){},_ssr(){return`<${e}${$e(t)}></${e}>`}};const r=document.createElement(e);if(t){const n={};let a=!1;for(const[s,o]of Object.entries(t))o!=null&&(typeof o=="object"||typeof o=="function"?(n[s]=o,a=!0):r.setAttribute(s,String(o)));a&&(r._nfProps=n)}return r}}function $e(e){if(!e)return"";let t="";for(const[r,n]of Object.entries(e))n!=null&&(typeof n=="object"||typeof n=="function"||(t+=` ${r}="${String(n).replace(/"/g,"&quot;")}"`));return t}function Ee(e,t){let r=t?" nf-ssr":"";for(const[n,a]of Object.entries(e)){if(typeof a=="function")continue;const s=typeof a=="object"?JSON.stringify(a):String(a);r+=` ${n}="${s.replace(/"/g,"&quot;")}"`}return r}function se(e,t={}){const r=t.initialValue!==void 0,n=$(t.initialValue),a=$(!r),s=$(void 0);let o=0,c=t.lazy??r;const u=()=>{if(c){c=!1;return}const m=++o;a.set(!0),s.set(void 0),e().then(w=>{m===o&&(n.set(w),a.set(!1))},w=>{m===o&&(s.set(w instanceof Error?w:new Error(String(w))),a.set(!1))})};return(pe()??A)(u),{data:n,loading:a,error:s,refetch:u}}P("shop-header",(e,{html:t})=>t`
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
    `});var x;class Se{constructor(){E(this,x,new Map)}find(t){const r=Array.from(p(this,x).values());return t?r.filter(n=>Object.keys(t).every(a=>n[a]===t[a])):r}findById(t){return p(this,x).get(t)??null}findOne(t){return this.find(t)[0]??null}insertOne(t){const r=crypto.randomUUID(),n={...t,_id:r};return p(this,x).set(r,n),n}updateOne(t,r){const n=p(this,x).get(t);if(!n)return null;const a={...n,...r};return p(this,x).set(t,a),a}deleteOne(t){return p(this,x).delete(t)}count(){return p(this,x).size}}x=new WeakMap;function Ne(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}const q=new Se,Ce=[{name:"Wireless Headphones",description:"Premium over-ear headphones with active noise cancellation and 30-hour battery life.",price:7999,category:"Electronics",stock:42,featured:!0},{name:"Mechanical Keyboard",description:"Compact 75% layout mechanical keyboard with tactile brown switches and RGB backlight.",price:12999,category:"Electronics",stock:18,featured:!1},{name:"Classic Crew Tee",description:"100% organic cotton crew-neck tee in a relaxed fit. Available in 8 colours.",price:2999,category:"Apparel",stock:120,featured:!0},{name:"Merino Wool Beanie",description:"Soft and warm merino wool beanie, one size fits all. Machine washable.",price:1999,category:"Apparel",stock:65,featured:!1},{name:"Clean Code",description:"Robert C. Martin's guide to writing readable, maintainable software. A must-read for every developer.",price:3499,category:"Books",stock:30,featured:!1},{name:"The Pragmatic Programmer",description:"From journeyman to master — timeless advice on crafting software and growing as a developer.",price:3999,category:"Books",stock:25,featured:!0}],Ae=new Date().toISOString();for(const e of Ce)q.insertOne({...e,slug:Ne(e.name),createdAt:Ae});function Pe(e){return`$${(e/100).toFixed(2)}`}P("product-card",({id:e})=>{const t=q.findById(e);if(!t)return'<div class="product-card product-card--missing">Product not found</div>';const r=t.description.length>100?t.description.slice(0,97)+"…":t.description;return`
      <article class="product-card">
        <div class="product-card__badge">${t.category}</div>
        <h2 class="product-card__name">${t.name}</h2>
        <p class="product-card__desc">${r}</p>
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
        <div class="product-grid__grid">${q.find().map(r=>we("product-card",{id:r._id})).join("")}</div>
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
    `});function Me(e,t){if(e==="*")return{};const r=o=>o.split("/").filter(Boolean),n=r(e),a=r(t);if(n.length!==a.length)return null;const s={};for(let o=0;o<n.length;o++){const c=n[o]??"",u=a[o]??"";if(c.startsWith(":"))s[c.slice(1)]=decodeURIComponent(u);else if(c!==u)return null}return s}function ze(e,t){for(const r of e){const n=Me(r.path,t);if(n!==null)return{route:r,params:n}}return null}function T(e){const t={};return new URLSearchParams(e).forEach((r,n)=>{t[n]=r}),t}function Oe(e,t={}){const r=t.mode??"history",n=typeof window<"u",a=()=>n?r==="hash"?window.location.hash.slice(1)||"/":window.location.pathname:t.ssrPath??"/",s=()=>n?T(window.location.search):{},o=$(a()),c=$(s()),u=O(()=>o.get()),h=O(()=>c.get()),m=O(()=>ze(e,o.get())),w=O(()=>{var l;return((l=m.get())==null?void 0:l.params)??{}}),M=$(0),N=new Set,v=new Set,C=l=>{if(!n)return;const d=l.indexOf("?"),b=d>=0?l.slice(0,d):l,g=d>=0?l.slice(d):"";r==="hash"?window.location.hash=b:history.pushState(null,"",l),o.set(b),c.set(T(g))};return n&&(r==="hash"?window.addEventListener("hashchange",()=>{o.set(window.location.hash.slice(1)||"/"),c.set(T(window.location.search))}):window.addEventListener("popstate",()=>{o.set(window.location.pathname),c.set(T(window.location.search))})),n&&t.interceptLinks===!0&&document.addEventListener("click",l=>{const d=l.target.closest("a[href]");if(d===null)return;const b=d.getAttribute("href");b===null||b.startsWith("http")||b.startsWith("//")||b.startsWith("mailto:")||d.target!==""&&d.target!=="_self"||(l.preventDefault(),C(b))}),{outlet:()=>{const l=m.get();if(l===null)return null;const{route:d,params:b}=l;return d.load!==void 0&&(M.get(),!N.has(d))?(v.has(d)||(v.add(d),d.load().then(()=>{N.add(d),v.delete(d),M.set(M.peek()+1)},()=>{v.delete(d)})),null):d.render(b)},navigate:C,link:l=>{l.preventDefault();const d=l.currentTarget.getAttribute("href");d!==null&&C(d)},currentPath:u,currentParams:w,currentQuery:h}}function Re(e){return`$${(e/100).toFixed(2)}`}const Te=P("admin-products",(e,{html:t})=>{const{data:r,loading:n,error:a,refetch:s}=se(()=>fetch("/api/products").then(c=>c.json()));async function o(c){await fetch(`/api/products/${c}`,{method:"DELETE"}),s()}return t`
      <div class="ap-wrap">
        <div class="ap-header">
          <h1 class="ap-title">Products</h1>
          <a class="ap-btn" href="/admin/new" @click=${S.link}
            >+ New Product</a
          >
        </div>
        ${()=>a.get()?t`<p class="ap-error">Failed to load products.</p>`:n.get()?t`<p class="ap-loading">Loading…</p>`:t`
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
                      ${()=>(r.get()??[]).map(c=>t`
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
    `}),X=P("admin-form",({"product-id":e},{html:t,signal:r,computed:n,watch:a})=>{const s=!!e,o=r(""),c=r(""),u=r(""),h=r("Electronics"),m=r("0"),w=r(!1),M=n(()=>o.get().trim()!==""&&Number(c.get())>0),N=r(null),v=s?se(()=>fetch(`/api/products/${e}`).then(i=>i.json())):null;v&&a(()=>v.data.get(),i=>{i&&(o.set(i.name),c.set(String(i.price)),u.set(i.description),h.set(i.category),m.set(String(i.stock)),w.set(i.featured))});async function C(i){i.preventDefault(),N.set(null);const l={name:o.get().trim(),price:Number(c.get()),description:u.get().trim(),category:h.get().trim(),stock:Number(m.get()),featured:w.get()},d=s?`/api/products/${e}`:"/api/products",g=await fetch(d,{method:s?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(l)});if(!g.ok){const y=await g.text();throw new Error(`Server error: ${y}`)}S.navigate("/admin")}const f=["Electronics","Apparel","Books","Other"];return t`
      <div class="af-wrap">
        <h1 class="af-title">${s?"Edit Product":"New Product"}</h1>
        ${()=>N.get()?t`<p class="af-error">${()=>N.get()}</p>`:""}
        ${v?t`${()=>v.loading.get()?t`<p class="af-loading">Loading product…</p>`:""}`:""}
        <form class="af-form" @submit=${i=>void C(i)}>
          <div class="af-field">
            <label class="af-label" for="af-name">Name</label>
            <input
              id="af-name"
              class="af-input"
              type="text"
              .value="${()=>o.get()}"
              @input=${i=>o.set(i.target.value)}
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
              @input=${i=>c.set(i.target.value)}
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
              @input=${i=>u.set(i.target.value)}
            ></textarea>
          </div>
          <div class="af-field">
            <label class="af-label" for="af-cat">Category</label>
            <select
              id="af-cat"
              class="af-input"
              .value="${()=>h.get()}"
              @change=${i=>h.set(i.target.value)}
            >
              ${ye(f.map(i=>`<option value="${i}">${i}</option>`).join(""))}
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
              @input=${i=>m.set(i.target.value)}
            />
          </div>
          <div class="af-field af-field--check">
            <input
              id="af-featured"
              type="checkbox"
              .checked="${()=>w.get()}"
              @change=${i=>w.set(i.target.checked)}
            />
            <label class="af-label" for="af-featured">Featured product</label>
          </div>
          <div class="af-actions">
            <button
              class="af-submit"
              type="submit"
              .disabled="${()=>!M.get()}"
            >
              ${s?"Save Changes":"Create Product"}
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
    `}),S=Oe([{path:"/admin",render:()=>Te({})},{path:"/admin/new",render:()=>X({})},{path:"/admin/edit/:id",render:e=>X({"product-id":e.id??""})},{path:"*",render:()=>te`<p class="not-found">Page not found</p>`}]);P("admin-app",(e,{html:t})=>{const r=()=>S.outlet();return t`
      <div class="admin-layout">
        <aside class="admin-sidebar">
          <div class="admin-sidebar__logo">NF Admin</div>
          <nav class="admin-sidebar__nav">
            <a href="/admin" @click=${S.link}>Products</a>
            <a href="/admin/new" @click=${S.link}>New Product</a>
          </nav>
        </aside>
        <main class="admin-main">
          ${r}
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
