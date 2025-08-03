// /netlify/functions/handle-call.js
const axios = require('axios');

exports.handler = async (event) => {
  // 1. Parse incoming call data
  const formData = new URLSearchParams(event.body);
  const callerNumber = formData.get('callerNumber') || 'Unknown';
  
  // 2. Generate AI response
  const aiResponse = await generateAIResponse(callerNumber);
  
  // 3. Build TwiML response (Google Voice compatible)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Say voice="woman">${aiResponse}</Say>
    ${shouldForwardCall(aiResponse) ? 
      `<Dial>${process.env.YOUR_PHONE_NUMBER}</Dial>` : 
      '<Hangup/>'}
  </Response>`;
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/xml' },
    body: twiml
  };
};

async function generateAIResponse(callerNumber) {
  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: [{
          role: "user",
          content: `You're NexusWeb's AI receptionist. Call from ${callerNumber}. 
          Respond in 1 sentence under 15 words like: 
          "Thanks for calling NexusWeb! How can we help?"`
        }],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek error:', error);
    return "Thanks for calling NexusWeb. Connecting you now...";
  }
}

function shouldForwardCall(response) {
  const forwardKeywords = [
    'project', 'urgent', 'talk to', 'human', 
    'price', 'quote', 'meeting'
  ];
  return forwardKeywords.some(keyword => 
    response.toLowerCase().includes(keyword)
}