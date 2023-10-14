/* eslint-disable */

export const hideAlert = () => {
  const el = document.querySelector('.alert');

  if (el) {
    el.parentElement.removeChild(el);
  }
};

export const showAlert = (type, msg) => {
  hideAlert();

  // type will be a success or error
  const markUp = `<div class="alert alert--${type}">${msg}</div>`;

  document.querySelector('body').insertAdjacentHTML('afterbegin', markUp);

  window.setTimeout(hideAlert, 5000);
};
