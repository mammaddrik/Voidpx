// ---------- Theme Toggle ----------
const toggleBtn = document.getElementById("themeToggle");
const toggleIcon = toggleBtn?.querySelector("i");
const toggleLabel = toggleBtn?.querySelector("span");

function updateThemeButton(isLight) {
  if (toggleLabel) {
    toggleLabel.textContent = isLight ? "LIGHT" : "DARK";
  }

  if (toggleIcon) {
    toggleIcon.className = isLight
      ? "bi bi-sun-fill"
      : "bi bi-moon-stars-fill";
  }
}

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light", isLight);
  updateThemeButton(isLight);
}

function saveTheme(theme) {
  localStorage.setItem("voidpx-theme", theme);
}

function loadTheme() {
  const savedTheme = localStorage.getItem("voidpx-theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    applyTheme(savedTheme);
  } else {
    applyTheme("dark");
  }

  document.body.classList.add("theme-ready");
}

loadTheme();

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isLight = !document.body.classList.contains("light");
    const newTheme = isLight ? "light" : "dark";

    applyTheme(newTheme);
    saveTheme(newTheme);
  });
}

// ---------- Elements ----------
const gallery = document.querySelector(".content__box");
const pagination = document.querySelector(".pagination");

const pageNumber = document.getElementById("pageNumber");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const imageCount = document.getElementById("imageCount");

const emptyState = document.getElementById("emptyState");
const searchForm = document.getElementById("search");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// ---------- Search Helpers ----------
function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .replaceAll("_", "")
    .replaceAll("-", "")
    .replaceAll(" ", "");
}

function getImageName(image) {
  if (typeof image === "string") {
    return image.split("/").pop() || "";
  }

  return image?.file || "";
}

// ---------- URL State ----------
function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const page = Number.parseInt(params.get("page"), 10);
  const query = params.get("q") || "";

  return {
    page: Number.isNaN(page) || page < 1 ? 1 : page,
    query: query.trim(),
  };
}

function saveStateToUrl({ page, query }) {
  const url = new URL(window.location.href);

  if (page <= 1) {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", String(page));
  }

  if (!query || query.trim() === "") {
    url.searchParams.delete("q");
  } else {
    url.searchParams.set("q", query.trim());
  }

  window.history.replaceState({}, "", url);
}

const initialUrlState = loadStateFromUrl();

// ---------- Gallery State ----------
let images = [];
let currentFilteredImages = [];
let currentPage = initialUrlState.page;
let imagesPerPage = 1;
let lastAppliedQuery = normalize(initialUrlState.query);

// ---------- Responsive Images Per Page ----------
function getNumberFromCSSValue(value) {
  return Number.parseFloat(value) || 0;
}

function calculateImagesPerPage() {
  if (!gallery) return 1;

  const galleryWidth = gallery.clientWidth;
  const galleryHeight = gallery.clientHeight;

  const isLandscape =
    window.matchMedia("(max-height: 480px) and (orientation: landscape)").matches;

  const minBoxSize = isLandscape ? 140 : 180;

  const galleryStyles = window.getComputedStyle(gallery);
  const paddingLeft = getNumberFromCSSValue(galleryStyles.paddingLeft);
  const paddingRight = getNumberFromCSSValue(galleryStyles.paddingRight);
  const paddingTop = getNumberFromCSSValue(galleryStyles.paddingTop);
  const paddingBottom = getNumberFromCSSValue(galleryStyles.paddingBottom);
  const columnGap = getNumberFromCSSValue(galleryStyles.columnGap);
  const rowGap = getNumberFromCSSValue(galleryStyles.rowGap);

  const usableWidth = galleryWidth - paddingLeft - paddingRight;
  const usableHeight = galleryHeight - paddingTop - paddingBottom;

  if (usableWidth <= 0 || usableHeight <= 0) return 1;

  const columns = Math.max(
    1,
    Math.floor((usableWidth + columnGap) / (minBoxSize + columnGap))
  );

  const rows = Math.max(
    1,
    Math.floor((usableHeight + rowGap) / (minBoxSize + rowGap))
  );

  return Math.max(1, columns * rows);
}

// ---------- Filter Images ----------
function filterImages(query) {
  const normalizedQuery = normalize(query);

  if (normalizedQuery === "") {
    currentFilteredImages = [...images];
    return;
  }

  currentFilteredImages = images.filter((image) => {
    const normalizedTitle = normalize(image.title);
    return normalizedTitle.includes(normalizedQuery);
  });
}

// ---------- Pagination Helpers ----------
function getTotalPages() {
  return Math.max(1, Math.ceil(currentFilteredImages.length / imagesPerPage));
}

function getCurrentQuery() {
  return searchInput?.value.trim() || "";
}

function syncUrlState() {
  saveStateToUrl({
    page: currentPage,
    query: getCurrentQuery(),
  });
}

