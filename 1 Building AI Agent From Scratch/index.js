import OpenAI from "openai";
import readlineSync from "readline-sync";
import dotenv from "dotenv";
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groq = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// Tools
const tools = {
  getWeatherDetails: (city = "") => {
    if (city.toLowerCase() === "patiala") return "10°C";
    if (city.toLowerCase() === "mohali") return "14°C";
    if (city.toLowerCase() === "banglore") return "25°C";
    if (city.toLowerCase() === "chandigarh") return "12°C";
    if (city.toLowerCase() === "delhi") return "15°C";
    return "Weather data not available";
  }
};

// -- If i run this then i get output that as AI Agent i dont have access to real time data
// async function runQuery() {
//   const user = "Hey, What is the weather of Patiala?";

//   try {
//     const response = await groq.chat.completions.create({
//       model: "llama-3.1-8b-instant",
//       messages: [{ role: "user", content: user }]
//     });

//     console.log(response.choices[0].message.content);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }
// runQuery();

//PROMPTING IS THE MAIN THING 
const SYSTEM_PROMPT = `
You are an AI Assistant with START, PLAN, ACTION, Obeservation and Output State.
Wait for the user prompt and first PLAN using available tools.
After Planning, Take the action with appropriate tools and wait for Observation based on Action. Once you get the observations, Return the AI response based on START propmt and observations

Strictly follow the JSON output format as in exmaples

Available Tools:
- function getWeatherDetails(city: string): string
getWeatherDetails is a function that accepts city name as string and retuns the weather details

Example: 
START
{ "type" : "user", "user": "What is the sum of weather of Patiala and Mohali?" }
{ "type": "plan", "plan": "I will call the getWeatherDetails for Patiala" }
{ "type": "action", "function": "getWeatherDetails", "input": "patiala" }
{ "type": "observation", "observation": "10°C" }
{ "type": "plan", "plan": "I will call getWeatherDetails for Mohali" }
{ "type": "action", "function": "getWeatherDetails", "input": "mohali" }
{ "type": "observation", "observation": "14°C" }
{ "type": "output", "output": "The sum of weather of Patiala and Mohali is 24°C" }

`;

const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

async function runAgent() {
while (true) {
    const query = readlineSync.question('>> ');
    const q = {
        type: 'user',
        user: query,
    };
    messages.push({ role: 'user', content: JSON.stringify(q) });

    while (true) {
        const chat = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            response_format: { type: 'json_object' },
        });

        const result = chat.choices[0].message.content;
        messages.push({ role: 'assistant', content: result });

        console.log(`\n\n----------START AI----------`)
        console.log(result);
        console.log(`----------END AI----------\n\n`)

        const call = JSON.parse(result);
        if (call.type === 'output') {
            console.log(`BOT: ${call.output}`);
            break;
        }
        else if (call.type === 'action') {
            const fn = tools[call.function];
            const observation = fn(call.input);
            const obs = { type: 'observation', observation: observation };
            messages.push({ role: 'developer', content: JSON.stringify(obs) });
        }
    }
  }
}

runAgent();