const express = require('express');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');//import multer
const fs = require("fs"); // Import fs module
const { exec } = require("child_process"); // Import child_process module
const axios = require("axios");
const path = require('path');
require('dotenv').config();
console.log("✅ Using default .env file from:", path.resolve(__dirname, '.env'));
const app = express();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const ONECOMPILER_URL = "https://onecompiler-apis.p.rapidapi.com/api/v1/run";
const MONGO_COMPILER_URI = process.env.MONGO_COMPILER_URI;

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = "AIzaSyC2Psvxy3aRne0-berI59WXCCPaKRW_5-g";

const languageMap = {
    java: "java",
  cpp: "cpp",          // ✅ use "cpp" only
  c: "c",
  python: "python",    // ✅ use "python" not "py"
  javascript: "javascript", // or "nodejs"
  typescript: "typescript",
  go: "go",
  ruby: "ruby",
  php: "php"
};

const compilerMap = {
    java: { lang: "java", ext: "java" },
    cpp: { lang: "cpp", ext: "cpp" },  // use cpp17 or cpp14
    c: { lang: "c", ext: "c" },
    python: { lang: "python", ext: "py" },
    javascript: { lang: "nodejs", ext: "js" },
    typescript: { lang: "typescript", ext: "ts" },
    go: { lang: "go", ext: "go" },
    ruby: { lang: "ruby", ext: "rb" },
    php: { lang: "php", ext: "php" },
};

  
// Middleware
//before deploying the server
/*app.use(cors({ origin: 'http://localhost:3000', credentials: true }));*/
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  credentials: true
}));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// MongoDB Connection
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function main() {
    console.log("[DEBUG] MONGO_URI:", process.env.MONGO_URI); // Add this debug line
    
    if (!process.env.MONGO_URI) {
        throw new Error("MongoDB connection string is missing!");
    }
    const client = new MongoClient(process.env.MONGO_URI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    

    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("✅ MongoDB connection verified");

        const db = client.db("LEARNWEAVE");
        const usersCollection = db.collection("users");
        const challengesCollection = db.collection("challenges");
        const notificationsCollection = db.collection("notifications");
        const solutionsCollection = db.collection("solutions");
        const attemptsCollection = db.collection("attempts");
        let savedOTPs = {};

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        function generateOtp() {
            return Math.floor(1000 + Math.random() * 9000).toString();
        }

        function generateToken(email) {
            return jwt.sign({ email }, JWT_SECRET, { expiresIn: '2d' });
        }
        

      



        app.post('/sendotp', async (req, res) => {
            const { email } = req.body;
            if (!email) return res.status(400).json({ message: "Email is required" });

            const otp = generateOtp();
            const mailOptions = {
                from: process.env.SMTP_EMAIL,
                to: email,
                subject: "OTP Verification",
                html: `<p>Your OTP from Learnweave is <strong>${otp}</strong>. It will expire in 2 minutes.</p>`,
            };

            transporter.sendMail(mailOptions, (error) => {
                if (error) return res.status(500).json({ message: "Failed to send OTP" });

                savedOTPs[email] = otp;
                setTimeout(() => delete savedOTPs[email], 120000);
                res.status(200).json({ message: "OTP sent successfully" });
            });
        });

        app.post('/verify', (req, res) => {
            const { email, otp } = req.body;
            if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

            if (savedOTPs[email] && savedOTPs[email] === otp) {
                delete savedOTPs[email];
                return res.status(200).json({ message: "OTP verified successfully" });
            }
            res.status(400).json({ message: "Invalid or expired OTP" });
        });

        app.post('/signup', async (req, res) => {
          const { fullName, email, password } = req.body;
      
          if (!fullName || !email || !password) {
              return res.status(400).json({ message: "All fields are required" });
          }
      
          try {
              const userExists = await usersCollection.findOne({ email });
              if (userExists) {
                  return res.status(400).json({ message: "User already exists" });
              }
      
              const hashedPassword = await bcrypt.hash(password, 10);
              const newUser = {
                  fullName,
                  email,
                  password: hashedPassword,
                  lastLogin: new Date(),
                  supercoins: 0,
                  token: null // Initialize token as null
              };
      
              const result = await usersCollection.insertOne(newUser);
      
              // Generate token with user details
              const token = jwt.sign(
                  {
                      userId: result.insertedId.toString(),
                      email: newUser.email,
                      fullName: newUser.fullName,
                  },
                  JWT_SECRET,
                  { expiresIn: "2d" }
              );
      
              // Store token in user collection
              await usersCollection.updateOne(
                  { _id: result.insertedId },
                  { $set: { token: token } }
              );
      
              console.log("Token generated and stored:", token); // Log token
              res.status(201).json({ message: "User signed up successfully", token });
          } catch (err) {
              res.status(500).json({ message: "An error occurred, please try again" });
          }
      });
      
      app.post('/login', async (req, res) => {
          const { email, password } = req.body;
      
          try {
              const user = await usersCollection.findOne({ email });
              if (!user || !(await bcrypt.compare(password, user.password))) {
                  return res.status(401).json({ message: "Invalid credentials" });
              }
      
              // Generate token with user details
              const token = jwt.sign(
                  {
                      userId: user._id.toString(),
                      email: user.email,
                      fullName: user.fullName,
                  },
                  JWT_SECRET,
                  { expiresIn: "2d" }
              );
      
              // Update token in user collection
              await usersCollection.updateOne(
                  { _id: user._id },
                  { $set: { token: token } }
              );
      
              console.log("Token updated and stored:", token); // Log token
              res.status(200).json({ message: "Login successful", token });
          } catch (err) {
              console.error(err);
              res.status(500).json({ message: "Internal server error" });
          }
      });

        app.post('/check-user', async (req, res) => {
            const { email } = req.body;
            if (!email) return res.status(400).json({ message: "Email is required" });

            try {
                const user = await usersCollection.findOne({ email });
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }

                const currentDate = new Date();
                const lastLoginDate = new Date(user.lastLogin);
                const timeDifference = currentDate - lastLoginDate;
                const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

                if (daysDifference > 2) {
                    return res.status(401).json({ message: "Token expired. Please log in again." });
                }

                await usersCollection.updateOne({ email }, { $set: { lastLogin: new Date() } });

                const token = generateToken(email);
                res.status(200).json({ message: "User found", token, user: { fullName: user.fullName, email: user.email, photo: user.photo } });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.post('/reset-password', async (req, res) => {
            const { email, newPassword } = req.body;
            if (!email || !newPassword) return res.status(400).json({ message: "Email and new password are required" });

            try {
                const user = await usersCollection.findOne({ email });
                if (!user) return res.status(404).json({ message: "User not found" });

                const hashedPassword = await bcrypt.hash(newPassword, 10);
                await usersCollection.updateOne({ email }, { $set: { password: hashedPassword } });

                res.status(200).json({ message: "Password reset successfully" });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: "Internal server error" });
            }
        });

        app.get('/get-profile', async (req, res) => {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ message: "Unauthorized" });
        
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await usersCollection.findOne({ email: decoded.email });
                if (!user) return res.status(404).json({ message: "User not found" });
        
                // Calculate total supercoins
                const challengeCoins = await challengesCollection.aggregate([
                    { $match: { userId: user._id } },
                    { $group: { _id: null, totalSupercoins: { $sum: "$supercoins" } } }
                ]).toArray();
                const solutionCoins = await solutionsCollection.aggregate([
                    { $match: { userId: user._id } },
                    { $group: { _id: null, totalSupercoins: { $sum: "$supercoins" } } }
                ]).toArray();
        
                const totalSupercoins = (challengeCoins[0]?.totalSupercoins || 0) + (solutionCoins[0]?.totalSupercoins || 0);
        
                res.status(200).json({ 
                    user: { 
                        fullName: user.fullName, 
                        email: user.email, 
                        photo: user.photo,
                        supercoins: totalSupercoins,
                    } 
                });
            } catch (err) {
                console.error(err);
                res.status(401).json({ message: "Invalid token" });
            }
        });

        app.post('/update-profile', upload.single('photo'), async (req, res) => {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ message: "Unauthorized" });

            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const { fullName } = req.body;
                const photo = req.file ? `/uploads/${req.file.filename}` : null;

                const updateData = { fullName };
                if (photo) updateData.photo = photo;

                await usersCollection.updateOne(
                    { email: decoded.email },
                    { $set: updateData }
                );

                const updatedUser = await usersCollection.findOne({ email: decoded.email });
                res.status(200).json({ 
                    message: "Profile updated successfully", 
                    user: { 
                        fullName: updatedUser.fullName, 
                        email: updatedUser.email, 
                        photo: updatedUser.photo,
                        supercoins: updatedUser.supercoins,
                    } 
                });
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: "Internal server error" });
            }
        });
        // Add this endpoint to check admin status


      app.get('/check-admin', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ isAdmin: false });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await usersCollection.findOne({ email: decoded.email });
        
        if (!user) return res.status(404).json({ isAdmin: false });
        
        // Check if user is admin (learnweave.org@gmail.com)
        const isAdmin = user.email.toLowerCase() === 'learnweave.org@gmail.com';
        res.json({ isAdmin });
    } catch (err) {
        console.error(err);
        res.status(500).json({ isAdmin: false });
    }
});

