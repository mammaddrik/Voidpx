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
const pageNumber = document.getElementById("pageNumber");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const imageCount = document.getElementById("imageCount");
const emptyState = document.getElementById("emptyState");
const searchForm = document.getElementById("search");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const categoryToggle = document.getElementById("categoryToggle");
const categoryLabel = categoryToggle?.querySelector("span");
const favoritesBtn = document.getElementById("favoritesBtn");
const favoritesIcon = favoritesBtn?.querySelector("i");

const previewModal = document.getElementById("previewModal");
const previewImage = document.getElementById("previewImage");
const previewTitle = document.getElementById("previewTitle");
const previewCategory = document.getElementById("previewCategory");
const previewClose = document.getElementById("previewClose");
const previewOverlay = document.querySelector(".preview-modal__overlay");
const copyToast = document.getElementById("copyToast");
let isCopying = false;

// ---------- Helpers ----------
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

// ---------- Favorites ----------
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem("voidpx_favorites")) || [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem("voidpx_favorites", JSON.stringify(favorites));
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(id) {
  const favorites = getFavorites();
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
  } else {
    favorites.splice(index, 1);
  }
  saveFavorites(favorites);
  return favorites.includes(id);
}

// ---------- URL State ----------
function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const page = Number.parseInt(params.get("page"), 10);
  const query = params.get("q") || "";
  const category = params.get("category") || "All";
  return {
    page: Number.isNaN(page) || page < 1 ? 1 : page,
    query: query.trim(),
    category: category.trim() || "All",
  };
}

function saveStateToUrl({ page, query, category }) {
  const url = new URL(window.location.href);
  if (page <= 1) {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", String(page));
  }
  if (!query) {
    url.searchParams.delete("q");
  } else {
    url.searchParams.set("q", query);
  }
  if (!category || category === "All") {
    url.searchParams.delete("category");
  } else {
    url.searchParams.set("category", category);
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
let selectedCategory = initialUrlState.category;
let resizeTimer;
let favoritesMode = false;
let currentPreviewIndex = 0;
let lastFocusedElement = null;

// ---------- Category ----------
function getCategories() {
  const unique = new Set();
  images.forEach((img) => {
    if (img.category) {
      unique.add(img.category);
    }
  });
  return ["All", ...Array.from(unique).sort()];
}

function updateCategoryButton() {
  if (!categoryLabel) return;
  categoryLabel.textContent = selectedCategory.toUpperCase();
}

// ---------- Favorites Mode ----------
if (favoritesBtn) {
  favoritesBtn.addEventListener("click", () => {
    favoritesMode = !favoritesMode;
    favoritesBtn.classList.toggle("is-active", favoritesMode);
    if (favoritesIcon) {
      favoritesIcon.className = favoritesMode ? "bi bi-heart-fill" : "bi bi-heart";
    }
    filterImages(getCurrentQuery());
    currentPage = 1;
    refreshGallery();
  });
}

// ---------- Responsive ----------
function getNumberFromCSSValue(value) {
  return Number.parseFloat(value) || 0;
}

function calculateImagesPerPage() {
  if (!gallery) return 1;
  const galleryWidth = gallery.clientWidth;
  const galleryHeight = gallery.clientHeight;
  const isLandscape = window.matchMedia("(max-height: 480px) and (orientation: landscape)").matches;
  const minBoxSize = isLandscape ? 140 : 180;
  const styles = window.getComputedStyle(gallery);
  const paddingLeft = getNumberFromCSSValue(styles.paddingLeft);
  const paddingRight = getNumberFromCSSValue(styles.paddingRight);
  const paddingTop = getNumberFromCSSValue(styles.paddingTop);
  const paddingBottom = getNumberFromCSSValue(styles.paddingBottom);
  const columnGap = getNumberFromCSSValue(styles.columnGap);
  const rowGap = getNumberFromCSSValue(styles.rowGap);
  const usableWidth = galleryWidth - paddingLeft - paddingRight;
  const usableHeight = galleryHeight - paddingTop - paddingBottom;
  if (usableWidth <= 0 || usableHeight <= 0) {
    return 1;
  }
  const columns = Math.max(1, Math.floor((usableWidth + columnGap) / (minBoxSize + columnGap)));
  const rows = Math.max(1, Math.floor((usableHeight + rowGap) / (minBoxSize + rowGap)));
  return Math.max(1, columns * rows);
}

// ---------- Filter ----------
function filterImages(query) {
  const normalizedQuery = normalize(query);
  const favorites = getFavorites();
  currentFilteredImages = images.filter((image) => {
    if (favoritesMode && !favorites.includes(image.file)) {
      return false;
    }
    const matchesCategory =
      selectedCategory === "All" || normalize(image.category) === normalize(selectedCategory);
    if (!matchesCategory) {
      return false;
    }
    if (normalizedQuery === "") {
      return true;
    }
    const normalizedTitle = normalize(image.title);
    return normalizedTitle.includes(normalizedQuery);
  });
}

// ---------- Pagination ----------
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
    category: selectedCategory,
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
}

// ---------- Render ----------
function createFavoriteButton(imageId) {
  const liked = isFavorite(imageId);
  const favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.className = "fav-btn";
  favBtn.setAttribute("aria-label", "Add to favorites");
  if (liked) {
    favBtn.classList.add("is-active");
  }
  const icon = document.createElement("i");
  icon.className = `bi ${liked ? "bi-heart-fill" : "bi-heart"}`;
  icon.setAttribute("aria-hidden", "true");
  favBtn.appendChild(icon);
  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const active = toggleFavorite(imageId);
    favBtn.classList.toggle("is-active", active);
    icon.className = `bi ${active ? "bi-heart-fill" : "bi-heart"}`;
    if (favoritesMode && !active) {
      filterImages(getCurrentQuery());
      refreshGallery();
    }
  });
  return favBtn;
}

