const csrf = require("csurf");
const express = require('express');
const productService = require("../services/ProductService");
const orderService = require("../services/OrderService.js");
const Cart = require("../models/cart");

const router = express.Router();
router.use(csrf());

router.get('/', async (request, response, next) => {
    console.log(request.user);
    var successMessage = request.flash("success")[0];
    const products = await productService.getAll();
    return response.render('shop/index', { title: 'Express', products, successMessage,
                                                  noMessages: !successMessage });
});

router.get("/add-to-cart/:id", async (request, response, next) => {
    var productId = request.params.id;
    var cart = new Cart(request.session.cart ? request.session.cart : {});
    try {
        var product = await productService.getProductById(productId);
        cart.add(product);
        request.session.cart = cart;
        console.log("---- SESSION UPDATED ----");
        console.log(request.session.cart);
        console.log("-------------------------");
        response.redirect("/");
    }catch(error) {
        // -- it would be helpful to put a flash message here to tell the user
        // that some error occurred. --
        console.log("-------------------------");
        console.log("Session error: " + error);
        console.log("-------------------------");
        response.redirect("/");
    }
});

router.get("/reduce/:id", async (request, response, next) => {
    try {
        var productId = request.params.id;
        var cart = new Cart(request.session.cart ? request.session.cart : {});
        cart.reduceByOne(productId);
        request.session.cart = cart;
        return response.redirect("/shopping-cart");
    }catch (error) {
        console.log("Error: " + error);
        return next(error);
    }
});

router.get("/remove/:id", async (request, response, next) => {
    try {
        var productId = request.params.id;
        var cart = new Cart(request.session.cart ? request.session.cart : {});
        cart.removeAllItemsWithId(productId);
        request.session.cart = cart;
        return response.redirect("/shopping-cart");
    }catch (error) {
        console.log("Error: " + error);
        return next(error);
    }
});

router.get("/shopping-cart", (request, response, next) => {
    if (!request.session.cart) {
        console.log("The user does not have a shopping cart yet...")
        return response.render("shop/cart", { products: null });
    }
    console.log("The user already has a shopping cart. Retrieving it...");
    var cart = new Cart(request.session.cart); // I think I don't need to create
    // another cart here...
    return response.render("shop/cart", { products: cart.objectToArray(), totalPrice: cart.totalPrice });
});

router.get("/checkout", isAuthenticated, (request, response, next) => {
    if (!request.session.cart) {
        response.redirect("/shopping-cart");
    }
    var cart = new Cart(request.session.cart); // I think I don't need to create
    // another cart here...
    var errorMessage = request.flash("error")[0];
    response.render("shop/checkout", { total: cart.totalPrice,
                                       errorMessage,
                                       noError: !errorMessage,
                                       csrfToken: request.csrfToken() });
});

router.post("/checkout", isAuthenticated, (request, response, next) => {
    if (!request.session.cart) {
        response.redirect("/shopping-cart");
    }

    // Making sure the separate forms (not from Stripe) were also filled.
    console.log(!request.body.name);
    if (!request.body.name || !request.body.address) {
        request.flash("error", "Please, fill all the fields.");
        return response.redirect("/checkout");
    }

    try {
        // Set your secret key: remember to change this to your live secret key in production
        // See your keys here: https://dashboard.stripe.com/account/apikeys
        const stripe = require("stripe")("MY_SECRET_KEY");

        // Token is created using Checkout or Elements!
        // Get the payment token ID submitted by the form:
        const token = request.body.stripeToken; // Using Express

        // Charging user. (I will create a Stripe service later).
        (async () => {
          const charge = await stripe.charges.create({
            amount: request.session.cart.totalPrice * 100, // In cents.
            currency: "usd",
            description: "Test Charge",
            source: token, // Hidden input data submitted from checkout.hbs
          });

          // Adding order obj to mongo db.
          orderService.createOrder({
              // Passport stores the user obj in the request obj.
              user: request.user,
              cart: request.session.cart,
              address: request.body.address, // From form.
              name: request.body.name, // From form.
              paymentId: charge.id
          });

          // Creating a success flash message.
          request.flash("success", "Your order has been successfully placed.");
          request.session.cart = null;
          return response.redirect("/");
        })();
    }catch (error) {
        console.log("Error: " + error);
        request.flash("error", error.message);
        return response.redirect("/checkout");
    }
});

module.exports = router;

function isAuthenticated(request, response, next) {
    if (request.isAuthenticated()) {
        return next();
    }
    request.session.oldURL = request.url;
    response.redirect("/user/signin");
}