// Update the submit-challenge endpoint with proper challenge type handling
// Update the submit-challenge endpoint with proper challenge type handling
// Update the submit-challenge endpoint with proper challenge type handling
app.post('/submit-challenge', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // DEBUG: Log the entire request body
        console.log('Received request body:', JSON.stringify(req.body, null, 2));
        
        // Extract ALL fields from request body including challengeType
        const { 
            language, 
            difficulty: rawDifficulty, 
            topic, 
            question, 
            testCases, 
            steps, 
            answer, 
            challengeType = 'normal' // Default to 'normal' if not provided
        } = req.body;

        console.log('Extracted challengeType:', challengeType);

        // Standardize difficulty format
        const difficulty = rawDifficulty ? rawDifficulty.charAt(0).toUpperCase() + rawDifficulty.slice(1).toLowerCase() : '';

        if (!language || !difficulty || !topic || !question || !testCases || !steps) {
            return res.status(400).json({ message: "All fields except answer are required" });
        }

       

        // Find the user
        const user = await usersCollection.findOne({ email: decoded.email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if user is admin and determine challenge type
        const isAdmin = user.email.toLowerCase() === 'learnweave.org@gmail.com';
        let finalChallengeType = 'normal'; // Default to normal
        
        // Only allow admin to set challenge type
        if (isAdmin && challengeType) {
            finalChallengeType = challengeType;
            console.log('Admin setting challenge type to:', finalChallengeType);
        } else if (challengeType && challengeType !== 'normal') {
            console.log('Non-admin user tried to set challenge type to:', challengeType);
        }
        
        console.log('Final challenge type to be stored:', finalChallengeType);

        // Calculate supercoins based on difficulty
        let supercoins = 0;
        if (difficulty === 'Basic') supercoins = 3;
        else if (difficulty === 'Intermediate') supercoins = 5;
        else if (difficulty === 'Advanced') supercoins = 7;

        // Create the challenge with challengeType
        const challenge = {
            userId: user._id,
            language,
            difficulty,
            topic,
            question,
            testCases,
            steps,
            answer: answer || null,
            supercoins,
            challengeType: finalChallengeType, // This should now be stored
            createdAt: new Date(),
        };

        console.log('Full challenge object to be stored:', JSON.stringify(challenge, null, 2));

        // Insert the challenge into the challenges collection
        const result = await challengesCollection.insertOne(challenge);
        
        // Verify the challenge was stored with the correct type
        const insertedChallenge = await challengesCollection.findOne({ _id: result.insertedId });
        console.log('Stored challenge type:', insertedChallenge?.challengeType);
        
        // Double-check by querying the database directly
        const dbCheck = await challengesCollection.findOne({ _id: result.insertedId }, { projection: { challengeType: 1 } });
        console.log('Database verification - challengeType:', dbCheck?.challengeType);

        // Add supercoins to the user's profile when the challenge is created
        await usersCollection.updateOne(
            { _id: user._id },
            { $inc: { supercoins: supercoins } }
        );

        // Create a notification
        const notificationMessage = `${user.fullName} has submitted a new ${finalChallengeType} challenge in ${language} (${difficulty} level).`;
        await notificationsCollection.insertOne({
            message: notificationMessage,
            seenBy: [],
            createdBy: user.email,
            createdAt: new Date(),
            challengeId: result.insertedId.toString(),
            type: 'challenge_submission',
            relatedUser: user._id
        });

        res.status(201).json({ 
            message: "Challenge submitted successfully", 
            challengeId: result.insertedId,
            challengeType: finalChallengeType // Return the challenge type in response
        });
    } catch (err) {
        console.error('Error in submit-challenge:', err);
        res.status(500).json({ message: "Internal server error" });
    }
});
       // Notifications Backend code
       /*app.get('/notifications', async (req, res) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });
    
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await usersCollection.findOne({ email: decoded.email });
            if (!user) return res.status(404).json({ message: "User not found" });
    
            // Fetch notifications that are not created by the current user
            const notifications = await notificationsCollection.find({ createdBy: { $ne: decoded.email } }).toArray();
            console.log("Fetched notifications:", notifications); // Debugging
            res.status(200).json({ notifications });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Internal server error" });
        }
    });*/

    // Updated notifications endpoint
