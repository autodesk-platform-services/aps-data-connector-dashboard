/////////////////////////////////////////////////////////////////////
// Copyright 2022 Autodesk Inc
// Written by Develope Advocacy and Support
//
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

'use strict';

const express = require('express');
const router = express.Router();
const path = require("path")
const fs = require("fs");
const mkdir = require('mkdirp')

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const config = require('../config')
const utility = require('../utility')

const { OAuth } = require('../services/oauth')
const dcServices = require('../services/data_connector');

const dataPath = path.join(__dirname, '/../downloads/');;

if(!fs.existsSync(dataPath))
  mkdir.mkdirp(dataPath,(err)=>{if(!err)console.log('folder ./server/downloads is created')})
  

//verify valid authentication
router.use(async (req, res, next) => {

  const oauth = new OAuth(req.session);
  if (!oauth.isAuthorized()) {
    console.log('no valid authorization!')
    res.status(401).end('Please login first')
    return
  }
  req.oauth_client = oauth.getClient();
  req.oauth_token = await oauth.getInternalToken();
  var twoleggedoauth = oauth.get2LeggedClient()
  var twoleggedres = await twoleggedoauth.authenticate()
  config.credentials.token_3legged = req.oauth_token.access_token
  config.credentials.token_2legged = twoleggedres.access_token

  next();
});



async function extractRequests(hubId, allRequests) {
  allRequests = await dcServices.getRequests(hubId, allRequests)
  //get jobs and sort data
  let promiseArr = allRequests.map(async (r, index) => {
    const reqId = r.id
    console.log(`sorting one request ${reqId}`);

    if (r.description.includes('IQ Data Extraction')) {
      r.description = 'Extraction by UI'
    }
    var allJobs = []
    allJobs = await dcServices.getJobs(hubId, reqId, allJobs)
    r.jobs = allJobs

    //data list of first job, for the job list of table view in client
    if (allJobs.length > 0) {
      r.data = r.serviceGroups
    }
    else {
      r.data = []
    }

    //complete date of first job,for the job list of table view in client
    if (allJobs.length > 0) {
      r.completedAt = allJobs[0].completedAt
    }
    else {
      r.completedAt = null
    }

    //status of first job,for the job list of table view in client
    if (allJobs.length > 0) {
      r.status = allJobs[0].status
    }
    else {
      r.status = null
    }
    return r
  })

  return Promise.all(promiseArr).then((resultsArray) => {
    console.log(`Promise.all sorting out assets done`)
    resultsArray = utility.flatDeep(resultsArray, Infinity)
    return resultsArray
  }).catch(function (err) {
    console.error(`exception when Promise.all sorting out requests: ${err}`)
    return []
  })
}

//get all requests
router.get('/requests/:hubId', async (req, res, next) => {

  const hubId = req.params['hubId']
  //send status to client firstly
  //Next, extract requests, finally notify client by socket when it is done
  res.status(200).end()

  try {
    //get all requests
    var allRequests = []
    allRequests = await extractRequests(hubId, allRequests)

    utility.socketNotify(utility.SocketEnum.DC_TOPIC,
      utility.SocketEnum.EXPORT_REQUESTS_DONE,
      allRequests)

  } catch (e) {
    // here goes out error handler
    console.log('get all requests failed: ' + e.message)
    utility.socketNotify(utility.SocketEnum.ASSET_TOPIC,
      utility.SocketEnum.DC_ERROR,
      { error: e.message })
  }
});

