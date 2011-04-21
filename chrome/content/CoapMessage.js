/*
 * Copyright (c) 2011, Institute for Pervasive Computing, ETH Zurich.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the Institute nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE INSTITUTE AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE INSTITUTE OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 * This file is part of the Copper CoAP Browser.
 */
/**
 * \file
 *         A wrapper for the different CoAP versions
 *
 * \author  Matthias Kovatsch <kovatsch@inf.ethz.ch>\author
 */

/*
 * Constants that must be present in all CoAP version modules
 * 
 * GET, POST, DELETE, SUBSCRIBE
 * WELL_KNOWN_RESOURCES
 * RESPONSE_TIMEOUT, MAX_RETRANSMIT
 */

//create a request/ack, received responses use parse()
function CoapMessage(type, code, uri, pl) {
	this.packet = new CoapPacket();
	
	this.packet.type = type;
	this.packet.code = code ? code : 0;
	
	// URI
	if (uri!=null) {
		this.setUri(uri);
	}
	// payload
	if (pl!=null) {
		this.setPayload(pl);
	}
}

CoapMessage.prototype = {
	packet : null,
	
	// message summary (e.g., for info/debug dumps)
	getSummary : function() {
		var ret = '';
		ret += ' Type: '+this.getType(true);
		ret += '\n Code: '+this.getCode(true);
		ret += '\n Transaction ID: '+this.getTID();
		ret += '\n Options ('+this.packet.optionCount+'): '+this.getOptions(true);
		ret += '\n Payload: '+this.getPayload();
		return ret;
	},
	
	// readable type
	getType : function(readable) {
		if (readable) {
			switch (parseInt(this.packet.type)) {
				case MSG_TYPE_CON: return 'Confirmable';
				case MSG_TYPE_NON: return 'Non-Confirmable';
				case MSG_TYPE_ACK: return 'Acknowledgment';
				case MSG_TYPE_RST: return 'Reset';
				default: return 'unknown ('+this.packet.type+')';
			}
		} else {
			return parseInt(this.packet.type);
		}
	},

	isConfirmable : function() {
		return this.packet.type==MSG_TYPE_CON;
	},
	
	getOptionCount : function() {
		return this.packet.optionCount;
	},
	
	// readable method or response code
	getCode : function(readable) {
		// codes are version specific
		return this.packet.getCode();
	},
	setCode : function(code) {
		this.packet.code = code;
	},
	
	getTID : function() {
		return this.packet.tid;
	},
	setTID : function(id) {
		this.packet.tid = id;
	},
	
	
	/*
	 * Option definitions for different versions
	 * 
	draft-05                            draft-03                            draft-00
	const OPTION_CONTENT_TYPE = 1;		const OPTION_CONTENT_TYPE = 1;		const OPTION_CONTENT_TYPE = 0;
										MUST be supported, once
										
	const OPTION_MAX_AGE = 2;			const OPTION_MAX_AGE = 2;			const OPTION_MAX_AGE = 3;
										once
										
	const OPTION_PROXY_URI = 3;			
	
	const OPTION_ETAG = 4;				const OPTION_ETAG = 4;				const OPTION_ETAG = 4;
										SHOULD be included for cache refresh, multiple
										
	const OPTION_URI_HOST = 5;			const OPTION_URI_AUTH = 5;			const OPTION_URI = 1;
										MUST be supported by proxy
										SHOULD be included if known, once
										
	const OPTION_LOCATION_PATH = 6;		const OPTION_LOCATION = 6;
										MAY be included for 30x response, once
										
	const OPTION_URI_PORT = 7;
	
	const OPTION_LOCATION_QUERY = 8;
	
	const OPTION_URI_PATH = 9;			const OPTION_URI_PATH = 9;			const OPTION_URI = 1;
										MUST be supported, once
										
	const OPTION_OBSERVE = 10;			const OPTION_SUB_LIFETIME = 10;		const OPTION_SUB_LIFETIME = 6;
	
	const OPTION_TOKEN = 11;			const OPTION_TOKEN = 11;
										MUST be included for delayed response (SHOULD omit Uri), once
										If delayed and no option in req, return 240
										
	const OPTION_BLOCK = 13;			const OPTION_BLOCK = 13;
	
	const OPTION_NOOP = 14;				const OPTION_NOOP = 14;
	
	const OPTION_URI_QUERY = 15;		const OPTION_URI_QUERY = 15;		const OPTION_URI = 1;
										MUST be supported, once
																			const OPTION_URI_CODE = 2;
																			const OPTION_DATE = 5;
	*/
	
	// OPTION_CONTENT_TYPE:00+
	getContentType : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_CONTENT_TYPE);
		var opt = this.packet.getOption(OPTION_CONTENT_TYPE); // integer

		if (optLen<=0) return null;
		
		if (readable) {
			var ret = 'unknown';
			switch (opt) {
				case CONTENT_TYPE_TEXT_PLAIN: ret = 'text/plain'; break;
				case CONTENT_TYPE_TEXT_XML: ret = 'text/xml'; break;
				case CONTENT_TYPE_TEXT_CSV: ret = 'text/csv'; break;
				case CONTENT_TYPE_TEXT_HTML: ret = 'text/html'; break;
				case CONTENT_TYPE_IMAGE_GIF: ret = 'image/gif'; break;
				case CONTENT_TYPE_IMAGE_JPEG: ret = 'image/jpeg'; break;
				case CONTENT_TYPE_IMAGE_PNG: ret = 'image/png'; break;
				case CONTENT_TYPE_IMAGE_TIFF: ret = 'image/tiff'; break;
				case CONTENT_TYPE_AUDIO_RAW: ret = 'audio/raw'; break;
				case CONTENT_TYPE_VIDEO_RAW: ret = 'video/raw'; break;
				case CONTENT_TYPE_APPLICATION_LINK_FORMAT: ret = 'application/link-format'; break;
				case CONTENT_TYPE_APPLICATION_XML: ret = 'application/xml'; break;
				case CONTENT_TYPE_APPLICATION_OCTET_STREAM: ret = 'application/octet-stream'; break;
				case CONTENT_TYPE_APPLICATION_RDF_XML: ret = 'application/rdf+xml'; break;
				case CONTENT_TYPE_APPLICATION_SOAP_XML: ret = 'application/soap+xml'; break;
				case CONTENT_TYPE_APPLICATION_ATOM_XML: ret = 'application/atom+xml'; break;
				case CONTENT_TYPE_APPLICATION_XMPP_XML: ret = 'application/xmpp+xml'; break;
				case CONTENT_TYPE_APPLICATION_EXI: ret = 'application/exi'; break;
				case CONTENT_TYPE_APPLICATION_X_BXML: ret = 'application/x-bxml'; break;
				case CONTENT_TYPE_APPLICATION_FASTINFOSET: ret = 'application/fastinfoset'; break;
				case CONTENT_TYPE_APPLICATION_SOAP_FASTINFOSET: ret = 'application/soap+fastinfoset'; break;
				case CONTENT_TYPE_APPLICATION_JSON: ret = 'application/json'; break;
				case CONTENT_TYPE_APPLICATION_X_OBIX_BINARY: ret = 'application/x-obix-binary'; break;
			}
			return new Array('Content-Type', ret, opt);
		} else {
			return opt;
		}
	},
	setContentType : function(content) {
		if (content>0xFF) {
			dump('WARNING: CoapMessage.setContentType [must be 1 byte; ignoring]\n');
		} else {
			this.packet.setOption(OPTION_CONTENT_TYPE, content);
		}
	},
	
	// OPTION_MAX_AGE:00+
	getMaxAge : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_MAX_AGE);
		var opt = this.packet.getOption(OPTION_MAX_AGE); // integer
		
		if (optLen<=0) return null;

		if (readable) {
			
			var ret = '';
			var time = opt;
			
			if (time==0) {
				ret += '0 ';
			} else {
				// split into weeks, days, hours, minutes, and seconds
				var s = time % 60;
				time = Math.floor(time/60);
				var m = time % 60;
				time = Math.floor(time/60);
				var h = time % 24;
				time = Math.floor(time/24);
				var d = time % 7;
				time = Math.floor(time/7);
				var w = time;
				
				var y = 0;
				if (w>104) var y = Math.round(1212424351/60.0/60.0/24.0/365.25*100.0)/100.0;
				
				// only print from largest to smallest given unit
				if (w) ret += w+'w ';
				if (d||(w&&(h||m||s))) ret += d+'d ';
				if (h||((w||d)&&(m||s))) ret += h+'h ';
				if (m||((w||d||h)&&s)) ret += m+'m ';
				if (s) ret += s+'s ';
				if (y) ret += '(~'+y+'y) ';
			}
			
			return new Array('Max-Age', ret.substring(0, ret.length-1), optLen+' byte(s)');
		} else {
			return opt;
		}
	},
	setMaxAge : function(age) {
		if (age>0xFFFFFFFF) {
			age = (0xFFFFFFFF & age);
			dump('WARNING: CoapMessage.setMaxAge [max-age must be 1-4 bytes; masking to 4 bytes]\n');
		}
		this.packet.setOption(OPTION_MAX_AGE, age);
	},
	
	// OPTION_PROXY_URI:04+
	getProxyUri : function(readable) {
		
		if (coapVersion < 4) {
			return null;
		}

		var optLen = this.packet.getOptionLength(OPTION_PROXY_URI);
		var opt = this.packet.getOption(OPTION_PROXY_URI); // string

		if (optLen<=0) return null;
		
		if (readable) {
			return new Array('Proxy-Uri', opt, optLen+' byte(s)');
		} else {
			return opt;
		}
	},
	
	// OPTION_ETAG:00+
	getETag : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_ETAG);
		var opt = this.packet.getOption(OPTION_ETAG); // byte array

		if (optLen<=0) return null;

		if (readable) {
			return new Array('ETag', '0x'+opt.toString(16).toUpperCase(), optLen+' byte(s)');
		} else {
			return opt;
		}
	},
	setETag : function(tag) {
		if (tag>0xFFFFFFFF) {
			tag = (0xFFFFFFFF & tag);
			dump('WARNING: CoapMessage.setETag [token must be 1-4 bytes; masking to 4 bytes]\n');
		}
		this.packet.setOption(OPTION_ETAG, tag);
	},
	
	// OPTION_URI_HOST:04+ / OPTION_URI_AUTH:03*renamed
	getUriHost : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_URI_HOST);
		var opt = this.packet.getOption(OPTION_URI_HOST); // string
		
		if (optLen<=0) return null;
		
		if (readable) {
			return new Array('Uri-Host', opt, optLen+' byte(s)');
		} else {
			return opt;
		}
	},
	setUriHost : function(host) {
		this.packet.setOption(OPTION_URI_HOST, host);
	},
	// OPTION_URI_PORT:04+
	getUriPort : function(readable) {
		
		if (coapVersion < 4) {
			return null;
		}

		var optLen = this.packet.getOptionLength(OPTION_URI_PORT);
		var opt = this.packet.getOption(OPTION_URI_PORT); // int

		if (optLen<=0) return null;
		
		if (readable) {
			return new Array('Uri-Port', opt, optLen+' byte(s)');
		} else {
			return opt;
		}
	},
	// multiple OPTION_URI_PATH:04+ / OPTION_URI_PATH:03+
	getUriPath : function(readable) {
		// multiple OPTION_URI_PATH options should be concatinated during datagram parsing
		// TODO: maybe use a string array later

		var optLen = this.packet.getOptionLength(OPTION_URI_PATH);
		var opt = this.packet.getOption(OPTION_URI_PATH); // string

		if (optLen<=0) return null;
		
		if (readable) {
			return new Array('Uri-Path', opt, optLen+' byte(s)');
		} else {
			return opt;
		}
	},
	// OPTION_URI_QUERY:03+
	getUriQuery : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_URI_QUERY);
		var opt = this.packet.getOption(OPTION_URI_QUERY); // string

		if (optLen<=0) return null;
		
		if (readable) {
			return new Array('Uri-Query', opt, optLen+' byte(s)');
		} else {
			return opt;
		}
	},
	// convenience function
	getUri : function(readable) {
		
		var host = this.getUriHost();
		var port = this.getUriPort();
		var path = this.getUriPath();
		var query = this.getUriQuery();
		
		var uri = '';
		var decoded = 0;
		if (host) {
			uri += 'coap://' + host;
			++decoded;
		}
		if (port) {
			uri += ':' + port;
			++decoded;
		}
		if (path) {
			uri += '/' + path;
			++decoded;
		}
		if (query) {
			uri += '?' + query;
			++decoded;
		}

		if (decoded<=0) return null;
		
		if (readable) {
			return new Array('Uri', uri, decoded+(decoded==1 ? ' option' : ' options'));
		} else {
			return uri;
		}
	},
	setUri : function(uri) {
		// URI encoding is version specific
		this.packet.setUri(uri);
	},
	
	// multiple OPTION_LOCATION_PATH:04+ / OPTION_LOCATION:03*renamed
	getLocationPath : function(readable) {
		// multiple OPTION_LOCATION_PATH options should be concatinated during datagram parsing
		// TODO: maybe use a string array later
		
		var optLen = this.packet.getOptionLength(OPTION_LOCATION_PATH);
		var opt = this.packet.getOption(OPTION_LOCATION_PATH); // string

		if (optLen<=0) return null;
		
		if (readable) {
			if (opt.charAt(0)!='/') opt = '/' + opt;
			return new Array('Location-Path', opt, optLen+' byte(s)');
		} else {
			return opt;
		}
	},
	setLocationPath : function(path) {
		this.packet.setOption(OPTION_LOCATION_PATH, path);
	},
	// OPTION_LOCATION_QUERY:05+
	getLocationQuery : function(readable) {
		
		if (coapVersion < 5) {
			return null;
		}

		var optLen = this.packet.getOptionLength(OPTION_LOCATION_QUERY);
		var opt = this.packet.getOption(OPTION_LOCATION_QUERY); // string

		if (optLen<=0) return null;
		
		if (readable) {
			return new Array('Location-Query', opt, optLen+' byte(s)');
		} else {
			return opt;
		}
	},
	// convenience function
	getLocation : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_LOCATION_PATH);
		var opt = this.packet.getOption(OPTION_LOCATION_PATH); // string
		
		var opt2 = null;
		var optLen2 = 0;

		if (coapVersion >= 5) {
			if (this.packet.getOptionLength(OPTION_LOCATION_QUERY)) {
				opt += '?' + this.packet.getOption(OPTION_LOCATION_QUERY);
				optLen2 = this.packet.getOptionLength(OPTION_LOCATION_QUERY);
			}
		}
		
		if (optLen+optLen2<=0) return null;
		
		if (readable) {
			if (opt.charAt(0)!='/') opt = '/' + opt;
			return new Array('Location', opt, optLen2>0 ? '2 options' : '1 option');
		} else {
			return opt;
		}
	},
	
	// OPTION_TOKEN:03+
	getToken : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_TOKEN);
		var opt = this.packet.getOption(OPTION_TOKEN); // byte array, treat as int
		
		if (optLen<=0) return null;
		
		if (readable) {
			return new Array('Token', '0x'+opt.toString(16).toUpperCase(), optLen+' byte(s)'); 
		} else {
			return opt;
		}
	},
	setToken : function(token) {
		if (token>0xFFFF) {
			token = (0xFFFF & token);
			dump('WARNING: CoapMessage.setToken [token must be 1-2 bytes; masking to 2 bytes]\n');
		}
		this.packet.setOption(OPTION_TOKEN, token);
	},
	
	// OPTION_BLOCK:03+
	getBlock : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_BLOCK);
		var opt = this.packet.getOption(OPTION_BLOCK); // integer

		if (optLen<=0) return null;
		
		if (readable) {
			var ret = this.getBlockNumber();
			if (this.getBlockMore()) ret += '+';
			ret += ' ('+this.getBlockSize()+' B/block)';
			return new Array('Block', ret, optLen+' byte(s)');
		} else {
			return opt;
		}
	},
	setBlock : function(num, size) {
		var block = num << 4;
		var szx = 0;
		
		// check for power of two and correct size
		if (!isPowerOfTwo(size)) {
			dump('WARNING: CoapMessage.setBlock ['+size+' not a power of two; using next smaller power]\n');
		}
		if (size<16) {
			size = 16;
			dump('WARNING: CoapMessage.setBlock [block size must be >=16; using 16]\n');
		}
		if (size>2048) {
			size = 2048;
			dump('WARNING: CoapMessage.setBlock [block size must be <=2048; using 2048]\n');
		}
		
		size >>= 4;
		for (szx = 0; size; ++szx) size >>= 1;
		block |= szx - 1;
		
		this.packet.setOption(OPTION_BLOCK, block);
	},
	// convenience functions for block option parts
	getBlockNumber : function() {
		return (this.getBlock() >> 4);
	},
	getBlockSize : function() {
		return (16 << (0x07 & this.getBlock()));
	},
	getBlockMore : function() {
		return (0x08 & this.getBlock());
	},

	// OPTION_SUB_LIFETIME:draft-ietf-core-observe-00*renamed
	getObserve : function(readable) {
		var optLen = this.packet.getOptionLength(OPTION_OBSERVE);
		var opt = this.packet.getOption(OPTION_OBSERVE); // int

		if (optLen<=0) return null;
		
		if (readable) {
			return new Array('Observe', opt, optLen+' byte(s)'); 
		} else {
			return opt;
		}
	},
	setObserve : function(num) {
		if (num> 0xFFFFFFFF) time = 0xFFFFFFFF;
		this.packet.setOption(OPTION_OBSERVE, num);
	},
	
	// readable options list
	getOptions : function(readable) {
		
		if (readable) {
			var ret = '';
	
			if (this.getContentType()!=null) ret += this.getContentType(true)[0] + ': ' + this.getContentType(true)[1] + ' ['+this.getContentType(true)[2]+']; ';
			if (this.getMaxAge()!=null) ret += this.getMaxAge(true)[0] + ': ' + this.getMaxAge(true)[1] + ' ['+this.getMaxAge(true)[2]+']; ';
			if (this.getProxyUri()!=null) ret += this.getProxyUri(true)[0] + ': ' + this.getProxyUri(true)[1] + ' ['+this.getProxyUri(true)[2]+']; ';
			if (this.getETag()!=null) ret += this.getETag(true)[0] + ': ' + this.getETag(true)[1] + ' ['+this.getETag(true)[2]+']; ';
			if (this.getUri()!=null) ret += this.getUri(true)[0] + ': ' + this.getUri(true)[1] + ' ['+this.getUri(true)[2]+']; ';
			if (this.getLocation()!=null) ret += this.getLocation(true)[0] + ': ' + this.getLocation(true)[1] + ' ['+this.getLocation(true)[2]+']; ';
			if (this.getObserve()!=null) ret += this.getObserve(true)[0] + ': ' + this.getObserve(true)[1] + ' ['+this.getObserve(true)[2]+']; ';
			if (this.getToken()!=null) ret += this.getToken(true)[0] + ': ' + this.getToken(true)[1] + ' ['+this.getToken(true)[2]+']; ';
			if (this.getBlock()!=null) ret += this.getBlock(true)[0] + ': ' + this.getBlock(true)[1] + ' ['+this.getBlock(true)[2]+']; ';
			
			return ret;
		} else {
			var ret = new Array();
			
			if (this.getContentType()!=null) ret.push(this.getContentType(true));
			if (this.getMaxAge()!=null) ret.push( this.getMaxAge(true) );
			if (this.getProxyUri()!=null) ret.push( this.getProxyUri(true) );
			if (this.getETag()!=null) ret.push( this.getETag(true) );
			if (this.getUri()!=null) ret.push( this.getUri(true) );
			if (this.getLocation()!=null) ret.push( this.getLocation(true) );
			if (this.getObserve()!=null) ret.push( this.getObserve(true) );
			if (this.getToken()!=null) ret.push( this.getToken(true) );
			if (this.getBlock()!=null) ret.push( this.getBlock(true) );
			
			return ret;
		}
	},
	
	// check if option is present
	isOption : function(optType) {
		var list = this.packet.getOptions();
		for (var i in list) {
			if (list[i]==optType) return true;
		}
		return false;
	},
	
	
	// payload functions
	getPayload : function() {
		return this.packet.payload;
	},
	setPayload : function(pl) {
		this.packet.payload = pl;
	},
	
	
	// convert message into datagram bytes
	serialize : function() {
		return this.packet.serialize();
	},
	
	// convert datagram bytes into message
	parse : function(datagram) {
		this.packet.parse(datagram);
	}
};
