# RTP LivePass data retrieval for Node

  Retrieve scan data from an RTP LivePass based season pass account.
  
  Defaults to Park City Mountain Resort.
  
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

## Retrieving Data from a different Resort

  Once you've determined the root endpoint for your resort's LivePass API, you can override the LivePassUser object's endpoint value.

  For example:

```javascript
var user = new LivePassUser();

user._resortEndpoint = "https://www.someresort.com/endpoint/";
```

For more information on determining your resort's LivePass API endpoint, see my blog post here: http://jeffstieler.com/projects/mylivepass-season-ski-pass-data-retrieval/