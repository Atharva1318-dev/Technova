import User from "../models/user.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {generateToken} from "../utils/token.js";
const SignUp = async (req, res) => {
  try {
    const { name, email, password, role, sebiRegistrationNumber, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Validate role
    const userRole = role && ["advisor", "investor"].includes(role) ? role : "investor";
    
    // For advisors, SEBI registration number is required
    if (userRole === "advisor" && !sebiRegistrationNumber) {
      return res.status(400).json({ 
        message: "SEBI registration number is required for advisors" 
      });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: "User already exists. Please login instead.",
        userExists: true
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: userRole,
    };
    
    // Add advisor-specific fields if role is advisor
    if (userRole === "advisor") {
      userData.sebiRegistrationNumber = sebiRegistrationNumber;
      if (phone) userData.phone = phone;
    }
    
    const newUser = await User.create(userData);
    
    const token = generateToken({ id: newUser._id });
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = generateToken({ id: user._id });
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const token = generateToken({ id: existingUser._id });
      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res
        .status(200)
        .json({ message: "Login successful", user: existingUser });
    } else {
      // New user - role is required
      if (!role || !["advisor", "investor"].includes(role)) {
        return res.status(400).json({ 
          message: "Role selection required", 
          requiresRole: true 
        });
      }
      
      const newUser = await User.create({ 
        name, 
        email, 
        role,
        isGoogleAuth: true 
      });
      
      const token = generateToken({ id: newUser._id });
      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res
        .status(200)
        .json({ 
          message: "Signup successful", 
          user: newUser,
          isNewUser: true 
        });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Check if user exists by email
const checkUserExists = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const user = await User.findOne({ email });
    return res.status(200).json({ 
      exists: !!user,
      isGoogleAuth: user?.isGoogleAuth || false
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { SignUp, Login, googleAuth, logout, checkUserExists };
