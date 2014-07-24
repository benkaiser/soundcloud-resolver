var request = require("request");
var sc_api = "https://api.soundcloud.com";

module.exports = function(c_id){
  this.client_id = c_id;
  this.client_id_prefix = "?client_id=" + this.client_id + "&";

  this.resolve = function(url){
    request(sc_api + "/resolve.json" + this.client_id_prefix + "url="+encodeURI(url), function (error, response, body) {
      var json = JSON.parse(body);
      if(json.kind == 'user'){
        console.log(json);
        request(sc_api + "/tracks.json" + this.client_id_prefix + "user_id=" + json.id, function(error, response, body){
          var json = JSON.parse(body);
          console.log(json);
        });
      }
      // TODO: implement other result types
    });
  };
};
