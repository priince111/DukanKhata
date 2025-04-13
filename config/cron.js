var cron = require('node-cron');
const https = require('https');

const job = new cron.schedule('*/14 * * * *', () => {
    https
        .get(process.env.API_URL, (res)=> {
            if(res.statusCode == 200) console.log("request send successfully")
            else console.log("request failed",res.statusCode)
        })
        .on("error", (e) => {console.log("error while sending request",e)})
  });

module.exports = job;