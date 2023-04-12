var mongoose = require("mongoose");
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
var ReviewSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  review: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  movieID: {
    type: Schema.Types.ObjectId,
    ref: "Movie",
  },
});

// return the model
module.exports = mongoose.model("Review", ReviewSchema);
