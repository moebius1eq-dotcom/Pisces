const hamburger = document.querySelector(".hamburger");
const offScreenMenu = document.querySelector(".off-screen-menu");
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

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible"); 
    });
}, { threshold: 0.15 });

document.querySelectorAll('.about-section, .news-section').forEach(el => {
    el.style.opacity = 0;
    el.style.transform = "translateY(30px)";
    el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
    observer.observe(el);
});

hamburger.addEventListener("click", () => {
    const isExpanded = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", !isExpanded);
    hamburger.classList.toggle("active");

    if (offScreenMenu.classList.contains("active")) {
        offScreenMenu.classList.remove("active");
        offScreenMenu.classList.add("closing");

        setTimeout(() => offScreenMenu.classList.remove("closing"), 1000);
    } else {
        offScreenMenu.classList.remove("closing");
        offScreenMenu.classList.add("active");
    }
});

document.querySelectorAll('.off-screen-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); 
        
        const href = link.getAttribute('href');
        const menu = document.querySelector('.off-screen-menu');
        const hamburger = document.querySelector('.hamburger');

        menu.classList.add('closing');
        menu.classList.remove('active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');

        setTimeout(() => {
            menu.classList.remove('closing');
            window.location.href = href; 
        }, 800); 
    });
});

const highlight = document.querySelector('.menu-highlight');
const menuItems = document.querySelectorAll('.off-screen-menu li');

function moveHighlight(li) {
    const menuRect = document.querySelector('.off-screen-menu').getBoundingClientRect();
    const liRect = li.getBoundingClientRect();
    highlight.style.left = (liRect.left - menuRect.left) + 'px';
    highlight.style.width = liRect.width + 'px';
}

document.querySelector('.hamburger').addEventListener('click', () => {
    setTimeout(() => {
        moveHighlight(menuItems[0]);
    }, 50);
});

menuItems.forEach(li => {
    li.addEventListener('mouseenter', () => moveHighlight(li));
});

document.querySelector('.off-screen-menu').addEventListener('mouseleave', () => {
    moveHighlight(menuItems[0]);
});
