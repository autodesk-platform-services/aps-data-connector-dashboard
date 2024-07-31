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
 
//callback when one job is done
router.post('/dc-webhook-callback', async (req, res, next) => {
  res.end() //notify APS this callback is triggered 
  console.log(`request callback is triggered: \n Account Id: ${req.body.accountId} \nRequest Id: ${req.body.requestId} \nJob Id: ${req.body.jobId}\nState: ${req.body.state}`)
  
  //do what you want with these data
  //......

}) 

module.exports = router


