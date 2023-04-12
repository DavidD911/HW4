function getJSONObjectForMovieRequirement(req) {
  var json = {
    headers: "No headers",
    key: process.env.UNIQUE_KEY,
    body: "No body",
  };

  if (req.body != null) {
    json.body = req.body;
  }

  if (req.headers != null) {
    json.headers = req.headers;
  }

  if (req.query) {
    json.queryString = req.query;
  }

  return json;
}
module.exports = getJSONObjectForMovieRequirement;
