import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "./models/user.models.js";
import bcrypt from "bcryptjs";

const users = [
  // Rishabh Jain accounts
  {
    name: "Rishabh Jain",
    email: "jainrishabh2610@gmail.com",
    password: "password123",
    role: "advisor",
    phone: "8433943227"
  },
  {
    name: "Rishabh Jain",
    email: "rishabh.jain09610@gmail.com",
    password: "password123",
    role: "investor",
    phone: "8433943227"
  },

  // Aaditya Benke accounts
  {
    name: "Aaditya Benke",
    email: "aadityabenke@gmail.com",
    password: "password123",
    role: "advisor",
    phone: "7021127964"
  },
  {
    name: "Aaditya Benke",
    email: "diagonalcube7777@gmail.com",
    password: "password123",
    role: "investor",
    phone: "7021127964"
  },

  // Atharva Jadhav accounts
  {
    name: "Atharva Jadhav",
    email: "atharvai2005@gmail.com",
    password: "password123",
    role: "advisor",
    phone: "7387241068"
  },
  {
    name: "Atharva Jadhav",
    email: "atharvajofficial@gmail.com",
    password: "password123",
    role: "investor",
    phone: "7387241068"
  },

  // Dhruv Singh accounts
  {
    name: "Dhruv Singh",
    email: "dhruvsinghxd@gmail.com",
    password: "password123",
    role: "advisor",
    phone: "9876543210"
  },
  {
    name: "Dhruv Singh",
    email: "dsingh19072005@gmail.com",
    password: "password123",
    role: "investor",
    phone: "9876543210"
  }
];

mongoose.connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("DB Connected for seeding users");
    seedUsers();
  })
  .catch(err => console.error("DB connection error:", err));

const seedUsers = async () => {
  try {
    // Delete existing user records
    await User.deleteMany({});

    // Manually hash passwords for each user
    const saltRounds = 12;
    const hashedUsers = await Promise.all(users.map(async user => {
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      return { ...user, password: hashedPassword };
    }));

    // Insert user data in bulk with hashed passwords
    await User.insertMany(hashedUsers);
    console.log("User data initialized successfully");
  } catch (error) {
    console.error("Error seeding user data:", error);
  } finally {
    mongoose.connection.close();
  }
};