Soundcloud Resolver
===================

Simple NodeJS library for resolving soundcloud url's to their associated tracks

Installation
-----

Install via npm:

`npm install soundcloud-resolver`

Usage
-----

Best explained in code:

```
// get the class
var SoundcloudResolver = require('soundcloud-resolver');

// get the object, and itialise it with your soundcloud client_id
var scres = new SoundcloudResolver('YOUR_CLIENT_ID');

scres.resolve( url_of_track_needed, function( err, tracks ) {
  // tracks is an array of tracks found
});
```

Testing
-------
```
$ git clone https://github.com/benkaiser/soundcloud-resolver.git
$ cd soundcloud-resolver
$ npm install
$ node test.js
```
