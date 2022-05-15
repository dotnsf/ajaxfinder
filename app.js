//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    app = express();
  
var AjaxFinder = require('./ajaxfinder');

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.post( '/find', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var n = 100;
  var keywords = [];
  var url = '';

  if( req.body.n ){
    n = parseInt( req.body.n );
  }
  if( req.body.keywords ){
    keywords = req.body.keywords;
  }
  if( req.body.url ){
    url = req.body.url;
  }

  if( url ){
    var ajaxFinder = new AjaxFinder( n, keywords );
    ajaxFinder.searchHTML( url ).then( async function( js_urls ){
      var results = {};
      for( var i = 0; i < js_urls.length; i ++ ){
        var js_url = js_urls[i];
        var base = js_url.base;
        var src = js_url.src;

        if( src.startsWith( 'http' ) || src.startsWith( '//' ) ){
          //. 外部 JavaScript
        }else{
          var js_src = '';

          if( src.startsWith( '/' ) ){
            var tmp = base.split( '/' );
            if( tmp.length > 3 ){
              tmp = tmp.splice( 3, tmp.length - 3 );
            }
            base = tmp.join( '/' );
          }else{
            if( !base.endsWith( '/' ) ){
              base += '/';
            }
          }
          js_src = base + src;

          var ajax_urls = await ajaxFinder.searchJS( js_src );
          results[js_src] = ajax_urls;
        }
      }

      res.write( JSON.stringify( { status: true, results: results }, null, 2 ) );
      res.end();
    }).catch( function( err ){
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
      res.end();
    });
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: "parameter url required." }, null, 2 ) );
    res.end();
  }
});

var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

module.exports = app;
