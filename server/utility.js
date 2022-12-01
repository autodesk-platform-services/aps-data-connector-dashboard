
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

const fs = require("fs");
const fetch = require('node-fetch');
const rimraf = require('rimraf');
const readline = require('readline');
const crypto = require('crypto');
const pako = require('pako') 


const SocketEnum = {
    DC_TOPIC: 'dc topic',
    EXPORT_HUBS_DONE:'export hubs done',
    EXPORT_REQUESTS_DONE:'export requests done',
    ONE_TIME_JOB_CREATED:'job of one_time type is available',
    CALLBACK_DONE: 'callback done',
    DC_ERROR:'dc errors'
  };  



module.exports = { 
    SocketEnum,
    clearFolder, 
    randomValueBase64,
    compressStream,
    flatDeep,
    socketNotify,
    checkTimeout,
    delay
}

//to avoid the problem of 429 (too many requests in a time frame)
async function delay(t, v) {
    return new Promise(function(resolve) {
      setTimeout(resolve.bind(null, v), t);
    });
  }

function socketNotify(topic,message,data){
    //notify client
    var sockketData = {message:message,data:data} 
    global.MyApp.SocketIo.emit(topic, JSON.stringify(sockketData));
  } 

async function clearFolder(folder){
    return new Promise((resolve, reject) => {
        rimraf(folder+ '/*', function () { 
            console.log('clear output foler done'); 
            resolve();
        }); 
    }); 
}  
    
function randomValueBase64 (len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
      .toString('base64')   // convert to base64 format
      .slice(0, len)        // return required number of characters
      .replace(/\+/g, '0')  // replace '+' with '0'
      .replace(/\//g, '0'); // replace '/' with '0'
}
 
 
 function compressStream(inputJson){ 
    const inputStr = JSON.stringify(inputJson)
    return pako.deflate(inputStr)
 }


function flatDeep(arr, d = 1) {
    return d > 0 ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val), [])
                 : arr.slice();
};

function  checkTimeout(st,end){
    return end - st  < 5 * 60 * 1000  // 5 minutes
  }

String.prototype.format =function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function(m, i){
        return args[i];
    });
};

