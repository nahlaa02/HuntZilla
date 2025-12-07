//
// 🛑 SECURITY WARNING: Hardcoding credentials is unsafe.
// In a production environment, these values MUST be loaded from
// AWS Lambda Environment Variables or AWS Secrets Manager.
// You must replace the placeholders below with your actual credentials
// on the AWS Lambda console, NOT in this file.
//
const dboptions = {
'user' : 'YOUR_DB_USERNAME',
'password' : 'YOUR_DB_PASSWORD',
'database' : 'j20cherry',
'host' : 'dataanalytics.temple.edu'
};

//global connection variable
var connection;


const features = [
"POST to login and provide the keys of username and password. If authenticated, the result will be the JSON object of the user.",
"Issue a POST to startgame to start a game. Provide a valid token. If successful, the result will be a JSON gameprogress object.",
"Issue a PATCH against guess1 and provide the keys of token and guess. If successful, the result will be either CORRECT or INCORRECT",
"Issue a PATCH against guess2 and provide the keys of token and guess. If successful, the result will be either CORRECT or INCORRECT",
"Issue a PATCH against guess3 and provide the keys of token and guess. If successful, the result will be either CORRECT or INCORRECT",
"Issue a POST against endgame and provide a token. If successful, the result will be 'Hunt Complete!'",
"Issue a DELETE against cancelgame and provide a token. If successful, the result will be 'Game cancelled'",
"Issue a GET against leaderboard for a JSON object showing the top 5 players/users.",
"Issue a GET against debugusers for a JSON object of all users.",
"Issue a GET against debuglogins for a JSON object of all logins.",
"Issue a GET against debuggames for a JSON object of all games.",
"Issue a GET against debuggameprogress for a JSON object of all the gameprogress.",
"Issue a GET against debugleaderboard for a JSON object of all the leaderboard data.",
"Created by Jeremy Shafer",
"Last modified by Nand Mehta, Connor Gal, Sikander Saeed, Seon Kim",
];

// supporting functions ******* STUDENT MAY EDIT ***********
// Replace your startGame with this:
let startGame = async (res, body) => {
const token = (body.token || "").trim();
if (!token) return formatres(res, "Token is missing or incorrect.", 400);

const txtSQL1 = "SELECT userid FROM logins WHERE token = ?";
const [result1] = await connection.execute(txtSQL1, [token]);

if (result1.length === 0) return formatres(res, "Invalid token.", 400);

const userid = result1[0].userid;

const txtSQL2 = "SELECT gameid, intro, q1, q2, q3, a1, a2, a3 FROM games LIMIT 1";
const [result2] = await connection.execute(txtSQL2);

if (result2.length === 0) return formatres(res, "No games available.", 400);

const game = result2[0];

const txtSQL3 = `
INSERT INTO gameprogress (
intro, q1, a1, q2, a2, q3, a3,
startts, status, token, userid
)
VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'ACTIVE', ?, ?)
`;

const params3 = [
game.intro, game.q1, game.a1,
game.q2, game.a2,
game.q3, game.a3,
token, userid
];

const [result3] = await connection.execute(txtSQL3, params3);
const progressid = result3.insertId;

const txtSQL5 = `
SELECT progressid, intro, q1, q2, q3, status, token
FROM gameprogress
WHERE progressid = ?
`;

const [result5] = await connection.execute(txtSQL5, [progressid]);
// <-- THIS is the Option B change
return formatres(res, [result5[0]], 200);
};


