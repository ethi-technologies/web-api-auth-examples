/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var fetch = require('node-fetch'); // "node-fetch" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const { URLSearchParams } = require('url');

var client_id = process.env.SPOTIFY_CLIENT_ID; // Your client id
var client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret
var redirect_uri = process.env.SPOTIFY_REDIRECT_URI; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-library-read user-read-email user-read-recently-played user-top-read';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('redirect_uri', redirect_uri);
    params.append('grant_type', 'authorization_code');
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      method: 'POST',
      body: params,
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
    };

		fetch(authOptions.url, authOptions).then(response => {
      // console.log(response);
			if (response.ok) {
				response.json().then(body => {
					var access_token = body.access_token,
							refresh_token = body.refresh_token;
          // console.log(`Access Token: ${access_token}, Refresh Token: ${refresh_token}`)
					var options = {
						url: 'https://api.spotify.com/v1/me',
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': 'Bearer ' + access_token
						}
					};
					// use the access token to access the Spotify Web API
					fetch(options.url, options).then(response => response.json()).then(body => {
						// console.log(body);
						// we can also pass the token to the browser to make requests from there
						res.redirect('/#' +
							querystring.stringify({
								access_token: access_token,
								refresh_token: refresh_token
						}));
					});
				})
			}	else {
				res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
		});
  }
});

app.get('/refresh_token', function(req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  const params = new URLSearchParams();
  params.append('refresh_token', refresh_token);
  params.append('grant_type', 'refresh_token');
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    method:'POST',
    body: params,
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')),
    }
  };

  fetch(authOptions.url, authOptions).then(response => {
    if (response.ok) {
      response.json().then(body => {
        var access_token = body.access_token;
        res.send({
          'access_token': access_token
        });
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
