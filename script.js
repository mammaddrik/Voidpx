const navbar = document.querySelector('.navbar');
const smallContainer = document.querySelector('.navbar-stars-small');
const crossContainer = document.querySelector('.navbar-stars-cross');

const navbarWidth = navbar.offsetWidth;
const navbarHeight = navbar.offsetHeight;

const margin = 4;

const numSmallStars = 200;
const numCrossStars = 50;

function randomPosition(width, height, margin) {
  const x = margin + Math.random() * (width - 2 * margin);
  const y = margin + Math.random() * (height - 2 * margin);
  return { x, y };
}

for (let i = 0; i < numSmallStars; i++) {
  const star = document.createElement('div');
  star.classList.add('pixel-star');
  const pos = randomPosition(navbarWidth, navbarHeight, margin);
  star.style.left = `${pos.x}px`;
  star.style.top = `${pos.y}px`;
  smallContainer.appendChild(star);
}

for (let i = 0; i < numCrossStars; i++) {
  const star = document.createElement('div');
  star.classList.add('pixel-cross');
  const pos = randomPosition(navbarWidth, navbarHeight, margin);
  star.style.left = `${pos.x}px`;
  star.style.top = `${pos.y}px`;
  crossContainer.appendChild(star);
}