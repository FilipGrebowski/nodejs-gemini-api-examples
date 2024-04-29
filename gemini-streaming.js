import dotenv from "dotenv";
dotenv.config();
import readline from "readline"; // Import readline for reading terminal input
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let isAwaitingResponse = false; // Flag to indicate if we're waiting for a response

async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const chat = model.startChat({
        history: [], // Start with an empty history
        generationConfig: {
            maxOutputTokens: 500,
        },
    });

    // Function to get user input and send it to the model using streaming
    function askAndRespond() {
        if (!isAwaitingResponse) {
            // Check if not currently awaiting a response
            rl.question("You: ", async (msg) => {
                if (msg.toLowerCase() === "exit") {
                    rl.close();
                } else {
                    isAwaitingResponse = true; // Set flag to true as we start receiving the stream
                    try {
                        const result = await chat.sendMessageStream(msg);
                        let text = "";
                        for await (const chunk of result.stream) {
                            const chunkText = await chunk.text(); // Assuming chunk.text() returns a Promise
                            console.log("AI: ", chunkText);
                            text += chunkText;
                        }
                        isAwaitingResponse = false; // Reset flag after stream is complete
                        askAndRespond(); // Ready for the next input
                    } catch (error) {
                        console.error("Error:", error);
                        isAwaitingResponse = false; // Ensure flag is reset on error too
                    }
                }
            });
        } else {
            console.log("Please wait for the current response to complete.");
        }
    }

    askAndRespond(); // Start the conversation loop
}

run();
