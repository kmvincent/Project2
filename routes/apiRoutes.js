// so we pull the petfinder api results based on the first how many questions
// then from there we parse the text for keywords.

// how do we assign points based on keywords?

// And then rank each one. 
const express = require("express");
const questions = require("../data/questions");
const router = express.Router();
let dotenv = require('dotenv').config();
var db = require("../models");
var request = require('request');


module.exports = function (app) {
    // first four in keyWordArray are sometimes listed in the "options" sections of api response (WORK IN PROGRESS with doggo words)
    let dogKeyWordArray = ["noKids", "noCats", "specialNeeds", "housetrained", ""]

    // will pull pets from database based on quiz criteria (first section, needs to be added as variables)
    app.post("/pf", function (req, res) {

        let queryAddendum = req.body.queryUrlParams;
        let requiredOptions = req.body.requiredOptions;
        let personalityQ1 = req.body.personalityQ1;
        let personalityQ2 = req.body.personalityQ2;
        let personalityQ3 = req.body.personalityQ3;
        let personalityQ4 = req.body.personalityQ4;
        let personalityQ5 = req.body.personalityQ5;
        let personalityQ6 = req.body.personalityQ6;

        var key = process.env.PETFINDER_KEY;

        //options variables; auto-set to not trigger requirements

        var fixed = false;
        var shots = false;
        var housetrained = false;
        var declawed = false;
        var specialNeeds = false;
        var noKids = false;
        var noCats = false;
        var noDogs = false;

        //loops to change options variables if quiz questions answered affirmatively
        for (let i = 0; i < requiredOptions.length; i++) {
            if (requiredOptions[i] == 'fixed') {
                fixed = true;
            }
            if (requiredOptions[i] == 'shots') {
                shots = true;
            }
            if (requiredOptions[i] == 'housetrained') {
                housetrained = true;
            }
            if (requiredOptions[i] == 'declawed') {
                declawed = true;
            }
            if (requiredOptions[i] == 'specialNeeds') {
                specialNeeds = true;
            }
            if (requiredOptions[i] == 'noKids') {
                noKids = true;
            }
            if (requiredOptions[i] == 'noCats') {
                noCats = true;
            }
            if (requiredOptions[i] == 'noDogs') {
                noDogs = true;
            }
        }

        console.log(`fixed: ${fixed}`)
        console.log(`shots: ${shots}`)
        console.log(`housetrained: ${housetrained}`)

        var queryUrl = `http://api.petfinder.com/pet.find?format=json&key=${key}&output=full&count=200${queryAddendum}`;

        console.log(queryUrl)

        request(queryUrl, function (error, response, body) {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            let responseObject = JSON.parse(body);
            let petsObject = responseObject.petfinder.pets.pet;


            //filter out "options" section in response from petfinder api

            let ineligibleIds = [];

            //loop through each pet
            for (let i = 0; i < petsObject.length; i++) {

                //if something ineligible happens, remove from petsObject (within each loop)
                if (!petsObject[i].description.$t) {
                    console.log(`${[i]}: undefined`)
                    ineligibleIds.push(petsObject[i].id.$t);
                }


                let petOptions = petsObject[i].options.option
                //console.log(typeof petOptions)
                //if nothing has been checked under a pet, insert an empty array so it doesn't break
                if (typeof petOptions == "undefined") {
                    petOptions = [];
                }
                //console.log(petOptions)


                //if user checks must be already fixed
                if (fixed == true) {
                    //loop through options list from api
                    for (let j = 0; j < petOptions.length; j++) {
                        //if pet options list contains altered, return true
                        if (petOptions[j].$t == 'altered') {
                            //console.log(`${petsObject[i].name.$t} is fixed!`);
                            break;
                        }
                        else {
                            //console.log(`${petsObject[i].name.$t} ineligible`)
                            ineligibleIds.push(petsObject[i].id.$t);
                            break;
                        }
                        //console.log(`${petsObject[i].name.$t}: ${petOptions[j].$t}`)
                    }
                }
                //if user checks must be already up to date on shots
                if (shots == true) {
                    //loop through options list from api
                    for (let j = 0; j < petOptions.length; j++) {
                        //if pet options list contains altered, return true
                        if (petOptions[j].$t == 'hasShots') {
                            //console.log(`${petsObject[i].name.$t} is up-to-date on shots!`);
                            break;
                        }
                        else {
                            //console.log(`${petsObject[i].name.$t} ineligible`)
                            ineligibleIds.push(petsObject[i].id.$t);
                            break;
                        }


                    }
                }
                //if user checks must be already housetrained
                if (housetrained == true) {
                    //loop through options list from api
                    for (let j = 0; j < petOptions.length; j++) {
                        //if pet options list contains altered, return true
                        if (petOptions[j].$t == 'housetrained') {
                            //console.log(`${petsObject[i].name.$t} goes wee-wee in the right place!`);
                            break;
                        }
                        else {
                            //console.log(`${petsObject[i].name.$t} ineligible`)
                            ineligibleIds.push(petsObject[i].id.$t);
                            break;
                        }
                    }
                }
                //if user checks must be declawed
                if (declawed == true) {
                    //loop through options list from api
                    for (let j = 0; j < petOptions.length; j++) {
                        //if pet options list contains altered, return true
                        if (petOptions[j].$t == 'declawed') {
                            //console.log(`${petsObject[i].name.$t} has been declawed :(`);
                            break;
                        }
                        else {
                            //console.log(`${petsObject[i].name.$t} ineligible`)
                            ineligibleIds.push(petsObject[i].id.$t);
                            break;
                        }

                    }
                }
                //if user doesn't check special needs are ok
                if (specialNeeds == false) {
                    //loop through options list from api
                    for (let j = 0; j < petOptions.length; j++) {
                        //if pet options list contains altered, return true
                        if (petOptions[j].$t == 'specialNeeds') {
                            //console.log(`${petsObject[i].name.$t} has special needs and isn't suitable for this user.`);
                            ineligibleIds.push(petsObject[i].id.$t);
                            break;
                        }

                    }
                }
                //if user doesn't check no kids is ok
                if (noKids == false) {
                    //loop through options list from api
                    for (let j = 0; j < petOptions.length; j++) {
                        //if pet options list contains altered, return true
                        if (petOptions[j].$t == 'noKids') {
                            //console.log(`${petsObject[i].name.$t} can't be around kids and isn't suitable for this user.`);
                            ineligibleIds.push(petsObject[i].id.$t);
                            break;
                        }

                    }
                }
                //if user doesn't check no other cats is ok
                if (noCats == false) {
                    //loop through options list from api
                    for (let j = 0; j < petOptions.length; j++) {
                        //if pet options list contains altered, return true
                        if (petOptions[j].$t == 'noCats') {
                            //console.log(`${petsObject[i].name.$t} can't be around other cats and isn't suitable for this user.`);
                            ineligibleIds.push(petsObject[i].id.$t);
                            break;
                        }

                    }
                }
                //if user doesn't check no other dogs is ok
                if (noDogs == false) {
                    //loop through options list from api
                    for (let j = 0; j < petOptions.length; j++) {
                        //if pet options list contains altered, return true
                        if (petOptions[j].$t == 'noDogs') {
                            //console.log(`${petsObject[i].name.$t} can't be around other dogs and isn't suitable for this user.`);
                            ineligibleIds.push(petsObject[i].id.$t);
                            break;
                        }

                    }
                }

            }

            //console.log(petsObject.length)
            //console.log(ineligibleIds)
            //console.log(ineligibleIds.length)
            for (let i = 0; i < petsObject.length; i++) {
                let petId = petsObject[i].id.$t
                for (let j = 0; j < ineligibleIds.length; j++) {
                    //console.log(ineligibleIds[j])
                    if (petId == ineligibleIds[j]) {
                        petsObject.splice(i, 1);
                        //ineligibleIds.splice(j,1);
                    }
                }
            }

            //console.log(petsObject)
            //console.log(petsObject.length)
            let parsePetsObject = petsObject;

            //console.log(parsePetsObject)

            //TEXT PARSING

            //CATS
            if (parsePetsObject[0].animal.$t == "Cat") {
                console.log('meow')
                //full array of words to find
                let playfulCatKeyWordArr = ['play', 'playful', 'energy', 'energetic', 'trouble', 'entertain', 'entertaining', 'wrestle', 'run', 'running', 'active', 'chase', 'chasing']
                let lapCatKeyWordArr = ['lap', 'lapcat', 'sit', 'curl', 'snuggle', 'snuggler', 'brush', 'brushing', 'rub', 'tummy', 'burrow', 'hold', 'held', 'rub', 'rubbing', 'rubbed', 'pet', 'petting', 'petted']
                let socialCatKeyWordArr = ['outgoing', 'people', 'social', 'hangout', 'hang-out', 'attention', 'follow']
                let independentCatKeyWordArr = ['independent', 'solitary', 'own', 'alone', 'aloof']
                let vocalCatKeyWordArr = ['voice', 'vocal', 'chatterbox', 'sing', 'singing', 'singer', 'chirp', 'chirps', 'chirping', 'chat', 'chatty', 'meow', 'meowing', 'conversation', 'converse']
                let cautiousCatKeyWordArr = ['cautious', 'shy', 'hide', 'hiding', 'patient', 'patience', 'noises', 'scare', 'timid', 'spook']
                //need to do for each result (pets object has been cut down by options logic above)
                console.log("parsePetsObject")
                console.log(parsePetsObject)
                for (let i = 0; i < parsePetsObject.length; i++) {
                    console.log(`---PET INDEX ${i}---`)
                    //empty arrays to push found words into
                    let foundPlayfulCatKeyWordArr = [];
                    let playfulCount = 0;
                    let foundLapCatKeyWordArr = [];
                    let lapCount = 0;
                    let foundSocialCatKeyWordArr = [];
                    let socialCount = 0;
                    let foundIndependentCatKeyWordArr = [];
                    let independentCount = 0;
                    let foundVocalCatKeyWordArr = [];
                    let vocalCount = 0;
                    let foundCautiousCatKeyWordArr = [];
                    let cautiousCount = 0;


                    //pull out string of text from each result
                    let text;
                    if (!parsePetsObject[i].description.$t) {
                        text = "aaaaaa"
                    }
                    else {
                        text = parsePetsObject[i].description.$t
                    };
                    //console.log("IS THIS UNDEFINED!?!?!?!")
                    //console.log(text)
                    //console.log(`${parsePetsObject[i].name.$t}: ${text}`)

                    //for each keyword in each array, scan through each text and push into found__KeyWordArr
                    for (let j = 0; j < playfulCatKeyWordArr.length; j++) {
                        //console.log(playfulCatKeyWordArr[j])
                        function parse() {
                            var result = text.search(playfulCatKeyWordArr[j]);
                            //console.log(result);
                            foundPlayfulCatKeyWordArr.push(result)
                        }
                        parse();
                    }
                    //console.log(text)
                    console.log(`playful: ${foundPlayfulCatKeyWordArr}`)
                    for (let n = 0; n < foundPlayfulCatKeyWordArr.length; n++) {
                        if (foundPlayfulCatKeyWordArr[n] != -1) {
                            playfulCount++
                        }
                    }
                    console.log(`playful total: ${playfulCount} out of ${foundPlayfulCatKeyWordArr.length}`)
                    for (let j = 0; j < lapCatKeyWordArr.length; j++) {
                        //console.log(lapCatKeyWordArr[j])
                        function parse() {
                            var result = text.search(lapCatKeyWordArr[j]);
                            foundLapCatKeyWordArr.push(result)
                        }
                        parse();
                    }
                    console.log(`lap: ${foundLapCatKeyWordArr}`)
                    for (let n = 0; n < foundLapCatKeyWordArr.length; n++) {
                        if (foundLapCatKeyWordArr[n] != -1) {
                            lapCount++
                        }
                    }
                    console.log(`lap total: ${lapCount} out of ${foundLapCatKeyWordArr.length}`)
                    for (let j = 0; j < socialCatKeyWordArr.length; j++) {
                        function parse() {
                            var result = text.search(socialCatKeyWordArr[j]);
                            foundSocialCatKeyWordArr.push(result)
                        }
                        parse();
                    }
                    console.log(`social: ${foundSocialCatKeyWordArr}`)
                    for (let n = 0; n < foundSocialCatKeyWordArr.length; n++) {
                        if (foundSocialCatKeyWordArr[n] != -1) {
                            socialCount++
                        }
                    }
                    console.log(`social total: ${socialCount} out of ${foundSocialCatKeyWordArr.length}`)
                    for (let j = 0; j < independentCatKeyWordArr.length; j++) {
                        function parse() {
                            var result = text.search(independentCatKeyWordArr[j]);
                            foundIndependentCatKeyWordArr.push(result)
                        }
                        parse();
                    }
                    console.log(`independent: ${foundIndependentCatKeyWordArr}`)
                    for (let n = 0; n < foundIndependentCatKeyWordArr.length; n++) {
                        if (foundIndependentCatKeyWordArr[n] != -1) {
                            independentCount++
                        }
                    }
                    console.log(`independent total: ${independentCount} out of ${foundIndependentCatKeyWordArr.length}`)
                    for (let j = 0; j < vocalCatKeyWordArr.length; j++) {
                        function parse() {
                            var result = text.search(vocalCatKeyWordArr[j]);
                            foundVocalCatKeyWordArr.push(result)
                        }
                        parse();
                    }
                    console.log(`vocal: ${foundVocalCatKeyWordArr}`)
                    for (let n = 0; n < foundVocalCatKeyWordArr.length; n++) {
                        if (foundVocalCatKeyWordArr[n] != -1) {
                            vocalCount++
                        }
                    }
                    console.log(`vocal total: ${vocalCount} out of ${foundVocalCatKeyWordArr.length}`)
                    for (let j = 0; j < cautiousCatKeyWordArr.length; j++) {
                        function parse() {
                            var result = text.search(cautiousCatKeyWordArr[j]);
                            foundCautiousCatKeyWordArr.push(result)
                        }
                        parse();
                    }
                    console.log(`cautious: ${foundCautiousCatKeyWordArr}`)
                    for (let n = 0; n < foundCautiousCatKeyWordArr.length; n++) {
                        if (foundCautiousCatKeyWordArr[n] != -1) {
                            cautiousCount++
                        }
                    }
                    console.log(`cautious total: ${cautiousCount} out of ${foundCautiousCatKeyWordArr.length}`)
                    //count number of words in each array and calculate cat personality results

                }
            }

            //DAWGS
            if (parsePetsObject[0].animal.$t == "Dog") {
                console.log('woof')
                //full array of words to find
                let playfulDogKeyWordArr = ['play', 'playful', 'energy', 'energetic', 'trouble', 'entertain', 'entertaining', 'wrestle', 'run', 'running', 'active', 'chase', 'chasing']
                let lapDogKeyWordArr = ['lap', 'lapcat', 'sit', 'curl', 'snuggle', 'snuggler', 'brush', 'brushing', 'rub', 'tummy', 'burrow', 'hold', 'held', 'rub', 'rubbing', 'rubbed', 'pet', 'petting', 'petted']
                let socialDogKeyWordArr = ['outgoing', 'people', 'social', 'hangout', 'hang-out', 'attention', 'follow']
                let independentDogKeyWordArr = ['independent', 'solitary', 'own', 'alone', 'aloof']
                let cautiousDogKeyWordArr = ['cautious', 'shy', 'hide', 'hiding', 'patient', 'patience', 'noises', 'scare', 'timid', 'spook']
                //need to do for each result (pets object has been cut down by options logic above)
                console.log("parsePetsObject")
                console.log(parsePetsObject)
                for (let i = 0; i < parsePetsObject.length; i++) {
                    console.log(`---PET INDEX ${i}---`)
                    //empty arrays to push found words into
                    let foundPlayfulDogKeyWordArr = [];
                    let playfulCount = 0;
                    let foundLapDogKeyWordArr = [];
                    let lapCount = 0;
                    let foundSocialDogKeyWordArr = [];
                    let socialCount = 0;
                    let foundIndependentDogKeyWordArr = [];
                    let independentCount = 0;
                    let foundVocalDogKeyWordArr = [];
                    let vocalCount = 0;
                    let foundCautiousDogKeyWordArr = [];
                    let cautiousCount = 0;


                    //pull out string of text from each result
                    let text;
                    if (!parsePetsObject[i].description.$t) {
                        text = "aaaaaa"
                    }
                    else {
                        text = parsePetsObject[i].description.$t
                    };
                    //console.log("IS THIS UNDEFINED!?!?!?!")
                    //console.log(text)
                    //console.log(`${parsePetsObject[i].name.$t}: ${text}`)

                    //for each keyword in each array, scan through each text and push into found__KeyWordArr
                    for (let j = 0; j < playfulDogKeyWordArr.length; j++) {
                        //console.log(playfulCatKeyWordArr[j])
                        function parse() {
                            var result = text.search(playfulDogKeyWordArr[j]);
                            //console.log(result);
                            foundPlayfulDogKeyWordArr.push(result)
                        }
                        parse();
                    }
                    //console.log(text)
                    console.log(`playful: ${foundPlayfulDogKeyWordArr}`)
                    for (let n = 0; n < foundPlayfulDogKeyWordArr.length; n++) {
                        if (foundPlayfulDogKeyWordArr[n] != -1) {
                            playfulCount++
                        }
                    }
                    console.log(`playful total: ${playfulCount} out of ${foundPlayfulDogKeyWordArr.length}`)
                    for (let j = 0; j < lapDogKeyWordArr.length; j++) {
                        //console.log(lapCatKeyWordArr[j])
                        function parse() {
                            var result = text.search(lapDogKeyWordArr[j]);
                            foundLapDogKeyWordArr.push(result)
                        }
                        parse();
                    }
                    console.log(`lap: ${foundLapDogKeyWordArr}`)
                    for (let n = 0; n < foundLapDogKeyWordArr.length; n++) {
                        if (foundLapDogKeyWordArr[n] != -1) {
                            lapCount++
                        }
                    }
                    console.log(`lap total: ${lapCount} out of ${foundLapDogKeyWordArr.length}`)
                    for (let j = 0; j < socialDogKeyWordArr.length; j++) {
                        function parse() {
                            var result = text.search(socialDogKeyWordArr[j]);
                            foundSocialDogKeyWordArr.push(result)
                        }
                        parse();
                    }
                    console.log(`social: ${foundSocialDogKeyWordArr}`)
                    for (let n = 0; n < foundSocialDogKeyWordArr.length; n++) {
                        if (foundSocialDogKeyWordArr[n] != -1) {
                            socialCount++
                        }
                    }
                    console.log(`social total: ${socialCount} out of ${foundSocialDogKeyWordArr.length}`)
                    for (let j = 0; j < independentDogKeyWordArr.length; j++) {
                        function parse() {
                            var result = text.search(independentDogKeyWordArr[j]);
                            foundIndependentDogKeyWordArr.push(result)
                        }
                        parse();
                    }
                    console.log(`independent: ${foundIndependentDogKeyWordArr}`)
                    for (let n = 0; n < foundIndependentDogKeyWordArr.length; n++) {
                        if (foundIndependentDogKeyWordArr[n] != -1) {
                            independentCount++
                        }
                    }
                    console.log(`independent total: ${independentCount} out of ${foundIndependentDogKeyWordArr.length}`)
                    for (let j = 0; j < cautiousDogKeyWordArr.length; j++) {
                        function parse() {
                            var result = text.search(cautiousDogKeyWordArr[j]);
                            foundCautiousDogKeyWordArr.push(result)
                        }
                        parse();
                    }
                    console.log(`cautious: ${foundCautiousDogKeyWordArr}`)
                    for (let n = 0; n < foundCautiousDogKeyWordArr.length; n++) {
                        if (foundCautiousDogKeyWordArr[n] != -1) {
                            cautiousCount++
                        }
                    }
                    console.log(`cautious total: ${cautiousCount} out of ${foundCautiousDogKeyWordArr.length}`)
                    //count number of words in each array and calculate cat personality results

                }
            }


        });





    });

    // POST route for saving a new user
    app.post("/api/users", function (req, res) {
        console.log(req.body);
        db.Buyer.create({
            buyer_first_name: req.body.firstName,
            buyer_last_name: req.body.lastName,
            buyer_email: req.body.email,
            buyer_password: req.body.password,
        })
            .then(function (data) {
                db.Buyer.findOne({
                    where: {
                        buyer_email: req.body.email,
                    }
                }).then(function (result) {
                    res.json(result.dataValues.id);
                });
            });
    });

    // Get route for retrieving a single pet from DB
    app.get("/api/pet/:id", function (req, res) {
        db.Pet.findOne({
            where: {
                pf_id: req.params.id
            },
        })
            .then(function (result) {
                res.json(result);
            });
    });

    app.post("/api/pet/:id", function (req, res) {
        db.Pet.create({
            pf_id: req.body.id,
        })
            .then(function (result) {
                res.json(result);
            });
    });
}