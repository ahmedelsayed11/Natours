/* eslint-disable */
import '@babel/polyfill';

import { loginUser, logOut } from './login';
import { initMap } from './mapbox';
import { updatePassword, updateUserData } from './updateSettings';
import { bookTour } from './stripe';

// Check if the map is in the page
const mapInThePage = document.getElementById('map');

if (mapInThePage) {
  window.initMap = initMap;
}

// if the form is exists in current page
const loginForm = document.querySelector('.form--login');
if (loginForm) {
  document.querySelector('.form--login').addEventListener('submit', e => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    loginUser(email, password);
  });
}

const logOutBtn = document.querySelector('.nav__el--logout');
if (logOutBtn) {
  logOutBtn.addEventListener('click', logOut);
}

const userDataForm = document.querySelector('.form-user-data');
if (userDataForm) {
  document.querySelector('.form-user-data').addEventListener('submit', e => {
    e.preventDefault();

    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateUserData(form);
  });
}

const userPasswordForm = document.querySelector('.form-user-settings');

if (userPasswordForm) {
  document
    .querySelector('.form-user-settings')
    .addEventListener('submit', async e => {
      e.preventDefault();

      document.querySelector('.btn--save-password').textContent =
        'Updating....';

      const currentPassword = document.getElementById('password-current').value;
      const newPassword = document.getElementById('password').value;
      const confirmPassword = document.getElementById('password-confirm').value;

      await updatePassword(currentPassword, newPassword, confirmPassword);

      document.querySelector('.btn--save-password').textContent =
        'Save password';

      document.getElementById('password-current').value = '';
      document.getElementById('password').value = '';
      document.getElementById('password-confirm').value = '';
    });
}

const bookTourElement = document.querySelector('.book-tour');
if (bookTourElement) {
  bookTourElement.addEventListener('click', e => {
    e.target.textContent = 'Processing....';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