//create new request
router.post('/requests/:hubId', jsonParser, async (req, res, next) => {

  const hubId = req.params['hubId']
  let body = req.body
  var createRes = null
  try {
    createRes = await dcServices.postRequest(hubId, body)
    if (createRes) {
      createRes.jobs = []
      createRes.completedAt = null
      createRes.status = null

      res.json(createRes)
    } else {
      res.status(500).end()
    }
  } catch (e) {
    // here goes out error handler
    console.log('create request failed: ' + e.message)
    res.status(500).end()
  }

  try {
    if (createRes && createRes.scheduleInterval == 'ONE_TIME') {

      //if ONE_TIME request, it may take a few minutes to have job list with request
      //send notification to client firstly and use socket to notify when one job is available 

      // as to other type of request（Day/Week/Month/Year), depending on the date of executeFrom. 
      // so better leave '/requests/callback' to nortify client when a job is done..

      //start to polling the job list, normally within 5 minutes
      //timeout if more than 5 minutes, then the client has to refresh manually
      //at client side.

      const st = new Date().getTime()

      var allJobs = []
      console.log(`polling jobs list of one_time request: ${createRes.id}`)
      while ( (allJobs.length == 0  || allJobs[0].startedAt == null )&&
        utility.checkTimeout(st, new Date().getTime())){
        allJobs = await dcServices.getJobs(hubId, createRes.id, allJobs)
        await utility.delay(5000) 
      } 
      if (allJobs.length > 0) {
        console.log(` jobs are available now with: ${createRes.id}.....`)

        createRes.jobs = allJobs
        createRes.completedAt = allJobs[0].completedAt
        createRes.status = allJobs[0].status
        //notify client
        utility.socketNotify(utility.SocketEnum.DC_TOPIC,
          utility.SocketEnum.ONE_TIME_JOB_CREATED,
          createRes)
      }else
        console.log(` no jobs with: ${createRes.id} yet or timeout of the polling, try later again`)

    }
  } catch (e) {
    console.log('get jobs of one request (one_time) failed: ' + e.message)
    utility.socketNotify(utility.SocketEnum.ASSET_TOPIC,
      utility.SocketEnum.DC_ERROR,
      { error: e.message })
  }

}); 
 

router.get('/requests/:hubId/:reqId', async (req, res, next) => {

  try {
    const hubId = req.params['hubId']
    const reqId = req.params['reqId']

    res.status(200).end()

    var allRequests = []
    allRequests = await dcServices.getRequests(hubId, allRequests)
    utility.socketNotify(utility.SocketEnum.DC_TOPIC,
      utility.SocketEnum.EXPORT_REQUESTS_DONE,
      allRequests)

  } catch (e) {
    // here goes out error handler
    console.log('get all requests failed: ' + e.message)
    utility.socketNotify(utility.SocketEnum.DC_TOPIC,
      utility.SocketEnum.DC_ERROR, { error: e.message })
  }
});

router.get('/requests/:hubId/:jobId/dataList', async (req, res, next) => {

  try {
    const hubId = req.params['hubId']
    const jobId = req.params['jobId']
    const dataList = await dcServices.getDataList(hubId, jobId)
    res.json(dataList);

  } catch (e) {
    // here goes out error handler
    console.log('get one job list failed: ' + e.message)
    res.status(500).end()
  }
});

router.get('/requests/download/:hubId/:jobId/:dataKey', async (req, res, next) => {

  try {
    const hubId = req.params['hubId']
    const jobId = req.params['jobId']
    const dataKey = req.params['dataKey']

    const dataPath = path.join(__dirname, '/../downloads/');;
    const dataName = `{${hubId}}-{${jobId}}-${dataKey}`
    if (!fs.existsSync(dataPath + dataName)) {
      //has not downloaded before 
      //download it
      const data = await dcServices.getOneData(hubId, jobId, dataKey)

      const input = {
        signedUrl: data.signedUrl,
        path: dataPath,
        name: dataName
      }
      await dcServices.downloadData(input)
    }
    res.download(dataPath + dataName);


  } catch (e) {
    // here goes out error handler
    console.log('get one data failed: ' + e.message)
    res.status(500).end()
  }
});

router.get('/requests/dataStream/:hubId/:jobId/:dataKey', async (req, res, next) => {

  try {
    const hubId = req.params['hubId']
    const jobId = req.params['jobId']
    const dataKey = req.params['dataKey']

    const dataPath = path.join(__dirname, '/../downloads/');;
    const dataName = `{${hubId}}-{${jobId}}-${dataKey}`
    if (!fs.existsSync(dataPath + dataName)) {
      //has not downloaded before 
      //download it
      const data = await dcServices.getOneData(hubId, jobId, dataKey)

      const input = {
        signedUrl: data.signedUrl,
        path: dataPath,
        name: dataName
      }
      await dcServices.downloadData(input)
    }
    //read the file
    const fileStream = fs.readFileSync(dataPath + dataName)
    res.send(fileStream)

  } catch (e) {
    // here goes out error handler
    console.log('get one data failed: ' + e.message)
    res.status(500).end()
  }
});

router.get('/requests/:hubId/:jobId', async (req, res, next) => {

  try {
    const hubId = req.params['hubId']
    const jobId = req.params['jobId']
    const job = await dcServices.getOneJob(hubId, jobId)
    res.json(job);

  } catch (e) {
    // here goes out error handler
    console.log('get one job failed: ' + e.message)
    res.status(500).end()
  }
});


module.exports = router


