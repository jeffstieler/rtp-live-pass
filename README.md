# RTP LivePass data retrieval for Node

  Retrieve scan data from an RTP LivePass based season pass account.
  
  Currently only supports Park City Mountain Resort.
  
## Install

    $ npm install rtp-live-pass

## Example Usage


```javascript
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
```