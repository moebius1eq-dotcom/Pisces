const hamburger = document.querySelector(".hamburger");
const offScreenMenu = document.querySelector(".off-screen-menu");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    offScreenMenu.classList.toggle("active");
});