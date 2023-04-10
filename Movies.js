var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.DB);

// Movie schema
var MovieSchema = new Schema({
  title: String,
  releaseDate: String,
  genere: {
    type: String,
    enum: [
      "Action",
      "Adventure",
      "Comedy",
      "Drama",
      "Fantasy",
      "Horror",
      "Mystery",
      "Thriller",
      "Western",
      "Science",
      "Fiction"
    ]
  },
  actors: {
    type: Array,
    items: {
      actorName: String,
      characterName: String
    }
  }
});

// return the model
module.exports = mongoose.model('Movie', MovieSchema);