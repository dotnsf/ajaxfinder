//. app.js
var client = require( 'cheerio-httpcli' );

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

async function searchJS( js_url, n, extra_keywords ){
  return new Promise( function( resolve, reject ){
    client.fetch( js_url, {}, 'UTF-8', function( err, $, res, body ){
      if( err ){
        reject( err );
      }else{
        var ajax_urls = [];
        var keywords = [
          '$.ajax',
          'xmlhttprequest',
          'axios',
          //'request',
          'fetch'
        ];
        
        if( extra_keywords && extra_keywords.length > 0 ){
          for( var i = 0; i < extra_keywords.length; i ++ ){
            keywords.push( extra_keywords[i] );
          }
        }

        if( keywords.length > 0 ){
          for( var i = 0; i < keywords.length; i ++ ){
            var idx = 0;
            while( idx > -1 ){
              var idx = body.toLowerCase().indexOf( keywords[i], idx );
              if( idx >= 0 ){
                var text = fetchText( body, idx, n );
                ajax_urls.push( { type: keywords[i], src: js_url, index: idx, text: text } );
                idx ++;
              }
            }
          }
        }

        resolve( ajax_urls );
      }
    });
  });
}

function usage(){
  console.log( 'Usage: node app [url] [n] [keyword0] [keyword1] ..' );
  console.log( '  - [url] : ページのURL' );
  console.log( '  - [n] : 前後何文字取得するか(Default:100)' );
  console.log( '  - [keywordx] : 追加で検索するキーワード' );
}

if( process.argv.length < 3 ){
  usage();
  process.exit( 1 );
}else{
  var N = 100;
  var keywords = [];

  if( process.argv.length > 3 ){
    N = parseInt( process.argv[3] );
  }
  if( process.argv.length > 4 ){
    for( var i = 4; i < process.argv.length; i ++ ){
      keywords.push( process.argv[i] );
    }
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

        var ajax_urls = await searchJS( js_src, N, keywords );
        if( ajax_urls.length ){
          console.log( ajax_urls );
        }
      }
    }
  }).catch( function( err ){
    console.log( err );
  });
}
