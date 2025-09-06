import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const VerifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, msg: 'Token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log('Decoded user'); // Log decoded user info for debugging
      req.user = decoded;
    } catch (err) {


      const response = await fetch(`http://localhost:${process.env.PORT}/api/refresh-token`, {
        method: 'GET',
        headers: {
          Cookie: req.headers.cookie 
        }
      });

      const data = await response.json();
      console.log('inside refresh token'); // Log the response from the refresh token endpoint
      if (response.status !== 200) {
        console.error('Failed to refresh token:', data.msg); // Log the error message
        return res.status(401).json({ success: false, msg: data.msg });
      }

      const access_token = data.token;
      res.setHeader('accessToken', `Bearer ${access_token}`); 
      req.user = data.user;
    }

  } catch (err) {
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
  
  return next();
};

export default VerifyToken;
