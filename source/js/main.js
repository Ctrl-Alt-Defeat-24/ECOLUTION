module.exports = function (app, ecoData, db, bcrypt, saltRounds, collection) {
  // Handle our routes
  app.get("/", async (req, res) => {

    res.render("index.ejs", {ecoData});
  });
//   app.get("/login", (req, res) => {
//     res.render("login.ejs");
//   });

// app.post("/login", async (req, res) => {
//     // Authentication logic for login
//     const { username, password } = req.body;
//     const user = await db.collection('User_Credentials').findOne({ username });
    
//     if (user) {
//         const match = await bcrypt.compare(password, user.password);
//         if (match) {
//             res.send("Logged in successfully");
//         } else {
//             res.send("Incorrect password");
//         }
//     } else {
//         res.send("User not found");
//     }
//   });

app.get("/register", (req, res) => {
    res.render("register.ejs");
  });

app.post("/register", async (req, res) => {
    // Logic to handle user registration
    const { username, password } = req.body;
    const existingUser = await db.collection('User_Credentials').findOne({ username });

    if (existingUser) {
        res.send("Username already taken");
    } else {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await db.collection('User_Credentials').insertOne({ username, password: hashedPassword });
        res.send("Registered successfully");
    }
  });
};
