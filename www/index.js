const global_oAuth = new oAuth()
const global_DataManagement = new DataManagement()
const global_DataConnector = new DataConnector()
const global_DataDashboard = new DataDashboard()
const global_navHelp= new NavHelp()


$(document).ready(function () {


  $('#signInButton').click(global_oAuth.ApsSignIn);
  (async () => {
    const currentToken = await global_oAuth.getApsToken();
    if (currentToken != '') {

      let profile = await global_oAuth.getApsUserProfile()

      $('#signInProfileImage').removeClass();
      $('#signInProfileImage').html('<img src="' + profile.picture + '" height="30"/>')
      $('#signInButtonText').text(profile.name);
      $('#signInButtonText').attr('title', 'Click to Sign Out');
      $('#signInButton').click(global_oAuth.ApsLogoff);

      global_DataManagement.refreshHubs()

      //delegate the event when one hub is selected
      delegateHubSelection()
      delegateCreateRequestButton()

    }
  })()

  //initialize the parameters of creating new request
  initDefaultParamsOfCreateReq()
  //initialize columns of request table view
  global_DataConnector.initTable()
  //initialize the helps
  global_navHelp.init()   

});

function initDefaultParamsOfCreateReq() {
  //description
  let date = new Date();

  $("#startDate").datepicker("setDate", date);
  $("#endDate").datepicker("setDate", date);

  const currentDate = date.getFullYear()
    + '-' + (date.getMonth() + 1)
    + '-' + date.getDate();
  $('#description').val(`Created by Dashboard App at ${currentDate}`)

}

//when one hub is selected
function delegateHubSelection() {
  $(document).on('click', '#hubs_list a', function (e) {
    $('#hub_dropdown_title').html($(this).html());
    const hub_id_without_b = $(this).attr('id')
    const hub_id_with_b = 'b.' + hub_id_without_b
    $('#hidden_hub_id').text(hub_id_without_b);

    //refresh the table view of requests
    global_DataConnector.extractRequests(hub_id_without_b)
  });
}


//create new request
function delegateCreateRequestButton() {
  $(document).on('click', '#createReq', (async e => {

    if ($('#hidden_hub_id').text() == '') {
      alert('please select one BIM account!');
      return;
    }

    const hub_id_without_b = $('#hidden_hub_id').text()

    const description = $('#description').val()
    const serviceGroups = []
    $('#srvAdmin').is(':checked') ? serviceGroups.push('admin') : {}
    $('#srvIssue').is(':checked') ? serviceGroups.push('issues') : {}
    $('#srvRfi').is(':checked') ? serviceGroups.push('rfis') : {}
    $('#srvChecklist').is(':checked') ? serviceGroups.push('checklists') : {}
    $('#srvCost').is(':checked') ? serviceGroups.push('cost') : {}
    $('#srvDailylog').is(':checked') ? serviceGroups.push('dailylogs') : {}
    $('#srvLocation').is(':checked') ? serviceGroups.push('locations') : {}
    $('#srvSubmittal').is(':checked') ? serviceGroups.push('submittals') : {}

    const scheduleInterval = $('input:radio[name="schedule"]:checked')[0].id.toLocaleUpperCase()
    const reoccuringInterval = scheduleInterval == 'one_time' ? -1 : Number($('#interval').val())


    var startDate, endDate

    let date1 = new Date($("#startDate").val());
    let currentDate= new Date()
    //ensure start time is not pasted time
    if(currentDate.getTime() > date1.getTime()){
      //use current date time
      date1 = currentDate
    }
    // start first extration 1 minute after creating request
    date1.setUTCMinutes(date1.getUTCMinutes() + 1)


    startDate = date1.getFullYear()
      + "-" + (("0" + (date1.getUTCMonth() + 1)).slice(-2))
      + "-" + ("0" + date1.getUTCDate()).slice(-2)
      + "T" + ("0" + date1.getUTCHours()).slice(-2)
      + ":" + ("0" + date1.getUTCMinutes()).slice(-2)
      + ":" + ("0" + date1.getUTCSeconds()).slice(-2)
      + ".000Z"

    if (scheduleInterval == 'ONE_TIME') {
      //ignore end date  
    } else { 
      var date2 = new Date($("#endDate").val());
      if (date1.getUTCDate() >= date2.getUTCDate() || currentDate.getTime() > date2.getTime()) {
        //ensure the end date is future of start date
        alert('start and end date is same date! ')
        return
      }
       
      endDate = date2.getFullYear()
        + "-" + (("0" + (date2.getUTCMonth() + 1)).slice(-2))
        + "-" + ("0" + date2.getUTCDate()).slice(-2)
        + "T" + ("0" + date2.getUTCHours()).slice(-2)
        + ":" + ("0" + date2.getUTCMinutes()).slice(-2)
        + ":" + ("0" + date2.getUTCSeconds()).slice(-2)
        + ".000Z"

    }

    let body = scheduleInterval == 'ONE_TIME' ? {
      description: description,
      isActive: true,
      scheduleInterval: scheduleInterval,
      serviceGroups: serviceGroups,
      effectiveFrom: startDate,
      //notified by Aps when one job is done
      //will add valid endpoint of callback on server side
      callbackUrl: null
    } :
      {
        description: description,
        isActive: true,
        scheduleInterval: scheduleInterval,
        reoccuringInterval: reoccuringInterval,
        serviceGroups: serviceGroups,
        effectiveFrom: startDate,
        effectiveTo: endDate,
        //notified by Aps when one job is done
        //will add valid endpoint of callback on server side
        callbackUrl: null
      }
    
    $('.req_progress').show(); 
    //create new request
    const newReqRes = await global_DataConnector.createRequest(hub_id_without_b, body)

    if (newReqRes) {
      if (global_DataConnector._data['requestsTable'] == null)
        global_DataConnector.extractRequests(hub_id_without_b)
      else {
        global_DataConnector._data['requestsTable'].push(newReqRes)
        //refresh table view of requests
        global_DataConnector.refreshRequestsTable(global_DataConnector._data['requestsTable'])

      }
    }
    $('.req_progress').hide(); 
  }))
}

