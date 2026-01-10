(() => {
  "use strict";

  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  // ---------------------------
  // Helpers
  // ---------------------------
  const getLang = () => {
    const html = document.documentElement;

    // Prefer explicit markers on <html>
    const dl = (html.getAttribute("data-lang") || "").trim().toLowerCase();
    if (dl === "en" || dl === "ms" || dl === "zh") return dl;

    const la = (html.getAttribute("lang") || "").trim().toLowerCase();
    if (la.startsWith("zh")) return "zh";
    if (la.startsWith("en")) return "en";
    if (la.startsWith("ms")) return "ms";

    // Fallback based on path (/en/, /ms/)
    const p = (location.pathname || "").toLowerCase();
    if (p.includes("/en/")) return "en";
    if (p.includes("/ms/")) return "ms";
    return "zh";
  };

  const LANG = getLang();

  // When pages live under /en/ or /ms/, assets in root need "../" prefix.
  const ASSET_PREFIX = (() => {
    const p = (location.pathname || "").toLowerCase();
    // Works for /en/index.html, /en/, /ms/..., etc.
    if (p.includes("/en/") || p.endsWith("/en") || p.endsWith("/en/")) return "../";
    if (p.includes("/ms/") || p.endsWith("/ms") || p.endsWith("/ms/")) return "../";
    return "";
  })();

  const t = (key) => {
    const dict = {
      zh: {
        drawerTitle: "作品集",
        empty: "该分类暂时没有作品。",
        all: "全部",
        cats: ["黑灰", "细线", "传统", "小图", "字母/文字", "客制"],
        artistA: "A 纹身师",
        artistB: "B 纹身师",
        subtitleA: "选择分类查看 A 纹身师作品。",
        subtitleB: "选择分类查看 B 纹身师作品。",
        workAlt: (name, idx) => `${name} 作品 ${idx}`,
      },
      en: {
        drawerTitle: "Portfolio",
        empty: "No works available in this category yet.",
        all: "All",
        cats: ["Black & Grey", "Fine Line", "Traditional", "Small Pieces", "Lettering", "Custom"],
        artistA: "Artist A",
        artistB: "Artist B",
        subtitleA: "Choose a category to view Artist A’s work.",
        subtitleB: "Choose a category to view Artist B’s work.",
        workAlt: (name, idx) => `${name} — Work ${idx}`,
      },
      ms: {
        drawerTitle: "Portfolio",
        empty: "Belum ada hasil untuk kategori ini.",
        all: "Semua",
        cats: ["Hitam & Kelabu", "Garisan Halus", "Tradisional", "Reka Bentuk Kecil", "Huruf / Teks", "Tempahan Khas"],
        artistA: "Artis A",
        artistB: "Artis B",
        subtitleA: "Pilih kategori untuk melihat karya Artis A.",
        subtitleB: "Pilih kategori untuk melihat karya Artis B.",
        workAlt: (name, idx) => `${name} — Karya ${idx}`,
      },
    };
    return (dict[LANG] || dict.zh)[key];
  };

  // ---------------------------
  // Footer year
  // ---------------------------
  const y = qs("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());

  // ---------------------------
  // Mobile menu toggle
  // ---------------------------
  const menuBtn = qs("[data-menu-button]");
  const mobileMenu = qs("[data-mobile-menu]");

  if (menuBtn && mobileMenu) {
    const setMenuOpen = (open) => {
      menuBtn.setAttribute("aria-expanded", String(open));
      mobileMenu.hidden = !open;
      document.documentElement.style.overflow = open ? "hidden" : "";
    };

    menuBtn.addEventListener("click", () => {
      const open = menuBtn.getAttribute("aria-expanded") === "true";
      setMenuOpen(!open);
    });

    mobileMenu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) setMenuOpen(false);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") setMenuOpen(false);
    });
  }

  // ---------------------------
  // Tattoo drawer portfolio
  // ---------------------------
  const overlay = qs("[data-drawer-overlay]");
  const drawer = qs("[data-drawer]");
  const closeBtn = qs("[data-drawer-close]");
  const titleEl = qs("[data-drawer-title]");
  const subEl = qs("[data-drawer-sub]");
  const chipsWrap = qs("[data-filter-bar]");
  const worksWrap = qs("[data-works]");

  // If drawer markup isn't on this page, safely exit
  if (!overlay || !drawer || !chipsWrap || !worksWrap) return;

  // Ensure starts closed
  overlay.hidden = true;
  document.documentElement.classList.remove("is-locked");

  const CATS = t("cats");

  const portfolio = {
    A: {
      name: t("artistA"),
      subtitle: t("subtitleA"),
      works: [
        { src: `${ASSET_PREFIX}images/TA01.png`, cat: CATS[0] },
        { src: `${ASSET_PREFIX}images/TA02.png`, cat: CATS[1] },
        { src: `${ASSET_PREFIX}images/TA03.png`, cat: CATS[2] },
        { src: `${ASSET_PREFIX}images/TA04.png`, cat: CATS[3] },
        { src: `${ASSET_PREFIX}images/TA05.png`, cat: CATS[4] },
        { src: `${ASSET_PREFIX}images/TA06.png`, cat: CATS[5] },
      ],
    },
    B: {
      name: t("artistB"),
      subtitle: t("subtitleB"),
      works: [
        { src: `${ASSET_PREFIX}images/TB01.png`, cat: CATS[0] },
        { src: `${ASSET_PREFIX}images/TB02.png`, cat: CATS[1] },
        { src: `${ASSET_PREFIX}images/TB03.png`, cat: CATS[2] },
        { src: `${ASSET_PREFIX}images/TB04.png`, cat: CATS[3] },
        { src: `${ASSET_PREFIX}images/TB05.png`, cat: CATS[4] },
        { src: `${ASSET_PREFIX}images/TB06.png`, cat: CATS[5] },
      ],
    },
  };

  let currentArtist = "A";
  let currentCat = t("all");

  const renderChips = () => {
    const cats = [t("all"), ...CATS];
    chipsWrap.innerHTML = "";
    cats.forEach((cat) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.setAttribute("aria-pressed", cat === currentCat ? "true" : "false");
      b.textContent = cat;
      b.addEventListener("click", () => {
        currentCat = cat;
        // update aria-pressed
        Array.from(chipsWrap.children).forEach((n) =>
          n.setAttribute("aria-pressed", n.textContent === currentCat ? "true" : "false")
        );
        renderWorks();
      });
      chipsWrap.appendChild(b);
    });
  };

  const renderWorks = () => {
    const meta = portfolio[currentArtist];
    const items = currentCat === t("all") ? meta.works : meta.works.filter((w) => w.cat === currentCat);

    worksWrap.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = t("empty");
      worksWrap.appendChild(empty);
      return;
    }

    items.forEach((w, i) => {
      const fig = document.createElement("figure");
      fig.className = "work-item";

      const img = document.createElement("img");
      img.src = w.src;
      img.alt = t("workAlt")(meta.name, i + 1);
      img.loading = "lazy";

      const cap = document.createElement("div");
      cap.className = "work-cap";
      cap.innerHTML = `<p class="cap-meta">${w.cat}</p>`;

      fig.appendChild(img);
      fig.appendChild(cap);
      worksWrap.appendChild(fig);
    });
  };

  const openDrawer = (artistKey) => {
    currentArtist = artistKey in portfolio ? artistKey : "A";
    currentCat = t("all");

    if (titleEl) titleEl.textContent = t("drawerTitle");
    if (subEl) subEl.textContent = portfolio[currentArtist].subtitle || "";

    renderChips();
    renderWorks();

    overlay.hidden = false;
    document.documentElement.classList.add("is-locked");
    if (closeBtn) closeBtn.focus();
  };

  const closeDrawer = () => {
    overlay.hidden = true;
    document.documentElement.classList.remove("is-locked");
  };

  // Bind open buttons
  qsa("[data-open-drawer]").forEach((b) => {
    b.addEventListener("click", () => {
      openDrawer(b.getAttribute("data-open-drawer") || "A");
    });
  });

  // Close interactions
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeDrawer();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay && overlay.hidden === false) closeDrawer();
  });
})();