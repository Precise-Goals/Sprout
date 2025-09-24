const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Access environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// --- ROUTES ---

// 1. Webhook Verification Endpoint
// This endpoint is used by Meta to verify your webhook URL.
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if a token and mode is in the query string of the request
    if (mode && token) {
        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            // Respond with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            // Respond with '403 Forbidden' if verify tokens do not match
            console.error('Verification failed. Tokens do not match.');
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400); // Bad Request
    }
});

// 2. Message Handling Endpoint
// This endpoint receives messages from WhatsApp.
app.post('/webhook', async (req, res) => {
    const body = req.body;

    console.log('Incoming webhook message:', JSON.stringify(body, null, 2));

    // Check if the webhook notification is a message notification
    if (body.object === 'whatsapp_business_account' && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
        
        const message = body.entry[0].changes[0].value.messages[0];

        // Check if the message is a text message
        if (message && message.type === 'text') {
            const from = message.from; // Sender's phone number
            const msg_body = message.text.body; // The actual message text
            const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;

            try {
                // Generate a response from Gemini
                console.log(`Generating response for: "${msg_body}"`);
                const result = await model.generateContent(msg_body);
                const response = await result.response;
                const geminiText = response.text();

                console.log(`Gemini response: "${geminiText}"`);

                // Send the Gemini response back to the user via WhatsApp
                await axios({
                    method: 'POST',
                    url: `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    data: {
                        messaging_product: 'whatsapp',
                        to: from,
                        text: { body: geminiText },
                    },
                });

                console.log('Reply sent successfully.');

            } catch (error) {
                console.error('Error processing message:', error.response ? error.response.data : error.message);
            }
        }
        
        // Mark the message as read
        res.sendStatus(200);

    } else {
        // If not a message notification, just acknowledge the request
        res.sendStatus(204); // No Content
    }
});

// Default route
app.get('/', (req, res) => {
    res.send('WhatsApp Chatbot with Gemini is running!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});