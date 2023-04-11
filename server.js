/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());
const mongoose = require("mongoose");
require("dotenv").config();
const TRACKING_ID = process.env.T_KEY;

var router = express.Router();

mongoose.set("strictQuery", false);
mongoose
  .connect("mongodb+srv://daviddesrochers:MyPassword@hw3.r0j9xqd.mongodb.net/?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database Connected"))
  .catch((err) => {
    console.log("Erorr", err);
  });
mongoose.set("useCreateIndex", true);

function customAnalytics (cat, action, label, value, dim, metric) {
    var options = {method: 'GET',
        url: 'https://www.google-analytics.com/collect',
        query: {
            version: '1',
            tracking: TRACKING_ID,
            clientID: crypto.randomBytes(16).toString("hex"),
            type: 'event',
            event: cat,
            eventAction: action,
            eventLabel: label,
            eventValue: value,
            customDimension: dim,
            customMetric: metric
        },
        headers: {'Cache Control': 'no Cache'},
    }
    return rp(options);
}
function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

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
            $lookup: {
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
          "Please include the title of the movie to \
        be returned in the url",
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
        be deleted in the url /Casino",
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


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


