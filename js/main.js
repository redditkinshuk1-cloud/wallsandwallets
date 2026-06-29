/* =========================================================
   WALLS & WALLETS — shared logic
========================================================= */

const WHATSAPP_NUMBER = "919315207344"; // no '+' for wa.me links
const STORE_EMAIL = "help@wallsandwallets.in";

const PRODUCTS = [
  { id:"venom-bite",      name:"Venom Bite",      tag:"Movie",     price:89, img:"images/venom-bite.jpg",      blurb:"Tap in, tap out, say nothing about the tongue.", landscape:true },
  { id:"spider-verse",    name:"Spider-Verse",    tag:"Movie",     price:89, img:"images/spider-verse.jpg",    blurb:"With great power comes great metro etiquette.", landscape:true },
  { id:"aesthetic-diary", name:"Aesthetic Diary", tag:"Aesthetic", price:89, img:"images/aesthetic-diary.jpg", blurb:"Soft scrapbook energy for your daily commute.", landscape:true },
  { id:"kuromi-street",   name:"Kuromi Street",   tag:"Cute",      price:89, img:"images/kuromi-street.jpg",   blurb:"Cute with an attitude problem, just like rush hour.", landscape:true },
  { id:"kiss-marks",      name:"Kiss Marks",      tag:"Aesthetic", price:89, img:"images/kiss-marks.jpg",      blurb:"Lipstick on every tap, no questions asked.", landscape:true },
  { id:"wolf-cash",       name:"Wolf Cash",       tag:"Movie",     price:89, img:"images/wolf-cash.jpg",       blurb:"Sell the pitch, swipe the card, repeat.", landscape:true },
  { id:"call-saul",       name:"Call Saul",       tag:"TV",        price:89, img:"images/call-saul.jpg",       blurb:"In legal trouble on the yellow line? Better swipe this.", landscape:true }
];

function findProduct(id){ return PRODUCTS.find(p => p.id === id); }

/* ---------------- CART ---------------- */
function getCart(){
  try{ return JSON.parse(localStorage.getItem("ww_cart")) || []; }
  catch(e){ return []; }
}
function saveCart(cart){
  localStorage.setItem("ww_cart", JSON.stringify(cart));
  updateCartBadge();
}
function addToCart(id){
  const cart = getCart();
  const line = cart.find(l => l.id === id);
  if(line){ line.qty += 1; } else { cart.push({ id, qty:1 }); }
  saveCart(cart);
}
function setQty(id, qty){
  let cart = getCart();
  if(qty <= 0){ cart = cart.filter(l => l.id !== id); }
  else { const line = cart.find(l => l.id === id); if(line) line.qty = qty; }
  saveCart(cart);
}
function removeFromCart(id){ setQty(id, 0); }
function cartCount(){ return getCart().reduce((sum,l)=>sum+l.qty,0); }
function cartTotal(){
  return getCart().reduce((sum,l)=>{
    const p = findProduct(l.id);
    return p ? sum + p.price * l.qty : sum;
  },0);
}
function updateCartBadge(){
  document.querySelectorAll(".cart-badge").forEach(el=>{ el.textContent = cartCount(); });
}