function clampCurrentPage() {
  const totalPages = getTotalPages();

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  if (currentPage < 1) {
    currentPage = 1;
  }

  syncUrlState();
}

// ---------- Show Page ----------
function showPage() {
  if (!gallery) return;

  clampCurrentPage();
  gallery.innerHTML = "";

  if (currentFilteredImages.length === 0) {
    updatePagination();
    return;
  }

  const startIndex = (currentPage - 1) * imagesPerPage;
  const pageImages = currentFilteredImages.slice(
    startIndex,
    startIndex + imagesPerPage
  );

  const fragment = document.createDocumentFragment();

  pageImages.forEach((image, index) => {
    const box = document.createElement("div");
    box.className = "box";
    box.style.animationDelay = `${index * 70}ms`;

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "gallery-card__image";

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.title || getImageName(image);
    img.loading = "lazy";
    img.decoding = "async";

    imageWrapper.appendChild(img);

    const meta = document.createElement("div");
    meta.className = "gallery-card__meta";

    const title = document.createElement("h3");
    title.className = "gallery-card__title";
    title.textContent = image.title || getImageName(image);

    const category = document.createElement("span");
    category.className = "gallery-card__category";
    category.textContent = image.category || "Uncategorized";

    meta.append(title, category);
    box.append(imageWrapper, meta);
    fragment.appendChild(box);
  });

  gallery.appendChild(fragment);
  updatePagination();
}

// ---------- Update Pagination UI ----------
function updatePagination() {
  const isEmpty = currentFilteredImages.length === 0;
  const totalPages = isEmpty ? 1 : getTotalPages();

  if (pageNumber) {
    pageNumber.textContent = `${currentPage} / ${totalPages}`;
  }

  if (prevBtn) {
    prevBtn.disabled = isEmpty || currentPage <= 1;
  }

  if (nextBtn) {
    nextBtn.disabled = isEmpty || currentPage >= totalPages;
  }

  if (imageCount) {
    const count = currentFilteredImages.length;
    imageCount.textContent = `${count} image${count === 1 ? "" : "s"}`;
  }

  if (emptyState) {
    emptyState.classList.toggle("is-hidden", !isEmpty);
  }

  const pagination = document.querySelector(".pagination");
  if (pagination) {
    pagination.classList.toggle("is-hidden", isEmpty || totalPages <= 1);
  }
}

// ---------- Pagination Events ----------
if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentPage <= 1) return;

    currentPage--;
    syncUrlState();
    showPage();
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    const totalPages = getTotalPages();

    if (currentPage >= totalPages) return;

    currentPage++;
    syncUrlState();
    showPage();
  });
}

// ---------- Search ----------
function handleSearch() {
  if (!searchInput) return;

  const query = searchInput.value.trim();
  const normalizedQuery = normalize(query);

  if (normalizedQuery === lastAppliedQuery) {
    return;
  }

  filterImages(query);
  currentPage = 1;
  lastAppliedQuery = normalizedQuery;
  syncUrlState();
  refreshGallery();
}

if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}

if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    handleSearch();
  });
}

if (searchInput) {
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  });

  searchInput.addEventListener("input", () => {
    const normalizedQuery = normalize(searchInput.value.trim());

    if (normalizedQuery !== "") return;
    if (lastAppliedQuery === "") return;

    currentFilteredImages = [...images];
    currentPage = 1;
    lastAppliedQuery = "";
    syncUrlState();
    refreshGallery();
  });
}

// ---------- Refresh Gallery ----------
function refreshGallery() {
  const newImagesPerPage = calculateImagesPerPage();
  imagesPerPage = newImagesPerPage;
  showPage();
}

// ---------- Load Images From JSON ----------
fetch("./assets/image/images.json")
  .then((res) => {
    if (!res.ok) {
      throw new Error("Could not load images.json");
    }

    return res.json();
  })
  .then((data) => {
    images = data.map((item) => ({
      file: item.file,
      src: `assets/image/${item.file}`,
      title: item.title,
      category: item.category,
    }));

    if (searchInput) {
      searchInput.value = initialUrlState.query;
    }

    filterImages(initialUrlState.query);
    lastAppliedQuery = normalize(initialUrlState.query);

    refreshGallery();
  })
  .catch((err) => {
    console.error("Failed to load images.json:", err);
  });

// ---------- Resize Handling ----------
let resizeTimer;

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);

  resizeTimer = setTimeout(() => {
    const newImagesPerPage = calculateImagesPerPage();

    if (newImagesPerPage === imagesPerPage) return;

    const firstVisibleImageIndex = (currentPage - 1) * imagesPerPage;

    imagesPerPage = newImagesPerPage;
    currentPage = Math.floor(firstVisibleImageIndex / imagesPerPage) + 1;
    syncUrlState();

    showPage();
  }, 150);
});
