require('dotenv').config();
var express = require('express');
var router = express.Router();
var passport = require('passport');
const saml = require('passport-saml').Strategy;
var fs = require('fs');
var axios = require('axios');
const https = require('https');
const { base64decode } = require('nodejs-base64');
const base64url = require('base64url');
const Console = require("console");

const agent = new https.Agent({
    rejectUnauthorized: false
});

var userProfile;
var userRole;
var patient_Email;
var view_Category;

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// saml strategy for passport
var strategy = new saml(
    {
        entryPoint: process.env.SAML_ENTRYPOINT,
        issuer: process.env.SAML_ISSUER,
        protocol: process.env.SAML_PROTOCOL,
        logoutUrl: process.env.SAML_LOGOUTURL,
        privateKey: fs.readFileSync('./security/private-key.pem', 'utf-8'),
        cert: fs.readFileSync('./security/wso2carbon.pem', 'utf8')
    },
    (profile, done) => {
      userProfile = profile;
      done(null, userProfile);
    }
);

passport.use(strategy);

var redirectToLogin = (req, res, next) => {
  if (!req.isAuthenticated() || userProfile == null) {
    return res.redirect('/login');
  }
  next();
};

/* GET home page. */
router.get('/', redirectToLogin, function(req, res, next) {
    // console.log(userRole)
    res.render(view_Category, { displayInfo: false });
});

/* GET login page. */
router.get('/login',
    passport.authenticate('saml', {
        successRedirect: '/',
        failureRedirect: '/login'
    })
);

router.get('/logout', (req, res) => {
  if (req.user == null) {
    return res.redirect('/login');
  }

  return strategy.logout(req, (err, uri) => {
    req.logout();

    userProfile = null;
    return res.redirect(uri);
  });
});

router.get('/failed', (req, res) => {
  res.status(401).send('Login failed');
});

router.post('/home', (req, res) => {
    res.redirect('/login');
});

router.post('/getPatientBasicInfo',
    (req, res) => {
    patient_Email = req.body.email;
    return res.redirect('/getPatientBasicInfo');
    });

router.get('/getPatientBasicInfo',
    (req, res) => {
        const encodedEmail = encodeURIComponent(patient_Email);
        const encodedUserRole = encodeURIComponent(userRole);
        const config = {
            httpsAgent: agent,
            headers: {
                'Authorization': 'Bearer ' + process.env.COMMON_TOKEN
            }
        };

        axios.get('https://127.0.0.1:8244/healthFirst/1.0.0/' + encodedEmail + '/' + encodedUserRole, config)
            .then(res1 => {
                let patientBasicInfo = res1.data;
                // console.log(patientBasicInfo)

                res.render('admin', {patient: patientBasicInfo, email: patient_Email, displayInfo: true});
            })
            .catch(error => {
                console.log(error);
                if(error.response.status === 401) {
                    return res.redirect('/login');
                }
                res.render('admin', {patient: {}, email: patient_Email, displayInfo: false});
            });
    });

router.post('/getPatientInfo',
    (req, res) => {
        patient_Email = req.body.email;
        return res.redirect('/getPatientInfo');
    });

router.get('/getPatientInfo',
    (req, res) => {
        const encodedEmail = encodeURIComponent(patient_Email);
        const encodedUserRole = encodeURIComponent(userRole);
        const config = {
            httpsAgent: agent,
            headers: {
                'Authorization': 'Bearer ' + process.env.COMMON_TOKEN
            }
        };

        axios.all([
            axios.get('https://127.0.0.1:8244/healthFirst/1.0.0/medicineList', config),
            axios.get('https://127.0.0.1:8244/healthFirst/1.0.0/doctorList', config),
            axios.get('https://127.0.0.1:8244/healthFirst/1.0.0/' + encodedEmail + '/' + encodedUserRole, config)
        ]).then(axios.spread((res1, res2, res3) => {
            let medicineList = res1.data;
            let doctorList = res2.data.doctors.doctor;
            let patientExtendedInfo = res3.data;
            // console.log(res3.data);
            let patientInfo = {
                "name": "",
                "email": "",
                "dateOfBirth": ""
            }

            patientInfo.name = patientExtendedInfo.name;
            patientInfo.email = patientExtendedInfo.email;
            patientInfo.dateOfBirth = patientExtendedInfo.dateOfBirth;
            let medicalRecordList = [];
            let medicalRecords = patientExtendedInfo.medicalRecords;
            for (let infoIndex in medicalRecords) {

                let medicalRecord = {};

                for (let medIndex in medicineList) {
                    if (medicineList[medIndex].code === medicalRecords[infoIndex].medicineCode) {
                        medicalRecord.medicine = medicineList[medIndex].name;
                    }
                }

                for (let docIndex in doctorList) {
                    if (doctorList[docIndex].id === medicalRecords[infoIndex].doctorId) {
                        medicalRecord.doctor = doctorList[docIndex].name;
                    }
                }

                medicalRecord.amount = medicalRecords[infoIndex].amount;
                medicalRecord.date = medicalRecords[infoIndex].date;
                medicalRecordList.push(medicalRecord);

            }
            // console.log(patientInfo);
            res.render('patient', {patient: patientInfo, medicalRecords: medicalRecordList, email: patient_Email, displayInfo: true});
        })).catch(error => {
            console.log(error);
            if(error.response.status === 401) {
                return res.redirect('/login');
            }
            res.render('patient', {patient: {}, medicalRecords: [], email: patient_Email, displayInfo: false});
        });
    });

