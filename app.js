var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var metarRoutes = require('./routes/metarRoute')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use('/api/metar', metarRoutes);

app.get("/", (req, res) => {
    res.status(200).json("Server running at port " + port);
});

var port = process.env.PORT || 8080;

app.listen(port, () => {
console.log("Server Running");
});