const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const keep_alive = require('./keep_alive.js')
// Create an instance of the Telegraf bot
const token = process.env['key'];
const bot = new Telegraf(token);

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.aikey);

// Store chat history for each user
const userChatHistory = {};

// Function to generate content based on prompts
async function generateContent(userId, prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text;
  } catch (error) {
    console.error("Error:", error);
    return "Sorry, an error occurred while generating content.";
  }
}

// Function to delete previous messages
async function deletePreviousMessages(userId, ctx) {
  // Clear user's chat history
  userChatHistory[userId] = [];
  await ctx.reply('Previous messages deleted.');
}

// Listen for messages from users
bot.on('message', async (ctx) => {
  try {
    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Handle /new command
    if (messageText === '/new') {
      await deletePreviousMessages(userId, ctx);
      return;
    }

    // Retrieve or initialize user's chat history
    let chatHistory = userChatHistory[userId];
    if (!chatHistory) {
      chatHistory = [];
      userChatHistory[userId] = chatHistory;
    }

    // Add current message to user's chat history
    chatHistory.push(`User: ${messageText}`);

    // Format the prompt with previous messages as data and current prompt
    let prompt = "You are a helpful bot. your name is 'SONIK BOT'.AND You Made By 'Sourabh Yadav' you have to answer the user question you can use the following data to answer the user question";
    if (chatHistory.length > 0) {
      prompt += "Message History:\n" + chatHistory.join('\n') + "\n\n";
    }
    prompt += "Current Prompt: \n" + messageText;

    // Generate content based on the prompt
    const generatedContent = await generateContent(userId, prompt);

    chatHistory.push(`Bot: ${generatedContent}`);
    // Send the generated content to the user
    await ctx.reply(generatedContent);
  } catch (error) {
    console.error("Error: Try Again By Using /new Command");
  }
});

const app = express();
const port = process.env.PORT || 3000;

// Define a route to check the status of the server
app.get('/', (req, res) => {
  res.send('Server started!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Start listening for messages from Telegram users
bot.launch();