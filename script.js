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

// ---------- Gallery State ----------
let images = [];
let currentFilteredImages = [];
let currentPage = 1;
let imagesPerPage = 1;

// ---------- Responsive Images Per Page ----------

function getNumberFromCSSValue(value) {
  return Number.parseFloat(value) || 0;
}

function calculateImagesPerPage() {
  if (!gallery) return 1;

  const galleryWidth = gallery.clientWidth;
  const galleryHeight = gallery.clientHeight;

  const isLandscape = window.innerHeight < 480;

  let minBoxSize;
  if (isLandscape) {
    minBoxSize = 140;
  } else if (window.innerWidth <= 400) {
    minBoxSize = 250;
  } else {
    minBoxSize = 180;
  }

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

  const columns = Math.max(1, Math.floor((usableWidth + columnGap) / (minBoxSize + columnGap)));
  const rows = Math.max(1, Math.floor((usableHeight + rowGap) / (minBoxSize + rowGap)));

  return Math.max(1, columns * rows);
}


// ---------- Create Boxes ----------
function createBoxes(count) {
  if (!gallery) return;

  gallery.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const box = document.createElement("div");
    box.className = "box";
    gallery.appendChild(box);
  }
}


// ---------- Pagination Helpers ----------
function getTotalPages() {
  return Math.max(1, Math.ceil(currentFilteredImages.length / imagesPerPage));
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

// ---------- Show Page ----------
function showPage() {
  if (!gallery) return;

  clampCurrentPage();

  if (currentFilteredImages.length === 0) {
    gallery.innerHTML = "";
    updatePagination();
    return;
  }

  const startIndex = (currentPage - 1) * imagesPerPage;
  const endIndex = startIndex + imagesPerPage;

  const pageImages = currentFilteredImages.slice(startIndex, endIndex);

  createBoxes(pageImages.length);

  const boxes = gallery.querySelectorAll(".box");

  pageImages.forEach((src, index) => {
    const box = boxes[index];
    if (!box) return;

    const img = document.createElement("img");
    img.src = src;
    img.alt = getImageName(src);
    img.loading = "lazy";
    img.decoding = "async";

    box.appendChild(img);
  });

  updatePagination();
}


// ---------- Update Pagination UI ----------
function updatePagination() {
  const totalPages = getTotalPages();

  if (pageNumber) {
    pageNumber.textContent = `${currentPage} / ${totalPages}`;
  }

  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
  }

  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
  }

  if (imageCount) {
    imageCount.textContent = `(${currentFilteredImages.length} images)`;
  }

  if (emptyState) {
  emptyState.classList.toggle("is-hidden", currentFilteredImages.length !== 0);
  }

  const pagination = document.querySelector(".pagination");

  if (pagination) {
    if (totalPages <= 1) {
      pagination.classList.add("is-hidden");
    } else {
      pagination.classList.remove("is-hidden");
    }
  }
}


// ---------- Pagination Events ----------
if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentPage <= 1) return;

    currentPage--;
    showPage();
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    const totalPages = getTotalPages();

    if (currentPage >= totalPages) return;

    currentPage++;
    showPage();
  });
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
    images = data.map((name) => `assets/image/${name}`);
    currentFilteredImages = [...images];

    refreshGallery();
  })
  .catch((err) => {
    console.error("Failed to load images.json:", err);
  });

// ---------- Search Helpers ----------
function normalize(text) {
  return text
    .toLowerCase()
    .replaceAll("_", "")
    .replaceAll("-", "")
    .replaceAll(" ", "");
}

function getImageName(src) {
  return src.split("/").pop() || "";
}

function filterImages(query) {
  const normalizedQuery = normalize(query);

  if (normalizedQuery === "") {
    currentFilteredImages = [...images];
    return;
  }

  currentFilteredImages = images.filter((img) => {
    const fileName = getImageName(img);
    const normalizedFileName = normalize(fileName);

    return normalizedFileName.includes(normalizedQuery);
  });
}

function handleSearch() {
  if (!searchInput) return;

  const query = searchInput.value.trim();

  filterImages(query);

  currentPage = 1;
  refreshGallery();
}

// ---------- Search Events ----------
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
    if (searchInput.value.trim() === "") {
      currentFilteredImages = [...images];
      currentPage = 1;
      refreshGallery();
    }
  });
}

// ---------- Refresh Gallery ----------
function refreshGallery() {
  const newImagesPerPage = calculateImagesPerPage();

  imagesPerPage = newImagesPerPage;
  showPage();
}


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

    showPage();
  }, 150);
});


// ---------- Initial Setup ----------
window.addEventListener("load", () => {
  refreshGallery();
});
