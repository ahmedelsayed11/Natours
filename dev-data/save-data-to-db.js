const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('../models/tourModel');
const Reviews = require('../models/reviewModel');
const Users = require('../models/userModel');

dotenv.config({ path: './config.env' });

// let DB_PASS = process.env.DATABASE_PASSWORD.replace('#', '%23');
// DB_PASS = DB_PASS.replace('@', '%40');
console.log(process.env.DATABASE);

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);

mongoose
  .connect(DB)
  .then(() => console.log('DB CONNECTION SUCCESSFULL !'))
  .catch(error => console.log(`ERROR Connecing to DB ${error}`));

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

const importData = async () => {
  try {
    console.log('....Loading');
    await Tour.create(tours);
    await Reviews.create(reviews);
    await Users.create(users, {
      validateBeforeSave: false
    });

    console.log('Success Import .....');
    process.exit();
  } catch (error) {
    console.log(`error ${error}`);
    process.exit();
  }
};

const deleteData = async () => {
  try {
    console.log('....Loading');
    await Tour.deleteMany();
    await Reviews.deleteMany();
    await Users.deleteMany();
    console.log('Success Deleted .....');
    process.exit();
  } catch (error) {
    console.log(`error ${error}`);
  }
};

// console.log(process.argv);
if (process.argv[2] === '--import') importData();
else if (process.argv[2] === '--delete') deleteData();
