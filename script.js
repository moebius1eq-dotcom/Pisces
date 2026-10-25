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

document.querySelectorAll(".planet-card").forEach(card => {
    card.addEventListener("click", () => {
        document.getElementById('modal-title').textContent = card.querySelector("h2").textContent;
        document.getElementById('modal-planet-label').textContent = card.querySelector("p").textContent;
        document.getElementById('modal-img').src = card.querySelector("img").src;
        document.getElementById('modal').classList.remove("hidden");
    });
});

document.getElementById('close-modal').addEventListener("click", () => {
    document.getElementById('modal').classList.add("hidden");
});
