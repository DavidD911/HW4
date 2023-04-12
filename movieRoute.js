const express = require("express");
const router = express.Router();
const authJwtController = require("./auth_jwt");
const Movies = require("./Movies");
const getJSONObjectForMovieRequirement = require("./getJSON");

router
  .route("/")
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const allMovies = await Movies.find({});
      res.json(allMovies);
    } catch (error) {
      res.json({
        message: "Could not get all movies",
        error,
      });
    }
  })

  .post(authJwtController.isAuthenticated, async (req, res) => {
    var o = getJSONObjectForMovieRequirement(req);
    if (
      req.body.title &&
      req.body.releaseDate &&
      req.body.genre &&
      req.body.actors.length >= 3
    ) {
      const movie = new Movies(req.body);
      try {
        await movie.save();
        o.message = "movie saved";
        o.status = res.statusCode;
        if (res.query) {
          o.queryString = res.query;
        } else {
          o.queryString = "No query string";
        }
        res.json(o);
      } catch (err) {
        res.json({
          message: "Could not save the movie",
        });
      }
    } else {
      res.json({
        action: "Failed to save because missing information",
        message:
          "Please enter title, releaseDate, genere, and actors ",
      });
    }
  })
  .all((req, res) => {
    res.status(200);
    res.send("Doesn't support the HTTP method");
  });

router
  .route("/:title")
  .get(async (req, res) => {
    var o = getJSONObjectForMovieRequirement(req);
    if (req.params.title && !req.query.reviews) {
      try {
        const title = req.params.title;
        const movie = await Movies.find({ title: title });
        o.data = movie;
        if (o.data == 0) {
          return res.json("Movie not found");
        }
        res.json(o);
      } catch (error) {
        console.log(error);
        res.json({
          message: "Could return movie",
          error,
        });
      }
    } else if (req.params.title && req.query.reviews) {
      try {
        const { title } = req.params;
        const movie = await Movies.aggregate([
          {
            $match: { title },
          },
          {
            $lookup: { //finds movie based on id and returns reviews along with the movie object
              from: "reviews",
              localField: "_id",
              foreignField: "movieID",
              as: "Reviews",
            },
          },
        ]);
        if (movie.length > 0) {
          res.json(movie);
        } else {
          res.status(404).json({ message: "Movie not found" });
        }
      } catch (error) {
        console.log(error);
        res.json({
          message: "Could return movie",
          error,
        });
      }
    } else {
      res.json({
        message:
          "Please include the title of the movie",
      });
    }
  })
  .delete(authJwtController.isAuthenticated, async (req, res) => {
    if (req.params.title) {
      try {
        res = res.status(200);
        if (req.get("Content-Type")) {
          res = res.type(req.get("Content-Type"));
        }
        var o = getJSONObjectForMovieRequirement(req);
        const d = await Movies.deleteOne({
          title: req.params.title,
        });
        o.status = res.status;
        o.message = `movie deleted ${req.params.title}`;
        if (res.query) {
          o.queryString = res.query;
        } else {
          o.queryString = "No query string";
        }
        res.json(o);
      } catch (err) {
        res.json({
          message: "Could not delete the movie",
        });
      }
    } else {
      res.json({
        message:
          "Please include the title of the movie to \
        be deleted in the url",
      });
    }
  })
  .put(authJwtController.isAuthenticated, async (req, res) => {
    const movie = await Movies.findOne({ title: req.params.title });
    if (!movie) {
      res.status(404).json({
        message: "Movie not found",
      });
    }
    if (
      req.body.title &&
      req.body.releaseDate &&
      req.body.genre &&
      req.body.actors.length >= 3
    ) {
      try {
        res = res.status(200);
        if (req.get("Content-Type")) {
          res = res.type(req.get("Content-Type"));
        }
        var o = getJSONObjectForMovieRequirement(req);
        const movie = await Movies.findOneAndUpdate(
          {
            title: req.params.title,
          },
          req.body,
          { new: true }
        );
        o.status = res.status;
        o.message = `movie updated ${movie}`;
        if (res.query) {
          o.queryString = res.query;
        } else {
          o.queryString = "No query string";
        }
        res.status(200).json(o);
      } catch (err) {
        res.status(404).json({
          message: "Could not update the movie",
        });
      }
    } else {
      res.status(500).json({
        action: "Failed to update movie because missing information",
        message:
          "Please enter title, releaseDate, genere, and actors",
      });
    }
  })
  .all((req, res) => {
    res.status(200);
    res.send("Doesn't support the HTTP method");
  });

module.exports = router;
