let CATALOG = [];
let CART = JSON.parse(localStorage.getItem("clawora_cart") || "[]");

const money = (n) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n);

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[m]);

async function ensureCatalog() {
  if (!CATALOG.length) {
    CATALOG = await fetch("products.json").then((r) => r.json());
  }
  return CATALOG;
}

function openMenu() {
  document.getElementById("menuDrawer")?.classList.add("open");
  document.body.classList.add("menu-open");
}

function closeMenu() {
  document.getElementById("menuDrawer")?.classList.remove("open");
  document.body.classList.remove("menu-open");
}

function openCart() {
  renderCart();
  document.getElementById("cartDrawer")?.classList.add("open");
  document.body.classList.add("menu-open");
}

function closeCart() {
  document.getElementById("cartDrawer")?.classList.remove("open");
  document.body.classList.remove("menu-open");
}

function productCard(p) {
  return `
    <article class="productCard">
      <a class="productImage" href="product.html?id=${p.id}">
        ${p.stock <= 0 ? '<span class="badge">SOLD OUT</span>' : ""}
        <img src="${p.image}" alt="${esc(p.title)}" loading="lazy">
      </a>

      <div class="productBody">
        <div class="vendor">${esc(p.vendor)}</div>
        <div class="productTitle">${esc(p.title)}</div>
        <div class="price">${money(p.price)}</div>

        <div class="cardActions">
          <a class="primary" href="product.html?id=${p.id}">
            View Product
          </a>

          <button
            ${p.stock <= 0 ? "disabled" : ""}
            onclick="addToCart(${p.id},1)"
          >
            ＋
          </button>
        </div>
      </div>
    </article>
  `;
}

async function loadFeatured() {
  await ensureCatalog();

  const box = document.getElementById("featuredProducts");
  if (!box) return;

  box.innerHTML = CATALOG
    .filter((x) => x.stock > 0)
    .slice(0, 8)
    .map(productCard)
    .join("");

  renderCart();
}

async function loadShop() {
  await ensureCatalog();

  const vendorFilter = document.getElementById("vendorFilter");
  const categoryFilter = document.getElementById("categoryFilter");

  if (vendorFilter) {
    vendorFilter.innerHTML =
      '<option value="">All brands</option>' +
      [...new Set(CATALOG.map((x) => x.vendor))]
        .sort()
        .map((v) => `<option>${esc(v)}</option>`)
        .join("");
  }

  const params = new URLSearchParams(location.search);

  if (categoryFilter && params.get("category")) {
    categoryFilter.value = params.get("category");
  }

  if (vendorFilter && params.get("vendor")) {
    vendorFilter.value = params.get("vendor");
  }

  renderShop();
  renderCart();
}

function renderShop() {
  const search = document.getElementById("search");
  const vendorFilter = document.getElementById("vendorFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const shopGrid = document.getElementById("shopGrid");
  const shopCount = document.getElementById("shopCount");

  if (!shopGrid) return;

  const q = (search?.value || "").toLowerCase();
  const v = vendorFilter?.value || "";
  const c = categoryFilter?.value || "";

  const list = CATALOG.filter((p) => {
    const matchesSearch =
      !q ||
      `${p.title} ${p.vendor} ${p.type}`
        .toLowerCase()
        .includes(q);

    const matchesVendor = !v || p.vendor === v;
    const matchesCategory = !c || p.category === c;

    return matchesSearch && matchesVendor && matchesCategory;
  });

  if (shopCount) {
    shopCount.textContent = `${list.length} products`;
  }

  shopGrid.innerHTML = list.map(productCard).join("");
}

async function loadBrands() {
  await ensureCatalog();

  const brandGrid = document.getElementById("brandGrid");
  if (!brandGrid) return;

  const brands = [...new Set(CATALOG.map((x) => x.vendor))].sort();

  brandGrid.innerHTML = brands
    .map((brand) => {
      const count = CATALOG.filter((x) => x.vendor === brand).length;

      return `
        <a
          class="categoryCard"
          href="shop.html?vendor=${encodeURIComponent(brand)}"
        >
          <div>
            <h3>${esc(brand)}</h3>
            <p>${count} products</p>
          </div>
        </a>
      `;
    })
    .join("");

  renderCart();
}

function addToCart(id, qty = 1) {
  const p = CATALOG.find((x) => x.id === id);

  if (!p || p.stock <= 0) return;

  const item = CART.find((x) => x.id === id);

  if (item) {
    item.qty += qty;
  } else {
    CART.push({
      id,
      qty,
    });
  }

  localStorage.setItem("clawora_cart", JSON.stringify(CART));
  renderCart();
}

function removeFromCart(id) {
  CART = CART.filter((x) => x.id !== id);

  localStorage.setItem("clawora_cart", JSON.stringify(CART));
  renderCart();
}

function renderCart() {
  const cartCount = document.getElementById("cartCount");
  const cartList = document.getElementById("cartList");
  const cartTotal = document.getElementById("cartTotal");

  if (cartCount) {
    cartCount.textContent = CART.reduce(
      (sum, item) => sum + item.qty,
      0
    );
  }

  if (!cartList) return;

  cartList.innerHTML = CART.length
    ? CART.map((item) => {
        const p = CATALOG.find((x) => x.id === item.id);

        if (!p) return "";

        return `
          <div class="cartItem">
            <img src="${p.image}" alt="${esc(p.title)}">

            <div>
              <b>${esc(p.title)}</b>
              <span>${money(p.price)} × ${item.qty}</span>
            </div>

            <button
              class="iconBtn"
              onclick="removeFromCart(${item.id})"
            >
              −
            </button>
          </div>
        `;
      }).join("")
    : '<p style="font-size:12px;color:var(--muted)">Your bag is empty.</p>';

  const total = CART.reduce((sum, item) => {
    const p = CATALOG.find((x) => x.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);

  if (cartTotal) {
    cartTotal.textContent = money(total);
  }
}

function orderText() {
  let text = `Order from ${STORE_CONFIG.storeName}\n\n`;
  let total = 0;

  CART.forEach((item) => {
    const p = CATALOG.find((x) => x.id === item.id);

    if (p) {
      text += `${item.qty} × ${p.title} — ${money(
        p.price * item.qty
      )}\n`;

      total += p.price * item.qty;
    }
  });

  text += `\nTotal: ${money(total)}`;
  text += `\n\nName:`;
  text += `\nPhone:`;
  text += `\nAddress:`;
  text += `\nCity:`;

  return text;
}

function checkout() {
  if (!CART.length) {
    alert("Your bag is empty.");
    return;
  }

  const number = STORE_CONFIG.whatsappNumber;

  location.href =
    `https://wa.me/${number}?text=` +
    encodeURIComponent(orderText());
}

function openSupportWhatsApp() {
  location.href =
    `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=` +
    encodeURIComponent(
      "Assalamualaikum, I need help with Clawora Beauty."
    );
}

function sendContact(e) {
  e.preventDefault();

  const name = document.getElementById("cName")?.value || "";
  const phone = document.getElementById("cPhone")?.value || "";
  const msg = document.getElementById("cMsg")?.value || "";

  const text =
    `Name: ${name}\n` +
    `Phone: ${phone}\n` +
    `Message: ${msg}`;

  location.href =
    `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=` +
    encodeURIComponent(text);
}

ensureCatalog().then(renderCart);
