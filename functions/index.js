const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const cors = require("cors")({ origin: true });

admin.initializeApp();

const razorpay = new Razorpay({
    key_id: functions.config().razorpay.key_id,
    key_secret: functions.config().razorpay.key_secret,
});

exports.createRazorpayOrder = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const { applicationId, amount } = req.body;

        if (!applicationId || !amount) {
            return res.status(400).send('Missing applicationId or amount');
        }

        const options = {
            amount: amount * 100, // Amount in paisa
            currency: "INR",
            receipt: applicationId,
        };

        try {
            const order = await razorpay.orders.create(options);
            return res.status(200).json({ order_id: order.id });
        } catch (error) {
            console.error("Razorpay order creation failed:", error);
            return res.status(500).send("Error creating Razorpay order");
        }
    });
});

exports.createOfficer = functions.https.onCall(async (data, context) => {
  // Ensure the user is an authenticated admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { email, password, officerType, fullName, location } = data;

  if (!email || !password || !officerType || !fullName || !location) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required officer data."
    );
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    const prefix = officerType === "Quarter Officer" ? "QO" : "GHO";
    const date = new Date();
    const dateString = `${date.getFullYear()}${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;
    const randomNum = Math.floor(Math.random() * 1000);
    const officerId = `${prefix}-${dateString}-${randomNum}`;

    await admin.firestore().collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      officerId,
      officerType,
      fullName,
      email,
      location,
      createdAt: new Date(),
    });

    return { success: true, officerId: officerId };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});
