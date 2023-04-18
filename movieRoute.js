const express = require("express");
const router = express.Router();
const authJwtController = require("./auth_jwt");
const Movies = require("./Movies");
const getJSONObjectForMovieRequirement = require("./getJSON");
const mongoose = require("mongoose");

router
  .route("/")
  .get(authJwtController.isAuthenticated, async (req, res) => {
    const { reviews } = req.query;
    try {
      let pipeline = [
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "movieID",
            as: "Reviews",
          },
        },
        {
          $addFields: {
            avgRating: {
              $round: [{ $avg: "$Reviews.rating" }, 1],
            },
          },
        },
        {
          $sort: { avgRating: 1 },
        },
      ];

      if (reviews === "true") {
        pipeline.push({
          $sort: { avgRating: -1 },
        });
      }

      const allMovies = await Movies.aggregate(pipeline);
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
          "Please enter title: '', releaseDate: '',\
          genre: 'Comedy, Action, Adventure, Drama,\
          Fantasy, Horror, Mystery, Thriller, Western,\
          Science Fiction', actors: [{actorName, characterName}, {}, {}] in JSON body",
      });
    }
  })
  .all((req, res) => {
    res.status(200);
    res.send("Doesn't support the HTTP method");
  });

router.post("/search", authJwtController.isAuthenticated, async (req, res) => {
  var o = getJSONObjectForMovieRequirement(req);
  try {
    const { query } = req.body;
    if (!query) {
      o.message = "Request Body is Missing";
      return res.status(400).json(o);
    }
    const movies = await Movies.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { "actors.actorName": { $regex: query, $options: "i" } },
      ],
    });
    if (!movies) {
      o.message = `${query} not found`;
      return res.status(404).json(o);
    }
    o.message = `Results for ${query}`;
    o.data = movies;
    res.status(200).json(o);
  } catch (error) {
    o.message = "Sever Error";
    return res.status(500).json(o);
  }
});

router
  .route("/:id")
  .get(authJwtController.isAuthenticated, async (req, res) => {
    var o = getJSONObjectForMovieRequirement(req);
    if (req.params.id && !req.query.reviews) {
      try {
        const id = req.params.id;
        const movie = await Movies.findById(id);
        o.data = movie;
        if (o.data == 0) {
          return res.json("Movie not found");
        }
        res.json(o);
      } catch (error) {
        console.log(error);
        res.json({
          message: "Could not return movie",
          error,
        });
      }
    } else if (req.params.id && req.query.reviews) {
      try {
        const { id } = req.params;
        const movie = await Movies.aggregate([
          {
            $match: { _id: mongoose.Types.ObjectId(id) },
          },
          {
            $lookup: {
              from: "reviews",
              localField: "_id",
              foreignField: "movieID",
              as: "Reviews",
            },
          },
          {
            $addFields: {
              avgRating: {
                $round: [{ $avg: "$Reviews.rating" }, 1],
              },
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
          message: "Could not return movie",
          error,
        });
      }
    } else {
      res.json({
        message:
          "Please include the title of the movie to \
        be returned in the url",
      });
    }
  })
  .delete(authJwtController.isAuthenticated, async (req, res) => {
    const { id } = req.params;
    if (id) {
      try {
        res = res.status(200);
        if (req.get("Content-Type")) {
          res = res.type(req.get("Content-Type"));
        }
        var o = getJSONObjectForMovieRequirement(req);
        const d = await Movies.findByIdAndDelete(id);
        o.status = res.status;
        o.message = `movie deleted ${req.params.id}`;
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
        be deleted in the url /Casino",
      });
    }
  })
  .put(authJwtController.isAuthenticated, async (req, res) => {
    var o = getJSONObjectForMovieRequirement(req);
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      var message = `${id} is not mongoose id`;
      return res.status(400).json(message);
    }
    const movie = await Movies.findById(id);
    if (!movie) {
      o.message = "Movie not found";
      return res.status(404).json(o);
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
        const movie = await Movies.findByIdAndUpdate(id, req.body, {
          new: true,
        });
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
          "Please enter title: '', releaseDate: '',\
          genre: 'Comedy, Action, Adventure, Drama,\
          Fantasy, Horror, Mystery, Thriller, Western,\
          Science Fiction', actors: [{actorName, characterName}, {}, {}] in JSON body",
      });
    }
  })
  .all((req, res) => {
    res.status(200);
    res.send("Doesn't support the HTTP method");
  });

module.exports = router;
