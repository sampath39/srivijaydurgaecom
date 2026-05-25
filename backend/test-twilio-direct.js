require('dotenv').config()
const twilio = require('twilio')

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
const toNumber = 'whatsapp:+916304258160' // From conversation logs

async function run() {
  console.log(`Sending WhatsApp message using Twilio...`)
  console.log(`From: ${fromNumber}`)
  console.log(`To: ${toNumber}`)

  try {
    const message = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
      contentVariables: JSON.stringify({ "1": "25/5", "2": "1:30pm" })
    })
    console.log('Success! Message SID:', message.sid)
    console.log('Status:', message.status)
  } catch (err) {
    console.error('Error sending message:', err.message)
  }
}

run()
