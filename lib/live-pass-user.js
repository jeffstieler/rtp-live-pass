var request = require("request"),
	async = require("async"),
	_ = require("underscore"),
	util = require("./live-pass-util");

/**
 * LivePassUser()
 *
 * @constructor
 */
function LivePassUser() {
	// Right now, we only support Park City Mountain Resort
	this._resortEndpoint = "https://secure.parkcitymountain.com/mobile/";
	// We have to maintain cookies from API responses
	this._cookieJar = request.jar();
	// User Profile info populated from API
	this.CustomerId = "";
	this.FirstName = "";
	this.LastName = "";
	this.BirthDate = "";
	this.PassMediaCode = "";
	// Access Code used to retrieve scan history
	this.AccessCode = "";
}

/**
 * Authenticate an RTP Live Pass User and retrieve their AccessCode
 *
 * - The following user data is retrieved and stored on the user object
 *   - CustomerId
 *   - FirstName
 *   - LastName
 *   - BirthDate
 *   - PassMediaCode
 *   - AccessCode
 *
 * - The callback will be passed an error (or null), and the user
 *
 * @param login
 * @param password
 * @param authCallback
 */
LivePassUser.prototype.authenticate = function(login, password, authCallback) {

	// TODO: check login and password values here
	var user = this;

	async.waterfall([
		function logUserIn(callback) {

			util.livePassRequest({

				url: user._resortEndpoint + "LivePassAuthenticationService.svc",
				action: "http://RTP.LivePass.Authentication/ILivePassAuthenticationService/Authenticate",
				method: "Authenticate",
				methodNS: "http://RTP.LivePass.Authentication",
				methodArgs: {
					userName: login,
					password: password
				},
				jar: user._cookieJar

			}, function(err, body) {

				callback(err, body);

			});

		},
		function parseAuthResponse(body, callback) {

			var authenticateResult = body.AuthenticateResponse[0].AuthenticateResult[0];

			if (authenticateResult.User) {

				_.each(['CustomerId',
					'FirstName',
					'LastName',
					'BirthDate',
					'PassMediaCode'], function(key) {
					user[key] = authenticateResult.User[0][key][0];
				});

				callback(null, user);

			} else if (authenticateResult["AuthenticateAndReturnUserInfo-Response"]) {

				var result = authenticateResult["AuthenticateAndReturnUserInfo-Response"][0];

				var error = new Error(result.AuthenticationError[0]);

				callback(error, null);

			} else {

				callback(new Error("An unknown error occurred authenticating."), null);

			}

		},
		function getUserAccessCode(theUser, callback) {

			user.getAccessCode(function(error, accessCode) {

				callback(error, accessCode);

			});

		}
	], function(err, accessCode) {

		if (err) {

			authCallback(err, null);

		} else {

			authCallback(null, user);

		}

	});

};

/**
 * Retrieve a user's AccessCode (used to retrieve scan data)
 *
 * @param callback
 */
LivePassUser.prototype.getAccessCode = function(accessCodeCallback) {

	var user = this;

	if ( ("" === user.CustomerId) || (0 === user._cookieJar.cookies.length) ) {
		return accessCodeCallback(new Error("User must be authenticated before retrieving AccessCode."), null);
	}

	util.livePassRequest({

		url: user._resortEndpoint + "CrmUserService.svc",
		action: "http://RTP.LivePass.CrmUserService/ICrmUserService/RetrievePrepaidAccessProducts",
		method: "RetrievePrepaidAccessProducts",
		methodNS: "http://RTP.LivePass.CrmUserService",
		methodArgs: {
			customerId: user.CustomerId
		},
		jar: user._cookieJar

	}, function(err, body) {

		if (err) {

			return accessCodeCallback(err, null);

		}

		var accessCodeResult = body.RetrievePrepaidAccessProductsResponse[0].RetrievePrepaidAccessProductsResult[0].AccessProducts[0];

		if (accessCodeResult.AccessProduct) {

			var accessCode = accessCodeResult.AccessProduct[0].AccessCode[0];

			user.AccessCode = accessCode;

			accessCodeCallback(null, accessCode);

		} else {

			accessCodeCallback(new Error("No access code found for CustomerId " + user.CustomerId), null);

		}

	});
};

/**
 * Retrieves a user's scan history and passes it to the provided callback
 *
 * - Example return:
 * [
 *  {
 *    AccessDate: '1970-01-01',
 *    AccessTime: '1:11 PM',
 *    AccessLocationDescription: 'Resort: Lift Name'
 *  }
 *  ...
 * ]
 *
 * @param scanHistoryCallback
 */
LivePassUser.prototype.getScanHistory = function(scanHistoryCallback) {

	var user = this;

	if ( ("" === user.AccessCode) || (0 === user._cookieJar.cookies.length) ) {
		return scanHistoryCallback(new Error("User must be authenticated and have AccessCode before retrieving scan history."), null);
	}

	util.livePassRequest({

		url: user._resortEndpoint + "CrmUserService.svc",
		action: "http://RTP.LivePass.CrmUserService/ICrmUserService/RetrieveIndividualAccessScanHistory",
		method: "RetrieveIndividualAccessScanHistory",
		methodNS: "http://RTP.LivePass.CrmUserService",
		methodArgs: {
			accessCode: user.AccessCode
		},
		jar: user._cookieJar

	}, function(err, body) {

		if (err) {

			scanHistoryCallback(err, null);

		} else {

			var scanHistoryResult = body.RetrieveIndividualAccessScanHistoryResponse[0].RetrieveIndividualAccessScanHistoryResult[0];

			if (scanHistoryResult.ScanHistory) {

				var scans = scanHistoryResult.ScanHistory[0].Scan;

				var scanHistory = _.pluck(scans, "$");

				scanHistoryCallback(null, scanHistory);

			} else {

				scanHistoryCallback(new Error("No scan history found for access code " + accessCode), null);

			}

		}

	});
};

module.exports = LivePassUser;