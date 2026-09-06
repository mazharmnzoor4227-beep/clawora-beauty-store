let CURRENT = null;
let CURRENT_QTY = 1;

(async function () {
  await ensureCatalog();

  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id"));

  CURRENT =
    CATALOG.find((x) => x.id === id) ||
    CATALOG[0];

  if (!CURRENT) return;

  document.title =
    CURRENT.title + " — Clawora Beauty";

  const vendor = document.getElementById("pVendor");
  const title = document.getElementById("pTitle");
  const price = document.getElementById("pPrice");
  const desc = document.getElementById("pDesc");
  const mainImage = document.getElementById("mainProductImage");
  const thumbs = document.getElementById("thumbs");
  const addBagBtn = document.getElementById("addBagBtn");
  const relatedGrid = document.getElementById("relatedGrid");

  if (vendor) vendor.textContent = CURRENT.vendor || "";
  if (title) title.textContent = CURRENT.title || "";
  if (price) price.textContent = money(CURRENT.price || 0);
  if (desc) desc.textContent = CURRENT.description || "";

  const imgs =
    CURRENT.images && CURRENT.images.length
      ? CURRENT.images
      : [CURRENT.image];

  const cleanImages = imgs.filter(Boolean);

  if (mainImage && cleanImages.length) {
    mainImage.src = cleanImages[0];
    mainImage.alt = CURRENT.title || "Product image";
  }

  if (thumbs) {
    thumbs.innerHTML = cleanImages
      .map(
        (url, i) => `
          <button
            class="thumb ${i === 0 ? "active" : ""}"
            onclick="setMainImage('${url.replace(/'/g, "\\'")}', this)"
          >
            <img src="${url}" alt="Product image ${i + 1}">
          </button>
        `
      )
      .join("");
  }

  if (CURRENT.stock <= 0 && addBagBtn) {
    addBagBtn.disabled = true;
    addBagBtn.textContent = "Sold out";
  }

  if (relatedGrid) {
    const related = CATALOG.filter(
      (x) =>
        x.id !== CURRENT.id &&
        x.category === CURRENT.category
    ).slice(0, 4);

    relatedGrid.innerHTML =
      related.map(productCard).join("");
  }

  renderCart();
})();

function setMainImage(url, el) {
  const mainImage = document.getElementById("mainProductImage");

  if (mainImage) {
    mainImage.src = url;
  }

  document
    .querySelectorAll(".thumb")
    .forEach((x) => x.classList.remove("active"));

  if (el) {
    el.classList.add("active");
  }
}

function changeQty(change) {
  CURRENT_QTY = Math.max(
    1,
    CURRENT_QTY + change
  );

  const qty = document.getElementById("qty");

  if (qty) {
    qty.textContent = CURRENT_QTY;
  }
}

function addCurrentProduct() {
  if (!CURRENT) return;

  addToCart(
    CURRENT.id,
    CURRENT_QTY
  );

  openCart();
}

function orderCurrentOnWhatsApp() {
  if (!CURRENT) return;

  const total =
    CURRENT.price * CURRENT_QTY;

  const msg =
    `Assalamualaikum, I want to order:\n\n` +
    `${CURRENT.title}\n` +
    `Quantity: ${CURRENT_QTY}\n` +
    `Price: ${money(total)}\n\n` +
    `Name:\n` +
    `Phone:\n` +
    `Address:\n` +
    `City:`;

  location.href =
    `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=` +
    encodeURIComponent(msg);
}
