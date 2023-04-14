const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwtGenerator = require("../utils/jwtGenerator");

const validinfo = require("../middleware/validinfo");
const authorization = require("../middleware/authorization");

router.post("/register", validinfo, async (req, res) => {
  try {
    // 1. destructure the reqbody ( name, email, password)
    const { name, email, password } = req.body;
    //2. check if user exists ( if user exits send error)
    const user = await pool.query("SELECT * FROM users WHERE user_email = $1", [
      email,
    ]);

    if (user.rows.length !== 0) {
      return res.status(401).send("User already exists");
    }
    //3. Bcrypt the user password
    //if the user doesnt exist his information is inside the database but i need to bcrypt his password
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);
    //4. enter the user inside our database
    const newUser = await pool.query(
      "INSERT INTO users (user_name, user_email, user_password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, bcryptPassword]
    );
    //5. generate our jwt token
    const token = jwtGenerator(newUser.rows[0].user_id);
    res.json({ token });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

//login route
router.post("/login", validinfo, async (req, res) => {
  try {
    // 1 . destructure
    const { email, password } = req.body;
    // 2 . check if user doesnt exist ( if not we need t o thr er)
    const user = await pool.query("SELECT * FROM users WHERE user_email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json("Password or email incorrect");
    }
    // 3 . check if incoming oassword is the same as db password, we brought user upstairs step 2 we selected the user
    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].user_password
    );
    if (!validPassword) {
      return res.status(401).json("Password or Email is incorrect");
    }
    // 4 . give them a jwt token
    const token = jwtGenerator(user.rows[0].user_id);
    res.json({ token });
  } catch (error) {
    res.status(500).send("Server Error");
    console.error(error.message);
  }
});

router.get("/verify", authorization, async (req, res) => {
  try {
    console.log("It is true");
    res.json(true);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