/* ---------------- WHATSAPP HELPERS ---------------- */
function openWhatsApp(message){
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

/* ---------------- SIGNUP GATE ---------------- */
function getUser(){
  try{ return JSON.parse(localStorage.getItem("ww_user")); }
  catch(e){ return null; }
}

function injectSignupGate(){
  if(getUser()) return; // already signed up
  const overlay = document.createElement("div");
  overlay.className = "gate-overlay";
  overlay.id = "signupGate";
  overlay.innerHTML = `
    <div class="gate-card">
      <span class="eyebrow">Walls &amp; Wallets</span>
      <h2>Before you<br>swipe in</h2>
      <p class="sub">Quick sign up so we can confirm your order on WhatsApp &mdash; takes 10 seconds.</p>
      <form id="gateForm" novalidate>
        <div class="field">
          <label for="gateName">Full name</label>
          <input id="gateName" name="name" type="text" placeholder="e.g. Aditi Sharma" autocomplete="name" required>
          <div class="err">Please enter your name.</div>
        </div>
        <div class="field">
          <label for="gatePhone">WhatsApp number</label>
          <input id="gatePhone" name="phone" type="tel" placeholder="10-digit mobile number" autocomplete="tel" required>
          <div class="err">Please enter a valid 10-digit number.</div>
        </div>
        <div class="field">
          <label for="gateEmail">Email</label>
          <input id="gateEmail" name="email" type="email" placeholder="you@example.com" autocomplete="email" required>
          <div class="err">Please enter a valid email.</div>
        </div>
        <button type="submit" class="btn solid">Enter the store</button>
      </form>
      <p class="gate-foot">By continuing you agree to be contacted on WhatsApp about your orders.<br>No spam, just card drops.</p>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const form = overlay.querySelector("#gateForm");
  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    let valid = true;

    const nameErr = form.name.nextElementSibling;
    const phoneErr = form.phone.nextElementSibling;
    const emailErr = form.email.nextElementSibling;

    if(name.length < 2){ nameErr.style.display = "block"; valid = false; } else { nameErr.style.display = "none"; }
    if(!/^\d{10}$/.test(phone.replace(/\D/g,""))){ phoneErr.style.display = "block"; valid = false; } else { phoneErr.style.display = "none"; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ emailErr.style.display = "block"; valid = false; } else { emailErr.style.display = "none"; }

    if(!valid) return;

    const user = { name, phone, email };
    localStorage.setItem("ww_user", JSON.stringify(user));

    const msg = `New sign up on Walls & Wallets!\nName: ${name}\nPhone: ${phone}\nEmail: ${email}`;
    openWhatsApp(msg);

    overlay.remove();
    document.body.style.overflow = "";
    prefillCheckoutFields();
  });
}

function prefillCheckoutFields(){
  const user = getUser();
  if(!user) return;
  const n = document.getElementById("coName");
  const p = document.getElementById("coPhone");
  const e = document.getElementById("coEmail");
  if(n && !n.value) n.value = user.name;
  if(p && !p.value) p.value = user.phone;
  if(e && !e.value) e.value = user.email;
}

/* ---------------- 3D TILT / HOLOGRAPHIC EFFECT ---------------- */
function attachTilt(el, maxTilt = 10){
  let frame = null;
  function onMove(e){
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * maxTilt * 2;
    const rotateX = (0.5 - y) * maxTilt * 2;
    if(frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(()=>{
      el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.025,1.025,1.025)`;
      el.style.setProperty("--glow-x", `${x*100}%`);
      el.style.setProperty("--glow-y", `${y*100}%`);
    });
    el.classList.add("tilting");
  }
  function onLeave(){
    if(frame) cancelAnimationFrame(frame);
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    el.classList.remove("tilting");
  }
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
  el.addEventListener("touchmove", onMove, { passive:true });
  el.addEventListener("touchend", onLeave);
}

function initTiltAll(){
  document.querySelectorAll(".card-3d").forEach(el => attachTilt(el, el.dataset.tilt ? Number(el.dataset.tilt) : 9));
}

/* ---------------- NAV ---------------- */
function initNav(){
  const burger = document.querySelector(".burger");
  const links = document.querySelector(".nav-links");
  if(burger && links){
    burger.addEventListener("click", ()=> links.classList.toggle("open"));
  }
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(a=>{
    if(a.getAttribute("href") === path) a.classList.add("active");
  });
  updateCartBadge();
}

/* ---------------- RENDER: PRODUCT GRID ---------------- */
function renderProductGrid(targetSelector){
  const target = document.querySelector(targetSelector);
  if(!target) return;
  target.innerHTML = PRODUCTS.map(p => `
    <div class="product">
      <div class="card-3d${p.landscape ? ' landscape' : ''}" data-tilt="8">
        <span class="product-tag">${p.tag}</span>
        <img src="${p.img}" alt="${p.name} metro card skin" loading="lazy">
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <span class="price">&#8377;${p.price}</span>
      </div>
      <p class="product-blurb">${p.blurb}</p>
      <button class="add-btn" data-id="${p.id}">Add to cart</button>
    </div>
  `).join("");

  target.querySelectorAll(".add-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      addToCart(btn.dataset.id);
      btn.textContent = "Added ✓";
      btn.classList.add("added");
      setTimeout(()=>{ btn.textContent = "Add to cart"; btn.classList.remove("added"); }, 1400);
    });
  });
}

