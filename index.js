var Iconv, jsencoding, iconvLite = require("iconv-lite");

try{
    Iconv  = require("iconv").Iconv;
}catch(E){}

try{
    jsencoding = require('jsencoding');
}catch(E){}

// Expose to the world
module.exports.convert = convert;

/**
 * Convert encoding of an UTF-8 string or a buffer
 *
 * @param {String|Buffer} str String to be converted
 * @param {String} to Encoding to be converted to
 * @param {String} [from="UTF-8"] Encoding to be converted from
 * @param {Boolean} useLite If set to ture, force to use iconvLite
 * @return {Buffer} Encoded string
 */
function convert(str, to, from, useLite){
    from = checkEncoding(from || "UTF-8");
    to = checkEncoding(to || "UTF-8");
    str = str || "";

    var result;

    if(from != "UTF-8" && typeof str == "string"){
        str = new Buffer(str, "binary");
    }

    if(from == to){
        result = str;
    }else{
        if(jsencoding &&
           jsencoding.encodingExists(to) &&
           jsencoding.encodingExists(from) ) {
            result = convertJsEncoding(str, to, from);
        }else{
            if(Iconv && !useLite){
                try{
                    result = convertIconv(str, to, from);
                }catch(E){
                    try{
                        result = convertIconvLite(str, to, from);
                    }catch(E){
                        result = str;
                    }
                }
            }else{
                try{
                    result = convertIconvLite(str, to, from);
                }catch(E){
                    result = str;
                }
            }
        }
    }

    if(typeof result == "string"){
        result = new Buffer(result, "utf-8");
    }

    return result;
}

/**
 * Convert encoding of astring with node-iconv (if available)
 *
 * @param {String|Buffer} str String to be converted
 * @param {String} to Encoding to be converted to
 * @param {String} [from="UTF-8"] Encoding to be converted from
 * @return {Buffer} Encoded string
 */
function convertIconv(str, to, from){
    var response, iconv;
    iconv = new Iconv(from, to + "//TRANSLIT//IGNORE");
    response = iconv.convert(str);
    return response.slice(0, response.length);
}

/**
 * Convert encoding of astring with iconv-lite (if node-iconv is not available)
 *
 * @param {String|Buffer} str String to be converted
 * @param {String} to Encoding to be converted to
 * @param {String} [from="UTF-8"] Encoding to be converted from
 * @return {Buffer} Encoded string
 */
function convertIconvLite(str, to, from){
    if(to == "UTF-8"){
        return iconvLite.decode(str, from);
    }else if(from == "UTF-8"){
        return iconvLite.encode(str, to);
    }else{
        return iconvLite.encode(iconvLite.decode(str, from), to);
    }
}

/**
 * Convert encoding of astring with jsencoding, taken from node-imap
 *
 * @param {String|Buffer} str String to be converted
 * @param {String} to Encoding to be converted to
 * @param {String} [from="UTF-8"] Encoding to be converted from
 * @return {Buffer} Encoded string
 */
function convertJsEncoding(str, to, from){
    if(to == "UTF-8"){
        return jsencoding.TextDecoder(from).decode(str);
    }else if(from == "UTF-8"){
        return jsencoding.TextDecoder(to).encode(str);
    }else{
        return jsencoding.TextDecoder(to).encode(
                   jsencoding.TextDecoder(from).decode(str)
               );
    }
}

/**
 * Converts charset name if needed
 *
 * @param {String} name Character set
 * @return {String} Character set name
 */
function checkEncoding(name){
    name = (name || "").toString().trim().
        replace(/^latin[\-_]?(\d+)$/i, "ISO-8859-$1").
        replace(/^win(?:dows)?[\-_]?(\d+)$/i, "WINDOWS-$1").
        replace(/^utf[\-_]?(\d+)$/i, "UTF-$1").
        replace(/^ks_c_5601\-1987$/i, "CP949").
        replace(/^us[\-_]?ascii$/i, "ASCII").
        toUpperCase();
    return name;
}
