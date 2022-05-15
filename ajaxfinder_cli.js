//. ajax_finder_cli.js
var client = require( 'cheerio-httpcli' );
var AjaxFinder = require('./ajaxfinder');

function usage(){
  console.log( 'Usage: node ajax_finder_cli [url] [n] [keyword0] [keyword1] ..' );
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

  var ajaxFinder = new AjaxFinder( N, keywords );
  ajaxFinder.searchHTML( process.argv[2] ).then( async function( js_urls ){
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
        if( ajax_urls.length ){
          console.log( ajax_urls );
        }
      }
    }
  }).catch( function( err ){
    console.log( err );
  });
}
