/**
 * This is an example of a basic node.js script that performs
 * the Client Credentials oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#client_credentials_flow
 */

var fetch = require('node-fetch'); // "Request" library
const { URLSearchParams } = require('url');

var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;

// your application requests authorization
var params = new URLSearchParams();
params.append('grant_type', 'client_credentials');
var authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  method: "POST",
  body: params,
  headers: {
    'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
  }
};

fetch(authOptions.url, authOptions).then(response => {
  if (response.ok) {
    response.json().then(body => {
      // use the access token to access the Spotify Web API
      var token = body.access_token;
      var options = {
        url: 'https://api.spotify.com/v1/users/jmperezperez',
        method: "GET",
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      };
      fetch(options.url, options).then(response => response.json()).then(body => {
        console.log(body);
      });
    });
  }
});
