const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let bot = null;

// Serve a basic HTML control panel directly from the script
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Minecraft Bot Control Panel</title>
            <style>
                body { font-family: sans-serif; background: #121212; color: #fff; padding: 20px; }
                #chat { height: 300px; overflow-y: scroll; background: #1e1e1e; padding: 10px; border-radius: 5px; margin-bottom: 10px; }
                input, button { padding: 10px; font-size: 16px; border: none; border-radius: 5px; }
                input[type="text"] { width: 70%; background: #2d2d2d; color: #fff; }
                button { background: #4ade80; color: #000; cursor: pointer; font-weight: bold; }
            </style>
        </head>
        <body>
            <h2>🤖 Live Minecraft Bot Dashboard</h2>
            <div id="chat"></div>
            <input type="text" id="cmd" placeholder="Type a command (e.g., /server skypvp)...">
            <button onclick="sendCmd()">Send</button>

            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                const chatDiv = document.getElementById('chat');
                
                socket.on('msg', (data) => {
                    chatDiv.innerHTML += '<div>' + data + '</div>';
                    chatDiv.scrollTop = chatDiv.scrollHeight;
                });

                function sendCmd() {
                    const inp = document.getElementById('cmd');
                    socket.emit('command', inp.value);
                    inp.value = '';
                }
            </script>
        </body>
        </html>
    `);
});

// Start the Minecraft Bot connection
function createBot() {
    bot = mineflayer.createBot({
        host: process.env.SERVER_HOST || '://server.com',
        port: parseInt(process.env.SERVER_PORT) || 25565,
        username: process.env.BOT_USERNAME || 'ManualBot',
        version: false, // Auto-detect
        auth: 'offline' // Cracked mode
    });

    bot.on('login', () => {
        io.emit('msg', '[System] Bot connected to the server hub!');
    });

    bot.on('message', (jsonMsg) => {
        io.emit('msg', jsonMsg.toAnsi ? jsonMsg.toAnsi() : jsonMsg.toString());
    });

    bot.on('end', () => {
        io.emit('msg', '[System] Bot disconnected. Reconnecting in 5s...');
        setTimeout(createBot, 5000);
    });
}

// Listen for commands typed into the web browser interface
io.on('connection', (socket) => {
    socket.emit('msg', '[System] Connected to Control Dashboard.');
    
    socket.on('command', (cmd) => {
        if (bot) {
            bot.chat(cmd);
            socket.emit('msg', '<span style="color:#4ade80">> Sent: ' + cmd + '</span>');
        } else {
            socket.emit('msg', '[Error] Bot is not spawned inside a server right now.');
        }
    });
});

createBot();
server.listen(process.env.PORT || 3000, () => {
    console.log('Control Dashboard active on port ' + (process.env.PORT || 3000));
});
