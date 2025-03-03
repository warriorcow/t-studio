import JustValidate from "just-validate";

document.addEventListener('DOMContentLoaded', () => {

  function showThx() {
    formEl.classList.add('active');
    thxEl.classList.add('active');
    if (window.innerWidth < 640) {
      setTimeout(() => {
        formEl.style.height = '200px';
        formParentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);

    }
  }
  // Инициализация валидации на форме с классом .form__wrapper
  const validation = new JustValidate('.form__wrapper');
  const formParentEl = document.querySelector('.form');
  const formEl = document.querySelector('.form .form__wrapper');
  const thxEl = document.querySelector('.form .form__thx');

  formEl.style.height = formEl.offsetHeight + 'px';

  // Добавление правил валидации для полей формы
  validation
      .addField('input#name', [
        {
          rule: 'required',
          errorFieldCssClass: 'invalid'
        }
      ])
      .addField('input#company', [
        {
          rule: 'required',
          errorFieldCssClass: 'invalid'
        }
      ])
      .addField('input#job', [
        {
          rule: 'required',
          errorFieldCssClass: 'invalid'
        }
      ])
      .addField('input#email', [
        {
          rule: 'required',
          errorFieldCssClass: 'invalid'
        },
        {
          rule: 'email',
          errorFieldCssClass: 'invalid'
        }
      ])
      .addField('input#phone', [
        {
          rule: 'required',
          errorFieldCssClass: 'invalid'
        },
        {
          rule: 'customRegexp',
          value: /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/,
          errorFieldCssClass: 'invalid'
        }
      ])
      .addField('input#description', [
        {
          rule: 'required',
          errorFieldCssClass: 'invalid'
        }
      ])
      .addField('input#policy', [
        {
          rule: 'required',
          errorFieldCssClass: 'invalid'
        }
      ])
      .onSuccess((event) => {
        showThx();

        // Код отправки
      });
});