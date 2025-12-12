// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../Models/UserModel");
const emailService = require("../Services/emailService");

const authController = {
  /* USER REGISTER */
  

  // register: async (req, res) => {
  //   try {
  //     const { firstName, lastName, email, password } = req.body;
  //     const profileImage = req.file;

  //     /* Check if user exists */
  //     const existingUser = await User.findOne({ email });
  //     if (existingUser) {
  //       return res.status(409).json({ message: "User already exists!" });
  //     }

  //     /* Hash the password */
  //     const salt = await bcrypt.genSalt();
  //     const hashedPassword = await bcrypt.hash(password, salt);

  //     /* Create user data object */
  //     const userData = {
  //       firstName,
  //       lastName,
  //       email,
  //       password: hashedPassword,
  //     };

  //     /* Add profile image path if provided */
  //     if (profileImage) {
  //       userData.profileImagePath = profileImage.path;
  //     }

  //     /* Create a new User */
  //     const newUser = new User(userData);

  //     /* Save the new User */
  //     await newUser.save();

  //     /* Send welcome email */
  //     emailService.sendWelcomeEmail(newUser).catch(error => {
  //       console.error('Failed to send welcome email:', error);
  //     });

  //     /* Remove password from response */
  //     const userResponse = { ...newUser._doc };
  //     delete userResponse.password;

  //     /* Send a successful message */
  //     res.status(200).json({ 
  //       message: "User registered successfully! Welcome email sent.", 
  //       user: userResponse 
  //     });
  //   } catch (err) {
  //     console.log(err);
  //     res.status(500).json({ 
  //       message: "Registration failed!", 
  //       error: err.message 
  //     });
  //   }
  // },

  register: async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;
      const profileImage = req.file;

      /* Check if user exists */
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "User already exists!" });
      }

      /* Hash the password */
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      /* Create user data object */
      const userData = {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      };

      /* Add profile image path if provided */
      if (profileImage) {
        // Handle Vercel vs local storage
        if (process.env.VERCEL && profileImage.isVercel) {
          // On Vercel: File is in memory buffer
          // For now, we'll just store the filename and handle cloud storage later
          userData.profileImagePath = `/uploads/users/${profileImage.filename}`;
          console.log('Vercel registration - profile image received in memory');
        } else {
          // Local: File is saved to disk
          userData.profileImagePath = profileImage.path;
        }
      }

      /* Create a new User */
      const newUser = new User(userData);

      /* Save the new User */
      await newUser.save();

      /* Send welcome email */
      emailService.sendWelcomeEmail(newUser).catch(error => {
        console.error('Failed to send welcome email:', error);
      });

      /* Remove password from response */
      const userResponse = { ...newUser._doc };
      delete userResponse.password;

      /* Send a successful message */
      res.status(200).json({ 
        message: "User registered successfully! Welcome email sent.", 
        user: userResponse 
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ 
        message: "Registration failed!", 
        error: err.message 
      });
    }
  }, 

  /* USER LOGIN */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      /* Check if user exists */
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(409).json({ message: "User doesn't exist!" });
      }

      /* Compare the password with the hashed password */
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid Credentials!" });
      }

      /* Generate Access Token (short-lived: 15 minutes) */
      const accessToken = jwt.sign(
        { id: user._id, email: user.email }, 
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      /* Generate Refresh Token (long-lived: 7 days) */
      const refreshToken = jwt.sign(
        { id: user._id }, 
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Store refresh token in database
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      user.refreshTokens.push({
        token: refreshToken,
        expiresAt: refreshTokenExpiry
      });

      // Clean expired tokens and limit to 5 active refresh tokens per user
      user.cleanExpiredRefreshTokens();
      if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5); // Keep only last 5
      }

      await user.save();

      const userWithoutPassword = { ...user._doc };
      delete userWithoutPassword.password;
      delete userWithoutPassword.refreshTokens;

      res.status(200).json({ 
        accessToken, 
        refreshToken,
        user: userWithoutPassword,
        expiresIn: '15m' // Access token expires in 15 minutes
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  /* REFRESH TOKEN ENDPOINT */
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required" });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Find user with this refresh token
      const user = await User.findOne({ 
        _id: decoded.id,
        'refreshTokens.token': refreshToken,
        'refreshTokens.expiresAt': { $gt: new Date() }
      });

      if (!user) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        { id: user._id, email: user.email }, 
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const userWithoutPassword = { ...user._doc };
      delete userWithoutPassword.password;
      delete userWithoutPassword.refreshTokens;

      res.status(200).json({ 
        accessToken: newAccessToken,
        user: userWithoutPassword,
        expiresIn: '15m'
      });

    } catch (err) {
      console.log(err);
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ message: "Invalid refresh token" });
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ message: "Refresh token expired" });
      }
      res.status(500).json({ error: err.message });
    }
  },

  /* LOGOUT - Revoke Refresh Token */
  logout: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token required" });
      }

      // Find user and remove the specific refresh token
      const user = await User.findOne({
        'refreshTokens.token': refreshToken
      });

      if (user) {
        user.refreshTokens = user.refreshTokens.filter(
          tokenData => tokenData.token !== refreshToken
        );
        await user.save();
      }

      res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  /* LOGOUT FROM ALL DEVICES */
  logoutAll: async (req, res) => {
    try {
      const userId = req.user.id; // From auth middleware
      
      const user = await User.findById(userId);
      if (user) {
        user.refreshTokens = [];
        await user.save();
      }

      res.status(200).json({ message: "Logged out from all devices" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  /* FORGOT PASSWORD */
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(200).json({ 
          message: "If an account with that email exists, a reset link has been sent." 
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Set token expiry (1 hour)
      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpires = Date.now() + 3600000;
      
      await user.save();

      await emailService.sendPasswordResetEmail(user, resetToken);

      res.status(200).json({
        message: "If an account with that email exists, a reset link has been sent."
      });

    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  },

  /* RESET PASSWORD */
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      const resetPasswordToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset token + refresh tokens (security measure)
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.refreshTokens = []; // Logout all devices after password change
      
      await user.save();

      res.status(200).json({ message: "Password reset successfully. Please login again." });

    } catch (err) {
      console.log(err);
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = authController;


  