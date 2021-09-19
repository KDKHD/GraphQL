export var cookieExtractor = function(req:any) {
    var token = null;
    if (req && req.cookies) token = req.cookies['token'];
    return token;
  };