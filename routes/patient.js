var express = require('express');
const https = require("https");
const axios = require("axios");
var router = express.Router();

const agent = new https.Agent({
  rejectUnauthorized: false
});



router.get('/', function(req, res, next) {
    res.render('addPatient');
});

router.post('/', function(req, res, next) {


    const data = {
        "name" : req.body.name,
        "dateOfBirth" : req.body.dob,
        "email" : req.body.email
    }

    const config = {
        httpsAgent: agent,
        headers: {
            'Authorization': 'Bearer ' + process.env.ADMIN_ONLY_TOKEN
        }
    };

    axios.post('https://127.0.0.1:8244/healthFirst/1.0.0/', data, config)
        .then(res1 => {
            return res.redirect('/patient/');
        })
        .catch(error => {
            console.log(error);
            if(error.response.status === 401) {
                return res.redirect('/login');
            }
            return res.redirect('/patient/');
        });
});


router.get('/delete/:patientId', function(req, res, next) {
  let patientId = req.params.patientId;

  const config = {
    httpsAgent: agent,
    headers: {
      'Authorization': 'Bearer ' + process.env.ADMIN_ONLY_TOKEN
    }
  };

  axios.delete('https://127.0.0.1:8244/healthFirst/1.0.0/' + patientId, config)
      .then(res1 => {
        return res.redirect('/getPatientBasicInfo');
      })
      .catch(error => {
          console.log(error);
          if(error.response.status === 401) {
              return res.redirect('/login');
          }
          return res.redirect('/getPatientBasicInfo');
      });
});

module.exports = router;
