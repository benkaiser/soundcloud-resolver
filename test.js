var async = require('async');

var SoundcloudResolver = require('./soundcloud-resolver.js');
var scres = new SoundcloudResolver(process.argv[2]);

var urls = {
  singleUrl: 'https://soundcloud.com/mrlittlejeans/good-mistake-y-s-500-mix',
  otherTest: 'https://soundcloud.com/seven-lions/oceanlab-satellite-seven?in=thedubstepgod/sets/melodic-dubstep-chillstep',
  userUrl: 'https://soundcloud.com/mrlittlejeans',
  repostsUrl: 'https://soundcloud.com/trapcity/reposts',
  setUrl: 'https://soundcloud.com/jcouch258-1/sets/dubstep', // tests pagination
  groupUrl: 'https://soundcloud.com/groups/dance-punk' // tests pagination
};

async.eachSeries(Object.keys(urls), function(url, callback) {
  console.log('testing ' + url + ': ' + urls[url]);
  scres.resolve(urls[url], function(err, tracks) {
    if (err) {
      console.log('Error: ' + err);
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
