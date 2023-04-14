const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    //1. destructure what is inside the token
    const jwtToken = await req.header("token");
    if (!jwtToken) {
      return res.status(403).json("Not Authorized");
    }
    const payload = jwt.verify(jwtToken, process.env.jwtSecret);
    req.user = payload.user;
  } catch (error) {
    console.log(error.message);
    return res.status(403).json("Not Authorised");
  }
  next();
};
