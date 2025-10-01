const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
  imageUrl: {type: String, required: true},
  title: {type: String, required: true},
  author: {type: String, required: true},
  year: {type: Number, required: true},
  genre: {type: String, required: true},
  ratings: [{userId: String, grade: Number}],
  userId: {type: String, required: true},
  averageRating: {type: Number},
});

module.exports = mongoose.model('Book', bookSchema);
