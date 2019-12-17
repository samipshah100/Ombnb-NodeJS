const express = require('express')
const router = express.Router()
//get the middleware
const auth = require('../../middleware/auth')

const User = require('../../models/User')
const config = require ('config')
const jwt = require('jsonwebtoken')
const { check, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')

// @route   GET api/auth
// @desc    Test route 
// @access  Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json(user)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server Error')
  }
})

// @route   POST api/auth
// @desc    Authenticate user and get token
// @access  Public
router.post(
  '/',
  [
    //validate using express-validator library
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Password is required'
    ).exists(),
  ],
  async (req, res) => {
    console.log(req.body)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    try {
      // get user from db
      let user = await User.findOne({ email: email })

      if (!user) {
        return res.status(400).json({ error: [{ msg: 'Invalid credentials' }] }) //bad request
      }

      const isMatch  = await bcrypt.compare(password, user.password)

      if(!isMatch) {
        return res.status(400).json({ error: [{ msg: 'Invalid credentials' }] }) //bad request
      }

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,//id is from mongo
        }
      }

      // signing and sending token
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err
          res.json({ token })
        }
      )

      // res.send('User Registered')
    } catch (err) {
      console.log(err.message)
      res.status(500).send('Server error')
    }
  }
)

module.exports = router
