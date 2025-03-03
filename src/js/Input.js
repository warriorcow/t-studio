import Inputmask from "inputmask";

// Используйте input[type="tel"] для телефонного поля
const phoneInput = document.querySelector('input[type="phone"]');
if (phoneInput) {
  Inputmask({ mask: "+7 (999) 999-99-99", showMaskOnHover: false }).mask(phoneInput);
}