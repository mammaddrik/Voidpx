// ---------- Theme Toggle ----------
const toggleBtn = document.getElementById("themeToggle");

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");

    toggleBtn.textContent = document.body.classList.contains("light")
      ? "LIGHT"
      : "DARK";
  });
}

// ---------- Side Menu ----------
const menu = document.querySelector(".menu");
const sideMenu = document.querySelector(".side__menu");
const closeBtn = document.querySelector(".close__btn");

if (menu && sideMenu) {
  menu.addEventListener("click", () => {
    sideMenu.classList.add("active");
  });
}

if (closeBtn && sideMenu) {
  closeBtn.addEventListener("click", () => {
    sideMenu.classList.remove("active");
  });
}

// ---------- Elements ----------
const gallery = document.querySelector(".content__box");

const pageNumber = document.getElementById("pageNumber");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const searchForm = document.getElementById("search");
const searchInput = document.querySelector("#search input");
const searchBtn = document.querySelector(".search__button");

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

  const galleryStyles = window.getComputedStyle(gallery);

  const galleryWidth = gallery.clientWidth;
  const galleryHeight = gallery.clientHeight;

  const paddingLeft = getNumberFromCSSValue(galleryStyles.paddingLeft);
  const paddingRight = getNumberFromCSSValue(galleryStyles.paddingRight);
  const paddingTop = getNumberFromCSSValue(galleryStyles.paddingTop);
  const paddingBottom = getNumberFromCSSValue(galleryStyles.paddingBottom);

  const columnGap = getNumberFromCSSValue(galleryStyles.columnGap);
  const rowGap = getNumberFromCSSValue(galleryStyles.rowGap);

  const usableWidth = galleryWidth - paddingLeft - paddingRight;
  const usableHeight = galleryHeight - paddingTop - paddingBottom;

  const minBoxSize = 230;

  if (usableWidth <= 0 || usableHeight <= 0) {
    return 1;
  }

  const columns = Math.max(
    1,
    Math.floor((usableWidth + columnGap) / (minBoxSize + columnGap))
  );

  const boxSize = (usableWidth - columnGap * (columns - 1)) / columns;

  const rows = Math.max(
    1,
    Math.floor((usableHeight + rowGap) / (boxSize + rowGap))
  );

  const count = columns * rows;

  return Math.max(1, count);
}

// ---------- Create Boxes ----------
function createBoxes() {
  if (!gallery) return;

  gallery.innerHTML = "";

  for (let i = 0; i < imagesPerPage; i++) {
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

  const boxes = gallery.querySelectorAll(".box");

  const startIndex = (currentPage - 1) * imagesPerPage;
  const endIndex = startIndex + imagesPerPage;

  const pageImages = currentFilteredImages.slice(startIndex, endIndex);

  boxes.forEach((box) => {
    box.innerHTML = "";
  });

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
  searchBtn.addEventListener("click", handleSearch);
}

if (searchForm) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSearch();
  });
}

if (searchInput) {
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

  createBoxes();
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

    createBoxes();
    showPage();
  }, 150);
});

// ---------- Initial Setup ----------
window.addEventListener("load", () => {
  refreshGallery();
});
