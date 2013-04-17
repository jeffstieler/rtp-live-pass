var LivePassUser = require("../lib/live-pass-user"),
	Util = require("../lib/live-pass-util"),
	nock = require("nock"),
	async = require("async"),
	zlib = require("zlib"),
	fs = require("fs");

module.exports = {
	"Build WCF Request": function(test) {

		var options = {
			url: "http://example.com/api/TestingService.svc",
			action: "http://Testing.Service.Test/ITestingService/Test",
			method: "Test",
			methodNS: "http://Testing.Service.Test",
			methodArgs: {
				"arg1": "arg1 value",
				"arg2": 1234
			},
			uuid: "urn:uuid:A7C641CE-2507-47A8-8E02-F6CA3AAEBB23"
		};

		var expected = '' +
			'<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing">' +
				'<s:Header>' +
					'<a:Action>http://Testing.Service.Test/ITestingService/Test</a:Action>' +
					'<a:MessageID>urn:uuid:A7C641CE-2507-47A8-8E02-F6CA3AAEBB23</a:MessageID>' +
					'<a:To>http://example.com/api/TestingService.svc</a:To>' +
					'<a:ReplyTo>' +
						'<a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address>' +
					'</a:ReplyTo>' +
				'</s:Header>' +
				'<s:Body>' +
					'<Test xmlns="http://Testing.Service.Test">' +
						'<arg1>arg1 value</arg1>' +
						'<arg2>1234</arg2>' +
					'</Test>' +
				'</s:Body>' +
			'</s:Envelope>';

		var result = Util.buildWCFRequest(options);

		test.equal(result, expected);

		test.done();
	},

	"LivePassUser.authenticate()": function(test) {

		var _nock = nock("https://secure.parkcitymountain.com");

		async.waterfall([
			function readAuthenticateResponseFile(callback) {
				fs.readFile(__dirname + "/data/nockAuthenticateResponse.xml", function(err, data) {
					if (err) {
						callback(err, null);
					} else {
						callback(null, data);
					}
				});
			},
			function gzipAuthenticateResponse(nockAuthenticateResponse, callback) {
				zlib.gzip(new Buffer(nockAuthenticateResponse), function(err, result) {
					callback(err, result);
				});
			},
			function mockAuthenticateResponse(responseBody, callback) {
				_nock.post("/mobile/LivePassAuthenticationService.svc").reply(200, responseBody);
				callback(null, _nock);
			},
			function readAccessCodeResponseFile(_nock, callback) {
				fs.readFile(__dirname + "/data/nockRetrieveAccessCodeResponse.xml", function(err, data) {
					if (err) {
						callback(err, null);
					} else {
						callback(null, data);
					}
				});
			},
			function gzipAccessCodeResponse(nockRetrieveAccessCodeResponse, callback) {
				zlib.gzip(new Buffer(nockRetrieveAccessCodeResponse), function(err, result) {
					callback(err, result);
				});
			},
			function mockAccessCodeResponse(responseBody, callback) {
				_nock.post("/mobile/CrmUserService.svc").reply(200, responseBody);
				callback(null, _nock);
			},
			function authenticateUser(_nock, callback) {
				var user = new LivePassUser();
				user.authenticate("user@example.com", "password", function(err, userObject) {

					test.equal(userObject.CustomerId, '1234567');
					test.equal(userObject.FirstName, 'Some');
					test.equal(userObject.LastName, 'User');
					test.equal(userObject.BirthDate, '1970-01-01');
					test.equal(userObject.PassMediaCode, 'GAT1234567');
					test.equal(userObject.AccessCode, 'PCBAN00KHR4A2H7U4');

					callback(err, userObject);
				});
			}
		], function(err, result) {

			test.done();
		});

	}
};

