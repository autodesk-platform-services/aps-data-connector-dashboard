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


class DataManagement {
  constructor() {
  }

  async refreshHubs() {

    try { 
      $('#hubSpinner').css({ display: "block" });

      const hubs = await this.getHubs()
      if (!hubs) {
        $('#hubSpinner').css({ display: "none" });
        return false
      }

      let hubs_list = $('#hubs_list')
      hubs_list.empty()
      hubs.forEach((ele) => {
        var hubId = ele.id
        var name = ele.name
        var validhtmlid = hubId.replace('b.', '')

        //produce hubs dropdown list
        const oneItem = document.createElement('a')
        oneItem.classList.add('dropdown-item')
        oneItem.href = "#";
        oneItem.id = validhtmlid
        oneItem.innerHTML = name
        hubs_list.append(oneItem);
      });

      if (hubs_list.height() > 400)
        hubs_list.addClass('dropdown-height')
      else
        hubs_list.removeClass('dropdown-height')

      $('#hubSpinner').css({ display: "none" });

      return true
    }
    catch (e) {
      console.log('refresh Hubs failed!')
      return false
    }
  } 

  async getHubs() {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/dm/getHubs',
        type: 'GET',
        success: function (res) {
          if (res != null && res != '')
            resolve(res)
          else
            resolve(null)
        }
      })
    })
  } 
} 