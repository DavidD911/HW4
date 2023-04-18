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
  },
  imageUrl: {
    type: String,
    validate: {
      validator: function (v) {
        return /^(ftp|http|https): \/\/[^ "]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid url`,
    },
  }
});

// return the model
module.exports = mongoose.model('Movie', MovieSchema);