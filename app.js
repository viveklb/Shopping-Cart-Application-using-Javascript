"use strict";
const $ = (s) => document.querySelector(s);
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
const page = document.body.dataset.page;
let users = read("mesh-users", []);
let session = read("mesh-session", null);
let user =
  (session &&
    session.expires > Date.now() &&
    users.find((u) => u.id === session.userId)) ||
  null;
if (["shop", "cart", "profile"].includes(page) && !user)
  location.replace("login.html?next=" + page);
const cartKey = () => "mesh-cart-" + user.id;
const getCart = () => (user ? read(cartKey(), []) : []);
const countCart = () => getCart().reduce((n, p) => n + p.quantity, 0);
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(
    () => $("#toast").classList.remove("show"),
    3000,
  );
}
function header() {
  return `<div class="announcement">A LITTLE LESS ORDINARY. A LOT MORE YOU. &nbsp; � &nbsp; THE EVERYDAY EDIT</div><header class="nav"><a class="brand" href="index.html">MeShop<span>.</span></a><nav class="navlinks" aria-label="Main navigation"><a class="${page === "shop" ? "active" : ""}" href="shop.html">Shop</a>${user ? `<a class="${page === "profile" ? "active" : ""}" href="profile.html">My profile</a>` : '<a href="login.html">Log in</a><a href="signup.html">Sign up</a>'}<a class="cart-link" href="cart.html">Bag <span id="cart-count">(${countCart()})</span></a></nav></header>`;
}
function footer() {
  return `<footer class="footer"><a class="brand" href="index.html">MeShop<span>.</span></a><span>Thoughtful finds for your everyday.<br>� ${new Date().getFullYear()} MeShop. A learning project.</span><a href="shop.html">Explore the collection ?</a></footer>`;
}
const categories = [
  "men's clothing",
  "women's clothing",
  "electronics",
  "jewelery",
];
const labels = ["Men's clothing", "Women's clothing", "Electronics", "Jewelry"];
function home() {
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow">THE EVERYDAY COLLECTION / 2026</div><h1>Good things.<br>Great everyday.</h1><p>Fresh perspectives. Thoughtful essentials. Discover the pieces that feel a little more like you.</p><a class="button" href="shop.html">Explore the shop <span>?</span></a><p class="muted">Curated with care. Priced for real life.</p></div><div class="hero-art"><img src="https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg" alt="Olive canvas backpack"><div class="hero-tag">THE DAILY COMPANION<br><strong>Made for wherever.</strong></div><span class="art-label">01 � CARRY SOMETHING GOOD</span></div></section><div class="benefits"><span>? &nbsp; Discover something new</span><span>? &nbsp; Essentials, thoughtfully selected</span><span>? &nbsp; A little something for everyone</span></div><section class="container"><div class="section-heading"><div><div class="eyebrow">FIND YOUR EVERYDAY</div><h2>Something for every side of you.</h2></div><span class="muted">04 collections</span></div><div class="category-grid">${labels.map((l, i) => `<a class="category-card" href="shop.html?category=${encodeURIComponent(categories[i])}"><span>${["?", "?", "?", "?"][i]}</span><strong>${l} &nbsp; ?</strong></a>`).join("")}</div></section>`;
}
function auth(signup) {
  return `<main class="auth-layout"><div class="auth-art"><div class="eyebrow">WELCOME TO YOUR EVERYDAY</div><h2>A good find.<br>A fresh start.</h2><p>Your next favorite is waiting here.</p><div class="decor">?</div><span class="muted">GOOD THINGS START WITH YOU.</span></div><section class="form-panel"><div class="eyebrow">${signup ? "JOIN THE COLLECTION" : "MAKE YOURSELF AT HOME"}</div><h1>${signup ? "Create an account." : "Welcome back."}</h1><p>${signup ? "A few details, a world of discoveries." : "Log in to pick up where you left off."}</p><form id="auth-form">${signup ? '<div class="two-fields"><label>First name<input name="firstName" autocomplete="given-name" required maxlength="50"></label><label>Last name<input name="lastName" autocomplete="family-name" required maxlength="50"></label></div>' : ""}<label>Email address<input name="email" type="email" autocomplete="email" required maxlength="150"></label><label>Password<input name="password" type="password" autocomplete="${signup ? "new-password" : "current-password"}" required minlength="8" maxlength="128"></label>${signup ? '<label>Confirm password<input name="confirm" type="password" autocomplete="new-password" required minlength="8" maxlength="128"></label>' : ""}<div class="error" id="form-error" role="alert"></div><button>${signup ? "Create account" : "Log in"} &nbsp; ?</button></form><p class="form-note">${signup ? 'Already part of the collection? <a href="login.html"><u>Log in</u></a>' : 'New around here? <a href="signup.html"><u>Create an account</u></a>'}</p></section></main>`;
}
async function hashPassword(password, salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    material,
    256,
  );
  return Array.from(new Uint8Array(bits), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
function bindAuth(signup) {
  $("#auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      email = f.get("email").trim().toLowerCase(),
      password = f.get("password");
    const btn = e.target.querySelector("button");
    btn.disabled = true;
    try {
      if (signup) {
        if (!f.get("firstName").trim() || !f.get("lastName").trim())
          throw Error("Please enter your first and last name.");
        if (password !== f.get("confirm"))
          throw Error("Passwords do not match.");
        if (users.some((u) => u.email === email))
          throw Error("An account with this email already exists.");
        const salt = crypto.randomUUID();
        user = {
          id: crypto.randomUUID(),
          firstName: f.get("firstName").trim(),
          lastName: f.get("lastName").trim(),
          email,
          salt,
          passwordHash: await hashPassword(password, salt),
        };
        users.push(user);
        write("mesh-users", users);
      } else {
        user = users.find((u) => u.email === email);
        if (
          !user ||
          (await hashPassword(password, user.salt)) !== user.passwordHash
        ) {
          user = null;
          throw Error("Email or password is incorrect.");
        }
      }
      write("mesh-session", {
        userId: user.id,
        token: crypto.randomUUID(),
        expires: Date.now() + 86400000,
      });
      const next = new URLSearchParams(location.search).get("next");
      location.href = ["shop", "cart", "profile"].includes(next)
        ? next + ".html"
        : "shop.html";
    } catch (err) {
      $("#form-error").textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}
function shop() {
  return `<main class="container"><div class="shop-head"><div><div class="eyebrow">THE COLLECTION</div><h1>Your next good find.</h1><p>Everyday favorites, all in one place.</p></div><span id="result-count" class="count"></span></div><div class="shop-layout"><aside class="sidebar" aria-label="Product filters"><div class="filter-section"><h3>Categories</h3>${labels.map((l, i) => `<label class="check"><input type="checkbox" name="category" value="${categories[i]}">${l}</label>`).join("")}</div><div class="filter-section"><h3>Colors</h3>${["Black", "White", "Blue", "Brown", "Green", "Gold"].map((c) => `<label class="check"><input type="checkbox" name="color" value="${c}">${c}</label>`).join("")}<p class="muted">Colors are curated demo attributes.</p></div><div class="filter-section"><h3>Maximum price <output id="price-label">$1,000</output></h3><input aria-label="Maximum price" id="price" type="range" min="0" max="1000" value="1000" step="10"><p class="muted">$0 <span style="float:right">$1,000</span></p></div><div class="filter-section"><h3>Minimum rating</h3><input aria-label="Minimum rating" id="rating" type="range" min="0" max="5" step="0.5" value="0"><output id="rating-label">Any rating</output></div><button class="reset" id="reset">Reset all filters ?</button></aside><section aria-label="Products"><div class="searchbar"><input id="search" type="search" aria-label="Search products" placeholder="Search for your next favorite�"><select id="sort" aria-label="Sort products"><option value="featured">Sort: Featured</option><option value="low">Price: Low to high</option><option value="high">Price: High to low</option><option value="rating">Top rated</option></select></div><div class="tabs" role="group" aria-label="Collections">${["All", ...labels].map((l, i) => `<button data-category="${i ? categories[i - 1] : ""}" class="${i ? "" : "selected"}" aria-pressed="${!i}">${l}</button>`).join("")}</div><div class="products" id="products"><div class="loading">Finding the good things�</div></div></section></div></main>`;
}
let products = [];
const colors = ["Brown", "Black", "Blue", "White", "Gold", "Green"];
async function loadProducts() {
  try {
    const response = await fetch("https://fakestoreapi.com/products", {
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw Error();
    products = (await response.json()).map((p) => ({
      ...p,
      color: colors[(p.id - 1) % colors.length],
    }));
    if (!Array.isArray(products) || !products.length) throw Error();
    renderProducts();
  } catch {
    $("#products").innerHTML =
      '<div class="empty"><h2>The collection is taking a moment.</h2><p>Check your connection and try again.</p><button id="retry">Try again</button></div>';
    $("#retry").onclick = loadProducts;
  }
}
function renderProducts() {
  const cats = [...document.querySelectorAll("[name=category]:checked")].map(
      (i) => i.value,
    ),
    cs = [...document.querySelectorAll("[name=color]:checked")].map(
      (i) => i.value,
    );
  const query = $("#search").value.toLowerCase().trim();
  let list = products.filter(
    (p) =>
      (!cats.length || cats.includes(p.category)) &&
      (!cs.length || cs.includes(p.color)) &&
      p.price <= Number($("#price").value) &&
      p.rating.rate >= Number($("#rating").value) &&
      p.title.toLowerCase().includes(query),
  );
  const sort = $("#sort").value;
  if (sort === "low") list.sort((a, b) => a.price - b.price);
  if (sort === "high") list.sort((a, b) => b.price - a.price);
  if (sort === "rating") list.sort((a, b) => b.rating.rate - a.rating.rate);
  $("#result-count").textContent = `${list.length} thoughtful finds`;
  $("#price-label").textContent = money(Number($("#price").value));
  $("#rating-label").textContent = Number($("#rating").value)
    ? `${$("#rating").value} stars & up`
    : "Any rating";
  $("#products").innerHTML = list.length
    ? list
        .map(
          (p) =>
            `<article class="product"><div class="product-image"><span class="badge">THE EVERYDAY EDIT</span><img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title)}" loading="lazy"></div><p class="product-category">${escapeHTML(p.category)} � ${p.color}</p><h3 title="${escapeHTML(p.title)}">${escapeHTML(p.title)}</h3><div class="rating">? ${p.rating.rate} <span>(${p.rating.count} reviews)</span></div><div class="product-bottom"><strong>${money(p.price)}</strong><button data-add="${p.id}" aria-label="Add ${escapeHTML(p.title)} to bag">Add to bag +</button></div></article>`,
        )
        .join("")
    : '<div class="empty"><h2>No finds just yet.</h2><p>Try another search or reset your filters.</p></div>';
}
function bindShop() {
  const selected = new URLSearchParams(location.search).get("category");
  document
    .querySelectorAll("[name=category]")
    .forEach((c) => (c.checked = c.value === selected));
  function syncTabs() {
    const checked = [
      ...document.querySelectorAll("[name=category]:checked"),
    ].map((c) => c.value);
    document.querySelectorAll("[data-category]").forEach((b) => {
      const active =
        checked.length === 0
          ? !b.dataset.category
          : checked.length === 1 && checked[0] === b.dataset.category;
      b.classList.toggle("selected", active);
      b.setAttribute("aria-pressed", active);
    });
  }
  syncTabs();
  document.querySelectorAll(".sidebar input, #search, #sort").forEach((el) =>
    el.addEventListener("input", () => {
      syncTabs();
      renderProducts();
    }),
  );
  document.querySelectorAll("[data-category]").forEach(
    (b) =>
      (b.onclick = () => {
        document
          .querySelectorAll("[name=category]")
          .forEach((c) => (c.checked = c.value === b.dataset.category));
        syncTabs();
        renderProducts();
      }),
  );
  $("#reset").onclick = () => {
    document
      .querySelectorAll(".sidebar input[type=checkbox]")
      .forEach((c) => (c.checked = false));
    $("#price").value = 1000;
    $("#rating").value = 0;
    $("#search").value = "";
    $("#sort").value = "featured";
    syncTabs();
    renderProducts();
  };
  $("#products").onclick = (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    const p = products.find((p) => p.id === Number(b.dataset.add));
    let cart = getCart(),
      existing = cart.find((i) => i.id === p.id);
    if (existing) existing.quantity++;
    else cart.push({ ...p, quantity: 1 });
    write(cartKey(), cart);
    $("#cart-count").textContent = `(${countCart()})`;
    toast("A good find, added to your bag.");
  };
  loadProducts();
}
function cart() {
  const items = getCart(),
    total = items.reduce((s, p) => s + p.price * p.quantity, 0);
  return `<main class="container"><div class="eyebrow">YOUR EVERYDAY, COLLECTED</div><h1>My bag<span class="count"> (${countCart()} items)</span></h1><div id="order-message"></div>${items.length ? `<div class="cart-layout"><section>${items.map((p) => `<article class="cart-row"><img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.title)}"><div><div class="eyebrow">${escapeHTML(p.category)}</div><h3>${escapeHTML(p.title)}</h3><span class="muted">${money(p.price)} each</span><div class="quantity"><button data-qty="${p.id}" data-change="-1" aria-label="Decrease quantity">-</button><span>${p.quantity}</span><button data-qty="${p.id}" data-change="1" aria-label="Increase quantity">+</button><button class="remove" data-remove="${p.id}">Remove</button></div></div><strong>${money(p.price * p.quantity)}</strong></article>`).join("")}</section><aside class="summary"><h2>Order summary</h2><div class="summary-line"><span>Subtotal</span><span>${money(total)}</span></div><div class="summary-line"><span>Shipping</span><span>Complimentary</span></div><div class="summary-line summary-total"><strong>Total</strong><strong>${money(total)}</strong></div><p class="muted">Catalog prices are in USD. Live payment currency and totals must be confirmed by the payment server.</p><button id="checkout">${window.SHOP_CONFIG.paymentApi ? "Pay with Razorpay ?" : "Complete demo checkout ?"}</button><p class="muted">${window.SHOP_CONFIG.paymentApi ? "Payment is confirmed after server verification." : "Demo mode � No money is charged."}</p><p class="error" id="payment-error" role="alert"></p><a href="shop.html" class="muted">? Continue discovering</a></aside></div>` : '<section class="empty"><h2>A little room for something good.</h2><p>Your bag is empty. Let�s find your next everyday favorite.</p><a class="button" href="shop.html">Explore the collection ?</a></section>'}</main>`;
}
function finishOrder(id) {
  write(cartKey(), []);
  render();
  const message = document.createElement("div");
  message.className = "success";
  message.textContent = `${window.SHOP_CONFIG.paymentApi ? "Payment verified." : "Demo checkout complete � no charge made."} Your bag has been cleared. Order: ${id}`;
  $("#order-message").append(message);
}
async function checkout() {
  const button = $("#checkout");
  button.disabled = true;
  const cfg = window.SHOP_CONFIG;
  try {
    if (!cfg.paymentApi) {
      finishOrder("DEMO-" + crypto.randomUUID().slice(0, 8));
      return;
    }
    const api = new URL(cfg.paymentApi);
    if (api.protocol !== "https:")
      throw Error("Payment server must use HTTPS.");
    const response = await fetch(api.href.replace(/\/$/, "") + "/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: getCart().map((p) => ({ id: p.id, quantity: p.quantity })),
      }),
    });
    if (!response.ok)
      throw Error("Unable to create a payment order. Please try again.");
    const order = await response.json();
    if (
      !order.id ||
      !Number.isInteger(order.amount) ||
      !order.currency ||
      !cfg.razorpayKey
    )
      throw Error("Payment server configuration is incomplete.");
    if (!window.Razorpay)
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = resolve;
        s.onerror = () => reject(Error("Payment gateway could not load."));
        document.head.append(s);
      });
    const payment = new window.Razorpay({
      key: cfg.razorpayKey,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      name: "MeShop",
      prefill: {
        name: user.firstName + " " + user.lastName,
        email: user.email,
      },
      handler: async (result) => {
        try {
          const verified = await fetch(
            api.href.replace(/\/$/, "") + "/verify",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...result, orderId: order.id }),
            },
          );
          if (!verified.ok || (await verified.json()).verified !== true)
            throw Error(
              "Payment verification is pending. Your bag has been retained. Contact support before retrying.",
            );
          finishOrder(order.id);
        } catch (err) {
          $("#payment-error").textContent = err.message;
        } finally {
          button.disabled = false;
        }
      },
      modal: {
        ondismiss: () => {
          button.disabled = false;
        },
      },
    });
    payment.on("payment.failed", () => {
      $("#payment-error").textContent =
        "Payment failed. Your bag is safe. Please try again.";
      button.disabled = false;
    });
    payment.open();
  } catch (err) {
    $("#payment-error").textContent = err.message;
    button.disabled = false;
  }
}
function bindCart() {
  document.querySelectorAll("[data-qty]").forEach(
    (b) =>
      (b.onclick = () => {
        let cart = getCart();
        const item = cart.find((p) => p.id === Number(b.dataset.qty));
        item.quantity += Number(b.dataset.change);
        write(
          cartKey(),
          cart.filter((p) => p.quantity > 0),
        );
        render();
      }),
  );
  document.querySelectorAll("[data-remove]").forEach(
    (b) =>
      (b.onclick = () => {
        write(
          cartKey(),
          getCart().filter((p) => p.id !== Number(b.dataset.remove)),
        );
        render();
        toast("Item removed from your bag.");
      }),
  );
  if ($("#checkout")) $("#checkout").onclick = checkout;
}
function profile() {
  return `<main class="container profile"><div class="eyebrow">YOUR LITTLE CORNER</div><h1>Hello, ${escapeHTML(user.firstName)}.</h1><p>Keep your details feeling like you.</p><section class="profile-section"><h2>Personal details</h2><form id="profile-form"><div class="two-fields"><label>First name<input name="firstName" autocomplete="given-name" value="${escapeHTML(user.firstName)}" required maxlength="50"></label><label>Last name<input name="lastName" autocomplete="family-name" value="${escapeHTML(user.lastName)}" required maxlength="50"></label></div><label>Email address<input name="email" type="email" autocomplete="email" value="${escapeHTML(user.email)}" required></label><div class="error" id="profile-error" role="alert"></div><button>Save changes ?</button></form></section><section class="profile-section"><h2>Change password</h2><form id="password-form"><label>Current password<input name="current" type="password" autocomplete="current-password" required></label><label>New password<input name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><label>Confirm new password<input name="confirm" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><div class="error" id="password-error" role="alert"></div><button class="outline">Update password</button></form></section><button id="logout" class="outline">Log out ?</button></main>`;
}
function bindProfile() {
  $("#profile-form").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      email = f.get("email").trim().toLowerCase();
    if (!f.get("firstName").trim() || !f.get("lastName").trim()) {
      $("#profile-error").textContent =
        "Please enter your first and last name.";
      return;
    }
    if (users.some((u) => u.id !== user.id && u.email === email)) {
      $("#profile-error").textContent = "This email is already in use.";
      return;
    }
    Object.assign(user, {
      firstName: f.get("firstName").trim(),
      lastName: f.get("lastName").trim(),
      email,
    });
    write("mesh-users", users);
    render();
    toast("Your details have been saved.");
  };
  $("#password-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    if (
      (await hashPassword(f.get("current"), user.salt)) !== user.passwordHash
    ) {
      $("#password-error").textContent = "Current password is incorrect.";
      return;
    }
    if (f.get("password") !== f.get("confirm")) {
      $("#password-error").textContent = "New passwords do not match.";
      return;
    }
    user.salt = crypto.randomUUID();
    user.passwordHash = await hashPassword(f.get("password"), user.salt);
    write("mesh-users", users);
    e.target.reset();
    $("#password-error").textContent = "";
    toast("Password updated.");
  };
  $("#logout").onclick = () => {
    localStorage.removeItem("mesh-session");
    location.href = "login.html";
  };
}
function render() {
  if (["shop", "cart", "profile"].includes(page) && !user) return;
  $("#app").innerHTML =
    header() +
    {
      index: home,
      login: () => auth(false),
      signup: () => auth(true),
      shop,
      cart,
      profile,
    }[page]() +
    footer();
  if (page === "login" || page === "signup") bindAuth(page === "signup");
  if (page === "shop") bindShop();
  if (page === "cart") bindCart();
  if (page === "profile") bindProfile();
}
render();
