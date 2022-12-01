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
const { get } = require('./fetch_common')

module.exports = {
  getHubs,
  getUserProfile 
}

async function getHubs(allHubs,limit =100, number = 0) {

  try {
    const endpoint = config.endpoints.bim360DM.get_hubs + `?page[limit]=${limit}&page[number]=${number}`
    const headers = config.endpoints.httpHeaders(config.credentials.token_3legged)
    const response = await get(endpoint, headers);

    if (response.data && response.data.length > 0) {
      console.log(`get one page of hubs succeeded`)
      allHubs = allHubs.concat(response.data);
      //return getHubs(allHubs, limit,number+1);
      return allHubs

    } else {
      return allHubs
    }
  } catch (e) {
    console.error(`get one page of hubs failed: ${e}`)
    return []
  }
}
 
async function getUserProfile() {

  try {
    const endpoint = config.endpoints.bim360DM.get_profile
    const headers = config.endpoints.httpHeaders(config.credentials.token_3legged)
    const response = await get(endpoint, headers); 
    return {
      name: response.firstName + ' ' + response.lastName,
      picture: response.profileImages.sizeX20,
      userId: response.userId
    }  
  } catch (e) {
    console.log(`get getUserProfile failed:${e.message}`)
    return []
  }
}

async function getHQUsersList(input) {
  let all = []
  let pageOffset = 0
  let morePagesAvailable = true;

  while (morePagesAvailable) {
    const single = await getAdminUserSinglePage(input, pageOffset)
    all = all.concat(single);
    pageOffset = all.length
    morePagesAvailable = single.length
  }

  return all
}


async function getAdminUserSinglePage(input, pageOffset) {

  return new Promise((resolve, reject) => {

    const headers = {
      Authorization: 'Bearer ' + input.access_token,
      'Content-Type': 'application/json'
    }
    var url =
      'https://developer.api.autodesk.com/hq/v1/accounts/'
      + input.accountId
      + '/users?limit=50&offset=' + pageOffset

    return fetch(url, {
      method: 'GET',
      headers: headers
    }).then(response => response.json()).then(data => {
      resolve(data)
    })
  })
}

async function getAdminCompanyList(input) {
  let all = []
  let pageOffset = 0
  let morePagesAvailable = true;

  while (morePagesAvailable) {
    const single = await getAdminCompanySinglePage(input, pageOffset)
    all = all.concat(single);
    pageOffset = all.length
    morePagesAvailable = single.length
  }

  return all
}

async function getAdminCompanySinglePage(input, pageOffset) {

  return new Promise((resolve, reject) => {

    const headers = {
      Authorization: 'Bearer ' + input.access_token,
      'Content-Type': 'application/json'
    }
    var url =
      'https://developer.api.autodesk.com/hq/v1/accounts/'
      + input.accountId
      + '/companies?limit=50&offset=' + pageOffset

    return fetch(url, {
      method: 'GET',
      headers: headers
    }).then(response => response.json()).then(data => {
      resolve(data)
    })
  })
}





