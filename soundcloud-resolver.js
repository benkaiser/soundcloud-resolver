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

  this.resolve = function(url, callback) {
    var self = this;

    request(self.sc_api + "/resolve.json" + self.client_id_prefix + self.limit + "url=" + encodeURI(url), function(error, response, body) {
      if(error) { callback(error); }
      var json = JSON.parse(body);
      if (json.errors) {
        console.log(json);
        callback("client_id not authorised");
      } else if (json.kind == 'user') {
        // fetch the tracks by the user
        self.paginate_requests(self.sc_api + "/tracks.json" + self.client_id_prefix + self.limit + "user_id=" + json.id, callback);
      } else if (json.kind == 'playlist') {
        // return the playlist tracks
        callback(null, json.tracks);
      } else if (json.kind == 'group') {
        // fetch the groups
        self.paginate_requests(self.sc_api + "/groups/" + json.id + "/tracks.json" +  self.client_id_prefix + self.limit, callback);
      } else if (json.kind == 'track') {
        callback(null, [json]);
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
      request(url + "&offset=" + page*self.max_limit, function( error, response, body ) {
        if ( error ) { callback( error ); }
        var json = JSON.parse(body);
        tracks = tracks.concat(json);
        // should we stop here?
        if(json.length != 200){
          finished = true;
        }
        page++;
        callback();
      });
    }, function(){
      // finished fetching tracks
      callback( null, tracks );
    });
  };
}


module.exports = SCResolver;
