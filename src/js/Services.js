import Masonry from "masonry-layout";

let masonry;
const container = document.querySelector(".services__column--slider");

function initLayout() {
  const isMobile = window.matchMedia("(max-width: 960px)").matches;

  if (!isMobile) {
    if (!masonry) {
      masonry = new Masonry(container, {
        itemSelector: ".service-card",
        gutter: 24,
      });
    }
  } else {
    if (masonry) {
      masonry.destroy(); // Уничтожаем Masonry, если он активен
      masonry = null;
    }
  }
}

window.addEventListener("load", initLayout);
window.addEventListener("resize", initLayout);