import express from 'express'
import {signupApi,loginApi,Mailverification,Mailsender,forgetPassword,resetpassword,RefreshkarRahatoken,logoutApi} from '../Controllers/LoginApi.js'
import { signupApiValidator, loginApiValidation, EmailValidator } from '../Helper/LoginValidator.js'

const router=express.Router()


// Un-Authorized Routes     -----      REST API

router.post('/signup',signupApiValidator,signupApi)
router.post('/login',loginApiValidation,loginApi)
router.post('/send-mail',EmailValidator,Mailsender)
router.get('/mail-verification',Mailverification)
router.post('/forget-password',EmailValidator,forgetPassword)
router.post('/reset-password',resetpassword)
router.get('/refresh-token',RefreshkarRahatoken)
router.post('/logout',logoutApi)





export default router
