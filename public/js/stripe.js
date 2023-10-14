/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51NyxVcKxtA5zRsd9bxunc9QMycJrMe6Cp7v6VoAIjBNL7chEfvceXZTFfdbjOv5YYB7LBEPZ3zUI4ENwPSyGI17J000fLWrvYL'
);

export const bookTour = async tourId => {
  try {
    const response = await axios({
      method: 'GET',
      url: `http://localhost:9000/api/v1/booking/checkout-session/${tourId}`
    });

    console.log(
      '🚀 ~ file: stripe.js:15 ~ bookTour ~ response:',
      response.data.session
    );

    await stripe.redirectToCheckout({ sessionId: response.data.session.id });

    // await stripe.
  } catch (err) {
    showAlert('error', err);
  }
};
