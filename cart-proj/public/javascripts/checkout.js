// Creating a Stripe client instance.
var stripe = Stripe("MY_PUBLIC_KEY");

// Creating an instance of Elements.
var elements = stripe.elements();

// Customizing the credit/debit card field.
var style = {
  base: {
    color: "#32325d",
    fontFamily: "Helvetica Neue, Helvetica, sans-serif",
    fontSmoothing: "antialiased",
    fontSize: "16px",
    "::placeholder": {
      color: "#aab7c4"
    }
  },
  invalid: {
    color: "#fa755a",
    iconColor: "#fa755a"
  }
};

// Creating an instance of the card Element.
var card = elements.create("card", {style: style});

// Adding an instance of the card Element into the `card-element` <div>.
card.mount("#card-element");

// Handling real-time validation errors from the card Element.
card.addEventListener("change", function(event) {
  var displayError = document.getElementById("card-errors");
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = "";
  }
});

// Handling form submission.
var form = document.getElementById("payment-form");
form.addEventListener("submit", function(event) {
  event.preventDefault();

  stripe.createToken(card).then(function(result) {
    if (result.error) {
      // Inform the user if there was an error.
      var errorElement = document.getElementById("card-errors");
      errorElement.textContent = result.error.message;
    } else {
      // Send the token to my localhost server.
      stripeTokenHandler(result.token);
    }
  });
});

// Submitting the form with the stripe token ID gotten from the Stripe server.
function stripeTokenHandler(token) {
  // Insert the token ID into the form so it gets submitted to the server.
  var form = document.getElementById("payment-form");
  var hiddenInput = document.createElement("input");
  hiddenInput.setAttribute("type", "hidden");
  hiddenInput.setAttribute("name", "stripeToken");
  hiddenInput.setAttribute("value", token.id);
  form.appendChild(hiddenInput);

  // Submit the form
  form.submit();
}
