var express = require('express');
const axios = require("axios");
const https = require("https");
var router = express.Router();

var patient_id;

const agent = new https.Agent({
    rejectUnauthorized: false
});


router.post('/', function(req, res, next) {

    const data = {
        "medicineCode" : req.body.medicineCode,
        "amount" : req.body.amount,
        "date" : req.body.date,
        "doctorId" : req.body.doctorId
    }

    const config = {
        httpsAgent: agent,
        headers: {
            'Authorization': 'Bearer ' + process.env.DOCTOR_ONLY_TOKEN
        }
    };

    axios.post('https://127.0.0.1:8244/healthFirst/1.0.0/medicalRecord/' + req.body.patientId, data, config)
        .then(res1 => {
            return res.redirect('/getPatientMedicalRecords');
        })
        .catch(error => {
            console.log(error);
            if(error.response.status === 403) {
                return res.redirect('/login');
            }
            return res.redirect('/getPatientMedicalRecords');
        });
});

router.get('/:patientId', function(req, res, next) {
    patient_id = req.params.patientId;
    const config = {
        httpsAgent: agent,
        headers: {
            'Authorization': 'Bearer ' + process.env.INFO_TOKEN
        }
    };

    axios.all([
        axios.get('https://127.0.0.1:8244/healthFirst/1.0.0/medicineList', config),
        axios.get('https://127.0.0.1:8244/healthFirst/1.0.0/doctorList', config)
    ]).then(axios.spread((res1, res2) => {
        res.render('addMedicalRecord', {patientId: patient_id, medicineList: res1.data, doctorList: res2.data.doctors.doctor});
        }))
        .catch(error => {
            console.log(error);
            if(error.response.status === 403) {
                return res.redirect('/login');
            }
            return res.redirect('/getPatientMedicalRecords');
        });
});

router.post('/', function(req, res, next) {
    patient_id = req.params.patientId;
    res.render('addMedicalRecord');
});

router.get('/:recordId/:patientId', function(req, res, next) {
    let patientId = req.params.patientId;
    let recordId = req.params.recordId;

    const config = {
        httpsAgent: agent,
        headers: {
            'Authorization': 'Bearer ' + process.env.DOCTOR_ONLY_TOKEN
        }
    };

    axios.delete('https://127.0.0.1:8244/healthFirst/1.0.0/medicalRecord/' + patientId + '/' + recordId, config)
        .then(res1 => {
            return res.redirect('/getPatientMedicalRecords');
        })
        .catch(error => {
            console.log(error);
            if(error.response.status === 403) {
                return res.redirect('/login');
            }
        });
});

module.exports = router;