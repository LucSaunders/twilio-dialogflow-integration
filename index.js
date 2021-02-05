const express = require('express');
const app = express();

require('dotenv').config();

// to manage user session
const dialogflowSessionClient =
    require('./botlib/dialogflow_session_client.js');

const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// set dialogflow and twilio credentials
const projectId = process.env.PROJECT_ID;
const phoneNumber = process.env.PHONE_NUMBER;
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

const client = require('twilio')(accountSid, authToken);
const sessionClient = new dialogflowSessionClient(projectId);

let port_num = 8989;
// start the server
const listener = app.listen(port_num, function() {
    console.log('Your Twilio integration server is listening on port ' +
        listener.address().port);
});

app.post('/', async function(req, res) {
    // get the body of the msg
    const body = req.body;
    // get original text by the user
    const text = body.Body;
    // get user mobile number
    const sendTo = body.From;
    // detect the intent and pass the query
    const dialogflowResponse = (
        await sessionClient.detectIntent(text, sendTo, body)).fulfillmentText;

    console.log("User response => " + JSON.stringify(text, null, 2));

    try {
        await client.messages.create({
            body: dialogflowResponse,
            from: phoneNumber,
            to: sendTo
        }).then(message => console.log("*** message sent successfully to => " + sendTo + "  *****"));
    } catch (error) {
        console.log("error => " + JSON.stringify(error, null, 2))
    }
    console.log("Dialogflow response => " + JSON.stringify(dialogflowResponse, null, 2));
    // terminate the user request successfully
    res.end();
});

process.on('SIGTERM', () => {
    listener.close(() => {
        console.log('Closing http server.');
        process.exit(0);
    });

});