let postLogin = async (res, body) => {
// 1. Extract username and password from the request body
let username = body.username;
let password = body.password;

// Validate that both fields have been provided
if (username == undefined || username.trim() == "") {
return formatres(res, "Username is missing or incorrect.", 400);
}
if (password == undefined || password.trim() == "") {
return formatres(res, "Password is missing or incorrect.", 400);
}

// 2. Check if username/password combination exists
// The ? placeholders are bound to [username, password]
let txtSQL1 = "SELECT * FROM users WHERE username = ? AND password = ?";
let [result1] = await connection.execute(txtSQL1, [username, password]);

// If no user was found, send a 400 error
if (result1.length == 0) {
return formatres(res, "Login failed.", 400);
}

// 3. Insert a new row in the logins table with a randomly generated token
// and the current timestamp; associate it with the user’s id
let userid = result1[0].userid;
let txtSQL2 =
"INSERT INTO logins (token, logints, userid) VALUES (UUID(), NOW(), ?)";
let [result2] = await connection.execute(txtSQL2, [userid]);

// result2.insertId contains the auto-increment id of the newly inserted
// row. mysql2 returns this after an INSERT query
let loginid = result2.insertId;

// 4. Retrieve the token just created using loginid
let txtSQL3 = "SELECT token FROM logins WHERE loginid = ?";
let [result3] = await connection.execute(txtSQL3, [loginid]);
let newtoken = result3[0].token;

// 5. Update the user’s lasttoken field in the users table
let txtSQL4 = "UPDATE users SET lasttoken = ? WHERE userid = ?";
let [result4] = await connection.execute(txtSQL4, [newtoken, userid]);

// 6. Fetch and return the user’s public information along with the new token
// Columns returned: username, first name, last name, lasttoken, and isadmin
let txtSQL5 =
"SELECT username, fname, lname, lasttoken, isadmin FROM users WHERE userid = ?";
let [result5] = await connection.execute(txtSQL5, [userid]);

// 7. Send the final response
return formatres(res, result5, 200);
};

let getUsers = async (res,query) => {
//work and return the result
let [result] = await connection.execute("select * from users");
return formatres(res,result,200);
}

// Supporting function for debuglogins
let getLogins = async (res, query) => {
// Work and return the result
let [result] = await connection.execute("select * from logins");
return formatres(res, result, 200);
};

let getGames = async (res, query) => {
// Work and return the result
let [result] = await connection.execute("select * from games");
return formatres(res, result, 200);
};

// Supporting function for debuggameprogress
let getGameProgress = async (res, query) => {
// Work and return the result
let [result] = await connection.execute("select * from gameprogress");
return formatres(res, result, 200);
};

// Supporting function for debugleaderboard
let getLeaderboard = async (res, query) => {
// Work and return the result
let [result] = await connection.execute("select * from leaderboard");
return formatres(res, result, 200);
};

let getTopLeaderboard = async (res, query) => {
// Work and return the result
let [result] = await connection.execute(
"SELECT * FROM leaderboard ORDER BY seconds ASC LIMIT 5"
);
return formatres(res, result, 200);
};

let guess1 = async (res, body) => {
// 1. Extract token and guess from the request body
const token = (body.token || "").trim();
const guess = (body.guess || "").trim();

// 2. Validate token
if (!token) {
return formatres(res, "Token is missing or incorrect.", 400);
}

// 3. Validate guess
if (!guess) {
return formatres(res, "Guess is missing or incorrect.", 400);
}

// 4. Retrieve the gameprogress row using the token
const txtSQL1 = "SELECT progressid, a1 FROM gameprogress WHERE token = ?";
const [result1] = await connection.execute(txtSQL1, [token]);

if (result1.length === 0) {
return formatres(res, "Invalid token.", 400);
}

const progressid = result1[0].progressid;
const correctAnswer = result1[0].a1;

// 5. Update the u1 column with the guess
const txtSQL2 = "UPDATE gameprogress SET u1 = ? WHERE progressid = ?";
await connection.execute(txtSQL2, [guess, progressid]);

// 6. Compare u1 with a1 and update msg1
const msg1 = guess === correctAnswer ? "CORRECT" : "INCORRECT";
const txtSQL3 = "UPDATE gameprogress SET msg1 = ? WHERE progressid = ?";
await connection.execute(txtSQL3, [msg1, progressid]);

// 7. Return the result
return formatres(res, msg1, 200);
};


let guess2 = async (res, body) => {
// 1. Extract token and guess from the request body
const token = (body.token || "").trim();
const guess = (body.guess || "").trim();

// 2. Validate token
if (!token) {
return formatres(res, "Token is missing or incorrect.", 400);
}

// 3. Validate guess
if (!guess) {
return formatres(res, "Guess is missing or incorrect.", 400);
}

// 4. Retrieve the gameprogress row using the token
const txtSQL1 = "SELECT progressid, a2 FROM gameprogress WHERE token = ?";
const [result1] = await connection.execute(txtSQL1, [token]);

if (result1.length === 0) {
return formatres(res, "Invalid token.", 400);
}

const progressid = result1[0].progressid;
const correctAnswer = result1[0].a2;

// 5. Update the u2 column with the guess
const txtSQL2 = "UPDATE gameprogress SET u2 = ? WHERE progressid = ?";
await connection.execute(txtSQL2, [guess, progressid]);

// 6. Compare u2 with a2 and update msg2
const msg2 = guess === correctAnswer ? "CORRECT" : "INCORRECT";
const txtSQL3 = "UPDATE gameprogress SET msg2 = ? WHERE progressid = ?";
await connection.execute(txtSQL3, [msg2, progressid]);

// 7. Return the result
return formatres(res, msg2, 200);
};

