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

class DataConnector {

  constructor() {

    this._pageLimit = 25
    this._pageOffset = 0
    this._data = {
      requestsTable: []
    }
    //columns definitions of table
    this._tableFixComlumns = {
      parent: this,
      requestsTable: function (isRaw) {
        return [
          { field: 'description', title: "description", align: 'left' },
          { field: 'scheduleInterval', title: "schedule", align: 'center' },
          { field: 'reoccuringInterval', title: "interval", align: 'center' },
          { field: 'createdAt', title: "created time", align: 'center' },
          { field: 'effectiveTo', title: "effective to", align: 'center' },
          { field: 'jobs', title: "jobs", align: 'center', formatter: this.parent.droplistFormatter },
          { field: 'completedAt', title: "job completedAt", align: 'left' },
          { field: 'status', title: "job status", align: 'center' },
          { field: 'serviceGroups', title: "service groups", align: 'center', formatter: this.parent.dataFormatter },
          { field: 'createdByEmail', title: "createdByEmail", align: 'center' },
          { field: 'isActive', title: "isActive", align: 'center' }
        ]
      }
    }
  }


  droplistFormatter(value, row, index) {
    var $select = $(`<select id="${row.id}" data="${index}"></select>`, {
    });
    value.forEach(async element => {
      var $option = $("<option></option>", {
        "text": `startedAt:${element.startedAt}`,
        "value": `${element.id}|${index}` //store job id and index
      });
      $select.append($option);
    });
    return $select.prop("outerHTML");
  }

  //formatter for service groups
  dataFormatter(value, row, index) {

    //when initialization, set data list to the data of first job
    var re = ``
    value.forEach(async element => {
      re += `<a href="${element}" data=${element}>${element}</a>&nbsp|&nbsp`;
    });
    return re
  }

  async extractRequests(hubId){
    try {
      global_DataConnector._data['requestsTable'] = null
      this.initTable()
      $('.req_progress').show();
      await this.getRequests(hubId)
      //It may take time to have all requests, 
      //so wait for the result at socket_modules.js

      ///.....do nothing....

    }catch (e) {
      $('.req_progress').hide();
    }
  }

  refreshRequestsTable(data) {
     
      //refresh table 
      $(`#requestsTable`).bootstrapTable('destroy');
      const fixCols = this._tableFixComlumns['requestsTable']()

      $(`#requestsTable`).bootstrapTable({
        data: data,
        editable: false,
        clickToSelect: true,
        cache: false,
        showToggle: false,
        showPaginationSwitch: false,
        pagination: true,
        pageList: [5, 10, 25, 50, 100],
        pageSize: 5,
        pageNumber: 1,
        uniqueId: 'id',
        striped: true,
        search: false,
        showRefresh: false,
        minimumCountColumns: 2,
        smartDisplay: true,
        clickToSelect: true,
        columns: fixCols 
      }); 
      //delegate events: select one job, select one request
      this.delegateJobsEvents()
  }

  initTable() {
    $(`#requestsTable`).bootstrapTable('destroy');
    const columns = this._tableFixComlumns['requestsTable']()
    $(`#requestsTable`).bootstrapTable({
      parent: this,
      data: [],
      editable: false,
      clickToSelect: true,
      cache: false,
      showToggle: false,
      showRefresh: false,
      showPaginationSwitch: false,
      pagination: true,
      pageList: [5, 10, 25, 50, 100],
      pageSize: 10,
      pageNumber: 1,
      uniqueId: 'id',
      striped: true,
      search: false,
      minimumCountColumns: 2,
      smartDisplay: true,
      columns: columns
    });
  }


