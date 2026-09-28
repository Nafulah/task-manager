const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "No token, auth denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
    if (decoded.user) {
      req.user = decoded.user;
    } else {
      req.user = decoded;
    }
    if (!req.user.id && req.user._id) {
      req.user.id = req.user._id;
    }
    console.log("Auth OK, user:", req.user.id); 
    next();
  } catch (err) {
    console.log("Auth FAIL:", err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
};