// ---------- Download Button ----------
function createDownloadButton(imageSrc, imageName) {
  const downloadBtn = document.createElement("button");
  downloadBtn.type = "button";
  downloadBtn.className = "fav-btn";
  downloadBtn.setAttribute("aria-label", "Download image");
  downloadBtn.style.margin = "0";

  const icon = document.createElement("i");
  icon.className = "bi bi-download";
  icon.setAttribute("aria-hidden", "true");
  downloadBtn.appendChild(icon);

  downloadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = imageName || "pixel-art.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  return downloadBtn;
}

// ---------- Render ----------
function createImageCard(image, index) {
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
  imageWrapper.addEventListener("click", () => {
    const absoluteIndex = (currentPage - 1) * imagesPerPage + index;
    openPreview(image, absoluteIndex);
  });
  const meta = document.createElement("div");
  meta.className = "gallery-card__meta";
  const metaText = document.createElement("div");
  metaText.className = "gallery-card__meta-text";
  const title = document.createElement("h3");
  title.className = "gallery-card__title";
  title.textContent = image.title || getImageName(image);
  const category = document.createElement("span");
  category.className = "gallery-card__category";
  category.textContent = image.category || "Uncategorized";
  metaText.append(title, category);
  const actionsWrapper = document.createElement("div");
  actionsWrapper.style.display = "flex";
  actionsWrapper.style.alignItems = "center";
  actionsWrapper.style.gap = "2px";
  const downloadButton = createDownloadButton(image.src, image.file);
  const favoriteButton = createFavoriteButton(image.file);
  favoriteButton.style.margin = "0";
  actionsWrapper.append(downloadButton, favoriteButton);
  meta.append(metaText, actionsWrapper);
  box.append(imageWrapper, meta);
  return box;
}

function showPage() {
  if (!gallery) return;
  clampCurrentPage();
  gallery.innerHTML = "";
  if (currentFilteredImages.length === 0) {
    updatePagination();
    return;
  }
  const startIndex = (currentPage - 1) * imagesPerPage;
  const pageImages = currentFilteredImages.slice(startIndex, startIndex + imagesPerPage);
  const fragment = document.createDocumentFragment();
  pageImages.forEach((image, index) => {
    fragment.appendChild(createImageCard(image, index));
  });
  gallery.appendChild(fragment);
  updatePagination();
}

