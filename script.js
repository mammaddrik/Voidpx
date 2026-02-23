const toggleBtn = document.getElementById("themeToggle");

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");

  if (document.body.classList.contains("light")) {
    toggleBtn.textContent = "LIGHT";
  } else {
    toggleBtn.textContent = "DARK";
  }
});

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageNumber = document.getElementById("pageNumber");

let currentPage = 1;

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    pageNumber.textContent = currentPage;
  }
});

nextBtn.addEventListener("click", () => {
  currentPage++;
  pageNumber.textContent = currentPage;
});

const squares = document.querySelectorAll('.square');

const images = [
  'assets/image/Alien.png',
  'assets/image/Arcade.png',
  'assets/image/Astronaut.png',
  'assets/image/Band_Aids.png',
  'assets/image/Blue_Ring.png',
  'assets/image/Cactus.png',
  'assets/image/Cat.png',
  'assets/image/Cats_Paw.png',
  'assets/image/Cow.png',
  'assets/image/chair.png',
  'assets/image/Cheese.png',
  'assets/image/Coin.png',
];

squares.forEach((square, index) => {
  const img = document.createElement('img');  // ساخت تگ img
  img.src = images[index];
  square.appendChild(img);                     // اضافه کردن به مربع
});
