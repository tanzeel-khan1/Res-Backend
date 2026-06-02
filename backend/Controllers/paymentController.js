const Stripe = require("stripe");

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(secretKey);
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency = "usd", tableId } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid advance payment amount is required",
      });
    }

    const stripe = getStripeClient();
    const appUrl = process.env.FRONTEND_URL || "http://localhost:4004";
    const unitAmount = Math.round(Number(amount) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "Advance Payment for Table Reservation",
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        tableId: tableId || "",
      },
      success_url: `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/${tableId}?payment=cancelled`,
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("Create Checkout Session Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Unable to start Stripe checkout",
    });
  }
};

exports.verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required",
      });
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.status(200).json({
      success: true,
      paymentStatus: session.payment_status,
      isPaid: session.payment_status === "paid",
      amountTotal: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    console.error("Verify Checkout Session Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Unable to verify Stripe session",
    });
  }
};