// ---------- Preview Modal ----------
function openPreview(image, index) {
  if (!previewModal) return;
  lastFocusedElement = document.activeElement;
  currentPreviewIndex = index;
  previewImage.src = image.src;
  previewImage.alt = image.title || getImageName(image);
  if (previewTitle) previewTitle.textContent = image.title || getImageName(image);
  if (previewCategory) previewCategory.textContent = image.category || "Uncategorized";

  const metaSection = document.querySelector(".preview-modal__meta");
  if (metaSection) {
    const existingPalette = metaSection.querySelector(".modal-palette-container");
    if (existingPalette) {
      existingPalette.remove();
    }

    if (image.palette && Array.isArray(image.palette)) {
      const paletteDiv = document.createElement("div");
      paletteDiv.className = "modal-palette-container";

      image.palette.forEach((color) => {
        const chip = document.createElement("div");
        chip.className = "palette-chip";
        chip.style.backgroundColor = color;
        chip.setAttribute("title", color);
        chip.setAttribute("role", "button");
        chip.setAttribute("tabindex", "0");

        const copyHandler = () => {
          if (isCopying) return;
          isCopying = true;
          document.body.classList.add("is-copying-active");

          navigator.clipboard
            .writeText(color)
            .then(() => {
              if (copyToast) {
                copyToast.textContent = `Color ${color} copied!`;
                copyToast.classList.add("show");
                setTimeout(() => {
                  copyToast.classList.remove("show");
                  isCopying = false;
                  document.body.classList.remove("is-copying-active");
                }, 2500);
              }

              chip.classList.remove("is-copied");
              void chip.offsetWidth;
              chip.classList.add("is-copied");
              setTimeout(() => {
                chip.classList.remove("is-copied");
              }, 400);
            })
            .catch(() => {
              if (copyToast) {
                copyToast.textContent = `Failed to copy ${color}`;
                copyToast.classList.add("show");
                setTimeout(() => {
                  copyToast.classList.remove("show");
                  isCopying = false;
                  document.body.classList.remove("is-copying-active");
                }, 2500);
              }
            });
        };

        chip.addEventListener("click", copyHandler);
        chip.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            copyHandler();
          }
        });

        paletteDiv.appendChild(chip);
      });

      metaSection.appendChild(paletteDiv);
    }
  }

  previewModal.classList.add("is-open");
  previewModal.removeAttribute("inert");
  previewModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => {
    previewClose?.focus();
  });
}

function closePreview() {
  if (!previewModal) return;
  if (previewModal.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  previewModal.classList.remove("is-open");
  previewModal.setAttribute("aria-hidden", "true");
  previewModal.setAttribute("inert", "");
  document.body.style.overflow = "";
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    requestAnimationFrame(() => {
      lastFocusedElement.focus();
    });
  }
}

if (previewClose) {
  previewClose.addEventListener("click", closePreview);
}
if (previewOverlay) {
  previewOverlay.addEventListener("click", closePreview);
}

function navigatePreview(direction) {
  const total = currentFilteredImages.length;
  if (total === 0) return;
  currentPreviewIndex = (currentPreviewIndex + direction + total) % total;
  const nextImage = currentFilteredImages[currentPreviewIndex];
  const targetPage = Math.floor(currentPreviewIndex / imagesPerPage) + 1;
  if (targetPage !== currentPage) {
    currentPage = targetPage;
    syncUrlState();
    showPage();
  }
  openPreview(nextImage, currentPreviewIndex);
}

document.getElementById("prevPreview")?.addEventListener("click", (e) => {
  e.stopPropagation();
  navigatePreview(-1);
});

document.getElementById("nextPreview")?.addEventListener("click", (e) => {
  e.stopPropagation();
  navigatePreview(1);
});

// ---------- Pagination UI ----------
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

// ---------- Display ----------
function refreshGallery() {
  imagesPerPage = calculateImagesPerPage();
  showPage();
}

// ---------- Events ----------
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
    if (currentPage >= getTotalPages()) return;
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
  searchForm.addEventListener("submit", (e) => e.preventDefault());
}

if (searchBtn) {
  searchBtn.addEventListener("click", handleSearch);
}

if (searchInput) {
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  });
  searchInput.addEventListener("input", () => {
    const normalizedQuery = normalize(searchInput.value.trim());
    if (normalizedQuery === "" && lastAppliedQuery !== "") {
      filterImages("");
      currentPage = 1;
      lastAppliedQuery = "";
      syncUrlState();
      refreshGallery();
    }
  });
}

// ---------- Category ----------
if (categoryToggle) {
  categoryToggle.addEventListener("click", () => {
    const categories = getCategories();
    const currentIndex = categories.indexOf(selectedCategory);
    const nextIndex = (currentIndex + 1) % categories.length;
    selectedCategory = categories[nextIndex];
    updateCategoryButton();
    filterImages(getCurrentQuery());
    currentPage = 1;
    syncUrlState();
    refreshGallery();
  });
}

// ---------- Load Images ----------
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
      palette: item.palette || null,
    }));
    const categories = getCategories();
    if (!categories.includes(selectedCategory)) {
      selectedCategory = "All";
    }
    updateCategoryButton();
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

// ---------- Resize ----------
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    requestAnimationFrame(() => {
      const newImagesPerPage = calculateImagesPerPage();
      if (newImagesPerPage === imagesPerPage) {
        return;
      }
      const firstVisibleIndex = (currentPage - 1) * imagesPerPage;
      imagesPerPage = newImagesPerPage;
      currentPage = Math.floor(firstVisibleIndex / imagesPerPage) + 1;
      syncUrlState();
      showPage();
    });
  }, 150);
});
