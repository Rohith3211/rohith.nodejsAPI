const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//api 1//
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectData = ` 
    SELECT* 
    FROM user
    WHERE username = '${username}';`;

  const dbUser = await db.get(selectData);
  if (dbUser === undefined) {
    if (password.len < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
        INSERT INTO user
        (username, name, password, gender, location )
        VALUES
        (
         '${username}',
         '${name}',
         '${hashedPassword}',
         '${gender}',
         '${location}'
        );`;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2//

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUsersQuery = `
    SELECT* 
    FROM user 
    WHERE username = '${username}';`;

  const dbUser = await db.get(selectUsersQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3//
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserId = ` 
    SELECT* 
    FROM user 
    WHERE username = '${username}';`;

  const dbUser = await db.get(selectUserId);
  const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);

  if (isPasswordMatch === true) {
    if (newPassword.len < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashingPassword = await bcrypt.hash(newPassword, 10);
      const updatingUserPassword = `
           UPDATE user
           SET password = '${hashingPassword}'
           WHERE username = '${username}';`;
      const updatedDb = await db.get(updatingUserPassword);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
