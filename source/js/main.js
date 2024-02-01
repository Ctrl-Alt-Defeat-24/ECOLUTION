module.exports = function (app, ecoData, db, bcrypt, saltRounds, collection) {
  // Handle our routes
  app.get("/", async (req, res) => {

    res.render("index.ejs", {ecoData});
  });

  
// Route to display the login page
// app.get("/login", (req, res) => {
//   res.render("login.ejs");
// });

// // Route to handle login logic
// app.post("/login", async (req, res) => {
//   // Extract username and password from request body
//   const { username, password } = req.body;
  
//   // Find user in the database
//   const user = await db.collection('User_Credentials').findOne({ username });

<<<<<<< Updated upstream
//   if (user) {
//       // Compare submitted password with stored hash
//       const match = await bcrypt.compare(password, user.password);
=======
app.get("/register", (req, res) => {
    res.render("register.ejs");
  });

// app.post("/register", async (req, res) => {
  //   // Logic to handle user registration
  //   const { username, password } = req.body;
  //   const existingUser = await db.collection('User_Credentials').findOne({ username });

  //   if (existingUser) {
  //       res.send("Username already taken");
  //   } else {
  //       const hashedPassword = await bcrypt.hash(password, saltRounds);
  //       await db.collection('User_Credentials').insertOne({ username, password: hashedPassword });
  //       res.send("Registered successfully");
  //   }
  // });

  app.get("/directions", (req, res) => {
    res.render("mapboxdirectionexample.ejs", ecoData);
  });

  app.get("/antpath", async (req, res) => {
    try {
>>>>>>> Stashed changes
      
//       if (match) {
//           // Passwords match, handle successful login
//           // You can set up a session or token here if needed
//           res.send("Logged in successfully");
//       } else {
//           // Passwords do not match
//           res.send("Incorrect password");
//       }
//   } else {
//       // User not found
//       res.send("User not found");
//   }
// });

// // Route to display the registration page
// app.get("/register", (req, res) => {
//   res.render("register.ejs");
// });

// // Route to handle registration logic
// app.post("/register", async (req, res) => {
//   // Extract email, username, and password from request body
//   const { email, username, password } = req.body;
  
//   try {
//       // Check if the user already exists
//       const existingUser = await db.collection('User_Credentials').findOne({ "credentials.username": username });

//       if (existingUser) {
//           // User already exists
//           res.send("User already exists with that username");
//       } else {
//           // Insert new user into the database
//           const newUser = {
//               email: email,
//               username: username,
//               password: password, // In a real application, you should hash the password
//               createDate: new Date(), // Storing the creation date
//               lastLoginDate: null, // Initially null, updated upon login
//               isActive: "T" // Assuming "T" means True/Active
//           };

//           await db.collection('User_Credentials').updateOne({}, { $push: { credentials: newUser } });

//           res.send("User registered successfully");
//       }
//   } catch (error) {
//       // Handle any errors that occur during the process
//       console.error("Error during registration:", error);
//       res.send("An error occurred during registration");
//   }
// });

};
