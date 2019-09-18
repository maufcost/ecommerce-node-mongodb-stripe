const csrf = require("csurf");
const express = require("express");
const passport = require("passport");
const { check } = require("express-validator");
const orderService = require("../services/OrderService.js");
const Cart = require("../models/cart");

const router = express.Router();
router.use(csrf());

router.get("/profile", isAuthenticated, async (request, response, next) => {
    try {
        orders = await orderService.getOrdersByUser({ user: request.user });
        response.render("user/profile", { orders });

    }catch (error) {
        console.log("Error: " + error);
        return next(error);
    }
});

router.get("/logout", isAuthenticated, (request, response, next) => {
    request.logout();
    response.redirect("/");
});

// Creating our own middleware: only allow not-logged-in users to access the
// following routes.
router.use("/", isNotAuthenticated, (request, response, next) => {
    next();
})

router.get("/signup", (request, response, next) => {
    // Extracts any flash messages on the request and store under 'error.'
    // Although in the second error in the passport config file, I wrote
    // {message: ...}, passport stores that flash message in the variable called
    // error.
    var messages = request.flash("error");
    return response.render("user/signup", { csrfToken: request.csrfToken(), messages });
});

router.post("/signup", [
    check("email").isEmail().withMessage("Invalid email"),
    check("password").isLength({ min: 4 }).withMessage("Invalid password")
], passport.authenticate("local.signup", {
    // successRedirect: "/user/profile",
    failureRedirect: "/user/signup",
    failureFlash: true // Shows the message I set at passport.js
}), (request, response, next) => {
    // Only gets executed if it doesn't fail.
    if(request.session.oldURL) {
        var oldURL = request.session.oldURL;
        request.session.oldURL = null;
        response.redirect(oldURL);
    }else {
        response.redirect("/user/profile");
    }
});

router.get("/signin", (request, response, next) => {
    var messages = request.flash("error");
    return response.render("user/signin", { csrfToken: request.csrfToken(), messages });
});

router.post("/signin", [
    check("email").isEmail().withMessage("Invalid email"),
    check("password").isLength({ min: 4 }).withMessage("Invalid password")
], passport.authenticate("local.signin", {
    // successRedirect: "/user/profile",
    failureRedirect: "/user/signin",
    failureFlash: true
}), (request, response, next) => {
    // Only gets executed if it doesn't fail.
    if(request.session.oldURL) {
        var oldURL = request.session.oldURL;
        request.session.oldURL = null;
        response.redirect(request.session.oldURL);
    }else {
        response.redirect("/user/profile");
    }
});

module.exports = router;

function isAuthenticated(request, response, next) {
    if (request.isAuthenticated()) {
        return next();
    }
    response.redirect("/");
}

function isNotAuthenticated(request, response, next) {
    if (!request.isAuthenticated()) {
        return next();
    }
    response.redirect("/");
}
