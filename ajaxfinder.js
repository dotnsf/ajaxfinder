//. ajaxfinder.js
var client = require( 'cheerio-httpcli' );

class AjaxFinder{
  constructor( n, keywords ){
    this.n = n;
    this.keywords = [];
    for( var i = 0; i < keywords.length; i ++ ){
      this.keywords.push( keywords[i] );
    };
  }

  async searchHTML( html_url ){
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
      }.bind( this ) );
    }.bind( this ) );
  }

  async searchJS( js_url ){
    return new Promise( function( resolve, reject ){
      client.fetch( js_url, {}, 'UTF-8', function( err, $, res, body ){
        if( err ){
          reject( err );
        }else{
          var ajax_urls = [];
          var keywords = [
            'ajax',
            //'xmlhttprequest',
            'axios',
            'request',
            'superagent',
            'http-proxy',
            'undici',
            'hyperquest',
            'libcurl',
            'wreck',
            'purest',
            'flashheart',
            'fetch'
          ];
          
          if( this.keywords && this.keywords.length > 0 ){
            for( var i = 0; i < this.keywords.length; i ++ ){
              keywords.push( this.keywords[i] );
            }
          }
  
          if( keywords.length > 0 ){
            for( var i = 0; i < keywords.length; i ++ ){
              var idx = 0;
              while( idx > -1 ){
                var idx = body.toLowerCase().indexOf( keywords[i], idx );
                if( idx >= 0 ){
                  var text = this.fetchText( body, idx, this.n );
                  ajax_urls.push( { type: keywords[i], src: js_url, index: idx, text: text } );
                  idx ++;
                }
              }
            }
          }

          resolve( ajax_urls );
        }
      }.bind( this ) );
    }.bind( this ) );
  }

  fetchText( body, idx, n ){
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
}


module.exports = AjaxFinder;
