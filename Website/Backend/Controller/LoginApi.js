import bcrypt from 'bcrypt'
import User from '../Model/LoginModels/User.js'
import { validationResult } from 'express-validator'
import Sendmailer from '../Helper/Mailsender.js'
import ResetPassword from '../Model/LoginModels/ResetPassword.js'
import Randomstring from 'randomstring'
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import jwt from 'jsonwebtoken'
import RefreshTokens from '../Model/LoginModels/RefreshTokens.js'




const signupApi = async (req, res) => {
    console.log("signupApi called")
    const error = validationResult(req)
    if (!error.isEmpty()) {
        return res.status(400).json({
            success: false,
            msg: error.array()[0].msg
        })
    }
    const { email, username, password } = req.body
    const olduser = await User.findOne({ email })
    if (olduser) {
        return res.status(400).json({
            success: false,
            msg: "User already exist"
        })
    }
    const usernameexist = await User.findOne({ username })
    if (usernameexist) {
        return res.status(400).json({
            success: false,
            msg: "Username already exist"
        })
    }
    const pass = await bcrypt.hash(password, 10)
    const user = new User({
        email,
        username,
        password: pass
    })
    await user.save()
    const result = fetch(`http://localhost:4000/api/login`, {
        method: "POST",
        body: JSON.stringify({
            username,
            email,
            password
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
        .then((response) => response.json())

    const a = await result

    res.status(200).json({
        success: true,
        token: a.token
    })
}


const generate_jwt_access_token = async (account) => {
    return jwt.sign(account, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30m" })
}

const jwt_Refress_token = async (account) => {
    return jwt.sign(account, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "7d" })
}


const loginApi = async (req, res) => {
    console.log("loginApi called")
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: error.array()
        });
    }

    const { username, email, password } = req.body;

    let user;
    if (email) {
        user = await User.findOne({ email });
    } else if (username) {
        user = await User.findOne({ username });
    }

    if (!user) {
        return res.status(400).json({
            success: false,
            msg: email ? "invalid email" : "invalid username"
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({
            success: false,
            msg: "Password is incorrect"
        });
    }

    // Remove password before sending response
    const { password: _, ...safeUser } = user.toObject();
    await RefreshTokens.deleteMany({ id: user._id })
    const access_token = await generate_jwt_access_token(safeUser)
    const refresh_token = await jwt_Refress_token(safeUser)



    const save_refresh_token = new RefreshTokens({
        id: safeUser._id,
        Refreshtoken: refresh_token
    })

    await save_refresh_token.save()

    res.cookie('token', refresh_token, {
        httpOnly: true,
        secure: false,
        sameSite: 'None',       // ✅ allow cross-origin cookies from same site
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
        success: true,
        token: access_token,
        username: safeUser.username,
    });
};


const Mailsender = async (req, res) => {
    const error = validationResult(req)
    if (!error.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: error.array()
        })
    }
    const { email } = req.body
    const userdata = await User.findOne({ email })
    if (!userdata) {
        return res.status(400).json({
            success: false,
            msg: "invalid email"
        });
    }
    if (userdata.isVerify) {
        return res.status(400).json({
            success: false,
            msg: "User already verify"
        });
    }
    const msg = `<p>hii , ${userdata.username}</p><div>Click here to  <a href="http://localhost:4000/api/mail-verification?_id=${userdata._id}"> verify</a>your email</div>`

    Sendmailer(email, "Mail verification", msg)
    return res.status(200).json({
        success: true,
        msg: "Mail send"
    });
}

const Mailverification = async (req, res) => {
    const { _id } = req.query
    await User.findByIdAndUpdate({ _id }, {
        $set: { isVerify: true }
    })
    res.redirect(`http://localhost:3000?_id=${_id}`)
}

const resetpasswordtoken = () => {
    return Randomstring.generate()
}
const forgetPassword = async (req, res) => {
    const error = validationResult(req)
    if (!error.isEmpty()) {
        return res.status(400).json({
            success: false,
            msg: error.array()[0].msg
        })
    }
    const { email } = req.body
    const userdata = await User.findOne({ email })
    if (!userdata) {
        return res.status(400).json({
            success: false,
            msg: "invalid email"
        });
    }
    const token = resetpasswordtoken()
    const tempuser = new ResetPassword({
        id: userdata._id,
        token
    })
    await tempuser.save()

    const msg = `<p>hii , ${userdata.username}</p><div>Click here to  <a href="http://localhost:3000/reset-password/${token}">Reset your Password</a></div>`

    Sendmailer(email, "Reset password", msg)
    return res.status(200).json({
        success: true,
        msg: "Mail send"
    });
}

const resetpassword = async (req, res) => {
    const { token, new_password, conform_password } = req.body
    if (new_password != conform_password) {
        return res.status(400).json({
            success: false,
            msg: "Conform pass is not same"
        })
    }
    const validlink = await ResetPassword.findOne({ token })
    if (!validlink) {
        return res.status(400).json({
            success: false,
            msg: "This link is expired"
        })
    }
    const _id = validlink.id
    const user = await User.findById({ _id })
    const change_password = await bcrypt.hash(new_password, 10)
    await User.findByIdAndUpdate({ _id }, {
        $set: { password: change_password }
    })

    await RefreshTokens.deleteMany({ id: _id })


    const { password: _, ...safeUser } = user.toObject();
    const access_token = await generate_jwt_access_token(safeUser)
    const refresh_token = await jwt_Refress_token(safeUser)



    const save_refresh_token = new RefreshTokens({
        id: safeUser._id,
        Refreshtoken: refresh_token
    })

    await save_refresh_token.save()
    await ResetPassword.deleteMany({ token })
    res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'None',       // ✅ allow cross-origin cookies from same site
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.status(200).json({
        success: true,
        token: access_token,
        username: safeUser.username,
    });

}

const RefreshkarRahatoken = async (req, res) => {

    const refresh_token = req.cookies.token;
    if (!refresh_token) {
        console.log("Refresh token not found");
        return res.status(400).json({
            success: false,
            msg: 'Logout kar'
        })
    }
    try {
        const decoded = jwt.verify(refresh_token, process.env.ACCESS_TOKEN_SECRET);


        delete decoded.exp
        delete decoded.iat

        const access_token = await generate_jwt_access_token(decoded);
        const refresh_token1 = await jwt_Refress_token(decoded);

        await RefreshTokens.deleteMany({ id: decoded._id });


        const save_refresh_token = new RefreshTokens({
            id: decoded._id,
            Refreshtoken: refresh_token1
        });
        await save_refresh_token.save();


        res.cookie("token", refresh_token1, {
            httpOnly: true,
            secure: false,
            sameSite: 'None',       // ✅ allow cross-origin cookies from same site
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            token: access_token,
            user: decoded
        });

    } catch (err) {
        console.error("Error verifying refresh token:", err);
        return res.status(401).json({ success: false, msg: "Logout kar" });
    }

}

export { signupApi, loginApi, Mailverification, Mailsender, forgetPassword, resetpassword, RefreshkarRahatoken }