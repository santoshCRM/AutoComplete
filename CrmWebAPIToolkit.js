CrmWebAPIToolkit = function () {
  
};
CrmWebAPIToolkit.WebAPI = function () {
    // Private members

    var alertMessage = function (message) {
        (Xrm.Utility !== undefined && Xrm.Utility.alertDialog !== undefined) ? Xrm.Utility.alertDialog(message) : alert(message);
    };

    var htmlEncode = function (s) {
        if (s === null || s === "" || s === undefined) return s;
        for (var count = 0, buffer = "", hEncode = "", cnt = 0, slength = s.length; cnt < slength; cnt++) {
            var c = s.charCodeAt(cnt);
            if (c > 96 && c < 123 || c > 64 && c < 91 || c === 32 || c > 47 && c < 58 || c === 46 || c === 44 || c === 45 || c === 95)
                buffer += String.fromCharCode(c);
            else buffer += "&#" + c + ";";
            if (++count === 500) {
                hEncode += buffer;
                buffer = "";
                count = 0;
            }
        }
        if (buffer.length) hEncode += buffer;
        return hEncode;
    };

    var innerSurrogateAmpersandWorkaround = function (s) {
        var buffer = '';
        var c0;
        for (var cnt = 0, slength = s.length; cnt < slength; cnt++) {
            c0 = s.charCodeAt(cnt);
            if (c0 >= 55296 && c0 <= 57343)
                if (cnt + 1 < s.length) {
                    var c1 = s.charCodeAt(cnt + 1);
                    if (c1 >= 56320 && c1 <= 57343) {
                        buffer += "CRMEntityReferenceOpen" + ((c0 - 55296) * 1024 + (c1 & 1023) + 65536).toString(16) + "CRMEntityReferenceClose";
                        cnt++;
                    } else
                        buffer += String.fromCharCode(c0);
                } else buffer += String.fromCharCode(c0);
            else buffer += String.fromCharCode(c0);
        }
        s = buffer;
        buffer = "";
        for (cnt = 0, slength = s.length; cnt < slength; cnt++) {
            c0 = s.charCodeAt(cnt);
            if (c0 >= 55296 && c0 <= 57343)
                buffer += String.fromCharCode(65533);
            else buffer += String.fromCharCode(c0);
        }
        s = buffer;
        s = htmlEncode(s);
        s = s.replace(/CRMEntityReferenceOpen/g, "&#x");
        s = s.replace(/CRMEntityReferenceClose/g, ";");
        return s;
    };

    // ReSharper disable UnusedLocals
    var crmXmlEncode = function (s) {
        // ReSharper restore UnusedLocals
        // ReSharper disable UsageOfPossiblyUnassignedValue
        // ReSharper disable ExpressionIsAlwaysConst
        if ('undefined' === typeof s || 'unknown' === typeof s || null === s) return s;
            // ReSharper restore ExpressionIsAlwaysConst
            // ReSharper restore UsageOfPossiblyUnassignedValue
        else if (typeof s != "string") s = s.toString();
        return innerSurrogateAmpersandWorkaround(s);
    };

    // ReSharper disable UnusedLocals
    var crmXmlDecode = function (s) {
        // ReSharper restore UnusedLocals
        if (typeof s != "string") s = s.toString();
        return s;
    };

    var context = function () {
        ///<summary>
        /// Private function to the context object.
        ///</summary>
        ///<returns>Context</returns>
        var oContext;
        if (typeof window.GetGlobalContext != "undefined") {
            oContext = window.GetGlobalContext();
        } else if (typeof GetGlobalContext != "undefined") {
            oContext = GetGlobalContext();
        } else {
            if (typeof Xrm != "undefined") {
                oContext = Xrm.Page.context;
            } else if (typeof window.parent.Xrm != "undefined") {
                oContext = window.parent.Xrm.Page.context;
            } else {
                throw new Error("Context is not available.");
            }
        }
        return oContext;
    };

    var getClientUrl = function () {
        ///<summary>
        /// Private function to return the server URL from the context
        ///</summary>
        ///<returns>String</returns>
        var serverUrl = typeof context().getClientUrl !== "undefined" ? context().getClientUrl() : context().getServerUrl();
        if (serverUrl.match(/\/$/)) {
            serverUrl = serverUrl.substring(0, serverUrl.length - 1);
        }
        return serverUrl;
    };

    var webAPIPath = function () {
        ///<summary>
        /// Private function to return the path to the REST endpoint.
        ///</summary>
        ///<returns>String</returns>
        return getClientUrl() + "/api/data/v9.1/";
    };

    var errorHandler = function (req) {
        ///<summary>
        /// Private function return an Error object to the errorCallback
        ///</summary>
        ///<param name="req" type="XMLHttpRequest">
        /// The XMLHttpRequest response that returned an error.
        ///</param>
        ///<returns>Error</returns>
        try {
            return new Error("Error : " +
                req.status + ": " +
                req.statusText + ": " +
                JSON.parse(req.responseText).error.message.value);
        } catch (err) {
            // Error status codes: https://support.microsoft.com/en-us/kb/193625
            return new Error("Error : " +
                req.status + ": " +
                req.statusText + ": " +
                "Response text could not be parsed (empty?). WinInet Error codes: https://support.microsoft.com/en-us/kb/193625 ."
            );
        }
    };

    var dateReviver = function (key, value) {
        ///<summary>
        /// Private function to convert matching string values to Date objects.
        ///</summary>
        ///<param name="key" type="String">
        /// The key used to identify the object property
        ///</param>
        ///<param name="value" type="String">
        /// The string value representing a date
        ///</param>
        var a;
        if (typeof value === 'string') {
            a = /Date\(([-+]?\d+)\)/.exec(value);
            if (a) {
                return new Date(parseInt(value.replace("/Date(", "").replace(")/", ""), 10));
            }
        }
        return value;
    };

    var parameterCheck = function (parameter, message) {
        ///<summary>
        /// Private function used to check whether required parameters are null or undefined
        ///</summary>
        ///<param name="parameter" type="Object">
        /// The parameter to check;
        ///</param>
        ///<param name="message" type="String">
        /// The error message text to include when the error is thrown.
        ///</param>
        if ((typeof parameter === "undefined") || parameter === null) {
            throw new Error(message);
        }
    };

    var stringParameterCheck = function (parameter, message) {
        ///<summary>
        /// Private function used to check whether required parameters are null or undefined
        ///</summary>
        ///<param name="parameter" type="String">
        /// The string parameter to check;
        ///</param>
        ///<param name="message" type="String">
        /// The error message text to include when the error is thrown.
        ///</param>
        if (typeof parameter != "string") {
            throw new Error(message);
        }
    };

    var callbackParameterCheck = function (callbackParameter, message) {
        ///<summary>
        /// Private function used to check whether required callback parameters are functions
        ///</summary>
        ///<param name="callbackParameter" type="Function">
        /// The callback parameter to check;
        ///</param>
        ///<param name="message" type="String">
        /// The error message text to include when the error is thrown.
        ///</param>
        if (typeof callbackParameter != "function") {
            throw new Error(message);
        }
    };

    var booleanParameterCheck = function (parameter, message) {
        ///<summary>
        /// Private function used to check whether required parameters are null or undefined
        ///</summary>
        ///<param name="parameter" type="String">
        /// The string parameter to check;
        ///</param>
        ///<param name="message" type="String">
        /// The error message text to include when the error is thrown.
        ///</param>
        if (typeof parameter != "boolean") {
            throw new Error(message);
        }
    };

    var getXhr = function () {
        ///<summary>
        /// Get an instance of XMLHttpRequest for all browsers
        ///</summary>
        if (XMLHttpRequest) {
            // Chrome, Firefox, IE7+, Opera, Safari
            // ReSharper disable InconsistentNaming
            return new XMLHttpRequest();
            // ReSharper restore InconsistentNaming
        }
        // IE6
        try {
            // The latest stable version. It has the best security, performance,
            // reliability, and W3C conformance. Ships with Vista, and available
            // with other OS's via downloads and updates.
            return new ActiveXObject('MSXML2.XMLHTTP.6.0');
        } catch (e) {
            try {
                // The fallback.
                return new ActiveXObject('MSXML2.XMLHTTP.3.0');
            } catch (e) {
                alertMessage('This browser is not AJAX enabled.');
                return null;
            }
        }
    };

  
   
    var retrieveMultipleRecords = function (type, options, successCallback, errorCallback, onComplete, async) {


        var optionsString = '';
        if (options != null) {
            if (options.charAt(0) !== "?") {
                optionsString = "?" + options;
            } else {
                optionsString = options;
            }
        }

        var req = getXhr();
        req.open("GET", webAPIPath() + type + optionsString, async);
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");

        if (async) {
            req.onreadystatechange = function () {
                if (req.readyState === 4 /* complete */) {
                    if (req.status === 200) {
                        var returned = JSON.parse(req.responseText, dateReviver).value;
                        successCallback(returned);
                        if (returned.__next == null) {
                            onComplete();
                        } else {
                            var queryOptions = returned.__next.substring((oDataPath() + type).length);
                            retrieveMultipleRecords(type, queryOptions, successCallback, errorCallback, onComplete, async);
                        }
                    } else {
                        errorCallback(errorHandler(req));
                    }
                }
            };
            req.send();
        } else {
            req.send();
            if (req.status === 200) {
                var returned = JSON.parse(req.responseText, dateReviver).value;
                successCallback(returned);
                if (returned.__next == null) {
                    onComplete();
                } else {
                    var queryOptions = returned.__next.substring((oDataPath() + type).length);
                    retrieveMultipleRecords(type, queryOptions, successCallback, errorCallback, onComplete, async);
                }
            } else {
                errorCallback(errorHandler(req));
            }
        }
    };
  

    // Toolkit's public static members
    return {
       
        RetrieveMultiple: retrieveMultipleRecords
      
    };
}();