// Add this to your server file (likely server.js or routes file)
app.get('/notifications', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await usersCollection.findOne({ email: decoded.email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch notifications that are not created by the current user
        const notifications = await notificationsCollection.find({ createdBy: { $ne: decoded.email } }).toArray();
        console.log("Fetched notifications:", notifications); // Debugging
        res.status(200).json({ notifications });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post('/notifications/mark-seen', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await notificationsCollection.updateMany(
            { seenBy: { $ne: decoded.email } },
            { $addToSet: { seenBy: decoded.email } }
        );
        res.status(200).json({ message: "Notifications marked as seen" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});


// This backend code is correct for its purpose and requires no changes.

app.get('/challenges', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { language, challengeType } = req.query;

    let query = {
      userId: { $ne: new ObjectId(decoded.userId) } // Exclude own challenges by default
    };

    if (challengeType && challengeType !== 'undefined') {
      if (challengeType === 'placement') {
        query.challengeType = 'placement'; 
      } else if (challengeType === 'normal') {
        query.challengeType = 'normal';
      }
    }

    if (language && language !== 'undefined') {
      query.language = language.toUpperCase();
    }

    const challenges = await challengesCollection.find(query).toArray();
    res.status(200).json({ challenges });
  } catch (err) {
    console.error("Error fetching challenges:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});



 // Save submission to the database
 async function saveToDatabase(submission) {
  try {
    await solutionsCollection.insertOne(submission);
  } catch (error) {
    console.error("MongoDB Error:", error);
  }
}

app.get("/solutions", async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const { challengeId } = req.query;
        if (!challengeId) {
            return res.status(400).json({ message: "Challenge ID is required" });
        }

        const solutions = await solutionsCollection.find({
            challengeId: new ObjectId(challengeId),
        }).toArray();

        res.status(200).json({ solutions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Add these routes to your server.js

// Get user's challenges
// Get user's challenges with language aggregation
app.get('/api/user-challenges', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await usersCollection.findOne({ email: decoded.email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Aggregate challenges by language
        const challenges = await challengesCollection.aggregate([
            { $match: { userId: user._id } },
            { 
                $group: {
                    _id: "$language",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        // Convert to { language: count } format
        const challengeCounts = challenges.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.status(200).json(challengeCounts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get user's solutions with language aggregation
app.get('/api/user-solutions', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await usersCollection.findOne({ email: decoded.email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Aggregate solutions by challenge language
        const solutions = await solutionsCollection.aggregate([
            {
                $lookup: {
                    from: "challenges",
                    localField: "challengeId",
                    foreignField: "_id",
                    as: "challenge"
                }
            },
            { $unwind: "$challenge" },
            {
                $group: {
                    _id: "$challenge.language",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        // Convert to { language: count } format
        const solutionCounts = solutions.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.status(200).json(solutionCounts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get('/total-supercoins/:userId', async (req, res) => {
    const userId = req.params.userId;

    // Validate userId
    if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
        // Sum supercoins from challenges
        const challenges = await challengesCollection.find({ userId: new ObjectId(userId) }).toArray();
        const challengeCoins = challenges.reduce((total, challenge) => total + (challenge.supercoins || 0), 0);

        // Sum supercoins from solutions
        const solutions = await solutionsCollection.find({ userId: new ObjectId(userId) }).toArray();
        const solutionCoins = solutions.reduce((total, solution) => total + (solution.supercoins || 0), 0);

        // Total supercoins
        const totalSupercoins = challengeCoins + solutionCoins;

        res.status(200).json({ totalSupercoins });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
});



   // Add this to your server.js routes
app.post('/get-help', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const { challengeId } = req.body;
        if (!challengeId) {
            return res.status(400).json({ message: "Challenge ID is required" });
        }

        // Get the challenge details
        const challenge = await challengesCollection.findOne({ 
            _id: new ObjectId(challengeId) 
        });
        
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        // Prepare the prompt
        const prompt = `Provide a step-by-step guide to solve the following programming challenge:\n\n
        Topic: ${challenge.topic}\n
        Language: ${challenge.language}\n
        Question: ${challenge.question}\n\n
        Provide detailed steps, explanations, and code snippets if necessary.`;

        // Call the Copilot5 API
        const response = await fetch('https://copilot5.p.rapidapi.com/copilot', {
            method: 'POST',
            headers: {
                'x-rapidapi-key': process.env.OPENAI_API_KEY,
                'x-rapidapi-host': 'copilot5.p.rapidapi.com',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: prompt,
                conversation_id: null,
                markdown: true
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();
        
        // Extract the guide from the response
        const guide = result.data?.message || "No guide could be generated.";
        res.status(200).json({ guide });

    } catch (error) {
        console.error('Error getting help:', error);
        res.status(500).json({ 
            message: "Error generating guide", 
            details: error.message 
        });
    }
});


    // Compile Code Endpoint
    // Updated compile endpoint with better error handling
    app.post("/compile", async (req, res) => {
    console.log("Compile request received:", req.body);

    const { language, code, challengeId, userId } = req.body;

    if (!language || !code || !challengeId || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const normalizedLanguage = language.toLowerCase();

    // Ensure language supported
    if (!compilerMap[normalizedLanguage]) {
        return res.status(400).json({ error: "Unsupported language" });
    }

    try {
        const existingSolution = await solutionsCollection.findOne({
            challengeId: new ObjectId(challengeId),
            userId: new ObjectId(userId),
        });

        if (existingSolution) {
            return res.status(400).json({
                message: "You already solved this challenge. Please try other challenges.",
            });
        }

        const challenge = await challengesCollection.findOne({
            _id: new ObjectId(challengeId),
        });

        if (!challenge) {
            return res.status(404).json({ error: "Challenge not found" });
        }

        const testCases = challenge.testCases;
        const results = [];
        let allPassed = true;

        const { lang: compilerLang, ext } = compilerMap[normalizedLanguage];

        for (let i = 0; i < testCases.length; i++) {
            const stdin = testCases[i].input;

            let requestData = {
                language: compilerLang,  // ✅ correct compiler identifier
                stdin: stdin,
            };

            if (normalizedLanguage === "java") {
                const classNameMatch = code.match(/public\s+class\s+(\w+)/);
                const className = classNameMatch ? classNameMatch[1] : "Main";

                requestData.files = [
                    { name: `${className}.java`, content: code }
                ];
            } else {
                requestData.files = [
                    { name: `main.${ext}`, content: code }
                ];
            }

            try {
                const response = await axios.post(
                    ONECOMPILER_URL,
                    requestData,
                    {
                        headers: {
                            "x-rapidapi-key": RAPIDAPI_KEY,
                            "x-rapidapi-host": "onecompiler-apis.p.rapidapi.com",
                            "Content-Type": "application/json",
                        },
                        timeout: 15000,
                    }
                );

                const result = response.data;

                const output = [result.stdout, result.stderr, result.error]
                    .filter(Boolean)
                    .join("\n")
                    .trim() || "No output";

                const passed = output === testCases[i].output.trim();

                results.push({
                    input: testCases[i].input,
                    expectedOutput: testCases[i].output,
                    actualOutput: output,
                    passed,
                });

                if (!passed) allPassed = false;
            } catch (innerError) {
                console.error("Error running code:", innerError);
                results.push({
                    input: testCases[i].input,
                    expectedOutput: testCases[i].output,
                    actualOutput: `Execution Error: ${innerError.response?.data?.message || innerError.message}`,
                    passed: false,
                });
                allPassed = false;
            }
        }

        if (allPassed) {
            let coinsToAdd = 0;
            switch (challenge.difficulty.toLowerCase()) {
                case "basic":
                    coinsToAdd = 3;
                    break;
                case "intermediate":
                    coinsToAdd = 5;
                    break;
                case "advanced":
                    coinsToAdd = 7;
                    break;
            }

            await solutionsCollection.insertOne({
                challengeId: new ObjectId(challengeId),
                userId: new ObjectId(userId),
                code,
                results,
                createdAt: new Date(),
                supercoins: coinsToAdd,
            });

            await usersCollection.updateOne(
                { _id: new ObjectId(userId) },
                { $inc: { supercoins: coinsToAdd } }
            );
        }

        res.json({ results, allPassed });
    } catch (error) {
        console.error("Compilation Error:", error);
        res.status(500).json({
            error: "Execution failed",
            details: error.message,
        });
    }
});



    // Gemini Compiler Endpoint (no DB insert, just test cases execution)
app.post("/geminicompiler", async (req, res) => {
    console.log("Gemini compile request received:", req.body);

    let { language, code, testCases } = req.body;

    if (!language || !code || !testCases) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const normalizedLanguage = language.toLowerCase();
    if (!languageMap[normalizedLanguage]) {
        return res.status(400).json({ error: "Unsupported language" });
    }

    // Clean template code (optional)
    code = code.replace(/^#\s*Write your code here\s*\n?/, "");

    try {
        const results = [];
        let allPassed = true;

        // Determine correct filename
        let filename;
        if (normalizedLanguage === "cpp") filename = "main.cpp";
        else if (normalizedLanguage === "java") {
            const classMatch = code.match(/public\s+class\s+([A-Za-z_]\w*)/);
            const className = classMatch ? classMatch[1] : "Main";
            filename = `${className}.java`;
        } else if (normalizedLanguage === "python") filename = "main.py";
        else if (normalizedLanguage === "c") filename = "main.c";
        else filename = "main.js";

        for (let i = 0; i < testCases.length; i++) {
            const stdin = testCases[i].input;

            try {
                const response = await axios.post(
                    ONECOMPILER_URL,
                    {
                        language: languageMap[normalizedLanguage], // ✅ correct API identifier
                        stdin,
                        files: [{ name: filename, content: code }]
                    },
                    {
                        headers: {
                            "x-rapidapi-key": RAPIDAPI_KEY,
                            "x-rapidapi-host": "onecompiler-apis.p.rapidapi.com",
                            "Content-Type": "application/json"
                        },
                        timeout: 10000
                    }
                );

                const result = response.data;
                const output = [result.stdout, result.stderr, result.error]
                    .filter(Boolean)
                    .join("\n")
                    .trim() || "No output";

                const passed = output === testCases[i].output.trim();

                results.push({
                    input: testCases[i].input,
                    expectedOutput: testCases[i].output,
                    actualOutput: output,
                    passed
                });

                if (!passed) allPassed = false;
            } catch (innerError) {
                console.error("Error running code:", innerError);
                results.push({
                    input: testCases[i].input,
                    expectedOutput: testCases[i].output,
                    actualOutput: `Execution Error: ${innerError.response?.data?.message || innerError.message}`,
                    passed: false
                });
                allPassed = false;
            }
        }

        res.json({ results, allPassed });
    } catch (error) {
        console.error("Gemini Compilation Error:", error);
        res.status(500).json({
            error: "Execution failed",
            details: error.message
        });
    }
});

app.post("/api/generateroadmap", async (req, res) => {
  const { technology, days } = req.body;

  if (!technology || !days) {
    return res
      .status(400)
      .json({ error: "Technology and days are required" });
  }

  try {
    const prompt = `
Create a ${days}-day step-by-step learning roadmap for ${technology}.  

⚡ Rules:
1. Strictly generate exactly ${days} days — no extra summary, no introduction, no conclusion.
2. Each day should start with "Day X:" (e.g., Day 1: ...).
3. Each day must have 2–4 clear tasks (topics + practical exercise).
4. Keep it concise, simple, and actionable.
5. Do not use markdown (**bold**, bullets, headings). Only plain text.
6. Output format must be exactly:

Day 1: ...
- Task 1
- Task 2
Day 2: ...
- Task 1
- Task 2
...
Day ${days}: ...
- Task 1
- Task 2
`;


    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json(data);
    }

    const aiText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No roadmap generated.";

    res.json({ roadmap: aiText });
  } catch (error) {
    console.error("Error generating roadmap:", error);
    res.status(500).json({ error: "Failed to generate roadmap" });
  }
});

// Save a mock test attempt
// Save a mock test attempt (secure: uses JWT to identify user)
app.post('/attempts', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Find user in DB
    const user = await usersCollection.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const {
      company,
      quizCorrect,
      quizTotal,
      codingPts,
      total,
      timeTakenSec = null,
      durationSec = null,
      meta = {}
    } = req.body || {};

    // Basic validation
    if (!company ||
        typeof quizCorrect !== "number" ||
        typeof quizTotal !== "number" ||
        typeof codingPts !== "number" ||
        typeof total !== "number") {
      return res.status(400).json({ error: "Missing or invalid fields." });
    }

    const doc = {
      userId: user._id.toString(),
      userName: user.fullName || user.email,
      company,
      quizCorrect,
      quizTotal,
      codingPts,
      total,
      timeTakenSec,
      durationSec,
      meta,
      createdAt: new Date()
    };

    const result = await attemptsCollection.insertOne(doc);
    res.status(201).json({ ok: true, attemptId: result.insertedId });
  } catch (err) {
    console.error("POST /attempts error:", err);
    res.status(500).json({ error: "Failed to save attempt." });
  }
});


// Get attempt history for a user
// Get attempt history for the logged-in user
app.get('/attempts/history', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Find user
    const user = await usersCollection.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));

    const cursor = attemptsCollection.find({ userId: user._id.toString() })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const items = await cursor.toArray();
    const total = await attemptsCollection.countDocuments({ userId: user._id.toString() });

    res.json({ page, limit, total, items });
  } catch (err) {
    console.error("GET /attempts/history error:", err);
    res.status(500).json({ error: "Failed to fetch history." });
  }
});


// Get leaderboard (company-specific or global)
// Leaderboard: best score per user (global or company-specific)
app.get('/attempts/leaderboard', async (req, res) => {
  try {
    const company = req.query.company; // optional
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const sinceDays = parseInt(req.query.sinceDays || "0", 10);

    const match = {};
    if (company) match.company = company;
    if (sinceDays > 0) match.createdAt = { $gte: new Date(Date.now() - sinceDays * 86400 * 1000) };

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: "$userId",
          userName: { $first: "$userName" },
          totalScore: { $sum: "$total" },   // 👈 cumulative score
          bestScore: { $max: "$total" },
          bestTime: { $min: "$timeTakenSec" },
          lastAttemptAt: { $max: "$createdAt" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userProfile"
        }
      },
      { $unwind: { path: "$userProfile", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          userId: "$_id",
          userName: 1,
          totalScore: 1,   // 👈 include in response
          bestScore: 1,
          bestTime: 1,
          lastAttemptAt: 1,
          userProfile: {
            fullName: "$userProfile.fullName",
            email: "$userProfile.email",
            photo: "$userProfile.photo"
          }
        }
      },
      { $sort: { totalScore: -1 } },   // 👈 sort by cumulative score, high → low
      { $limit: limit }
    ];

    const items = await attemptsCollection.aggregate(pipeline).toArray();
    res.json({ company: company || null, limit, sinceDays: sinceDays || null, items });
  } catch (err) {
    console.error("GET /attempts/leaderboard error:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard." });
  }
});

// Get total users count
app.get('/total-users', async (req, res) => {
  try {
    const totalUsers = await usersCollection.countDocuments();
    res.status(200).json({ totalUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get total challenges count
app.get('/total-challenges', async (req, res) => {
  try {
    const totalChallenges = await challengesCollection.countDocuments();
    res.status(200).json({ totalChallenges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get supported languages count (fixed at 6)
app.get('/supported-languages', async (req, res) => {
  try {
    const supportedLanguages = 6; // Fixed count as requested
    res.status(200).json({ supportedLanguages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});
    // before deploying the server
  /*const PORT = process.env.PORT;
   app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    });*/

    // deploy code:
    // ✅ Serve React build folder in production

        if (process.env.NODE_ENV === "production") {
    // Serve React build folder
    app.use(express.static(path.join(__dirname, "../../build")));

    // Serve index.html for all routes
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../../build", "index.html"));
    });
    }

    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    });



    } catch (err) {
        console.error("❌ MongoDB connection failed:", err);
        process.exit(1);
    }
}



main().catch(console.error);