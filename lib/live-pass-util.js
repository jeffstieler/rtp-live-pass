var _ = require("underscore"),
	XML = require("xml"),
	uuid = require("node-uuid"),
	xml2js = require("xml2js"),
	zlib = require("zlib"),
	request = require("request"),
	async = require("async");

/**
 * Make a request to the LivePass service
 *
 * Example options object:
 * {
 * 		url      : "https://website.com/LivePassAuthenticationService.svc",
 * 		action   : "http://RTP.LivePass.Authentication/ILivePassAuthenticationService/Authenticate",
 * 		method   : "Authenticate",
 * 		methodNS : "http://RTP.LivePass.Authentication",
 * 		args     : {
 * 			userName: "guy",
 * 			password: "banana"
 * 		}
 * }
 *
 * - forms XML for WCF request (using WS-Addressing)
 * - GZips XML payload
 * - makes HTTP request
 * - GUnzips response body
 *
 * @uses buildWCFRequest
 * @param options
 * @param requestCallback
 */
function livePassRequest(options, requestCallback) {

	_.defaults(options, {
		url: "",
		action: "",
		method: "",
		methodNS: "",
		methodArgs: {}
	});

	// TODO: check options here!

	var body = buildWCFRequest(options);

	async.waterfall([
		function gzipRequest(callback) {
			zlib.gzip(new Buffer(body), function(err, result) {
				callback(err, result);
			});
		},
		function postRequest(body, callback) {
			var args = {
				url: options.url,
				body: body,
				headers: {
					"Content-Type": "application/x-gzip"
				},
				encoding: null
			};
			if (options.jar) {
				args.jar = options.jar;
			}
			request.post(args, function(err, res) {
				callback(err, res);
			});
		},
		function gunzipRequest(response, callback) {
			zlib.gunzip(new Buffer(response.body), function(err, result) {
				response.body = result;
				callback(err, response);
			});
		},
		function parseXMLBodyAsJS(res, callback) {
			xml2js.parseString(res.body.toString(), function(err, result) {

				if (err) {
					return callback(err, null);
				}

				var body = result["s:Envelope"]["s:Body"][0];

				callback(null, body);

			});
		}
	], function(err, result) {
		requestCallback(err, result);
	});

}

/**
 * Builds a SOAP XML envelope (WS-Addressing) based on options
 *
 * @param options
 * @return {--null-string--}
 */
function buildWCFRequest(options) {

	_.defaults(options, {
		url: "",
		action: "",
		method: "",
		methodNS: "",
		methodArgs: {},
		uuid: ""
	});

	var methodObject = {};
	methodObject[options.method] = [
		{
			_attr: {
				xmlns: options.methodNS
			}
		}
	];

	// super naive at the moment - single depth objects for args ONLY
	_.each(_.pairs(options.methodArgs), function(argPair) {
		var argObject = {};
		argObject[argPair[0]] = argPair[1];
		methodObject[options.method].push(argObject);
	});

	var body = XML([{
		"s:Envelope": [
			{
				_attr: {
					"xmlns:s": "http://www.w3.org/2003/05/soap-envelope",
					"xmlns:a": "http://www.w3.org/2005/08/addressing"
				}
			},
			{
				"s:Header": [
					{
						"a:Action" : options.action
					},
					{
						"a:MessageID": options.uuid || "urn:uuid:" + uuid.v4().toUpperCase()
					},
					{
						"a:To": options.url
					},
					{
						"a:ReplyTo" : [
							{
								"a:Address": "http://www.w3.org/2005/08/addressing/anonymous"
							}
						]
					}
				]
			},
			{
				"s:Body": [ methodObject ]
			}
		]
	}]);

	return body;

}

module.exports.buildWCFRequest = buildWCFRequest;
module.exports.livePassRequest = livePassRequest;