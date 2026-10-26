const hamburger = document.querySelector(".hamburger");
const offScreenMenu = document.querySelector(".off-screen-menu");

hamburger.addEventListener("click", () => {
    const isExpanded = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", !isExpanded);
    hamburger.classList.toggle("active");
    offScreenMenu.classList.toggle("active");
});

const track = document.querySelector(".planet-track");

if (track) {
    const cards = Array.from(track.children);

    cards.forEach(card => {
        const clone = card.cloneNode(true);
        track.appendChild(clone);
    });

    document.querySelectorAll(".planet-card").forEach(card => {
        card.addEventListener("click", () => {
            document.getElementById('modal-title').textContent = card.querySelector("h2").textContent;
            document.getElementById('modal-planet-label').textContent = card.querySelector("p").textContent;
            document.getElementById('modal-img').src = card.querySelector("img").src;
            document.getElementById('modal').classList.remove("hidden");

            const stats = [
                ["Mass", card.dataset.mass],
                ["Radius", card.dataset.radius],
                ["Distance from Sun", card.dataset.distance],
                ["Number of Moons", card.dataset.moons],
                ["Average Temperature", card.dataset.temp],
                ["Composition", card.dataset.composition],
                ["Axial Tilt", card.dataset.tilt],
                ["Orbital Period", card.dataset.orbitalPeriod],
            ];

            const descEL = document.getElementById('modal-description');
            descEL.innerHTML = `
                <div class="stat-grid">
                    ${stats.map(([label, val]) => `
                    <div class="stat-item">
                        <span class="stat-label">${label}</span>
                        <span class="stat-value">${val}</span>
                    </div>
                    `).join('')}
                    <div class="stat-item fun-fact-item">
                        <span class="stat-label">Fun Fact</span>
                        <span class="stat-value">${card.dataset.funFact}</span>
                    </div>
                </div>
            `;
        });
    });

    document.getElementById('close-modal').addEventListener("click", () => {
        document.getElementById('modal').classList.add("hidden");
    });
}