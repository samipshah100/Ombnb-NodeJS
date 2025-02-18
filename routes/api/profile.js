const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const config = require('config')
const request = require('request')

const Profile = require('../../models/Profile')
const User = require('../../models/User')

const { check, validationResult } = require('express-validator')

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // set the profile to be that of the user with the user id that comes with the token
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar'])
    //populate is used to populat fields from another model (in this case user model) to the current object

    if (!profile)
      return res.status(400).json({ msg: 'There is no profile for this user' })

    //if profile exists
    res.json(profile)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server Error')
  }

  // res.send('profile Route')
})

// @route   POST api/profile
// @desc    Create or Update a user profile
// @access  Private

router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required')
        .not()
        .isEmpty(),
      check('skills', 'Skills is required')
        .not()
        .isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body

    // Build profile object
    const profileFields = {}
    profileFields.user = req.user.id

    // confirm if stuff is comign in from form
    if (company) profileFields.company = company
    if (website) profileFields.website = website
    if (location) profileFields.location = location
    if (bio) profileFields.bio = bio
    if (status) profileFields.status = status
    if (githubusername) profileFields.githubusername = githubusername
    if (skills) {
      profileFields.skills = skills.split(',').map(skill => skill.trim())
    }

    // Build social object
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube
    if (twitter) profileFields.social.twitter = twitter
    if (facebook) profileFields.social.facebook = facebook
    if (linkedin) profileFields.social.linkedin = linkedin
    if (instagram) profileFields.social.instagram = instagram

    try {
      let profile = await Profile.findOne({ user: req.user.id })

      if (profile) {
        //Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        )
        return res.json(profile)
      }

      //create new profile

      profile = new Profile(profileFields)

      //save it in database
      await profile.save()

      //server response
      res.json(profile)
    } catch (err) {
      console.warn(err.message)
      res.status(500).send('Server Error')
    }
  }
)

// @route   GET api/profile
// @desc    GET all profiles
// @access  Private

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar'])
    res.json(profiles)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('server error')
  }
})

// @route   GET api/profile/user/:user_id
// @desc    GET all profiles
// @access  Private

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar'])

    if (!profile) return res.status(400).json({ msg: 'Profile not found.' })

    res.json(profile)
  } catch (err) {
    console.error(err.message)
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found.' })
    }

    res.status(500).send('server error')
  }
})

// @route   DELETE api/profile
// @desc    DELTETE profile, user and posts
// @access  Private

router.delete('/', auth, async (req, res) => {
  try {
    // TODO remove users posts

    // remove profile  from database
    await Profile.findOneAndRemove({ user: req.user.id })

    // remove user from database
    await User.findOneAndRemove({ _id: req.user.id })
    res.json({ msg: 'User Deleted' })
  } catch (err) {
    console.error(err.message)
    res.status(500).send('server error')
  }
})

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('company', 'Company is required')
        .not()
        .isEmpty(),
      check('from', 'From Date is required')
        .not()
        .isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body

    const newExp = { title, company, location, from, to, current, description }

    try {
      const profile = await Profile.findOne({ user: req.user.id })

      // unshift === push
      profile.experience.unshift(newExp)

      await profile.save()

      res.json(profile)
    } catch (err) {
      console.log(err.message)
      res.status(500).send('Server Error')
    }
  }
)

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })

    //get remove index

    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id)

    //removing that experience
    profile.experience.splice(removeIndex, 1)

    await profile.save()

    res.json(profile)
  } catch (error) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required')
        .not()
        .isEmpty(),
      check('degree', 'Degree is required')
        .not()
        .isEmpty(),
      check('fieldofstudy', 'Field of Study is required')
        .not()
        .isEmpty(),
      check('from', 'From Date is required')
        .not()
        .isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id })

      // unshift === push
      profile.education.unshift(newEdu)

      await profile.save()

      res.json(profile)
    } catch (err) {
      console.log(err.message)
      res.status(500).send('Server Error')
    }
  }
)

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete education from profile
// @access  Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })

    //get remove index

    const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id)

    //removing that education
    profile.education.splice(removeIndex, 1)

    await profile.save()

    res.json(profile)
  } catch (error) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

// @route   GET api/profile/github/:username
// @desc    Get user repos from github
// @access  Public

router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: encodeURI(`https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`),
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    }

    request(options, (error, response, body) => {
      if (error) console.log(error)

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github profile found' })
      }

      res.json(JSON.parse(body))
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).send('server error')
  }
})

module.exports = router
