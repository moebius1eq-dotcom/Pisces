const hamburger = document.querySelector(".hamburger");
const offScreenMenu = document.querySelector(".off-screen-menu");
const track = document.querySelector(".planet-track");
const cards = Array.from(track.children);

cards.forEach(card => {
    const clone = card.cloneNode(true);
    track.appendChild(clone);
});

hamburger.addEventListener("click", () => {
    const isExpanded = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", "!isExpanded");
    hamburger.classList.toggle("active");
    offScreenMenu.classList.toggle("active");
});