router.post('/getPatientMedicalRecords',
    (req, res) => {
        patient_Email = req.body.email;
        return res.redirect('/getPatientMedicalRecords');
    });

router.get('/getPatientMedicalRecords',
    (req, res) => {

    var selectedEmail = patient_Email;
    const encodedEmail = encodeURIComponent(patient_Email);
    const encodedUserRole = encodeURIComponent(userRole);
    const config = {
        httpsAgent: agent,
        headers: {
                'Authorization': 'Bearer ' + process.env.COMMON_TOKEN
            }
        };

    axios.all([
        axios.get('https://127.0.0.1:8244/healthFirst/1.0.0/medicineList', config),
        axios.get('https://127.0.0.1:8244/healthFirst/1.0.0/doctorList', config),
        axios.get('https://127.0.0.1:8244/healthFirst/1.0.0/' + encodedEmail + '/' + encodedUserRole, config)
    ]).then(axios.spread((res1, res2, res3) => {
        let medicineList = res1.data;
        let doctorList = res2.data.doctors.doctor;
        let patientId = res3.data.id;
        let medicalRecords = res3.data.medicalRecords;
            // console.log(res3.data);
            // console.log(patientId);
            // console.log(medicalRecords);

        let medicalRecordList = [];
        for (let infoIndex in medicalRecords) {

            let medicalRecord = {};

            for (let medIndex in medicineList) {
                if (medicineList[medIndex].code === medicalRecords[infoIndex].medicineCode) {
                    medicalRecord.medicine = medicineList[medIndex].name;
                }
            }

            for (let docIndex in doctorList) {
                if (doctorList[docIndex].id === medicalRecords[infoIndex].doctorId) {
                    medicalRecord.doctor = doctorList[docIndex].name;
                }
            }

            medicalRecord.id = medicalRecords[infoIndex].id;
            medicalRecord.amount = medicalRecords[infoIndex].amount;
            medicalRecord.date = medicalRecords[infoIndex].date;
            medicalRecordList.push(medicalRecord);

        }
            // console.log(medicalRecordList);
        res.render('doctor', { email: selectedEmail, patient_id: patientId, medicalRecords: medicalRecordList, displayInfo: true});
        })).catch(error => {
            console.log(error);
            if(error.response.status === 401) {
                return res.redirect('/login');
            }
            res.render('doctor', { email: selectedEmail, patient_id: "", medicalRecords: [], displayInfo: false});
        });
    });


router.post(
    '/saml/consume',
    passport.authenticate('saml', {
      failureRedirect: '/failed',
      failureFlash: true
    }),
    (req, res) => {

        const body = 'client_id=' + process.env.CLIENT_ID
            + '&client_secret=' + process.env.CLIENT_SECRET
            + '&grant_type=client_credentials&scope='

        const config = {
            httpsAgent: agent,
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            }
        };

        let roles = userProfile.role;

        if(roles.includes('admin')) {
            view_Category = 'admin'
            userRole = 'Admin'
            axios.all([
                axios.post('https://127.0.0.1:8244/token', body + process.env.COMMON_SCOPE, config),
                axios.post('https://127.0.0.1:8244/token', body + process.env.ADMIN_ONLY_SCOPE, config)
            ]).then(axios.spread((res1, res2) => {
                process.env.COMMON_TOKEN = res1.data.access_token;
                process.env.ADMIN_ONLY_TOKEN = res2.data.access_token;
                return res.redirect('/');
                }))
                .catch(error => {
                    console.log(error);
                    return res.redirect('/login')
                });
        } else if (roles.includes('Doctor')) {
            view_Category = 'doctor'
            userRole = 'Doctor'
            axios.all([
                axios.post('https://127.0.0.1:8244/token', body + process.env.COMMON_SCOPE, config),
                axios.post('https://127.0.0.1:8244/token', body + process.env.DOCTOR_ONLY_SCOPE, config)
            ]).then(axios.spread((res1, res2) => {
                process.env.COMMON_TOKEN = res1.data.access_token;
                process.env.DOCTOR_ONLY_TOKEN = res2.data.access_token;
                return res.redirect('/');
            }))
                .catch(error => {
                    console.log(error);
                    return res.redirect('/login')
                });
        } else if(roles.includes('Patient')) {
            view_Category = 'patient'
            userRole = 'Patient'
            axios.post('https://127.0.0.1:8244/token', body + process.env.COMMON_SCOPE, config)
                .then((res1) => {
                    process.env.COMMON_TOKEN = res1.data.access_token;
                    return res.redirect('/');
                })
                .catch(error => {
                    console.log(error);
                    return res.redirect('/login')
                });
        }else {
            view_Category = 'index'
            userRole = 'Invalid'
            return res.redirect('/');
        }
      // // saml assertion extraction from saml response
      // var samlResponse = res.req.body.SAMLResponse;
      // var decoded = base64decode(samlResponse);
      // // console.log("Saml",decoded);
      // var assertion =
      //     ('<saml2:Assertion' + decoded.split('<saml2:Assertion')[1]).split(
      //         '</saml2:Assertion>'
      //     )[0] + '</saml2:Assertion>';
      // // console.log("assertion", assertion);
      // var urlEncoded = base64url(assertion);
      // // console.log("urlEncoded", urlEncoded);
      //


      // success redirection to / home page
    }
);



module.exports = router;
