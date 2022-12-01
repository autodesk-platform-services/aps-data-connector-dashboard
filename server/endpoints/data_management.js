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
const config = require('../config')

const { OAuth } = require('../services/oauth')
const dmServices = require('../services/data_management');

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

router.get('/getHubs', async (req, res, next) => { 
  try {   

    //Generally, not many hubs, so it is fine to extract hubs and notify client
    var allHubs = []
    allHubs = await dmServices.getHubs(allHubs)  

    var resHubs = [] 
    allHubs.forEach(async function (hub) {
      var hubType;
      switch (hub.attributes.extension.type) {
        case "hubs:autodesk.core:Hub":
          hubType = "hubs";
          break;
        case "hubs:autodesk.a360:PersonalHub":
          hubType = "personalHub";
          break;
        case "hubs:autodesk.bim360:Account":
          hubType = "bim360Hubs";
          break;
      }
      if (hubType == "bim360Hubs") {
        resHubs.push({ id: hub.id, name: hub.attributes.name })
      }
    })

    //generally, a few hubs only. so wait the extracting completes and
    //return the hubs list
    res.json(resHubs)  
 
   } catch(e) {
      // here goes out error handler
      console.log('get all hubs failed: '+ e.message)
      res.status(500).end() 
   }
})
 
router.get('/userProfile', async (req, res, next) => {

  try {   
    const userProfile = await dmServices.getUserProfile()  
    res.json(userProfile) 
  }catch(e) {
    // here goes out error handler
    console.log(`get userProfile failed: ${e.message}`)
    res.status(500).end()
  }

}); 
 

 

module.exports =  router 
 

