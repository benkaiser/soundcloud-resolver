var request = require('request');
var async = require('async');

function SCResolver(cId) {
  if (cId === undefined) {
    throw new Error('client_id must be set for soundcloud-resolver to work');
  }

  this.clientId = cId;
  this.clientIdPrefix = '?client_id=' + this.clientId + '&';
  this.scAPI = 'https://api.soundcloud.com';
  this.maxLimit = 200;
  this.limit = 'limit=' + this.maxLimit + '&';
  this.resolveUrlPrefix = this.scAPI + '/resolve.json' + this.clientIdPrefix + this.limit + 'url=';

  var magicId = '376f225bf427445fc4bfb6b99b72e0bf';

  this.resolve = function(url, callback) {
    var _this = this;

    request(_this.resolveUrlPrefix + encodeURI(url), function(error, response, body) {
      if (error) { callback(error); }

      var json = JSON.parse(body);
      if (json.errors) {
        if (url.indexOf('reposts') > 0) {
          // process the track as a repost
          request(_this.resolveUrlPrefix + encodeURI(url.replace(/reposts/, '')), function(error, response, body) {
            json = JSON.parse(body);
            _this.paginateRepostRequests('https://api-v2.soundcloud.com/profile/soundcloud:users:' + json.id + '', callback);
          });
        } else {
          // fail
          console.log(json);
          callback('client_id not authorised');
        }
      } else if (json.kind == 'user') {
        // fetch the tracks by the user
        _this.paginateRequests(_this.scAPI + '/tracks.json' + _this.clientIdPrefix + _this.limit + 'user_id=' + json.id, callback);
      } else if (json.kind == 'playlist') {
        // return the playlist tracks
        _this.findMissingTracksStreamUrl(json.tracks, callback);
      } else if (json.kind == 'group') {
        // fetch the groups
        _this.paginateRequests(_this.scAPI + '/groups/' + json.id + '/tracks.json' +  _this.clientIdPrefix + _this.limit, callback);
      } else if (json.kind == 'track') {
        _this.findMissingTracksStreamUrl([json], callback);
      } else {
        console.log(json);
      }
    });
  };

  this.paginateRequests = function(url, callback) {
    var _this = this;

    var tracks = [];
    var finished = false;
    var page = 0;

    async.until(function() {
      return finished;
    },

    function(callback) {
      request(url + '&offset=' + page * _this.maxLimit, function(error, response, body) {
        if (error) { callback(error); }

        var json = JSON.parse(body);
        tracks = tracks.concat(json);

        // should we stop here?
        if (json.length != 200) {
          finished = true;
        }

        page++;
        callback();
      });
    },

    function() {
      // finished fetching tracks
      _this.findMissingTracksStreamUrl(tracks, callback);
    });
  };

  this.paginateRepostRequests = function(url, callback) {
    var _this = this;

    var tracks = [];
    var finished = false;
    var page = 0;

    async.until(function() {
      return finished;
    },

    function(callback) {
      request(url, function(error, response, body) {
        if (error) { callback(error); }

        var json = JSON.parse(body);

        for (var x = 0; x < json.collection.length; x++) {
          // only add it if it's defined
          if(json.collection[x].track) {
            tracks.push(json.collection[x].track);
          }
        }

        // should we stop here?
        if (json.next_href) {
          url = json.next_href;
        } else {
          finished = true;
        }

        page++;
        callback();
      });
    },

    function() {
      // finished fetching tracks
      _this.findMissingTracksStreamUrl(tracks, callback);
    });
  };

  // loop over the found songs and manually fetch stream urls for ones not given
  this.findMissingTracksStreamUrl = function(tracks, callback) {
    // find the indexes of songs not streamable
    var notStreamable = [];
    for (var track in tracks) {
      if (!tracks[track].stream_url || !tracks[track].streamable) {
        notStreamable.push(track);
      }
    }

    // start async loop until finished
    var finished = false;
    if (notStreamable.length === 0) {
      finished = true;
    }

    async.until(function() {
      return finished;
    },

    function(callback) {
      var currentIndex = notStreamable.pop();

      // call to special endpoint to fetch stream urls
      request('http://api.soundcloud.com/i1/tracks/' + tracks[currentIndex].id + '/streams?client_id=' + magicId, function(error, response, body) {
        if (error) { callback(error); }

        // extract the track data
        var responseBody = JSON.parse(body);

        // set the stream_url
        tracks[currentIndex].stream_url = responseBody.http_mp3_128_url;
        tracks[currentIndex].streamable = true;

        // if we are finished, mark it
        if (notStreamable.length === 0) {
          finished = true;
        }

        // call next interation
        callback();
      });
    },

    function() {
      callback(null, tracks);
    });
  };
}

module.exports = SCResolver;
