/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const loginUser = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:9000/api/v1/users/login',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        mode: 'same-origin'
      },
      data: {
        email,
        password
      }
    });

    if (res.data.status === 'success') {
      // alert('Logged in successfully');
      showAlert('success', 'Logged in successfully!');

      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error?.response?.data?.message);
  }
};

export const logOut = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:9000/api/v1/users/logOut'
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged out successfully!');

      // history.replaceState(null);

      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', 'Log out failed, Try again later!');
  }
};
