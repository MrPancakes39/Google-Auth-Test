require('dotenv').config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cookieSession = require("cookie-session");

app.listen(port, () => console.log("listening at port 3000"));
app.use(express.static("public"));

app.use(cookieSession({
    name: "google-session",
    keys: ["key1", "key2"]
}));

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const GOOGLE_CLIENT_ID = process.env.ID;
const GOOGLE_CLIENT_SECRET = process.env.SECRET;

let userProfile;
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/callback"
    },
    // Use profile info (mainly id) to check if the user is registered in db.
    function (accessToken, refreshToken, profile, done) {
        userProfile = profile;
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    //Not supposed to be like this
    done(null, user);
});

const isLoggedIn = (req, res, next) => {
    if (req.user && typeof userProfile != "undefined") {
        next();
    } else {
        res.sendStatus(401);
    }
}

app.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

app.get("/auth/google/callback", passport.authenticate("google", {
        failureRedirect: "/failed"
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect("/success");
    });

app.get("/failed", (req, res) => res.send("failed logging in"));
app.get("/success", isLoggedIn, (req, res) => {
    //console.log(userProfile);
    let profile = {
        id: userProfile["id"],
        name: userProfile["displayName"],
        email: userProfile["emails"][0].value
    }
    res.send(profile);
});
app.get("/logout", (req, res) => {
    req.session = null;
    req.logout();
    res.redirect("/");
});