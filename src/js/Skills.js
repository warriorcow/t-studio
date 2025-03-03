document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".skills__tabs-tab");
  const contents = document.querySelector(".skills__tabs-contents");

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      contents.style.transform = `translateX(calc(-100% * ${index}))`;
    });
  });

  // Устанавливаем активный первый таб по умолчанию
  if (tabs.length > 0) {
    tabs[0].classList.add("active");
  }
});