/* ---------------- RENDER: CHECKOUT ---------------- */
function renderCheckout(){
  const listEl = document.querySelector("#cartList");
  const emptyEl = document.querySelector("#emptyCart");
  if(!listEl) return;
  const cart = getCart();

  if(cart.length === 0){
    listEl.style.display = "none";
    if(emptyEl) emptyEl.style.display = "block";
    updateSummary();
    return;
  }
  if(emptyEl) emptyEl.style.display = "none";
  listEl.style.display = "flex";

  listEl.innerHTML = cart.map(line=>{
    const p = findProduct(line.id);
    if(!p) return "";
    return `
      <div class="cart-item" data-id="${p.id}">
        <img src="${p.img}" alt="${p.name}">
        <div>
          <h4>${p.name}</h4>
          <span class="unit">&#8377;${p.price} each</span>
          <div class="qty">
            <button class="qty-minus" aria-label="Decrease quantity">&minus;</button>
            <span>${line.qty}</span>
            <button class="qty-plus" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <span class="line-total">&#8377;${p.price * line.qty}</span>
          <button class="remove-line">Remove</button>
        </div>
      </div>`;
  }).join("");

  listEl.querySelectorAll(".qty-plus").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.closest(".cart-item").dataset.id;
      const line = getCart().find(l=>l.id===id);
      setQty(id, (line ? line.qty : 0) + 1);
      renderCheckout();
    });
  });
  listEl.querySelectorAll(".qty-minus").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.closest(".cart-item").dataset.id;
      const line = getCart().find(l=>l.id===id);
      setQty(id, (line ? line.qty : 0) - 1);
      renderCheckout();
    });
  });
  listEl.querySelectorAll(".remove-line").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.closest(".cart-item").dataset.id;
      removeFromCart(id);
      renderCheckout();
    });
  });

  updateSummary();
}

function updateSummary(){
  const subtotalEl = document.querySelector("#subtotalVal");
  const totalEl = document.querySelector("#totalVal");
  const itemsEl = document.querySelector("#itemCountVal");
  const placeBtn = document.querySelector("#placeOrderBtn");
  const total = cartTotal();
  const count = cartCount();
  if(subtotalEl) subtotalEl.textContent = `\u20B9${total}`;
  if(totalEl) totalEl.textContent = `\u20B9${total}`;
  if(itemsEl) itemsEl.textContent = count;
  if(placeBtn) placeBtn.disabled = count === 0;
}

function placeOrder(e){
  e.preventDefault();
  const cart = getCart();
  if(cart.length === 0) return;

  const name = document.getElementById("coName").value.trim();
  const phone = document.getElementById("coPhone").value.trim();
  const email = document.getElementById("coEmail").value.trim();
  const address = document.getElementById("coAddress").value.trim();

  if(!name || !phone || !address){
    alert("Please fill in your name, phone and delivery address before placing the order.");
    return;
  }

  let lines = cart.map(l=>{
    const p = findProduct(l.id);
    return p ? `${p.name} x${l.qty} = \u20B9${p.price*l.qty}` : "";
  }).filter(Boolean).join("\n");

  const message = `New order — Walls & Wallets\n\n${lines}\n\nTotal: \u20B9${cartTotal()}\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nDelivery address: ${address}`;

  openWhatsApp(message);
  localStorage.removeItem("ww_cart");
  updateCartBadge();

  const checkoutGrid = document.querySelector(".checkout-grid");
  if(checkoutGrid){
    checkoutGrid.innerHTML = `
      <div class="empty-cart" style="grid-column:1/-1;">
        <h2 style="margin-bottom:14px;">Order sent ✓</h2>
        <p>We've opened WhatsApp with your order details — just hit send and we'll confirm payment &amp; delivery with you there.</p>
        <a href="index.html" class="btn solid">Keep browsing skins</a>
      </div>`;
  }
}

/* ---------------- CONTACT FORM ---------------- */
function initContactForm(){
  const form = document.querySelector("#contactForm");
  if(!form) return;
  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = form.cName.value.trim();
    const email = form.cEmail.value.trim();
    const msg = form.cMessage.value.trim();
    if(!name || !msg){ alert("Please add your name and message."); return; }
    const text = `New message from website\nName: ${name}\nEmail: ${email}\n\n${msg}`;
    openWhatsApp(text);
    form.reset();
    const note = document.querySelector("#contactNote");
    if(note) note.textContent = "Opened WhatsApp with your message — hit send and we'll reply soon.";
  });
}

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", ()=>{
  initNav();
  injectSignupGate();
  prefillCheckoutFields();
  renderProductGrid("#productGrid");
  initTiltAll();
  renderCheckout();
  initContactForm();

  const checkoutForm = document.querySelector("#checkoutForm");
  if(checkoutForm) checkoutForm.addEventListener("submit", placeOrder);
});