let guess3 = async (res, body) => {
// 1. Extract token and guess from the request body
const token = (body.token || "").trim();
const guess = (body.guess || "").trim();

// 2. Validate token
if (!token) {
return formatres(res, "Token is missing or incorrect.", 400);
}

// 3. Validate guess
if (!guess) {
return formatres(res, "Guess is missing or incorrect.", 400);
}

// 4. Retrieve the gameprogress row using the token
const txtSQL1 = "SELECT progressid, a3 FROM gameprogress WHERE token = ?";
const [result1] = await connection.execute(txtSQL1, [token]);

if (result1.length === 0) {
return formatres(res, "Invalid token.", 400);
}

const progressid = result1[0].progressid;
const correctAnswer = result1[0].a3;

// 5. Update the u3 column with the guess
const txtSQL2 = "UPDATE gameprogress SET u3 = ? WHERE progressid = ?";
await connection.execute(txtSQL2, [guess, progressid]);

// 6. Compare u3 with a3 and update msg3
const msg3 = guess === correctAnswer ? "CORRECT" : "INCORRECT";
const txtSQL3 = "UPDATE gameprogress SET msg3 = ? WHERE progressid = ?";
await connection.execute(txtSQL3, [msg3, progressid]);

// 7. Return the result
return formatres(res, msg3, 200);
};

let CancelGame = async (res, body) => {
// 1. Extract token from the request body
let token = body.token;

// 2. Validate token presence
if (token == undefined || token.trim() == "") {
return formatres(res, "Token is missing or incorrect.", 400);
}

// 3. Check if token exists in gameprogress
let txtSQL1 = "SELECT progressid FROM gameprogress WHERE token = ?";
let [result1] = await connection.execute(txtSQL1, [token]);

if (result1.length == 0) {
return formatres(res, "Token is missing or incorrect.", 400);
}

// 4. Delete from gameprogress
let txtSQL2 = "DELETE FROM gameprogress WHERE token = ?";
await connection.execute(txtSQL2, [token]);

// 5. Delete from logins
let txtSQL3 = "DELETE FROM logins WHERE token = ?";
await connection.execute(txtSQL3, [token]);

// 6. Return success message
return formatres(res, "Game session cancelled.", 200);
};


let postEndGame = async (res, body) => {
// 1. Extract token from the request body
let token = body.token;

// 2. Validate token presence
if (token == undefined || token.trim() == "") {
return formatres(res, "Token is missing or incorrect.", 400);
}

// 3. Check if token matches any user's lasttoken
let txtSQL1 = "SELECT userid, username FROM users WHERE lasttoken = ?";
let [result1] = await connection.execute(txtSQL1, [token]);

if (result1.length == 0) {
return formatres(res, "Token is missing or incorrect.", 400);
}

let userid = result1[0].userid;
let username = result1[0].username;

// 4. Validate that all msg1, msg2, msg3 in gameprogress are "CORRECT"
let txtSQL2 = "SELECT progressid, msg1, msg2, msg3, startts FROM gameprogress WHERE token = ?";
let [result2] = await connection.execute(txtSQL2, [token]);

if (result2.length == 0) {
return formatres(res, "Game session not found.", 400);
}

let progressid = result2[0].progressid;
let { msg1, msg2, msg3 } = result2[0];

if (msg1 !== "CORRECT" || msg2 !== "CORRECT" || msg3 !== "CORRECT") {
return formatres(res, "Keep Hunting!", 400);
}

// 5. Update endts to NOW(), set status to COMPLETE, and compute secondsduration
let txtSQL3 = `
UPDATE gameprogress
SET endts = NOW(),
status = 'COMPLETE',
secondsduration = TIMESTAMPDIFF(SECOND, startts, NOW())
WHERE progressid = ?
`;

await connection.execute(txtSQL3, [progressid]);

// 6. Retrieve secondsduration
let txtSQL4 = "SELECT secondsduration FROM gameprogress WHERE progressid = ?";
let [result4] = await connection.execute(txtSQL4, [progressid]);
let seconds = result4[0].secondsduration;

// 7. Insert into leaderboard (userid, username, seconds)
let txtSQL5 = "INSERT INTO leaderboard (userid, username, seconds) VALUES (?, ?, ?)";
await connection.execute(txtSQL5, [userid, username, seconds]);

// 8. Update users.lasttoken to null
let txtSQL6 = "UPDATE users SET lasttoken = NULL WHERE userid = ?";
await connection.execute(txtSQL6, [userid]);

// 9. Return success message
return formatres(res, "Hunt Complete!", 200);
};


