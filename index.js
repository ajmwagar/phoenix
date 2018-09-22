/*
    The following code goes into it's own file, and you run this file
    instead of your main bot file.
*/
const logo = require('asciiart-logo');
const chalk = require("chalk");
console.log(chalk.keyword('orange')(
    logo({
        name: 'ZORA',
        font: 'Doh',
        lineChars: 15,
        padding: 5,
        margin: 2
    })
    .emptyLine()
    .right('version 0.1.0 beta')
    .emptyLine()
    .wrap('ZoraBOT was created by Avery Wagar and Nathan Laha')
    .render()
));
const Discord = require('discord.js');
const Manager = new Discord.ShardingManager('./src/index.js');
Manager.spawn(1); // This example will spawn 2 shards (5,000 guilds);

/**
 * Web Interface!
 * Express Server
 */

const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const hbs = require('express-handlebars')
const app = express();

app.use(express.static(path.join(__dirname, 'static')))

// Register Handlebars instance as view engine
app.engine('hbs', hbs({
    extname: 'hbs', // Extension (*.hbs Files)
    defaultLayout: 'layout', // Main layout -> layouts/layout.hbs
    layoutsDir: __dirname + '/layouts', // Layouts directory -> layouts/
}))

// Set folder views/ as location for views files
app.set('views', path.join(__dirname, 'views'))
// Set hbs as view engine
app.set('view engine', 'hbs')

// SSL Certs
// TODO move into config.json
const options = {
    cert: fs.readFileSync('./sslcert/fullchain.pem'),
    key: fs.readFileSync('./sslcert/privkey.pem')
};

app.listen(80, () => {
    console.info('Running on port 80');
});
https.createServer(options, app).listen(443);
console.log(chalk.bgGreen("HTTPS server set up at port 443"))

// Routes
app.use('/api/discord', require('./api/discord'));

app.use((err, req, res, next) => {
    switch (err.message) {
        case 'NoCodeProvided':
            return res.status(400).send({
                status: 'ERROR',
                error: err.message,
            });
        default:
            return res.status(500).send({
                status: 'ERROR',
                error: err.message,
            });
    }
});