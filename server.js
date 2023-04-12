var express = require("express");
var bodyParser = require("body-parser");
var passport = require("passport");
var jwt = require("jsonwebtoken");
var cors = require("cors");
var User = require("./Users");
const movieRoutes = require("./movieRoute");
const reviewRoutes = require("./reviewRoute");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.Promise = global.Promise;
mongoose.set("strictQuery", false);
mongoose.set("useFindAndModify", false);
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useCreateIndex", true);

mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log("Database Connected"))
  .catch((err) => {
    console.log("Erorr", err);
  });
mongoose.set("useCreateIndex", true);

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());
require("dotenv").config();

var router = express.Router();

function addGoogleAnalytics(req, res, next) {
  const trackingCode = `
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      
      gtag('config', '${process.env.GA_MEASUREMENT_ID}');
    </script>
  `;

  res.setHeader(
    "X-Google-Analytics",
    trackingCode.replace(/(\r\n|\n|\r)/gm, "")
  );
  next();
}

app.use(addGoogleAnalytics);

router.post("/signup", function (req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({
      success: false,
      msg: "Please include both username and password to signup.",
    });
  } else {
    var user = new User();
    user.name = req.body.name;
    user.username = req.body.username;
    user.password = req.body.password;

    user.save(function (err) {
      if (err) {
        if (err.code == 11000)
          return res.json({
            success: false,
            message: "A user with that username already exists.",
          });
        else return res.json(err);
      }

      res.json({ success: true, msg: "Successfully created new user." });
    });
  }
});

router.post("/signin", function (req, res) {
  var userNew = new User();
  userNew.username = req.body.username;
  userNew.password = req.body.password;

  User.findOne({ username: userNew.username })
    .select("name username password")
    .exec(function (err, user) {
      if (err) {
        res.send(err);
      }

      user.comparePassword(userNew.password, function (isMatch) {
        if (isMatch) {
          var userToken = { id: user.id, username: user.username };
          var token = jwt.sign(userToken, process.env.SECRET_KEY);
          res.json({ success: true, token: "JWT " + token });
        } else {
          res
            .status(401)
            .send({ success: false, msg: "Authentication failed." });
        }
      });
    });
});

app.use("/movies", movieRoutes);
app.use("/reviews", reviewRoutes);
app.use("/", router);
app.use("*", (req, res) => {
  res.status(404).json("Page not found");
});
app.all("/", (req, res) => {
  res.send("Route does not exist");
});
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only
