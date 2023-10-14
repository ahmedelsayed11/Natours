const AppError = require("./AppError");

class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    const queryObj = { ...this.queryStr };
    
    const excludedFields = ['sort', 'page', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el])



    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      match => `$${match}`
    );


    // mongoose return a query
    this.query = this.query.find(JSON.parse(queryString));

    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    }
    return this;
  }

  limit() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',')
      if(fields?.includes("password")){
        throw new AppError("Password cannot be selected!" , "400");
      }
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select(['-__v' , '-password']); // don't send __v for the user; or the password;
    }
    return this;
  }

  paginate() {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    if (this.queryStr.page) {
      // const numOfTours = await Tours.countDocuments();
      // if (skip >= numOfTours) {
      //   console.log('hello');
      // }
    }

    return this;
  }
}

module.exports = APIFeatures;
