import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import RefreshTokens from '../Models/LoginModels/RefreshTokens.js';
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
      req.user = decoded;
    } catch (err) {
      // Token is invalid, try to refresh it
      if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
        try {
          // Get refresh token from cookies
          const cookies = req.headers.cookie;
          if (!cookies) {
            return res.status(401).json({ success: false, msg: 'No refresh token available' });
          }

          // Parse refresh token from cookies
          const refreshTokenMatch = cookies.match(/token=([^;]+)/);
          if (!refreshTokenMatch) {
            return res.status(401).json({ success: false, msg: 'No refresh token found' });
          }

          const refresh_token = refreshTokenMatch[1];

          // Verify refresh token
          const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET);

          // Check if refresh token exists in database
          const tokenExists = await RefreshTokens.findOne({ 
            id: decoded._id, 
            Refreshtoken: refresh_token 
          });

          if (!tokenExists) {
            return res.status(401).json({ success: false, msg: 'Invalid refresh token' });
          }

          // Clean decoded token
          delete decoded.exp;
          delete decoded.iat;

          // Generate new access token
          const access_token = jwt.sign(decoded, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30m" });

          res.setHeader('accessToken', `Bearer ${access_token}`);
          req.user = decoded;
        } catch (refreshError) {
          return res.status(401).json({ success: false, msg: 'Token refresh failed' });
        }
      } else {
        return res.status(401).json({ success: false, msg: 'Invalid token' });
      }
    }

  } catch (err) {
    return res.status(500).json({ success: false, msg: 'Server error' });
  }
  
  return next();
};

export default VerifyToken;
