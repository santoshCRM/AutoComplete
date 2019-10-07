
/// <reference path="sav_/Scripts/CrmWebAPIToolkit.js" />

Address1s = [];
function GetAddress1(oEntityLogicalName, oAttributeName, fieldName) {
    debugger;
    var odataEntity = oEntityLogicalName;
    var odataSelect = "$select=" + oAttributeName;
    CrmWebAPIToolkit.WebAPI.RetrieveMultiple(odataEntity, odataSelect,
       function (results) {
           if (results.length > 0)
               for (var x = 0; x < results.length; x++) {
                   Address1s.push(results[x][oAttributeName])
               }
           Xrm.Page.getControl(fieldName).addOnKeyPress(keyPressFcn);
       },
       function (error) {
           Xrm.Navigation.openAlertDialog(error.message);
       },
       function onComplete() { },
       false);
   
}
var keyPressFcn = function (ext) {
    debugger;
    try {
        var userInput = Xrm.Page.getControl(ext.getEventSource().getName()).getValue();
        resultSet = {
            results: new Array(),
        };
        var userInputLowerCase = userInput.toLowerCase();
        for (i = 0; i < Address1s.length; i++) {
            if (Address1s[i] != null && userInputLowerCase === Address1s[i].substring(0, userInputLowerCase.length).toLowerCase()) { resultSet.results.push({ id: i, fields: [Address1s[i]] }); } if (resultSet.results.length >= 10) break;
        }
        if (resultSet.results.length > 0) {
            ext.getEventSource().showAutoComplete(resultSet);
        } else {
            ext.getEventSource().hideAutoComplete();
        }
    } catch (e) {
        console.log(e);
    }
};

