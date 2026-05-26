require('dotenv').config()
const twilio = require('twilio')

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_WHATSAPP_FROM // e.g., whatsapp:+14155238886
const client = twilio(accountSid, authToken)

async function sendWhatsAppAlert(toNumber) {
  try {
    const formattedNumber = `whatsapp:${toNumber.startsWith('+') ? toNumber : '+91' + toNumber}`
    
    console.log(`Sending WhatsApp alert to ${formattedNumber}...`)
    
    const message = await client.messages.create({
      body: '🔥 Price dropped from ₹5999 → ₹4499. Sale offers available only 9 hours! Click here to grab your Kadi Saree now: http://localhost:3000',
      from: fromNumber,
      to: formattedNumber
    })
    
    console.log(`Message sent successfully! SID: ${message.sid}`)
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message)
  }
}

// Ensure the user provided a number as an argument, or use the default test number
const testNumber = process.argv[2] || '+916304258160'
sendWhatsAppAlert(testNumber)
