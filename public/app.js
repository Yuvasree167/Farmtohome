// Lightweight frontend for FarmToHome: product fetch, cart, simple cinematic touches

const api = {
  products: '/api/products',
  auth: '/api/auth',
  orders: '/api/orders'
};

function $(s){return document.querySelector(s)}
function $all(s){return document.querySelectorAll(s)}

// Product grid
async function loadProducts(){
  const res = await fetch(api.products);
  const products = await res.json();
  const grid = $('#productGrid');
  grid.innerHTML = '';
  const cart = getCart();
  products.forEach(p => {
    const col = document.createElement('div'); col.className = 'col-12 col-sm-6 col-md-4';
    // compute existing qty from cart
    const existing = (cart.find(i=>i.product===p._id) || { qty:0 }).qty;
    col.innerHTML = `
      <div class="card shadow-sm product-card" data-product-id="${p._id}">
        <div class="qty-badge" data-id="${p._id}" style="display:${existing? 'flex':'none'}">${existing}</div>
        <img src="${p.image||'/assets/placeholder.png'}" class="card-img-top" alt="${p.name}">
        <div class="card-body">
          <h5 class="card-title">${p.name}</h5>
          <p class="card-text text-muted small">${p.description||''}</p>
          <div class="d-flex justify-content-between align-items-center">
            <strong>₹${p.price.toFixed(2)}</strong>
            <div class="btn-group">
              ${existing > 0 ? `
                <button class="btn btn-sm btn-outline-danger remove-btn" data-id="${p._id}">-</button>
                <button class="btn btn-sm btn-outline-success add-btn" data-id="${p._id}">+</button>
              ` : `
                <button class="btn btn-sm btn-outline-success add-btn" data-id="${p._id}">Add to Cart</button>
              `}
            </div>
          </div>
        </div>
      </div>`;
    grid.appendChild(col);
  });
    // attach listeners
  $all('.add-btn').forEach(btn => btn.addEventListener('click', e => addToCart(e.target.dataset.id)));
  $all('.remove-btn').forEach(btn => btn.addEventListener('click', e => removeFromCart(e.target.dataset.id)));
}

// Cart in localStorage
function getCart(){ return JSON.parse(localStorage.getItem('ft_cart')||'[]'); }
function saveCart(c){ localStorage.setItem('ft_cart', JSON.stringify(c)); updateCartUI(); }

async function removeFromCart(productId) {
  const cart = getCart();
  const entry = cart.find(i=>i.product===productId);
  if(entry) {
    entry.qty -= 1;
    if(entry.qty <= 0) {
      cart.splice(cart.indexOf(entry), 1);
    }
  }
  saveCart(cart);
  await refreshProductUI(productId);
}

async function addToCart(productId){
  const cart = getCart();
  const entry = cart.find(i=>i.product===productId);
  if(entry) entry.qty += 1; else cart.push({ product: productId, qty: 1});
  saveCart(cart);
  await refreshProductUI(productId);
}

async function refreshProductUI(productId) {
  const cart = getCart();
  const entry = cart.find(i=>i.product===productId);
  const newQty = entry ? entry.qty : 0;
  
  // Update badge
  const badge = document.querySelector(`.qty-badge[data-id=\"${productId}\"]`);
  if(badge){ 
    if(newQty > 0) {
      badge.textContent = newQty;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // Update buttons
  const card = document.querySelector(`.product-card[data-product-id=\"${productId}\"]`);
  if(card) {
    const btnGroup = card.querySelector('.btn-group');
    if(btnGroup) {
      if(newQty > 0) {
        btnGroup.innerHTML = `
          <button class="btn btn-sm btn-outline-danger remove-btn" data-id="${productId}">-</button>
          <button class="btn btn-sm btn-outline-success add-btn" data-id="${productId}">+</button>
        `;
      } else {
        btnGroup.innerHTML = `<button class="btn btn-sm btn-outline-success add-btn" data-id="${productId}">Add to Cart</button>`;
      }
      // Reattach listeners
      btnGroup.querySelector('.add-btn').addEventListener('click', e => addToCart(e.target.dataset.id));
      const removeBtn = btnGroup.querySelector('.remove-btn');
      if(removeBtn) {
        removeBtn.addEventListener('click', e => removeFromCart(e.target.dataset.id));
      }
    }
  }
}

function updateCartUI(){
  const cart = getCart();
  $('#cartCount').textContent = cart.reduce((s,i)=>s+i.qty,0);
  const itemsEl = $('#cartItems');
  itemsEl.innerHTML = '';
  let total = 0;
  if(!cart.length){ itemsEl.innerHTML = '<div class="p-3 text-muted">Cart is empty</div>'; $('#cartTotal').textContent = '0.00'; return; }
  // For each item, we need product data
  fetch(api.products).then(r=>r.json()).then(products=>{
    cart.forEach(it=>{
      const p = products.find(x=>x._id===it.product);
      if(!p) return;
      const price = p.price * it.qty; total+=price;
      const row = document.createElement('div'); row.className='d-flex align-items-center gap-2 py-2 border-bottom';
      row.innerHTML = `
        <img src="${p.image}" style="width:54px;height:54px;object-fit:cover;border-radius:8px">
        <div class="flex-grow-1">
          <div class="small">${p.name}</div>
          <div class="text-muted small">${it.qty} × ₹${p.price.toFixed(2)}</div>
        </div>
        <div><strong>₹${price.toFixed(2)}</strong></div>`;
      itemsEl.appendChild(row);
    });
    $('#cartTotal').textContent = total.toFixed(2);
  });
}

// Cart drawer toggles
$('#openCart').addEventListener('click', ()=> $('#cartDrawer').classList.add('open'));
$('#closeCart').addEventListener('click', ()=> $('#cartDrawer').classList.remove('open'));

// Account management
function checkAuth() {
  const token = localStorage.getItem('ft_token');
  const userStr = localStorage.getItem('ft_user');
  if(token && userStr){
    const user = JSON.parse(userStr);
    const welcome = document.getElementById('welcomeName');
    if(welcome){ 
      welcome.innerHTML = `
        <div class="d-flex align-items-center gap-2 user-welcome">
          <div class="user-avatar">👤</div>
          <div class="user-name">${user.name}</div>
        </div>
      `; 
      welcome.style.display = 'inline-block'; 
    }
    const account = document.getElementById('accountDropdown'); if(account) account.style.display='block';
    const loginBtn = document.getElementById('loginBtn'); if(loginBtn) loginBtn.style.display='none';
  }
}

function logout() {
  localStorage.removeItem('ft_token');
  localStorage.removeItem('ft_user');
  location.reload();
}

// Initialize
loadProducts().catch(err=>console.error(err));
updateCartUI();
checkAuth();

// Small cinematic entrance for hero elements
window.addEventListener('load', ()=>{
  document.querySelectorAll('.card').forEach((c,i)=>{
    c.style.opacity = 0; c.style.transform = 'translateY(18px)';
    setTimeout(()=>{ c.animate([{opacity:0, transform:'translateY(18px)'},{opacity:1, transform:'translateY(0)'}], {duration:520, easing:'cubic-bezier(.2,.85,.2,1)'}); c.style.opacity=1; c.style.transform=''; }, 120*i);
  });
});
