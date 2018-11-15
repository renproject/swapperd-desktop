const express = require('express');
const { exec } = require('child_process');
const app = express();

function serve() {
    app.listen(7778)       
}

app.post('/account', (req, res) => {
    console.log(req.body)
    request = JSON.parse(req.body)
    createAccount(request.Username, request.Password)
});

function createAccount(username, password) {
    exec(`install.sh testnet ${username} ${password}`)
}