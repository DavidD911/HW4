const express = require("express");
const router = express.Router();
const Review = require("./Reviews");
const Movies = require("./Movies");
const authJwtController = require("./auth_jwt");
const getJSONObjectForReviewsRequirement = require("./getJSON");

router
  .route("/")
  .get(async (req, res) => {
    const reviews = await Review.find({});
    var o = getJSONObjectForReviewsRequirement(req);
    o.data = reviews;
    o.status = res.statusCode;
    o.message = `All reviews`;
    res.status(200).json(o);
  })
  .post(authJwtController.isAuthenticated, async (req, res) => {
    if (req.body.review && req.body.rating && req.body.title) {
      const movie = await Movies.find({ title: req.body.title });
      if (movie == 0) {
        return res.json("Movie does not exist");
      }
      const movieID = movie[0]._id;
      if (movie.length > 0) {
        const o = getJSONObjectForReviewsRequirement(req);
        const review = new Review({
          username: req.user.username,
          review: req.body.review,
          rating: req.body.rating,
          movieID,
        });
        try {
          const sr = await review.save();
          o.message = "Review created!";
          o.data = sr;
          o.status = res.statusCode;
          res.status(200).json(o);
        } catch (err) {
          console.log(err);
        }
      } else {
        return res.status(200).json("Movie does not exist");
      }
    } else {
      res.json({
        message: "Please include review, rating and movie title in body",
      });
    }
  });

module.exports = router;
