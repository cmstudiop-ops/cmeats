import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const supabase=createClient('https://fjttrtxegefejpevdznm.supabase.co','sb_publishable__GG6-AUad9FakXoTu9OyqA__9NCIive');
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'R '+Number(n||0).toFixed(2);
let session=null,restaurants=[],currentRestaurant=null,menu=[],category='All',cart=[];
const views=['home','restaurant','cart','orders','profile'];
function go(view){for(const v of views)$(v).hidden=v!==view;document.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===view));window.scrollTo({top:0,behavior:'auto'});if(view==='profile')renderProfile();if(view==='orders')loadOrders();if(view==='cart')renderCart()}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
$('account').onclick=()=>go('profile');$('browse').onclick=()=>document.querySelector('#restaurants').scrollIntoView({behavior:'smooth'});
const icon=(paths)=>'<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';
const emptyIcon='<svg viewBox="0 0 96 96" width="84" height="84" fill="none" aria-hidden="true"><circle cx="48" cy="48" r="42" fill="#FFF0E5"/><circle cx="48" cy="48" r="30" fill="#FFDFC5"/><path d="M25 56h46M30 56c0-12 8-22 18-22s18 10 18 22M48 34v-8M30 67h36" stroke="#EF641C" stroke-width="4" stroke-linecap="round"/><path d="M36 27l-4-5M60 27l4-5" stroke="#EF641C" stroke-width="3" stroke-linecap="round"/></svg>';
const cats=[
['All',icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/>')],
['Burgers',icon('<path d="M4 11a8 8 0 0 1 16 0H4ZM3 15h18M5 19h14l1-2H4l1 2Z"/>')],
['Chicken',icon('<path d="M8 17a7 7 0 1 1 9-9c2 2 1 6-2 8l-3 2-4-1ZM7 17l-3 3M4 17l3 3"/>')],
['Pizza',icon('<path d="M4 20 12 3c5 1 8 4 9 9L4 20Z"/><circle cx="12" cy="12" r="1"/><circle cx="16" cy="10" r="1"/>')],
['African',icon('<path d="M4 10h16c0 7-3 10-8 10S4 17 4 10ZM3 10h18M7 6h10M10 3h4"/>')],
['Fast Food',icon('<path d="M6 8h12l-1 12H7L6 8ZM5 8h14M9 8V4M12 8V3M15 8V5"/>')],
['Desserts',icon('<path d="M5 11h14l-2 9H7l-2-9ZM7 11c-2-4 1-7 5-5 3-4 8 0 5 5"/>')],
['Drinks',icon('<path d="M5 5h14l-2 15H7L5 5ZM8 9h8M13 5l3-3"/>')]
];
$('categories').innerHTML=cats.map(([c,icon])=>'<button class="category-card '+(c===category?'selected':'')+'" data-cat="'+esc(c)+'"><span class="cat-icon">'+icon+'</span><span>'+esc(c)+'</span></button>').join('');
$('categories').onclick=e=>{const b=e.target.closest('[data-cat]');if(!b)return;category=b.dataset.cat;document.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('selected',x===b));renderRestaurants()};
$('search').oninput=renderRestaurants;
document.querySelectorAll('[data-category-jump]').forEach(b=>b.onclick=()=>{category=b.dataset.categoryJump;document.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('selected',x.dataset.cat===category));renderRestaurants();document.querySelector('.restaurants-title').scrollIntoView({behavior:'smooth',block:'start'})});
function renderRestaurants(){const term=$('search').value.trim().toLowerCase();const list=restaurants.filter(r=>(category==='All'||String(r.category||'').toLowerCase().includes(category.toLowerCase()))&&(!term||(r.name+' '+(r.category||'')).toLowerCase().includes(term)));$('count').textContent=list.length+' found';$('restaurants').innerHTML=list.length?list.map(r=>'<button class="restaurant-card" data-id="'+esc(r.id)+'"><div class="restaurant-cover">'+(r.image_url?'<img src="'+esc(r.image_url)+'" alt="'+esc(r.name)+'" loading="lazy">':'<span class="cover-placeholder">CM EATS</span>')+'<span class="cover-label">LOCAL FAVOURITE</span></div><div class="restaurant-info"><div><strong>'+esc(r.name)+'</strong><p>'+esc(r.category||'Local food')+' · '+esc(r.area||'Nkomazi')+'</p></div><span class="restaurant-arrow">↗</span></div></button>').join(''):'<div class="empty"><span class="empty-art">'+emptyIcon+'</span><strong>No restaurants just yet</strong>We’re getting Nkomazi’s food spots ready. Check back soon!</div>'}
$('restaurants').onclick=e=>{const b=e.target.closest('[data-id]');if(b)openRestaurant(b.dataset.id)};
async function loadRestaurants(){const {data,error}=await supabase.from('restaurants').select('id,name,category,area,image_url').eq('is_active',true).order('name');if(error){$('restaurants').innerHTML='<div class="empty">Restaurants could not load. Check the Supabase setup and try refreshing.</div>';return}restaurants=data||[];renderRestaurants()}
async function openRestaurant(id){currentRestaurant=restaurants.find(r=>String(r.id)===String(id));if(!currentRestaurant)return;go('restaurant');$('restaurantContent').innerHTML='<div class="empty">Loading menu…</div>';const {data,error}=await supabase.from('menu_items').select('id,name,description,price,image_url,is_available').eq('restaurant_id',id).eq('is_available',true).order('name');if(error){$('restaurantContent').innerHTML='<div class="empty">Menu unavailable right now.</div>';return}menu=data||[];$('restaurantContent').innerHTML='<h1>'+esc(currentRestaurant.name)+'</h1><p class="muted">'+esc(currentRestaurant.area||'Nkomazi')+'</p><h2>Menu</h2>'+(menu.length?menu.map(m=>'<div class="item"><div><b>'+esc(m.name)+'</b><p class="muted">'+esc(m.description||'')+'</p><span class="price">'+money(m.price)+'</span></div><button class="secondary" style="width:auto" data-add="'+esc(m.id)+'">+ Add</button></div>').join(''):'<div class="empty">No menu items published yet.</div>')};
$('restaurantContent').onclick=e=>{const b=e.target.closest('[data-add]');if(!b)return;const item=menu.find(m=>String(m.id)===b.dataset.add);if(!item)return;if(cart.length&&cart[0].restaurant_id!==currentRestaurant.id){if(!confirm('Start a new cart for this restaurant?'))return;cart=[]}const found=cart.find(x=>x.id===item.id);if(found)found.qty++;else cart.push({...item,restaurant_id:currentRestaurant.id,restaurant_name:currentRestaurant.name,qty:1});saveCart();b.textContent='Added ✓';setTimeout(()=>b.textContent='+ Add',900)};
function saveCart(){localStorage.setItem('cmeats_cart',JSON.stringify(cart));$('cartCount').textContent=cart.reduce((n,x)=>n+x.qty,0)||''}
try{cart=JSON.parse(localStorage.getItem('cmeats_cart')||'[]');if(!Array.isArray(cart))cart=[]}catch{cart=[]}saveCart();
function renderCart(){const total=cart.reduce((s,x)=>s+Number(x.price)*x.qty,0);$('cartContent').innerHTML=cart.length?cart.map(x=>'<div class="item"><div><b>'+esc(x.name)+'</b><p>'+money(x.price)+'</p></div><div class="qty"><button data-qty="'+esc(x.id)+'" data-delta="-1">−</button>'+x.qty+'<button data-qty="'+esc(x.id)+'" data-delta="1">+</button></div></div>').join('')+'<div class="line"><b>Subtotal</b><b>'+money(total)+'</b></div><p class="muted">Delivery fees and availability are confirmed at checkout.</p><button id="checkout" class="primary">Continue to checkout</button>':'<div class="empty"><span class="empty-art">'+emptyIcon+'</span><strong>Your cart is waiting</strong>Discover a restaurant and add something delicious.</div><button class="primary" data-go="home">Explore restaurants →</button>';const homeButton=$('cartContent').querySelector('[data-go="home"]');if(homeButton)homeButton.onclick=()=>go('home');const checkout=$('checkout');if(checkout)checkout.onclick=()=>{if(!session){$('authDialog').showModal();return}alert('Live checkout is not enabled yet. No order has been placed or charged.')}};
$('cartContent').onclick=e=>{const b=e.target.closest('[data-qty]');if(!b)return;const item=cart.find(x=>String(x.id)===b.dataset.qty);if(!item)return;item.qty+=Number(b.dataset.delta);cart=cart.filter(x=>x.qty>0);saveCart();renderCart()};
const orderStages=['pending','accepted','preparing','ready','picked_up','delivered'];
const orderLabels={pending:'Order received',accepted:'Restaurant accepted',preparing:'Kitchen preparing',ready:'Ready for collection',picked_up:'Out for delivery',delivered:'Delivered',cancelled:'Cancelled'};
function orderTimeline(status){
 if(status==='cancelled')return '<p class="order-cancelled">This order was cancelled.</p>';
 const step=orderStages.indexOf(status);
 return '<div class="order-progress" aria-label="Order progress">'+orderStages.map((stage,i)=>'<div class="order-step '+(i<=step?'complete ':'')+(i===step?'current':'')+'"><span class="order-step-dot"></span><span>'+esc(orderLabels[stage])+'</span></div>').join('')+'</div>';
}
async function loadOrders(){
 if(!session){$('ordersContent').innerHTML='<div class="empty">Sign in to view your orders.</div><button class="primary" id="ordersLogin">Sign in</button>';$('ordersLogin').onclick=()=>$('authDialog').showModal();return}
 const {data,error}=await supabase.from('orders').select('id,status,total_amount,created_at').eq('customer_id',session.user.id).order('created_at',{ascending:false}).limit(30);
 $('ordersContent').innerHTML=error?'<div class="empty">Orders are temporarily unavailable. Please try again.</div>':data?.length?data.map(o=>'<article class="card order-card"><div class="order-card-top"><span class="section-kicker">ORDER #'+esc(String(o.id).slice(0,8).toUpperCase())+'</span><span class="order-status '+esc(o.status)+'">'+esc(orderLabels[o.status]||o.status)+'</span></div><div class="order-card-main"><strong>'+money(o.total_amount)+'</strong><small>'+new Date(o.created_at).toLocaleString()+'</small></div>'+orderTimeline(o.status)+'</article>').join(''):'<div class="empty"><span class="empty-art">'+emptyIcon+'</span><strong>No orders yet</strong>Once you order, your history will appear here.</div>';
}
async function renderProfile(){
const root=$('profileContent');
if(!session){root.innerHTML='<div class="account-hero guest"><div class="account-avatar">CE</div><div><span class="account-overline">WELCOME TO THE CLUB</span><h2>Your food journey starts here</h2><p>Save your addresses, discover local favourites and keep your orders in one place.</p></div></div><div class="profile-actions"><button class="primary" id="profileLogin">Sign in or create an account</button></div>'+profileBenefits();$('profileLogin').onclick=()=>$('authDialog').showModal();return}
const user=session.user;
const [profileResult,addressResult,ordersResult,favResult]=await Promise.all([
supabase.from('customer_profiles').select('full_name,phone').eq('id',user.id).maybeSingle(),
supabase.from('customer_addresses').select('id,label,address_line,area,is_default').eq('customer_id',user.id).order('created_at',{ascending:false}),
supabase.from('orders').select('id',{count:'exact',head:true}).eq('customer_id',user.id),
supabase.from('customer_favourites').select('restaurant_id',{count:'exact',head:true}).eq('customer_id',user.id)
]);
const data=profileResult.data||{},addresses=addressResult.data||[];
const name=data.full_name||user.user_metadata?.full_name||'CM EATS member',initials=name.trim().split(/\s+/).slice(0,2).map(v=>v[0]?.toUpperCase()).join('');
root.innerHTML='<div class="account-hero"><div class="account-avatar">'+esc(initials||'CE')+'</div><div class="account-intro"><span class="account-overline">YOUR CM EATS ACCOUNT</span><h2>'+esc(name)+'</h2><p>'+esc(user.email||'')+'</p></div><div class="account-hero-orb"></div></div>'+
'<div class="account-stats"><div><strong>'+Number(ordersResult.count||0)+'</strong><span>Orders</span></div><div><strong>'+Number(favResult.count||0)+'</strong><span>Favourites</span></div><div><strong>'+addresses.length+'</strong><span>Addresses</span></div></div>'+
'<section class="account-section"><div class="account-section-title"><div><span class="section-kicker">YOUR DETAILS</span><h3>Personal information</h3></div><span class="account-section-icon">'+accountIcon('user')+'</span></div><div class="account-fields"><label>Full name<input id="fullName" maxlength="100" autocomplete="name" value="'+esc(data.full_name||user.user_metadata?.full_name||'')+'" placeholder="Your full name"></label><label>Phone number<input id="phone" type="tel" autocomplete="tel" value="'+esc(data.phone||user.user_metadata?.phone||'')+'" placeholder="082 123 4567"></label></div><button class="primary account-save" id="saveProfile">Save changes</button><p class="account-feedback" id="profileMessage" role="status"></p></section>'+
'<section class="account-section"><div class="account-section-title"><div><span class="section-kicker">DROP-OFF SPOTS</span><h3>Delivery addresses</h3></div><span class="account-section-icon">'+accountIcon('pin')+'</span></div><div class="address-list">'+(addresses.length?addresses.map(a=>'<div class="address-tile"><span class="address-tile-icon">'+accountIcon('home')+'</span><div><strong>'+esc(a.label||'Delivery address')+(a.is_default?' <small class="default-tag">DEFAULT</small>':'')+'</strong><p>'+esc(a.address_line)+' · '+esc(a.area||'Nkomazi')+'</p></div><button class="address-select" data-default-address="'+esc(a.id)+'" aria-label="Set as default address">'+(a.is_default?'✓':'○')+'</button></div>').join(''):'<p class="account-muted">No saved delivery addresses yet. Add your first one below.</p>')+'</div><form id="addressForm" class="address-form"><div class="account-fields"><label>Label<select id="addressLabel"><option>Home</option><option>Work</option><option>Other</option></select></label><label>Area<input id="addressArea" placeholder="e.g. Malelane" required></label></div><label>Street / building / house number<input id="addressLine" placeholder="Where should we deliver?" required minlength="5"></label><button type="submit" class="secondary">+ Add delivery address</button><p id="addressMessage" class="account-feedback" role="status"></p></form></section>'+
'<section class="account-section"><div class="account-section-title"><div><span class="section-kicker">WE ARE HERE FOR YOU</span><h3>Help & support</h3></div><span class="account-section-icon">'+accountIcon('help')+'</span></div><a class="account-link" href="tel:+27818401398">'+accountIcon('phone')+'<span><strong>Call our team</strong><small>+27 81 840 1398</small></span><span class="account-chevron">›</span></a><a class="account-link" href="mailto:help@cmeats.co.za">'+accountIcon('mail')+'<span><strong>Email support</strong><small>help@cmeats.co.za</small></span><span class="account-chevron">›</span></a></section>'+
'<button id="logout" class="account-logout">'+accountIcon('logout')+' Sign out of CM EATS</button><p class="account-footnote">Made for Nkomazi. Powered by local flavour.</p>';
$('saveProfile').onclick=async()=>{const full_name=$('fullName').value.trim(),phone=$('phone').value.trim();if(full_name.length<3){$('profileMessage').textContent='Please enter your full name.';return}const {error}=await supabase.from('customer_profiles').upsert({id:user.id,full_name,phone});$('profileMessage').textContent=error?'Could not save: '+error.message:'Your details were saved.';if(!error)setTimeout(()=>renderProfile(),800)};
$('addressForm').onsubmit=async e=>{e.preventDefault();const line=$('addressLine').value.trim(),area=$('addressArea').value.trim();if(line.length<5||area.length<2){$('addressMessage').textContent='Please provide a complete address and area.';return}const btn=$('addressForm').querySelector('button[type=submit]');btn.disabled=true;const {error}=await supabase.from('customer_addresses').insert({customer_id:user.id,label:$('addressLabel').value,address_line:line,area,is_default:addresses.length===0});if(error){$('addressMessage').textContent=error.message;btn.disabled=false}else renderProfile()};
root.querySelectorAll('[data-default-address]').forEach(b=>b.onclick=async()=>{const id=b.dataset.defaultAddress;const {error:e1}=await supabase.from('customer_addresses').update({is_default:false}).eq('customer_id',user.id);if(e1){alert('Could not update your address.');return}const {error:e2}=await supabase.from('customer_addresses').update({is_default:true}).eq('id',id).eq('customer_id',user.id);if(e2)alert('Could not set default address.');renderProfile()});
$('logout').onclick=async()=>{await supabase.auth.signOut();session=null;renderProfile()};
}
function accountIcon(type){const p={user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 3-7 8-7s8 2 8 7"/>',pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 18h.01"/>',phone:'<path d="M6 3h4l1 5-2 2c1 3 3 5 6 6l2-2 4 1v4c0 2-2 3-4 2C9 19 5 15 3 7c-1-2 0-4 3-4Z"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>',logout:'<path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M8 12h10"/>'};return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(p[type]||p.user)+'</svg>'}
function profileBenefits(){return '<div class="account-section"><div class="account-section-title"><div><span class="section-kicker">WHY JOIN?</span><h3>Everything in one place</h3></div></div><div class="benefit-row">'+accountIcon('pin')+' Save delivery addresses</div><div class="benefit-row">'+accountIcon('home')+' Discover local restaurants</div><div class="benefit-row">'+accountIcon('help')+' Get support when you need it</div></div>'}
$('signIn').onclick=async()=>{const {error}=await supabase.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});$('authMessage').textContent=error?error.message:'Signed in successfully';if(!error){$('authDialog').close();renderProfile()}};
let signupMode=false;
function toggleSignup(on){signupMode=on;$('signupDetails').hidden=!on;$('backToSignIn').hidden=!on;$('signIn').hidden=on;$('reset').hidden=on;$('signUp').textContent=on?'Create my account →':'Create an account';$('authMessage').textContent='';}
$('signUp').onclick=async()=>{if(!signupMode){toggleSignup(true);return}
const name=$('signupName').value.trim(),phone=$('signupPhone').value.trim(),address=$('signupAddress').value.trim(),area=$('signupArea').value.trim(),email=$('email').value.trim(),password=$('password').value,msg=$('authMessage');
if(name.length<3){msg.textContent='Enter your full name.';return}
if(!/^(?:0[0-9]{9}|27[0-9]{9}|\+27[0-9]{9})$/.test(phone.replace(/[\s().-]/g,''))){msg.textContent='Enter a valid phone number.';return}
if(address.length<5||area.length<2){msg.textContent='Enter your delivery address and area.';return}
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.textContent='Enter a valid email address.';return}
if(password.length<6){msg.textContent='Choose a password of at least 6 characters.';return}
const button=$('signUp');button.disabled=true;button.textContent='Creating account…';
try{const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name,phone,delivery_address:address,delivery_area:area}}});if(error){msg.textContent=error.message;return}
if(data?.session){const profile=await supabase.from('customer_profiles').upsert({id:data.user.id,full_name:name,phone});const addr=await supabase.from('customer_addresses').insert({customer_id:data.user.id,label:'Home',address_line:address,area,is_default:true});if(profile.error||addr.error){msg.textContent='Account created, but some details could not be saved. Update your profile.';return}$('authDialog').close();toggleSignup(false);go('profile')}
else{msg.textContent='Account created. Email verification is currently required by Supabase. Disable Confirm email in Authentication → Providers → Email for immediate sign-in.'}
}catch(err){msg.textContent='Could not create your account. Please try again.'}finally{button.disabled=false;button.textContent='Create my account →'}
};
$('backToSignIn').onclick=()=>toggleSignup(false);
$('reset').onclick=async()=>{const email=$('email').value.trim();if(!email){$('authMessage').textContent='Enter your email first.';return}const {error}=await supabase.auth.resetPasswordForEmail(email);$('authMessage').textContent=error?error.message:'If this account exists, a recovery email will be sent.'};
// Keep the customer experience synchronized with Supabase Realtime.
// RLS controls visibility; each signed-in customer only subscribes to their own orders.
let customerOrdersChannel=null;
let activeMenuChannel=null;
let reloadRestaurantsQueued=false;
let reloadOrdersQueued=false;
function queueRestaurantsReload(){
 if(reloadRestaurantsQueued)return;
 reloadRestaurantsQueued=true;
 queueMicrotask(async()=>{reloadRestaurantsQueued=false;await loadRestaurants();if(currentRestaurant&&!restaurants.some(r=>r.id===currentRestaurant.id)){currentRestaurant=null;menu=[];cart=[];saveCart();if(!$('restaurant').hidden)go('home')}});
}
function queueOrdersReload(){
 if(reloadOrdersQueued)return;
 reloadOrdersQueued=true;
 queueMicrotask(async()=>{reloadOrdersQueued=false;if(!$('orders').hidden)await loadOrders();if(!$('profile').hidden)await renderProfile()});
}
const catalogChannel=supabase.channel('cmeats-public-catalog')
.on('postgres_changes',{event:'*',schema:'public',table:'restaurants'},queueRestaurantsReload)
.on('postgres_changes',{event:'*',schema:'public',table:'menu_items'},()=>{if(currentRestaurant&&!$('restaurant').hidden)openRestaurant(currentRestaurant.id)})
.subscribe();
function subscribeCustomerOrders(){
 if(customerOrdersChannel){supabase.removeChannel(customerOrdersChannel);customerOrdersChannel=null}
 if(!session?.user?.id)return;
 const userId=session.user.id;
 customerOrdersChannel=supabase.channel('cmeats-customer-orders-'+userId)
 .on('postgres_changes',{event:'*',schema:'public',table:'orders',filter:'customer_id=eq.'+userId},queueOrdersReload)
 .subscribe();
}
supabase.auth.onAuthStateChange((_event,nextSession)=>{
 const previousId=session?.user?.id;
 session=nextSession;
 if(previousId!==session?.user?.id){
   // Defer database requests until Supabase finishes the auth callback.
   setTimeout(()=>{subscribeCustomerOrders();if(!$('orders').hidden)loadOrders();if(!$('profile').hidden)renderProfile()},0);
 }
});
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='visible'){loadRestaurants();if(!$('orders').hidden)loadOrders();if(!$('profile').hidden)renderProfile();if(currentRestaurant&&!$('restaurant').hidden)openRestaurant(currentRestaurant.id)}
});
window.addEventListener('online',()=>{loadRestaurants();if(!$('orders').hidden)loadOrders()});
(async()=>{const {data}=await supabase.auth.getSession();session=data.session;subscribeCustomerOrders();await loadRestaurants()})();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
