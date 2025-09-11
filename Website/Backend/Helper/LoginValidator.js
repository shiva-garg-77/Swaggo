import { check, body } from "express-validator";

export const signupApiValidator = [
    check('email', "invalid Email").isEmail().normalizeEmail({
        gmail_remove_dots: true,
        gmail_lowercase: true
    }),
    check('password', "Password must have 8 character ").not().isEmpty().isLength({
        min: 8,
        max: 20
    }),
    check('username', "Enter your username").not().isEmpty()
]

export const loginApiValidation = [
     body('email')
    .if(body('username').not().exists()) // validate email only if username doesn't exist
    .notEmpty().withMessage('Email is required when username is not provided')
    .isEmail().withMessage('Invalid email format'),

  body('username')
    .if(body('email').not().exists()) // validate username only if email doesn't exist
    .notEmpty().withMessage('Username is required when email is not provided'),

  body().custom(body => {
    if (!body.email && !body.username) {
      throw new Error('Either email or username must be provided');
    }
    return true;
  }),
    check('password', "Password is required").not().isEmpty().isLength({
        min: 8,
        max: 20
    }),

]

export const EmailValidator =[
  check('email', "invalid Email").isEmail().normalizeEmail({
        gmail_remove_dots: true,
        gmail_lowercase: true
    })
]