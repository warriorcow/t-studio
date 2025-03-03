import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';

new Swiper(".cases__swiper", {
  modules: [Navigation],
  loop: true,
  slidesPerView: 1,
  spaceBetween: 24,
  navigation: {
    nextEl: '.cases__arrow--next',
    prevEl: '.cases__arrow--prev',
  },
  breakpoints: {
    640: {
      slidesPerView: 2,
      spaceBetween: 16
    },
    960: {
      slidesPerView: 3,
      spaceBetween: 24,
    }
  },
  on: {
    slideChangeTransitionStart: (swiper) => {
      if (window.innerWidth < 640) {
        const maxHeight = swiper.slides.reduce((max, el) => Math.max(max, el.offsetHeight - el.querySelector('.cases__description').offsetHeight), 0);
        swiper.slides.forEach((slide, i) => {

          const slideDescription = slide.querySelector('.cases__description');
          slide.classList.remove('active');
          slideDescription.style.height = 0 + 'px';
          slide.style.height = maxHeight + 'px';
        });
      }
    },
    init: (swiper) => {
      const maxHeight = swiper.slides.reduce((max, el) => Math.max(max, el.offsetHeight - el.querySelector('.cases__description').offsetHeight), 0);
      swiper.slides.forEach((slide, i) => {
        slide.style.height = maxHeight + 'px';
        slide.style.minHeight = maxHeight + 'px';

        const slideAdditionalEl = slide.querySelector('.cases__additional');
        const slideDescription = slide.querySelector('.cases__description');
        const slideDescriptionHeight = slideDescription.offsetHeight;
        slideDescription.style.height = '0px';

        slide.querySelector('.cases__button').addEventListener('click', () => {
          if (!slide.classList.contains('active')) {
            slide.classList.add('active');
            slideAdditionalEl.style.marginTop = window.getComputedStyle(slideAdditionalEl)['margin-top'];
            slideDescription.style.height = slideDescriptionHeight + 35 + 'px';
            slideDescription.style.paddingTop = '35px';
            slide.style.height = maxHeight + slideDescriptionHeight + 35 + 'px';
          } else {
            slide.classList.remove('active');
            slideDescription.style.height = 0 + 'px';
            slide.style.height = maxHeight + 'px';
          }
        })
      })
    }
  }
});