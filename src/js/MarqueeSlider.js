import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

new Swiper(".marquee-slider__swiper", {
  modules: [Autoplay],
  slidesPerView: 'auto',
  spaceBetween: 20,
  loop: true,
  freeMode: true,
  speed: 6000,
  autoplay: {
    delay: 0
  }
});