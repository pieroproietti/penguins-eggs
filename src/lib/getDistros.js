/**
 * os-release
 * 
 * 
 */

var fs = require('fs');

function read(file, cb) {
  fs.readFile(file, 'utf8', function (err, data) {
    if (!err) {
      cb(data.toString().split('\n'))
    } else {
      console.log(err)
    }
  });
}

var os = [];
os['PRETTY_NAME'] = "PRETTY_NAME=";
os['NAME'] = "NAME=";
os['ID'] = "ID=";
os['VERSION_ID'] = "VERSION_ID=";
os['HOME_URL'] = "HOME_URL=";
os['SUPPORT_URL'] = "SUPPORT_URL=";
os['BUG_REPORT_URL'] = "BUG_REPORT_URL=";

read('/etc/os-release', function (data) {
  for (var temp in data) {
    if (!data[temp].search(os['PRETTY_NAME'])) {
      os['PRETTY_NAME'] = data[temp].substring(os['PRETTY_NAME'].length).replace(/"/g, "");  
    };

    if (!data[temp].search(os['NAME'])) {
      os['NAME'] = data[temp].substring(os['NAME'].length).replace(/"/g, "");  
    };

    if (!data[temp].search(os['ID'])) {
      os['ID'] = data[temp].substring(os['ID'].length).replace(/"/g, "");  
    };

    if (!data[temp].search(os['VERSION_ID'])) {
      os['VERSION_ID'] = data[temp].substring(os['VERSION_ID'].length).replace(/"/g, "");  
    };

    if (!data[temp].search(os[`HOME_URL`])) {
      os[`HOME_URL`] = data[temp].substring(os[`HOME_URL`].length).replace(/"/g, "");  
    };

    if (!data[temp].search(os[`SUPPORT_URL`])) {
      os[`SUPPORT_URL`] = data[temp].substring(os[`SUPPORT_URL`].length).replace(/"/g, "");  
    };

    if (!data[temp].search(os[`BUG_REPORT_URL`])) {
      os[`BUG_REPORT_URL`] = data[temp].substring(os[`BUG_REPORT_URL`].length).replace(/"/g, "");  
    };
  }
  var oJson = "{ ";
  oJson += '"prettyName": "' + os['PRETTY_NAME'] + '", ';
  oJson += '"name": "' + os['NAME'] + '", ';
  oJson += '"id": "' + os['ID'] + '", ';
  oJson += '"versionId": "' + os['VERSION_ID'] + '", ';
  oJson += '"homeUrl": "' + os['HOME_URL'] + '", ';
  oJson += '"supportUrl": "' + os['SUPPORT_URL'] + '", ';
  oJson += '"bugReportUrl": "' + os['BUG_REPORT_URL'] + '"}';

  var obj = JSON.parse(oJson);
    console.log(obj.prettyName);
    console.log(obj.name);
    console.log(obj.id);
    console.log(obj.versionId);
    console.log(obj.homeUrl);
    console.log(obj.supportUrl);
    console.log(obj.bugReportUrl);

});