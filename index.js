/* 
  Copyright 2013 Mozilla Foundation
 
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// Global requires
var request = require( "request" ),
    Fogin = require( "./test/Fogin.js" ),
    url = require( "url" );

// Module.exports
module.exports = function ( app, rawUrl ) {
  var parsedUrl = url.parse( rawUrl ),
      // Force a trailing slash
      webmakerUrl = parsedUrl.href.replace( /\/$/, '/' ),
      authBits = parsedUrl.auth.split(":");

  if ( parsedUrl.protocol !== ("http:" || "https:") ) {
    return console.error("Webmaker-LoginAPI ERROR: Invalid uri!");
  }

  authBits = {
    user: authBits[0],
    pass: authBits[1]
  };

  var loginAPI = {
    getUser: function ( id, callback ) {
      request({
        auth: {
          username: authBits.user,
          password: authBits.pass,
          sendImmediately: false
        },
        method: "GET",
        uri: webmakerUrl + "user/" + id,
        json: true
      }, function ( error, response, body ) {
        if ( response.statusCode == 401 ) {
          return callback( "Authentication failed!" );
        }

        if ( error || body.error ) {
          return callback( error || body.error );
        }

        callback( null, body.user );
      });
    },
    isAdmin: function ( id, callback ) {
      request({
        auth: {
          username: authBits.user,
          password: authBits.pass,
          sendImmediately: false
        },
        method: "GET",
        uri: webmakerUrl + "isAdmin?id=" + id,
        json: true
      }, function ( error, response, body ) {
        if ( response.statusCode == 401 ) {
          return callback( "Authentication failed!" );
        }

        if ( error || body.error ) {
          return callback( error || body.error );
        }

        callback( null, body.isAdmin );
      });
    }
  }; // END LoginAPI

  // Routes declaration
  app.get( "/user/:userid", function( req, res ) {
    loginAPI.getUser(req.param( 'userid' ), function( err, user ) {
      if ( err || !user ) {
        return res.json( 404, {
          status: "failed",
          reason: ( err || "user not found" )
        });
      }
      req.session.username = user.username;
      res.json( 200, {
        status: "okay",
        user: user
      });
    });
  });

  return {
    Fogin: Fogin, 
    getUser: loginAPI.getUser,
    isAdmin: loginAPI.isAdmin
  };
};