// do not delete this handy little supporting function
let formatres = async (res, output, statusCode) => {
// kill the global database connection
if (connection != undefined &&
typeof(connection)=='object' &&
typeof(connection.end())=='object' ){
await connection.end();
}
res.statusCode = statusCode;
res.body = JSON.stringify(output);
return res;
}

// do not delete this handy little supportng function
function isEmpty(obj) {
return Object.keys(obj).length === 0;
}

// My Routing Function ****** STUDENT MAY EDIT **********
let myRoutingFunction = (res, method, path, query, body) => {
// Conditional statements go here.
// Look at the path and method and return the output from the
// correct supporting function.
if (method == "POST" && path == "login") {
return postLogin(res, body);
}
if (method == "GET" && path == "debugusers") {
return getUsers(res, query);
}
if (method == "GET" && path == "debuglogins") {
return getLogins(res, query);
}
if (method == "GET" && path == "debuggames") {
return getGames(res, query);
}
if (method == "GET" && path == "debuggameprogress") {
return getGameProgress(res, query);
}
if (method == "GET" && path == "debugleaderboard") {
return getLeaderboard(res, query);
}
// Simple GET request with no features specified results
// in a list of features / instructions
if (method == "GET" && path == "") {
return formatres(res, features, 200);
}
if (method == "GET" && path == "topleaderboard") {
return getTopLeaderboard(res, query);
}
// Add the route to the routing function
if (method == "POST" && path == "startgame") {
return startGame(res, body);
}
// Add the route to the routing function
if (method == "PATCH" && path == "guess1") {
return guess1(res, body);
}
// Add the route to the routing function
if (method == "PATCH" && path == "guess2") {
return guess2(res, body);
}
// Add the route to the routing function
if (method == "PATCH" && path == "guess3") {
return guess3(res, body);
}
if (method == "DELETE" && path == "cancelgame"){
return CancelGame(res, body);
}
if (method == "POST" && path == "endgame"){
return postEndGame(res, body);
}
return res;
};


// event handler **** DO NOT EDIT ***********
// Students should not have to change the code here.
// Students should be able to read and understand the code here.
import qs from 'qs'; //for parsing URL encoded data
import axios from 'axios'; // for calling another API
import mysql from 'mysql2/promise'; //for talking to a database
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export const handler = async (request) => {
connection = await mysql.createConnection(dboptions);
// identify the method (it will be a string)
let method = request["httpMethod"];
// identify the path (it will also be a string)
let fullpath = request["path"];
// we clean the full path up a little bit
if (fullpath == undefined || fullpath == null){ fullpath = ""};
let pathitems = fullpath.split("/");
let path = pathitems[2];
if (path == undefined || path == null){ path = ""};
// identify the querystring ( we will convert it to
// a JSON object named query)
let query = request["queryStringParameters"];
if (query == undefined || query == null){ query={} };
// identify the body (we will convert it to
// a JSON object named body)
let body = qs.parse(request["body"]);
if (body == undefined || body == null){ body={} };
// Create the default response object that will include
// the status code, the headers needed by CORS, and
// the string to be returned formatted as a JSON data structure.
let res = {
'statusCode': 400,
'headers': {
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Credentials': true
},
'body': JSON.stringify("Feature not found."),
};
// run all the parameters through my routing function
// and return the result
return myRoutingFunction(res,method,path,query,body);
//*** this is a good place to test one supporting function at a time
//query={};
//body={"token":"7b339c71-d066-11f0-b8b9-005056b11032"}
//return startGame(res,body);
};
