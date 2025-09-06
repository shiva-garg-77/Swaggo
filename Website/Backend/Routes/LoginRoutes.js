import express from 'express'
import {signupApi,loginApi,Mailverification,Mailsender,forgetPassword,resetpassword,RefreshkarRahatoken,logoutApi} from '../Controller/LoginApi.js'
import { signupApiValidator,loginApivalidation,EmailValidator } from '../Helper/LoginValidator.js'

import bodyParser from 'body-parser'
const router=express()
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({extended:true}))


// Un-Authorized Routes     -----      REST API

router.post('/signup',signupApiValidator,signupApi)
router.post('/login',loginApivalidation,loginApi)
router.post('/send-mail',EmailValidator,Mailsender)
router.get('/mail-verification',Mailverification)
router.post('/forget-password',EmailValidator,forgetPassword)
router.post('/reset-password',resetpassword)
router.get('/refresh-token',RefreshkarRahatoken)
router.post('/logout',logoutApi)





export default router
