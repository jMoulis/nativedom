var U=e=>{throw TypeError(e)};var V=(e,t,o)=>t.has(e)||U("Cannot "+o);var p=(e,t,o)=>(V(e,t,"read from private field"),o?o.call(e):t.get(e)),N=(e,t,o)=>t.has(e)?U("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,o);var A=(e,t,o)=>(V(e,t,"access private method"),o);var v=null,O=0,F=new Set;function q(e){let t=e;const o=new Set;return{get(){return v!==null&&(o.add(v),v.deps.add(o)),t},set(n){Object.is(t,n)||(t=n,ae(o))},peek(){return t}}}function $(e){let t=null;const o=()=>{n();const s=v;v=o,o.deps=new Set;try{const r=e();typeof r=="function"&&(t=r)}finally{v=s}};o.deps=new Set;function n(){t!==null&&(t(),t=null),o.deps.forEach(s=>{s.delete(o)}),o.deps.clear()}return o(),{dispose(){n()}}}function M(e){const t=q(le(e));return $(()=>{t.set(e())}),{get:()=>t.get(),peek:()=>t.peek()}}function P(e){O++;try{e()}finally{if(O--,O===0){const t=new Set(F);F.clear(),t.forEach(o=>{o()})}}}function le(e){const t=v;v=null;try{return e()}finally{v=t}}function ae(e){e.size!==0&&(O>0?e.forEach(t=>{F.add(t)}):[...e].forEach(t=>{t()}))}var Z=Symbol("nf.ref");function de(){return{[Z]:!0,el:null}}function fe(e){return typeof e=="object"&&e!==null&&e[Z]===!0}var R=Symbol("nf.directive");function K(e){return typeof e=="object"&&e!==null&&R in e&&e[R]===!0}var X="__NF__",ue=/^__NF__(\d+)$/,w=/__NF__(\d+)/g,z="@",H=".",Y=new WeakMap,L=null;function ee(e,t){L=e;try{return t()}finally{L=null}}function pe(e,...t){return typeof window>"u"?be(e,t):he(e,t)}function he(e,t){let o=Y.get(e);o===void 0&&(o=ge(e),Y.set(e,o));const n=o.content.cloneNode(!0),s=me(n);for(const r of s){const i=t[r.index];i!==void 0&&ye(r,i)}return n}function ge(e){let t="";for(let n=0;n<e.length;n++)if(t+=e[n],n<e.length-1){const s=t.lastIndexOf("<"),r=t.lastIndexOf(">");s>r?t+=`${X}${n}`:t+=`<!--${X}${n}-->`}const o=document.createElement("template");return o.innerHTML=t,o}function me(e){const t=[],o=document.createTreeWalker(e,NodeFilter.SHOW_COMMENT|NodeFilter.SHOW_ELEMENT);let n;for(;(n=o.nextNode())!==null;)if(n.nodeType===Node.COMMENT_NODE){const s=ue.exec(n.nodeValue??"");s!==null&&t.push({type:"content",node:n,index:parseInt(s[1]??"0",10)})}else if(n.nodeType===Node.ELEMENT_NODE){const s=n;for(const r of[...s.attributes])if(r.name.startsWith(z)){const i=w.exec(r.value);w.lastIndex=0,i!==null&&t.push({type:"event",node:s,index:parseInt(i[1]??"0",10),eventName:r.name.slice(z.length)})}else if(r.name.startsWith(H)){const i=w.exec(r.value);w.lastIndex=0,i!==null&&t.push({type:"prop",node:s,index:parseInt(i[1]??"0",10),propName:r.name.slice(H.length)})}else if(r.name==="ref"){const i=w.exec(r.value);w.lastIndex=0,i!==null&&t.push({type:"ref",node:s,index:parseInt(i[1]??"0",10)})}else{const i=w.exec(r.value);w.lastIndex=0,i!==null&&t.push({type:"attr",node:s,index:parseInt(i[1]??"0",10),attrName:r.name})}}return t}function ye(e,t){const o=L??$;switch(e.type){case"event":{typeof t=="function"&&e.node.addEventListener(e.eventName,t),e.node.removeAttribute(`${z}${e.eventName}`);break}case"prop":{e.node.removeAttribute(`${H}${e.propName}`);const n=s=>{e.node[e.propName]=s};typeof t=="function"?o(()=>{n(t())}):n(t);break}case"content":{const n=e.node;if(K(t)){t._apply(n,o);break}let s=[];const r=i=>{var a,h;for(const f of s)(a=f.parentNode)==null||a.removeChild(f);s=[];for(const f of te(i))(h=n.parentNode)==null||h.insertBefore(f,n),s.push(f)};typeof t=="function"?o(()=>r(t())):r(t);break}case"ref":{e.node.removeAttribute("ref"),fe(t)&&(t.el=e.node);break}case"attr":{typeof t=="function"?o(()=>{e.node.setAttribute(e.attrName,I(t()))}):e.node.setAttribute(e.attrName,I(t));break}}}function be(e,t){let o="";for(let n=0;n<e.length;n++){const s=e[n]??"";if(n<t.length){const r=t[n];if(/\s([@.][\w:-]+|ref)=["']?$/.test(s.trimEnd())){o+=s.replace(/\s([@.][\w:-]+|ref)=["']?$/,"");continue}o+=s;const a=typeof r=="function"?r():r;K(a)?o+=a._ssr():Array.isArray(a)?o+=a.map(h=>typeof h=="string"?h:G(I(h))).join(""):o+=G(I(a))}else o+=s}return o}function te(e){return e instanceof DocumentFragment?[...e.childNodes]:e instanceof Node?[e]:Array.isArray(e)?e.flatMap(te):[document.createTextNode(I(e))]}function I(e){return e==null?"":String(e)}function G(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}var D=new WeakMap,xe=new Map;function j(e,t,o={}){if(!e.includes("-"))throw new Error(`[nativedom] Component name "${e}" must contain a hyphen (Custom Elements spec).`);const n={name:e,fn:t,options:{shadow:o.shadow??!0,shadowMode:o.shadowMode??"open",observedAttrs:o.observedAttrs??[],island:o.island??!1,onError:o.onError,styles:o.styles}};return xe.set(e,n),typeof window<"u"&&ke(n),we(e)}function ve(e,t){if(document.querySelector(`style[data-nf="${e}"]`)!==null)return;const o=document.createElement("style");o.dataset.nf=e,o.textContent=`@scope (${e}) {
${t}
}`,document.head.appendChild(o)}function ke(e){var i,a,h,f,m,B,oe,ne;const{name:t,fn:o,options:n}=e;if(customElements.get(t)!==void 0)return;!n.shadow&&n.styles!==void 0&&ve(t,n.styles);let s;if(n.shadow&&n.styles!==void 0)try{s=new CSSStyleSheet,s.replaceSync(n.styles)}catch{}class r extends HTMLElement{constructor(){super(...arguments);N(this,m);N(this,i,[]);N(this,a,[]);N(this,h,[]);N(this,f,[])}static get observedAttributes(){return n.observedAttrs}connectedCallback(){if(s!==void 0){const c=this.shadowRoot??this.attachShadow({mode:n.shadowMode});c.adoptedStyleSheets.includes(s)||(c.adoptedStyleSheets=[s,...c.adoptedStyleSheets])}A(this,m,B).call(this),p(this,a).forEach(c=>{c()})}disconnectedCallback(){p(this,i).forEach(c=>{c.dispose()}),p(this,i).length=0,p(this,h).forEach(c=>{c()});for(const c of p(this,f))c.el=null;p(this,f).length=0}attributeChangedCallback(c,l,d){l!==d&&A(this,m,B).call(this)}}i=new WeakMap,a=new WeakMap,h=new WeakMap,f=new WeakMap,m=new WeakSet,B=function(){var _;const c=n.shadow?this.shadowRoot??this.attachShadow({mode:n.shadowMode}):this;if(c.childNodes.length>0&&this.hasAttribute("nf-ssr")){this.removeAttribute("nf-ssr");return}for(const y of p(this,f))y.el=null;p(this,f).length=0;const l=A(this,m,ne).call(this),d=A(this,m,oe).call(this);if(n.shadow&&n.styles!==void 0&&s===void 0&&c.querySelector("style[data-nf]")===null){const y=document.createElement("style");y.dataset.nf=t,y.textContent=n.styles,c.appendChild(y)}const g=p(this,i).length;try{const y=ee(l.effect,()=>o(d,l));c.replaceChildren(y)}catch(y){for(let b=g;b<p(this,i).length;b++)(_=p(this,i)[b])==null||_.dispose();if(p(this,i).length=g,n.onError!==void 0){console.error(`[nativedom] <${this.tagName.toLowerCase()}>:`,y);try{const b=n.onError(y);b instanceof DocumentFragment?c.replaceChildren(b):c.innerHTML=typeof b=="string"?b:String(b??"")}catch{c.innerHTML=""}}else throw y}},oe=function(){const c={};for(const d of this.attributes)if(d.name!=="nf-ssr")try{c[d.name]=JSON.parse(d.value)}catch{c[d.name]=d.value}const l=this._nfProps;return l!==void 0&&Object.assign(c,l),c},ne=function(){const c=this;return{signal(l){return q(l)},computed(l){return M(l)},batch:P,effect(l){const d=n.onError!==void 0?$(()=>{try{l()}catch(g){console.error(`[nativedom] effect error in <${c.tagName.toLowerCase()}>:`,g)}}):$(l);return p(c,i).push(d),d},watch(l,d){let g,_=!1;const y=$(()=>{const b=l();if(!_){_=!0,g=b;return}d(b,g),g=b});p(c,i).push(y)},html:pe,onMount(l){p(c,a).push(l)},onUnmount(l){p(c,h).push(l)},provide(l,d){let g=D.get(c);g===void 0&&(g=new Map,D.set(c,g)),g.set(l._id,d)},inject(l){let d=c.parentElement;for(;d!==null;){const g=D.get(d);if(g!==void 0&&g.has(l._id))return g.get(l._id);d=d.parentElement}return l._defaultValue},ref(){const l=de();return p(c,f).push(l),l}}},customElements.define(t,r)}function we(e){return t=>{if(typeof window>"u")return{[R]:!0,_apply(){},_ssr(){return`<${e}${Ee(t)}></${e}>`}};const o=document.createElement(e);if(t){const n={};let s=!1;for(const[r,i]of Object.entries(t))i!=null&&(typeof i=="object"||typeof i=="function"?(n[r]=i,s=!0):o.setAttribute(r,String(i)));s&&(o._nfProps=n)}return o}}function Ee(e){if(!e)return"";let t="";for(const[o,n]of Object.entries(e))n!=null&&(typeof n=="object"||typeof n=="function"||(t+=` ${o}="${String(n).replace(/"/g,"&quot;")}"`));return t}function Se(e,t,o){return{[R]:!0,_apply(n,s){const r=new Map;s(()=>{var m,E,J;const i=e(),a=i.map(t),h=new Set(a);for(const[k,T]of r)if(!h.has(k)){for(const S of T)(m=S.parentNode)==null||m.removeChild(S);r.delete(k)}let f=n;for(let k=i.length-1;k>=0;k--){const T=i[k],S=a[k];let c=r.get(S);if(c===void 0){const l=ee(s,()=>o(T,k));c=re(l),r.set(S,c);for(const d of c)(E=n.parentNode)==null||E.insertBefore(d,f)}else{const l=c[c.length-1];if(l!==void 0&&l.nextSibling!==f)for(const d of c)(J=n.parentNode)==null||J.insertBefore(d,f)}c.length>0&&(f=c[0])}})},_ssr(){return e().map((n,s)=>W(o(n,s))).join("")}}}function re(e){return e instanceof DocumentFragment?[...e.childNodes]:e instanceof Node?[e]:Array.isArray(e)?e.flatMap(re):[document.createTextNode(e==null?"":String(e))]}function W(e){return K(e)?e._ssr():typeof e=="string"?e:e==null?"":Array.isArray(e)?e.map(W).join(""):typeof e=="function"?W(e()):String(e)}function se(e){const t={};for(const s of Object.keys(e))t[s]=q(e[s]);const o=t;return{...o,derive(s){return M(()=>s(o))},update(s){P(()=>{for(const r of Object.keys(s)){const i=s[r];i!==void 0&&r in t&&t[r].set(i)}})},snapshot(){const s={};for(const r of Object.keys(t))s[r]=t[r].peek();return s},rehydrate(s){P(()=>{for(const r of Object.keys(s)){const i=s[r];i!==void 0&&r in t&&t[r].set(i)}})}}}const u=se({todos:[]}),ie="nf-todos";function Ne(){try{const e=localStorage.getItem(ie),t=JSON.parse(e??"null");u.todos.set(t??[])}catch{}}function $e(){$(()=>{localStorage.setItem(ie,JSON.stringify(u.todos.get()))})}const x=se({filter:"all",editingId:null});function _e(e){const t=e.trim();t&&u.todos.set([...u.todos.get(),{id:crypto.randomUUID(),text:t,done:!1}])}function ce(e){u.todos.set(u.todos.get().filter(t=>t.id!==e))}function Ae(e){u.todos.set(u.todos.get().map(t=>t.id===e?{...t,done:!t.done}:t))}function Q(e,t){const o=t.trim();o?u.todos.set(u.todos.get().map(n=>n.id===e?{...n,text:o}:n)):ce(e),x.editingId.set(null)}function Ce(){const e=u.todos.get(),t=e.length>0&&e.every(o=>o.done);u.todos.set(e.map(o=>({...o,done:!t})))}function Me(){u.todos.set(u.todos.get().filter(e=>!e.done))}j("todo-form",(e,{html:t})=>t`
    <style>
      :host { display: block; }
      form {
        display: flex;
        gap: 8px;
        padding: 12px 0;
        border-bottom: 1px solid #e0e0e0;
      }
      input {
        flex: 1;
        padding: 8px 12px;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        outline: none;
      }
      input:focus { border-color: #5c6bc0; }
      button {
        padding: 8px 16px;
        font-size: 1rem;
        background: #5c6bc0;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      button:hover { background: #3f51b5; }
    </style>
    <form
      @submit=${o=>{o.preventDefault();const n=o.target.querySelector("input"),s=n.value.trim();s&&(_e(s),n.value="")}}
    >
      <input type="text" placeholder="What needs to be done?" autofocus />
      <button type="submit">Add</button>
    </form>
  `);const Ie=M(()=>{const e=u.todos.get(),t=x.filter.get();return t==="active"?e.filter(o=>!o.done):t==="done"?e.filter(o=>o.done):e});let C=null;const Te=j("todo-item",(e,{html:t})=>{const o=e["todo-id"]??"",n=M(()=>u.todos.get().find(r=>r.id===o)),s=M(()=>x.editingId.get()===o);return t`
    <style>
      :host { display: block; }
      li {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 8px;
        border-bottom: 1px solid #f0f0f0;
        list-style: none;
        cursor: grab;
      }
      li:active { cursor: grabbing; }
      li[data-done="true"] .text { text-decoration: line-through; color: #aaa; }
      li[data-editing="true"] .text { display: none; }
      li[data-editing="false"] .edit { display: none; }
      .toggle {
        cursor: pointer;
        background: none;
        border: none;
        font-size: 1.2rem;
        padding: 0 4px;
        flex-shrink: 0;
      }
      .text {
        flex: 1;
        font-size: 1rem;
        word-break: break-word;
        user-select: none;
      }
      .edit {
        flex: 1;
        font-size: 1rem;
        padding: 2px 6px;
        border: 1px solid #5c6bc0;
        border-radius: 3px;
        outline: none;
      }
      .delete {
        cursor: pointer;
        background: none;
        border: none;
        color: #e53935;
        font-size: 1rem;
        padding: 0 4px;
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.15s;
      }
      li:hover .delete { opacity: 1; }
    </style>
    <li
      data-done="${()=>{var r;return String(((r=n.get())==null?void 0:r.done)??!1)}}"
      data-editing="${()=>String(s.get())}"
      draggable="true"
      @dragstart=${r=>{var i;C=o,(i=r.dataTransfer)==null||i.setData("text/plain",o)}}
      @dragover=${r=>{r.preventDefault()}}
      @drop=${r=>{if(r.preventDefault(),C===null||C===o)return;const i=u.todos.get(),a=i.findIndex(E=>E.id===C),h=i.findIndex(E=>E.id===o);if(a===-1||h===-1)return;const f=[...i],[m]=f.splice(a,1);m!==void 0&&f.splice(h,0,m),u.todos.set(f),C=null}}
    >
      <button
        class="toggle"
        @click=${()=>{Ae(o)}}
      >${()=>{var r;return(r=n.get())!=null&&r.done?"✓":"○"}}</button>
      <span
        class="text"
        @dblclick=${r=>{x.editingId.set(o);const a=r.target.getRootNode().querySelector(".edit");a!==null&&requestAnimationFrame(()=>{a.focus()})}}
      >${()=>{var r;return((r=n.get())==null?void 0:r.text)??""}}</span>
      <input
        class="edit"
        type="text"
        .value="${()=>{var r;return((r=n.get())==null?void 0:r.text)??""}}"
        @keydown=${r=>{const i=r,a=r.target;i.key==="Enter"?Q(o,a.value):i.key==="Escape"&&(x.editingId.set(null),a.blur())}}
        @blur=${r=>{s.get()&&Q(o,r.target.value)}}
      />
      <button
        class="delete"
        @click=${()=>{ce(o)}}
      >✕</button>
    </li>
  `},{observedAttrs:["todo-id"]});j("todo-list",(e,{html:t})=>t`
    <ul class="todo-list">
      ${Se(()=>Ie.get(),o=>o.id,o=>Te({"todo-id":o.id}))}
    </ul>
  `);j("todo-footer",(e,{html:t,computed:o})=>{const n=o(()=>u.todos.get().filter(i=>!i.done).length),s=o(()=>u.todos.get().some(i=>i.done)),r=o(()=>u.todos.get().length>0);return t`
    <style>
      :host { display: block; }
      footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 8px;
        border-top: 1px solid #e0e0e0;
        font-size: 0.9rem;
        color: #555;
      }
      footer[data-visible="false"] { display: none; }
      .count { min-width: 6ch; }
      .filters { display: flex; gap: 4px; }
      .filters button {
        padding: 3px 10px;
        border: 1px solid transparent;
        border-radius: 3px;
        background: none;
        cursor: pointer;
        font-size: 0.85rem;
        color: inherit;
      }
      .filters button:hover { border-color: #ccc; }
      .filters button[data-active="true"] {
        border-color: #5c6bc0;
        color: #3f51b5;
        font-weight: 600;
      }
      .actions { display: flex; gap: 8px; }
      .actions button {
        padding: 3px 10px;
        border: 1px solid #ccc;
        border-radius: 3px;
        background: none;
        cursor: pointer;
        font-size: 0.85rem;
        color: inherit;
      }
      .actions button:hover { background: #f5f5f5; }
      .actions button[data-visible="false"] { display: none; }
    </style>
    <footer data-visible="${()=>r.get()?"true":"false"}">
      <span class="count">${()=>n.get()} item${()=>n.get()===1?"":"s"} left</span>
      <div class="filters">
        <button
          data-active="${()=>x.filter.get()==="all"?"true":"false"}"
          @click=${()=>{x.filter.set("all")}}
        >All</button>
        <button
          data-active="${()=>x.filter.get()==="active"?"true":"false"}"
          @click=${()=>{x.filter.set("active")}}
        >Active</button>
        <button
          data-active="${()=>x.filter.get()==="done"?"true":"false"}"
          @click=${()=>{x.filter.set("done")}}
        >Done</button>
      </div>
      <div class="actions">
        <button @click=${()=>{Ce()}}>Mark all ✓</button>
        <button
          data-visible="${()=>s.get()?"true":"false"}"
          @click=${()=>{Me()}}
        >Clear completed</button>
      </div>
    </footer>
  `});Ne();$e();
