//. app.js
var client = require( 'cheerio-httpcli' );
var N = 100;

function fetchText( body, idx, n ){
  var s = idx - n;
  var w = 2 * n;

  if( idx < n ){
    s = 0;
    w -= idx;
  }

  if( n + idx > body.length ){
    w -= ( n + idx - body.length );
  }

  var text = body.substr( s, w );
  text = text.split( "\r" ).join( "" ).split( "\n" ).join( "" );

  return text;
}

async function searchHTML( html_url ){
  return new Promise( function( resolve, reject ){
    client.fetch( html_url, {}, 'UTF-8', function( err, $, res, body ){
      if( err ){
        reject( err );
      }else{
        var src_urls = [];
        $('script').each( function(){
          var src_url = $(this).attr( 'src' );
          if( src_url ){
            src_urls.push( { base: html_url, src: src_url } );
          }
        });

        resolve( src_urls );
      }
    });
  });
}

async function searchJS( js_url ){
  return new Promise( function( resolve, reject ){
    client.fetch( js_url, {}, 'UTF-8', function( err, $, res, body ){
      if( err ){
        reject( err );
      }else{
        var ajax_urls = [];

        //. ajax
        var idx = 0;
        while( idx > -1 ){
          var idx = body.toLowerCase().indexOf( '$.ajax', idx );
          if( idx >= 0 ){
            var text = fetchText( body, idx, N );
            ajax_urls.push( { type: 'ajax', src: js_url, index: idx, text: text } );
            idx ++;
          }
        }

        //. XMLHttpRequest
        var idx = 0;
        while( idx > -1 ){
          var idx = body.toLowerCase().indexOf( 'xmlhttprequest', idx );
          if( idx >= 0 ){
            var text = fetchText( body, idx, N );
            ajax_urls.push( { type: 'xmlhttprequest', src: js_url, index: idx, text: text } );
            idx ++;
          }
        }

        resolve( ajax_urls );
      }
    });
  });
}

function usage(){
  console.log( 'Usage: node app [url] [n]' );
  console.log( '  - [url] : ページのURL' );
  console.log( '  - [n] : 前後何文字取得するか(Default:100)' );
}

if( process.argv.length < 3 ){
  usage();
  process.exit( 1 );
}else{
  if( process.argv.length > 3 ){
    N = parseInt( process.argv[3] );
  }

  searchHTML( process.argv[2] ).then( async function( js_urls ){
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

        var ajax_urls = await searchJS( js_src );
        if( ajax_urls.length ){
          console.log( ajax_urls );
        }
      }
    }
  }).catch( function( err ){
    console.log( err );
  });
}
