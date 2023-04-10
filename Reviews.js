var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);
require("dotenv").config();

// Movie schema
var ReviewSchema = new Schema({
  userID: {type: Schema.Types.ObjectId, ref: "User Schema", required: true},
  movieID: {type: Schema.Types.ObjectId, ref: "Movie", required: true},
  username: {type: String, required: true},
  quote: {type: String, required: true},
  rating: {type: Number, min: 1, max: 5, required: true}

});
ReviewSchema.pre('save', function(next) {
  next();
})
// return the model
module.exports = mongoose.model('Review', ReviewSchema);