  async getRequests(hubId) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/dc/requests/${hubId}`,
        type: 'GET',
        success: function (res) {
          if (res != null && res != [])
            resolve(res)
          else
            resolve(null)
        }
      })
    })
  }

  async getOneJobDatalist(hubId, jobId) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/dc/requests/${hubId}/${jobId}/dataList`,
        type: 'GET',
        success: function (res) {
          if (res != null && res != [])
            resolve(res)
          else
            resolve(null)
        }
      })
    })
  }

  async getOneDataStream(hubId, jobId, dataKey) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/dc/requests/dataStream/${hubId}/${jobId}/${dataKey}`,
        type: 'GET',
        success: function (res) {
          if (res != null && res != [])
            resolve(res)
          else
            resolve(null)
        }
      })
    })
  }

  async createRequest(hubId, body) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/dc/requests/${hubId}`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(body),
        success: function (res) {
          if (res != null && res != [])
            resolve(res)
          else
            resolve(null)
        },
        error: function (res) {
          resolve(null);
        }
      })
    })
  }

  delegateJobsEvents() {

    $('#requestsTable').on('click', 'tbody tr', function (event) {
      $(this).addClass('highlight').siblings().removeClass('highlight');
    })
    $(document).on('change', 'select', function (e) {
      const selectedIndex = $(this)[0].selectedIndex
      const reqId = $(this)[0].id
      const value = $(this)[0].options[selectedIndex].value
      const jobId = value.split('|')[0]
      const rowIndex = value.split('|')[1]

      //job complete at
      //this._data['requestsTable'] stores the data already
      const request = global_DataConnector._data['requestsTable'].find(
        d => d.id == reqId
      )
      const job = request.jobs.find(
        d => d.id == jobId
      )

      var $table = $('#requestsTable')
      $table.bootstrapTable('updateCell', {
        index: rowIndex,
        field: 'completedAt',
        value: job.completedAt
      })
      //job status
      $table.bootstrapTable('updateCell', {
        index: rowIndex,
        field: 'status',
        value: job.status
      })
    })

    $("#requestsTable").on("click-row.bs.table", (async (row, $sel, field) => {

      const hub_id_without_b = $('#hidden_hub_id').text()

      const reqId = $sel.id
      const indexId = $(`#${reqId} option:selected`).index()
      if(indexId == null || indexId == undefined || indexId <0){
        alert('no job with this request, wait some time until the jobs list is available and try again')
        return 
      }
      const text = $(`#${reqId} option`)[indexId].text
      const value = $(`#${reqId} option`)[indexId].value
      const jobId = value.split('|')[0]
      const rowIndex = value.split('|')[1]

      $('.datalist_progress').show() 
      const dataList = await this.getOneJobDatalist(hub_id_without_b, jobId)
      $('.datalist_progress').hide()

      //render the data list 
      //update title
      $('#dataListTitle')[0].innerHTML = `Data List - Job ${text}`

      let dom_dataList = $('#dataList')
      dom_dataList.empty()

      if(dataList==null || dataList.length == 0){
        alert('the job has not completed or has failed, try other job!')
        return
      }
      let innerHTML = ''
      dataList.forEach(async d => {


        global_DataDashboard._dashboardDefs.includes(d.name) ?
          innerHTML +=
          `<li class="list-group-item d-flex justify-content-between align-items-center" data="${hub_id_without_b}|${jobId}|${d.name}">`
          + `<i class="fa fa-file pr-3" aria-hidden="true"></i>${d.name}`
          + `<i class="fa fa-download ml-auto pr-3" aria-hidden="true"></i>`
          + `<i class="fa fa-tachometer" aria-hidden="true"></i></li>` :
          innerHTML +=
          `<li class="list-group-item d-flex justify-content-between align-items-center" data="${hub_id_without_b}|${jobId}|${d.name}">`
          + `<i class="fa fa-file pr-3" aria-hidden="true"></i>${d.name}`
          + `<i class="fa fa-download ml-auto pr-3" aria-hidden="true"></i></li>`
      })

      dom_dataList.html(innerHTML)

      if (dom_dataList.height() > $('#dashboard').height())
        dom_dataList.addClass('dropdown-height')
      else
        dom_dataList.removeClass('dropdown-height')



      $('.list-group-item i').on('click', function () {

        const data = $(this).closest('.list-group-item').attr('data')
        const hubId = data.split('|')[0]
        const jobId = data.split('|')[1]
        const dataKey = data.split('|')[2]

        if ($(this).hasClass('fa-download')) {
          window.location = `/dc/requests/download/${hubId}/${jobId}/${dataKey}`

        }
        else if ($(this).hasClass('fa-tachometer')) {

          (async (hubId, jobId, dataKey) => {
            $('.dashboard_progress').show()
            //send to dashboard 
            await global_DataDashboard.configData(hubId, jobId, dataKey, data)
            $('.dashboard_progress').hide()
          })(hubId, jobId, dataKey)
        }
        else {
          //do nothing
        }
      })

    }));

  }

} 