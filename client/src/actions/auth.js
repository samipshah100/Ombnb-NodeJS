import axios from 'axios'
import {
  REGISTER_FAIL,
  REGISTER_SUCCESS,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAILED,
  LOGOUT
} from './types'
import { setAlert } from './alert'
import  setAuthToken  from '../utils/setAuthToken'

// Load User

export const loadUser = params => async dispatch => {
  if (localStorage.token) {
    setAuthToken(localStorage.token)
  }

  try {
    const res = await axios.get('/api/auth')

    dispatch({
      type: USER_LOADED,
      payload: res.data,
    })
  } catch (error) {
    dispatch({ type: AUTH_ERROR })
  }
}

//Login User

export const login = (email, password) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  const body = JSON.stringify({ email, password })

  try {
    const res = await axios.post('/api/auth', body, config)

    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data,
    })

    dispatch(loadUser())

  } catch (error) {
    const errors = error.response.data.errors

    if (errors) {
      errors.forEach(error => {
        dispatch(setAlert(error.msg + ' server side', 'danger'))
      })
    }

    console.log('now i am going to fail', errors)
    dispatch({
      type: LOGIN_FAILED,
    })
  }
}

//Register User

export const register = (name, email, password) => async dispatch => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  const body = JSON.stringify({ name, email, password })

  try {
    const res = await axios.post('/api/users', body, config)

    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data,
    })

    dispatch(loadUser())

  } catch (error) {
    const errors = error.response.data.errors

    if (errors) {
      errors.forEach(error => {
        dispatch(setAlert(error.msg + ' server side', 'danger'))
      })
    }

    console.log('now i am going to fail', errors)
    dispatch({
      type: REGISTER_FAIL,
    })
  }
}

// lgout /clear profile

export const logout = (params) => dispatch => {
  dispatch({type:LOGOUT})
  
}
