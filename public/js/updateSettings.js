/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alert';

export const updateUserData = async data => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://localhost:9000/api/v1/users/updateCurrentUser',
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Your data has been updated successfully!');
    }

    window.setTimeout(() => {
      location.reload(true);
    }, 3000);
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

export const updatePassword = async (
  currentPassword,
  newPassword,
  confirmPassword
) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://localhost:9000/api/v1/users/updatePassword',
      data: {
        oldPassword: currentPassword,
        newPassword: newPassword,
        newConfirmPassword: confirmPassword
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Your password has been updated successfully!');
    }

    // window.setTimeout(() => {
    //   location.reload(true);
    // }, 3000);
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
