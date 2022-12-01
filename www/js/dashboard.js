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

class DataDashboard {

  constructor() { 
    this._dashboardDefs =[
      'issues_issues.csv',
     // 'admin_users.csv',
     // 'checklists_checklists.csv'
     // if dashboards of more categories are needed
    ]
  }
 
  async getRenderHTML(html) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: html,
        success: function (data) {
          resolve(data)
        }, error: function (error) {
          reject(error)
        }
     }) 
  })}

  //fix 3 types of dashboards, change with your requirements
  renderDashboard(labels,dataTotals,colors,title,chartType,legend_display,dom){
    var chartData = {
      datasets: [{
        data: dataTotals,
        backgroundColor: colors
      }],
      labels: labels
    };

    var config = {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,

        title: {
          display: true,
          text: title
        },
        tooltips: {
          mode: 'index',
          intersect: true
        },
        legend: {
          display: legend_display
        },
        plugins: {
          datalabels: {
            display: true,
            align: 'center',
            anchor: 'center'
          }
        }
      }
    }

    const canvas = document.getElementById(dom);
    const ctx = canvas.getContext('2d');
    new Chart(ctx, config);
  }

  //only demo making dashboards with issue data
  //add more dashboards for other types of data with your requirements
  async configData(hubId,jobId,dataKey){

    const data = await global_DataConnector.getOneDataStream(hubId,jobId,dataKey)
    var csvData = $.csv.toObjects(data)

    if(dataKey == 'issues_issues.csv'){

      //add tabs, each tab one chart 
      const issueDashboardHTML = await this.getRenderHTML('issue_dashboard.html')
      $('#dashboard').html( issueDashboardHTML) 
      //some definitions data
      const adminUsers = await global_DataConnector.getOneDataStream(hubId,jobId,'admin_users.csv')
      const csvAdminUsers = $.csv.toObjects(adminUsers)

      const adminProjects = await global_DataConnector.getOneDataStream(hubId,jobId,'admin_projects.csv')
      const csvAminProjects = $.csv.toObjects(adminProjects)

      const issueTypes = await global_DataConnector.getOneDataStream(hubId,jobId,'issues_issue_types.csv')
      const csvIssueTypes = $.csv.toObjects(issueTypes)

      //map meaningful name of issue type

      csvData = csvData.map(function(a) {
        a.issue_type_name =  csvIssueTypes.find(x=>x.issue_type_id == a.type_id ).issue_type
        return a;
      });

      //grouped by projects
      var issues =[]
      csvAminProjects.forEach(async p=>{
         const bim360_project_id = p.id
         const currentTime = (new Date()).getTime()
         const one_project_issues = csvData.filter(x=>x.bim360_project_id == bim360_project_id)
         //find overdue and not-closed issues
         var overDue_OpenIssues = one_project_issues.filter(
           x=>x.due_date!=null 
           && x.due_date!=undefined
           && x.due_date!=''
           && new Date(x.due_date).getTime() < currentTime
           && x.status != 'close')
        //find issues due in this week
        const weekDueStart = new Date()
        var dateAtOneWeek = new Date(); 
        dateAtOneWeek.setDate(weekDueStart.getDate() + 7);

        var due_thisWeek_Issues = one_project_issues.filter(
          x=>x.due_date!=null 
          && x.due_date!=undefined
          && x.due_date!=''
          && new Date(x.due_date).getTime() > weekDueStart.getTime() && new Date(x.due_date).getTime() < dateAtOneWeek.getTime()
          && x.status != 'close')  
      
         issues.push({
           project_id:bim360_project_id,
           project_name:p.name,
           project_issues_count:one_project_issues.length,
           overdue_issues_count:overDue_OpenIssues.length,
           due_thisWeek_issues_count:due_thisWeek_Issues.length,
           issue_types:[]
        })                     
      }) 

      //issue by projects, sorting the top 10 projects by issues count
      issues.sort(function(a, b){
        return b.project_issues_count - a.project_issues_count;
      });  
      var len = issues.length < 10? issues.length:10
      var dashBoardData = issues.slice(0, len).map(i => {
        return i
      }) 
      var labels = [],dataTotals = [], colors = []; 
      for (var index in dashBoardData) {
        labels.push(dashBoardData[index].project_name);
        dataTotals.push(dashBoardData[index].project_issues_count);
        colors.push(this.random_rgba())
      }

      this.renderDashboard(labels,
                            dataTotals,
                            colors,
                            'Issue Count of Top 10 Projects',
                            'horizontalBar',
                            false,
                            'issueByProjects')
  
    
      //overdue issues by projects top 5
      issues.sort(function(a, b){
        return b.overdue_issues_count - a.overdue_issues_count;
      }); 

       len = issues.length < 5? issues.length:5
      var dashBoardData = issues.slice(0, len).map(i => {
        return i
      }) 
      labels = [];dataTotals = [];colors = [];
 
      for (var index in dashBoardData) {
        labels.push(dashBoardData[index].project_name);
        dataTotals.push(dashBoardData[index].overdue_issues_count);
        colors.push(this.random_rgba())
      } 

      this.renderDashboard(labels,
                            dataTotals,
                            colors,
                            'Overdue Issues of Top 5 Projects ',
                            'pie',
                            true,
                            'topOverdue')


      //due this week  by projects top 10
      issues.sort(function(a, b){
        return b.due_thisWeek_issues_count - a.due_thisWeek_issues_count;
      }); 


      len = issues.length < 10? issues.length:10
      var dashBoardData = issues.slice(0, len).map(i => {
        return i
      }) 
       labels = [];dataTotals = [];colors = [];
 
      for (var index in dashBoardData) {
        labels.push(dashBoardData[index].project_name);
        dataTotals.push(dashBoardData[index].due_thisWeek_issues_count);
        colors.push(this.random_rgba())
      } 

      this.renderDashboard(labels,
                            dataTotals,
                            colors,
                            'Due Issues This Week of Top 10 Projects ',
                            'horizontalBar',
                            false,
                            'overdueThisWeek')


    }else if(dataKey == 'xxxx.csv'){

      //if you want to extend with more dashboards...
      //prepare the HTML page like issue_dashboard.html

    } 
    //else if....

  } 
  random_rgba() {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r() * s) + ',' + o(r() * s) + ',' + o(r() * s) + ',' + 0.5 + ')';
  }


}