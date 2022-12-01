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
const config = require('../config')
const utility = require('../utility')
const { get, post, patch, mydelete,fileStreamGet } = require('./fetch_common')
const fs = require("fs"); 

module.exports = {
    getRequests,
    getOneRequest,
    getJobs,
    getOneJob,
    getDataList,
    getOneData,
    downloadData,
    postRequest,
    deleteRequest
}

async function getRequests(hubId, allRequests, limit = 10, offset = 0) {
    try {
        const endpoint = config.endpoints.bim360DC.get_requests.format(hubId) + `?limit=${limit}&offset=${offset}`
        const headers = config.endpoints.httpHeaders(config.credentials.token_3legged)
        const response = await get(endpoint, headers);

        if (response.results && response.results.length > 0) {
            console.log(`get one page of requests succeeded: hubId=${hubId}`)
            allRequests = allRequests.concat(response.results);
            return getRequests(hubId, allRequests, limit,offset+response.results.length);
        } else {
            return allRequests
        }
    } catch (e) {
        console.error(`get one page of requests failed: hibId=${hubId}, ${e}`)
        return []
    }
}



async function getOneRequest(hubId,reqId) {
    try {
        const endpoint = config.endpoints.bim360DC.get_request.format(hubId,reqId)
        const headers = config.endpoints.httpHeaders(config.credentials.token_3legged)
        const response = await get(endpoint, headers);

        console.log(`getting one request reqId ${reqId}`) 
        return response
         
    } catch (e) {
        console.error(`getting one request failed: ${reqId} , ${e}`)
        return null
    }
} 


async function getJobs(hubId, reqId,allJobs, limit = 10, offset = 0) {
    try {
        const endpoint = config.endpoints.bim360DC.get_jobs.format(hubId,reqId) + `?limit=${limit}&offset=${offset}`
        const headers = config.endpoints.httpHeaders(config.credentials.token_3legged)
        const response = await get(endpoint, headers);

        if (response.results && response.results.length > 0) {
            console.log(`getting jobs of one request succeeded: ${reqId}`)
            allJobs = allJobs.concat(response.results);
            return getJobs(hubId, reqId,allJobs, limit,offset+response.results.length);
        } else {
            return allJobs
        }
    } catch (e) {
        console.error(`getting jobs of one request failed:: ${reqId},${e}`)
        return []
    }
}

async function getOneJob(hubId,jobId) {
    try {
        const endpoint = config.endpoints.bim360DC.get_job.format(hubId,jobId)
        const headers = config.endpoints.httpHeaders(config.credentials.token_3legged)
        const response = await get(endpoint, headers);

        console.log(`getting one job ${jobId}`) 
        return response
         
    } catch (e) {
        console.error(`getting one job failed: ${jobId} , ${e}`)
        return null
    }
} 

async function getDataList(hubId,jobId) {
    try {
        const endpoint = config.endpoints.bim360DC.get_datalist.format(hubId,jobId)
        const headers = config.endpoints.httpHeaders(config.credentials.token_3legged)
        const response = await get(endpoint, headers);

        console.log(`getting one job datalist ${jobId}`) 
        return response
         
    } catch (e) {
        console.error(`getting one job datalist failed: ${jobId} , ${e}`)
        return null
    }
} 

async function getOneData(hubId,jobId,dataKey) {
    try {
        const endpoint = config.endpoints.bim360DC.get_data.format(hubId,jobId,dataKey)
        const headers = config.endpoints.httpHeaders(config.credentials.token_3legged)
        const response = await get(endpoint, headers);

        console.log(`getting one job data: ${jobId}, ${dataKey}`) 
        return response
         
    } catch (e) {
        console.error(`getting one job data failed: ${jobId} , ${dataKey},${e}`)
        return null
    }
} 

async function downloadData(input) {

    //const headers = config.endpoints.httpHeaders(config.credentials.token_3legged)
    const res = await fileStreamGet(input.signedUrl, {});
    const fileStream = fs.createWriteStream(input.path + input.name);

    await new Promise((resolve, reject) => {
        res.pipe(fileStream);
        res.on("error", (err) => {
            console.log(`download one data failed:${input.jobId},${input.name},${err}`)  
            reject(err);
        });
        fileStream.on("finish", function (res) {
            console.log(`download one data succeeded:${input.jobId},${input.name}`)  
            resolve();
        });
    });
}  

async function postRequest(hubId,body) {
    try {
        body.callbackUrl = config.credentials.dc_callback_url
        const endpoint = config.endpoints.bim360DC.post_request.format(hubId)
        const headers = config.endpoints.httpHeaders(config.credentials.token_3legged)
        headers['Content-Type'] = 'application/json'

        const response = await post(endpoint, headers,JSON.stringify(body));

        console.log(`creating one request succeeded:`) 
        return response
         
    } catch (e) {
        console.error(`creating one request failed:: ${e.message}`)
        return null
    }
} 

async function deleteRequest(hubId,reqId) {
    try {
        const endpoint = config.endpoints.bim360DC.delete_request.format(hubId,reqId)
        const headers = config.endpoints.httpHeaders(config.credentials.token_3legged)

        const response = await mydelete(endpoint,headers);

        console.log(`deleting one request succeeded:${reqId}`) 
        return response
         
    } catch (e) {
        console.log(`deleting one request failed:${reqId},${e.message}`) 
        return null
    }
} 