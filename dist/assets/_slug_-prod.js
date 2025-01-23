import{d as F,l as q,F as H,u as T,r as a,w as P,o as V,a as O,_ as L,G as b,b as W,c as n,e as r,f as $,H as j,g as o,h as G,v as K,i as U,j as d,k as z,t as i,m as _,n as R,p as J,q as Q}from"./app-prod.js";const X={class:"blog-page-hero"},Y={class:"search-bar-section"},Z={key:0,class:"loader"},ee={class:"blog-section-header"},te={key:0},ae={class:"allposts-section"},se=["href"],oe={class:"allposts-post-details"},ne={class:"post-date"},re={class:"author-list"},le={class:"author-name"},ie={class:"author-details"},ce={class:"author-name"},de={key:0,class:"author-name"},ue=["src"],he=F({__name:"all-blog-posts",setup(pe){var N;const y=q("https://content.thegovlab.com").with(H()),w=typeof window<"u"?T():a(null),u=a(0);a([]);const l=a(""),D=a(""),x=a(null),h=a(!1);a(!1),a(0),a(""),a(0),a(1),a(2),a(0);const A=a([]),p=a([]),m=a([]);a([]),a(!0);const k=a(!1);a(typeof window<"u"?(N=w.value)==null?void 0:N.fullPath:""),a(1),a(7e3),a(""),a(!1),a(!0),P(()=>{var s;return typeof window<"u"?(s=w.value)==null?void 0:s.fullPath:""},()=>{I()},{deep:!0,immediate:!0}),V(()=>{I(),S(),f(),M(),O()}),x.value=L.debounce(B,500);function B(){h.value=!0;let s=l.value.split(" ");s=s.filter(e=>e);const t=[];s.forEach(e=>{t.push({excerpt:{_contains:e}}),t.push({title:{_contains:e}}),t.push({content:{_contains:e}}),t.push({authors:{team_id:{First_Name:{_contains:e}}}}),t.push({authors:{team_id:{Last_Name:{_contains:e}}}}),t.push({authors:{team_id:{Title:{_contains:e}}}})}),l.value?u.value=1:u.value=0,y.request(b("reboot_democracy_blog",{limit:-1,filter:{_and:[{date:{_lte:"$NOW(-5 hours)"}},{status:{_eq:"published"}}],_or:t},sort:["date"],fields:["*.*","authors.team_id.*","authors.team_id.Headshot.*"]})).then(e=>{p.value=e,h.value=!1}).catch(e=>{console.error("Error in searchBlog:",e),h.value=!1})}function f(){p.value=[],u.value=0,D.value=l.value,B()}function M(){W({title:"RebootDemocracy.AI",meta:[{name:"title",content:"RebootDemocracy.AI"},{property:"og:title",content:"RebootDemocracy.AI"},{property:"og:description",content:`RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`},{property:"og:image",content:"https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b"},{property:"twitter:title",content:"RebootDemocracy.AI"},{property:"twitter:description",content:`RebootDemocracy.AI - We believe that artificial intelligence can and should be harnessed to strengthen participatory democracy. Done well, participation and engagement lead to 

1. Better governance
2. Better outcomes
3. Increased trust in institutions
4. And in one another
As researchers we want to understand how best to “do democracy” in practice.

Emboldened by the advent of generative AI, we are excited about the future possibilities for reimagining democracy in practice and at scale.`},{property:"twitter:image",content:"https://content.thegovlab.com/assets/41462f51-d8d6-4d54-9fec-5f56fa2ef05b"},{property:"twitter:card",content:"summary_large_image"}]})}function I(){y.request(b("innovate_us_modal",{meta:"total_count",limit:-1,fields:["*.*"]})).then(s=>{var t,e,v,c;if(m.value=Array.isArray(s.data)?s.data[0]:s.data,typeof window<"u"){const g=((e=(t=m.value)==null?void 0:t.campaigns)==null?void 0:e.campaign_name)||"ModalCampaign",C=localStorage.getItem(g)==="off";k.value=((v=m.value)==null?void 0:v.status)==="published"&&!C}else k.value=((c=m.value)==null?void 0:c.status)==="published"}).catch(s=>{console.error("Error loading modal:",s)})}function E(s){return J(s,"MMMM d, yyyy")}function S(){y.request(b("reboot_democracy_blog",{meta:"total_count",limit:50,filter:{status:{_eq:"published"}},fields:["*.*","authors.team_id.*","authors.team_id.Headshot.*"],sort:["date"]})).then(s=>{A.value=s,console.log("Fetched blogData:",A.value)}).catch(s=>{console.error("Error fetching blog data:",s)})}return(s,t)=>(n(),r(_,null,[$(j),o("div",X,[t[4]||(t[4]=o("h1",{class:"eyebrow"},"Reboot Democracy",-1)),t[5]||(t[5]=o("h1",null,"All Posts",-1)),o("div",Y,[G(o("input",{class:"search-bar","onUpdate:modelValue":t[0]||(t[0]=e=>l.value=e),onKeyup:t[1]||(t[1]=U(e=>f(),["enter"])),type:"text",placeholder:"SEARCH"},null,544),[[K,l.value]]),o("span",{type:"submit",onClick:t[2]||(t[2]=()=>{l.value="",f()}),class:"search-bar-cancel-btn material-symbols-outlined"}," cancel "),o("span",{type:"submit",onClick:t[3]||(t[3]=e=>f()),class:"search-bar-btn material-symbols-outlined"}," search ")]),t[6]||(t[6]=o("a",{href:"/signup",class:"btn btn-small btn-primary"},"Sign up",-1))]),h.value?(n(),r("div",Z)):d("",!0),o("div",ee,[u.value&&l.value!=""?(n(),r("h2",te,[t[7]||(t[7]=z(" Searching for ")),o("i",null,i(D.value),1)])):d("",!0)]),o("div",ae,[p.value?(n(!0),r(_,{key:0},R(p.value.slice().reverse(),(e,v)=>(n(),r("div",{class:"allposts-post-row",key:v},[o("a",{href:"/blog/"+e.slug},[o("div",oe,[o("h3",null,i(e.title),1),o("p",ne," Published on "+i(E(new Date(e.date))),1),o("div",re,[o("p",le,i(e.authors.length>0?"By":""),1),(n(!0),r(_,null,R(e.authors,(c,g)=>(n(),r("div",{key:g,class:"author-item"},[o("div",ie,[o("p",ce,i(c.team_id.First_Name)+" "+i(c.team_id.Last_Name),1),e.authors.length>1&&g<e.authors.length-1?(n(),r("p",de," and ")):d("",!0)])]))),128))])]),e.image?(n(),r("img",{key:0,class:"blog-list-img",src:"https://content.thegovlab.com/assets/"+e.image.id+"?width=300"},null,8,ue)):d("",!0)],8,se)]))),128)):d("",!0)])],64))}}),fe=Q(he,[["__scopeId","data-v-a78956cc"]]);export{fe as default};
