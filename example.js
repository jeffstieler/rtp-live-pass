var LivePassUser = require("./index"),
	async = require("async");

var user = new LivePassUser();

async.waterfall([
	function (callback) {
		user.authenticate("email@example.com", "password", function(err, accessCode) {
			callback(err, accessCode);
		});
	},
	function (accessCode, callback) {
		user.getScanHistory(function(err, history) {
			callback(err, history);
		});
	}
], function (err, result) {
	console.log(err);
	console.log(result);
});