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

// Autodesk APS configuration

const APSBaseUrl = 'https://developer.api.autodesk.com'

const credentials = {
  client_id: process.env.APS_CLIENT_ID,
  client_secret: process.env.APS_CLIENT_SECRET,
  callback_url: process.env.APS_CALLBACK_URL,
  dc_callback_url:process.env.DC_CALLBACK_URL,

  scopes: {
      // Required scopes for the server-side application
      internal: ['data:read', 'data:write','data:create'], 
      // Required scopes for the server-side BIM360 Account Admin
      internal_2legged: ['account:read'],
      // Required scope for the client-side viewer, if needed
      public: ['viewables:read']
  },
  token_2legged:'',
  token_3legged:'',

}

const endpoints = {
  authentication:{
    authorize: `${APSBaseUrl}/authentication/v1/authorize` 
  },
   bim360Admin:{ 
      get_project_companies: `${APSBaseUrl}/hq/v1/accounts/{0}/projects/{1}/companies` ,
      get_project_users:  `${APSBaseUrl}/bim360/admin/v1/projects/{0}/users`,
      get_project_roles:  `${APSBaseUrl}/hq/v2/accounts/{0}/projects/{1}/industry_roles`
    }, 
  bim360DM:{
      get_profile:`${APSBaseUrl}/userprofile/v1/users/@me`,
      get_hubs:`${APSBaseUrl}/project/v1/hubs`,
      get_hub:`${APSBaseUrl}/project/v1/hubs/{0}`,
      get_projects:`${APSBaseUrl}/project/v1/hubs{0}/{1}`, 
      get_project:`${APSBaseUrl}/project/v1/hubs/{0}/projects/{1}`,
      get_item:`${APSBaseUrl}/data/v1/projects/{0}/items/{1}`,
      get_item_parent:`${APSBaseUrl}/data/v1/projects/{0}/items/{1}/parent`
  },
  bim360DC:{ // Data Connector API
      get_requests:`${APSBaseUrl}/data-connector/v1/accounts/{0}/requests`,
      get_request:`${APSBaseUrl}/data-connector/v1/accounts/{0}/requests/{1}`,
      get_jobs:`${APSBaseUrl}/data-connector/v1/accounts/{0}/requests/{1}/jobs`,
      get_job:`${APSBaseUrl}/data-connector/v1/accounts/{0}/jobs/{1}`,
      get_datalist:`${APSBaseUrl}/data-connector/v1/accounts/{0}/jobs/{1}/data-listing`,
      get_data:`${APSBaseUrl}/data-connector/v1/accounts/{0}/jobs/{1}/data/{2}`,

      post_request:`${APSBaseUrl}/data-connector/v1/accounts/{0}/requests`,
      patch_request:`${APSBaseUrl}/data-connector/v1/accounts/{0}/requests/{1}`,
      delete_request:`${APSBaseUrl}/data-connector/v1/accounts/{0}/requests/{1}`
     }, 
  httpHeaders: function (access_token) {
      return {
        Authorization: 'Bearer ' + access_token
      }
  } 
}

module.exports = {
  credentials,
  endpoints
};
