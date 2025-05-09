const functions = require('firebase-functions');
const OpenAI = require('openai');

const openai = new OpenAI({
    api_Key: functions.config().openai.api_key
});

module.exports = {
    openai
}; 