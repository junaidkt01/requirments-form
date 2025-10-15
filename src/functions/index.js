// functions/index.js (Node 18+)
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
admin.initializeApp();
const db = admin.firestore();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.sendOtp = functions.https.onRequest(async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });

    const otp = generateOtp();
    const hashedOtp = otp; // You should hash with bcrypt in production.
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 min

    await db.collection("emailOtps").doc(email).set({
      otp: hashedOtp,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const msg = {
      to: email,
      from: "no-reply@yourdomain.com",
      subject: "Your OTP code",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`
    };
    await sgMail.send(msg);

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

exports.verifyOtp = functions.https.onRequest(async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Missing" });

    const doc = await db.collection("emailOtps").doc(email).get();
    if (!doc.exists) return res.status(400).json({ message: "OTP not found" });

    const data = doc.data();
    const now = admin.firestore.Timestamp.now();
    if (data.expiresAt.toMillis() < now.toMillis()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    if (data.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    // Optional: update user's password using Admin SDK
    const userRecord = await admin.auth().getUserByEmail(email);
    if (newPassword) {
      await admin.auth().updateUser(userRecord.uid, { password: newPassword });
    }

    // delete OTP or mark used
    await db.collection("emailOtps").doc(email).delete();

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});


///////////////////////////////////////

const axios = require("axios");

// Store these as environment variables (for security)
// const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
// const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = functions.config().whatsapp.token;
const WHATSAPP_PHONE_ID = functions.config().whatsapp.phone_id;

exports.sendWhatsApp = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { name, service, phone } = req.body;
    if (!phone || !name || !service) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone, // e.g., "919961260138"
        type: "template",
        template: {
          name: "vanitha_veedu",
          language: { code: "en_US" },
          components: [
            {
              type: "header",
              parameters: [{ type: "text", text: name }],
            },
            {
              type: "body",
              parameters: [{ type: "text", text: service }],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (err) {
    console.error("Error sending WhatsApp:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      error: err.response?.data || err.message,
    });
  }
});


// firebase functions:config:set whatsapp.token="EAAQZBr44sSeoBPnXiJ3ZB7F0BeX7lZCiGLHsjllttzZCgRem0zWwQVCxtgQjyZBrXmv6vbmrP1A55UN3Eytet5K0c8QYREy3ZA09IfNjomIOqRmmT6EMtoYdvc1gldD5dtgpZCpyhXRfAg3JvFt8uDfAcEUeZAS2wlbQPKkrBZBbGAw5eMVyMYFiFQ4JZBA9cfPg7D1AZDZD" whatsapp.phone_id="866342399887735"

