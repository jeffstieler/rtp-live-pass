var LivePassUser = require("../lib/live-pass-user"),
	Util = require("../lib/live-pass-util");

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
	}
};

