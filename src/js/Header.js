const hamburger = document.querySelector('.header__hamburger');
const sideMenu = document.querySelector('.header__side');
const links = document.querySelectorAll('.header__link');
const body = document.body;

const toggleMenu = () => {
  const isOpen = sideMenu.classList.toggle('open');
  hamburger.classList.toggle('open');
  body.style.overflow = isOpen ? 'hidden' : '';
};

// Открытие/закрытие по клику на гамбургер
hamburger.addEventListener('click', toggleMenu);

// Отслеживание изменения размера окна
const mediaQuery = window.matchMedia('(min-width: 960px)');
const checkScreenSize = () => {
  if (mediaQuery.matches) {
    sideMenu.classList.remove('open');
    hamburger.classList.remove('open');
    body.style.overflow = ''; // Разрешаем скролл на десктопе
  }
};

// Вызов при загрузке и при изменении размера окна
mediaQuery.addEventListener('change', checkScreenSize);
checkScreenSize();

links.forEach(link => {
  link.addEventListener('click', () => {
    sideMenu.classList.remove('open');
    hamburger.classList.remove('open');
    body.style.overflow = '';
  });
})
