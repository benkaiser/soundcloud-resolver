var request = require("request");
var async = require("async");

function SCResolver(c_id) {
  if (c_id === undefined) {
    throw new Error("client_id must be set for soundcloud-resolver to work");
  }
  this.client_id = c_id;
  this.client_id_prefix = "?client_id=" + this.client_id + "&";
  this.sc_api = "https://api.soundcloud.com";
  this.max_limit = 200;
  this.max_page = 500;
  this.limit = "limit=" + this.max_limit + "&";

  var magic_id = "376f225bf427445fc4bfb6b99b72e0bf";

  this.resolve = function(url, callback) {
    var self = this;

    request(self.sc_api + "/resolve.json" + self.client_id_prefix + self.limit + "url=" + encodeURI(url), function(error, response, body) {
      if (error) { callback(error); }
      var json = JSON.parse(body);
      if (json.errors) {
        console.log(json);
        callback("client_id not authorised");
      } else if (json.kind == 'user') {
        // fetch the tracks by the user
        self.paginate_requests(self.sc_api + "/tracks.json" + self.client_id_prefix + self.limit + "user_id=" + json.id, callback);
      } else if (json.kind == 'playlist') {
        // return the playlist tracks
        self.find_missing_stream_links(json.tracks, callback);
      } else if (json.kind == 'group') {
        // fetch the groups
        self.paginate_requests(self.sc_api + "/groups/" + json.id + "/tracks.json" +  self.client_id_prefix + self.limit, callback);
      } else if (json.kind == 'track') {
        self.find_missing_stream_links([json], callback);
      } else {
        console.log(json);
      }
    });
  };

  this.paginate_requests = function(url, callback){
    var self = this;

    var tracks = [];
    var finished = false;
    var page = 0;

    async.until(function(){ return finished; }, function(callback){
      request(url + "&offset=" + page*self.max_limit, function(error, response, body) {
        if (error) { callback(error); }
        var json = JSON.parse(body);
        tracks = tracks.concat(json);
        // should we stop here?
        if (json.length != 200){
          finished = true;
        }
        page++;
        callback();
      });
    }, function() {
      // finished fetching tracks
      self.find_missing_stream_links(tracks, callback);
    });
  };

  // loop over the found songs and manually fetch stream urls for ones not given
  this.find_missing_stream_links = function(tracks, callback){
    // find the indexes of songs not streamable
    var not_streamable = [];
    for(var track in tracks){
      if(!tracks[track].stream_url){
        not_streamable.push(track);
      }
    }
    // start async loop until finished
    var finished = false;
    if(not_streamable.length === 0){
      finished = true;
    }

    async.until(function(){ return finished; }, function(callback){
      var currentIndex = not_streamable.pop();
      // call to special endpoint to fetch stream urls
      request('http://api.soundcloud.com/i1/tracks/' + tracks[currentIndex].id + '/streams?client_id=' + magic_id, function(error, response, body){
        if (error) { callback(error); }
        // extract the track data
        var responseBody = JSON.parse(body);
        // set the stream_url
        tracks[currentIndex].stream_url = responseBody.http_mp3_128_url;
        tracks[currentIndex].streamable = true;
        // if we are finished, mark it
        if(not_streamable.length === 0){
          finished = true;
        }
        // call next interation
        callback();
      });
    }, function() {
      callback(null, tracks);
    });
  };
}


module.exports = SCResolver;
