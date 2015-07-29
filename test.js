var async = require('async');

var SoundcloudResolver = require('./soundcloud-resolver.js');
var scres = new SoundcloudResolver(process.argv[2]);

var urls = {
  single_url: 'https://soundcloud.com/mrlittlejeans/good-mistake-y-s-500-mix',
  user_url: 'https://soundcloud.com/mrlittlejeans',
  set_url: 'https://soundcloud.com/jcouch258-1/sets/dubstep', // tests pagination
  group_url: 'https://soundcloud.com/groups/dance-punk' // tests pagination
};

async.eachSeries(Object.keys(urls), function(url, callback) {
  console.log('testing ' + url + ': ' + urls[url]);
  scres.resolve(urls[url], function(err, tracks) {
    if (err) {
      console.log( 'Error: ' + err);
    } else {
      console.log(tracks.length + ' tracks returned');
      console.log(tracks[0]);
    }

    callback();
  });
},

function() {
  console.log('testing done.');
});
