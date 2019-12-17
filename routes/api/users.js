const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')

// User model

const User = require('../../models/User')

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  '/',
  [
    //validate using express-validator library
    check('name', 'Name is required')
      .not()
      .isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    console.log(req.body)
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body
    try {
      // See if user exists
      let user = await User.findOne({ email: email })

      if (user) {
        return res.status(400).json({ error: [{ msg: 'User already exists' }] }) //bad request
      }

      // Get users gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      })

      //create a user
      user = new User({ name, email, avatar, password })

      // Encrypt password

      const salt = await bcrypt.genSalt(10)

      user.password = await bcrypt.hash(password, salt)

      // save user in mongoDB
      await user.save()

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        }
      }

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
