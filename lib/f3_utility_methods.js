/**
 * Created by zahmed on 26-Dec-14.
 *
 * Class Name: Utility
 * -
 * Description:
 * - This class contains commonly used methods
 * -
 * Referenced By:
 * - connector_salesorder_sch.js
 * - connector_customer_sch_new.js
 * - connector_item_sch.js
 * -
 * Dependency:
 * -
 */

Utility = (function () {
    return {
        b_logDebug: true,
        /**
         * Init method
         */
        initialize: function () {

        },
        /**
         * Assign key-values to destObject from array of srcObjects
         * @param {} destObject
         * @param [srcObjects]
         */
        objectAssign: function (destObject, srcObjects) {
            for (var i = 0; i < srcObjects.length; ++i) {
                var srcObject = srcObjects[i];
                for (var key in srcObject) {
                    destObject[key] = srcObject[key];
                }
            }

            return destObject;
        },

        formatName: function (name){
          if(!!name){
              return name[0].toUpperCase()+name.slice(1,name.length);
          }else{
              return '';
          }
        },
        parseFloatForNetSuite: function round_float(a) {
            return round_float_to_n_places(a, 8);
        },
        round_float_to_n_places: function round_float_to_n_places(a, n) {
            var str = a + '';
            if (str.indexOf('.') < 0)
                return a;
            if (str.length - str.indexOf('.') - 1 <= n)
                return a;
            var b = Math.abs(a);
            b = b + 0.00000000000001;
            var factor = Math.pow(10, n);
            b = Math.floor((b * factor) + 0.5) / factor;
            b = b * (a >= 0.0 ? 1.0 : -1.0);
            if (b == 0.0)
                return 0.0;
            return b;
        },
        /**
         * Convert number to float
         *
         * @param {number,string,int} [num] string/integer/float number
         * @restriction returns 0 if num parameter is invalid
         * @return {float} floating number
         *
         * @since    Jan 12, 2015
         */
        parseFloatNum: function (num) {
            var no = parseFloat(num);
            if (isNaN(no)) {
                no = 0;
            }
            return no;
        },
        /**
         * This function returns the date using the given specified offset
         *
         * @param {number} offset number
         * @return {date} returns date
         *
         * @since    Jan 12, 2015
         */
        getDateUTC: function (offset) {
            var today = new Date();
            var utc = today.getTime() + (today.getTimezoneOffset() * 60000);
            offset = parseInt(this.parseFloatNum(offset * 60 * 60 * 1000));
            today = new Date(utc + offset);
            return today;
        },
        /**
         * This function prints error logs in NetSuite server script or in browser console.
         *
         * @param {string} fn function name
         * @param {nlobjError, Exception}  e NetSuite or JavaScript error object
         * @return {void}
         *
         * @since    Jan 12, 2015
         */
        logException: function (fn, e) {
            var err = '';
            if (e instanceof nlobjError) {
                err = 'System error: ' + e.getCode() + '\n' + e.getDetails();
            }
            else {
                err = 'Unexpected error: ' + e.toString();
            }
            if (!!window.console) {
                console.log('ERROR :: ' + fn + ' :: ' + err);
            } else {
                nlapiLogExecution('ERROR', fn, err);
            }
        },
        /**
         * This function prints debug logs in NetSuite server script or in browser console.
         *
         * @param {string} title
         * @param {string}  description
         * @return {void}
         *
         * @since    Jan 12, 2015
         */
        logDebug: function (title, description) {
            if (!this.b_logDebug) {
                // supress debug
                return;
            }
            if (!!window.console) {
                console.log('DEBUG :: ' + title + ' :: ' + description);
            } else {
                nlapiLogExecution('DEBUG', title, description);
            }
        },
        /**
         * This function prints audit logs in NetSuite server script or in browser console.
         *
         * @param {string} title
         * @param {string}  description
         * @return {void}
         *
         * @since    Jan 12, 2015
         */
        logAudit: function (title, description) {
            if (!this.b_logDebug) {
                // supress debug
                return;
            }
            if (!!window.console) {
                console.log('AUDIT :: ' + title + ' :: ' + description);
            } else {
                nlapiLogExecution('AUDIT', title, description);
            }
        },
        /**
         * This function prints debug logs in NetSuite server script or in browser console.
         *
         * @param {string} title
         * @param {string}  description
         * @return {void}
         *
         * @since    Jan 12, 2015
         */
        logEmergency: function (title, description) {
            if (!this.b_logDebug) {
                // supress debug
                return;
            }
            if (!!window.console) {
                console.log('EMERGENCY :: ' + title + ' :: ' + description);
            } else {
                nlapiLogExecution('EMERGENCY', title, description);
            }
        },
        isBlankOrNull: function (str) {
            return str == null || str == undefined || typeof (str) == 'undefined' || str == 'undefined' || (str + '').trim().length == 0;
        },
        addZeroes: function (vle, requiredLength) {
            vle = vle.toString();
            var i = vle.length;

            while (i < requiredLength) {

                vle = '0' + vle;
                i++;
            }

            return vle;
        },
        // convert into to digits
        convertIntToDigit: function (num, length) {
            var str = '';
            if (!isNaN(num)) {
                num = parseInt(num);
                if (num >= 0) {
                    var numArr = new String(num);
                    if (numArr.length < length) {
                        var diff = length - numArr.length;
                        for (var i = 0; i < diff; i++) {
                            str += '0';
                        }
                    }
                    str += num;
                }
            }
            return str;
        },
        addslashes: function (str) {
            return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
        },


        /**
         * Calculate the size of object
         * @param {object} obj
         * @return {number} Returns the count of attributes of object at first level
         */
        objectSize: function (obj) {
            var size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    size++;
                }
            }
            return size;
        },
        /**
         * Get Empty string for null
         * @param data
         * @return {data, ''}
         */
        getBlankForNull: function (data) {
            var returnValue;
            if (this.isBlankOrNull(data)) {
                returnValue = '';
            } else {
                returnValue = data;
            }
            return returnValue;
        },
        /**
         * Check if NetSuite Account Type is One World
         * @return {boolean}
         */
        isOneWorldAccount: function () {
            return nlapiGetContext().getFeature('SUBSIDIARIES');
        },
        /**
         * Check if MultiLocation is enabled
         * @return {boolean}
         */
        isMultiLocInvt: function () {
            return nlapiGetContext().getFeature('MULTILOCINVT');
        },
        /**
         * Throw Custom NetSuite Expcetion
         * @param code
         * @param message
         * @return {nlobjError}
         */
        throwException: function (code, message) {
            code = code || 'CustomException';
            throw nlapiCreateError(code, message, true);
        },

        isMultiCurrency: function () {
            return nlapiGetContext().getFeature('MULTICURRENCY');
        },
        addMinutes: function (date, minutes) {
            return new Date(date.getTime() + minutes * 60000);
        },
        getRecords: function (recordType, savedSearchId, filters, columns, pages) {
            var result = [];
            // TODO: improve and implement facade
            var savedSearch;
            try {
                if (!!savedSearchId) {
                    savedSearch = nlapiLoadSearch(null, savedSearchId);
                } else {
                    savedSearch = nlapiCreateSearch(recordType, filters, columns);
                }
            } catch (ex) {
                nlapiLogExecution('DEBUG', 'getRecords', ex);
                return result;
            }

            var runSearch = savedSearch.runSearch();
            var start = 0, end = 1000;
            var page = 1;
            var chunk = runSearch.getResults(start, end);

            if (!!chunk) {
                result = result.concat(chunk);
                while (chunk.length === 1000 && (!!pages ? page < pages : true)) {
                    start += 1000;
                    end += 1000;
                    chunk = runSearch.getResults(start, end);
                    if (chunk !== null) {
                        result = result.concat(chunk);
                    }
                    page = !!pages ? ++page : null;
                }
            }

            return result;
        },
        /**
         * Get Current or specified date of the System in specified offset or timezone
         * @param [date]
         * @param [offset]
         * @returns {Date}
         */
        getDateUTCExtended: function (date, offset) {
            offset = offset || 0;
            var today = !!date ? new Date(date) : new Date();
            var utc = today.getTime() + (today.getTimezoneOffset() * 60000);
            offset = parseInt(this.parseFloatNum(offset * 60 * 60 * 1000));
            today = new Date(utc + offset);
            return today;
        },
        /**
         * Generic XML Node to JSON
         * @param xmlNode
         */
        xmlNodeToJSON: function (xmlNode) {
            var nodes = nlapiSelectNodes(xmlNode, '*');
            if (nodes.length) {
                var obj;
                var localName = xmlNode.localName.toLowerCase();
                var xsiType = nlapiSelectValue(xmlNode, '@xsi:type') || '';
                var isArray = (
                    xsiType.toLowerCase().lastIndexOf('array') >= 0 //localName.substr(-6) == "result"
                    || localName.substr(-4) == "list"
                    || localName.substr(-8) == "children"
                );
                if (isArray) {
                    obj = [];
                }
                else {
                    obj = {};
                }
                for (var i = 0; i < nodes.length; ++i) {
                    var node = nodes[i];
                    var res = this.xmlNodeToJSON(node);
                    var name = node.localName;
                    if (isArray) {
                        obj.push(res);
                    }
                    else {
                        obj[name] = res;
                    }
                }
                var attrs = nlapiSelectNodes(xmlNode, '@*');
                for (var i = 0; i < attrs.length; ++i) {
                    var attr = attrs[i];
                    if (attr.prefix != "xmlns") {
                        obj[attr.localName] = attr.nodeValue;
                    }
                }
                return obj;
            }
            var value = xmlNode.textContent; //nlapiSelectValue(xmlRecord,'../*[name()="'+xmlRecord.tagName+'"]');
            return value == "true" ? true : value == "false" ? false : value;
        },
        /**
         * Get 12 hr Date Time Format to be converted to 24 hr
         * @param dateTime <string>
         * @returns {*}
         */
        getDateConvertedTo24Hours: function (dateTime) {
            Utility.logDebug("dateTime", dateTime);
            var dateTimeArray = dateTime.split(" ");
            var timeString = dateTimeArray[1];
            if (!!dateTimeArray[1]) {
                var time = dateTimeArray[1];
                time = time.match(/(\d+):(\d+):(\d+) (\w)/);
                var hours = Number(time[1]);
                var minutes = Number(time[2]);
                var seconds = Number(time[3]);
                var AMPM = dateTimeArray[2].toLowerCase();
                if (AMPM == "p" && hours < 12) hours = hours + 12;
                if (AMPM == "a" && hours == 12) hours = hours - 12;
                var sHours = hours.toString();
                var sMinutes = minutes.toString();
                if (hours < 10) sHours = "0" + sHours;
                if (minutes < 10) sMinutes = "0" + sMinutes;
                timeString = sHours + ":" + sMinutes + ":" + seconds;
            }
            return timeString;
        },
        guid: function () {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }

            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        }
    };
})();

if (!Date.prototype.toISOString) {
    (function () {

        function pad(number) {
            var r = String(number);
            if (r.length === 1) {
                r = '0' + r;
            }
            return r;
        }

        Date.prototype.toISOString = function () {
            return this.getUTCFullYear()
                + '-' + pad(this.getUTCMonth() + 1)
                + '-' + pad(this.getUTCDate())
                + 'T' + pad(this.getUTCHours())
                + ':' + pad(this.getUTCMinutes())
                + ':' + pad(this.getUTCSeconds())
                + '.' + String((this.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5)
                + 'Z';
        };

    }());
}

TimeLogger = (function () {
    var instances = {};
    var loggerId = guid();
    var off = false;

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    function log(title, description) {
        if (!!window.console) {
            console.log('AUDIT :: ' + title + ' :: ' + description);
        } else {
            nlapiLogExecution('AUDIT', title, description);
        }
    }

    return {
        start: function (id) {
            if (off) {
                return;
            }
            if (!!id) {
                instances[id] = new Date();
                log(loggerId + " - " + id, "START " + 0 + " second(s)");
            } else {
                log(loggerId, "Id is invalid or not found");
            }
        },
        stop: function (id) {
            if (off) {
                return;
            }
            if (!!id && instances.hasOwnProperty(id)) {
                var startTime = instances[id].getTime();
                var endTime = (new Date()).getTime();
                var timeInSecs = Math.round(((endTime - startTime) / 1000) * 100) / 100;

                log(loggerId + " - " + id, "END: " + timeInSecs + " second(s)");

                delete instances[id];
            } else {
                log(loggerId, "Id is invalid or not found");
            }
        }
    };
})();
function JsonHelper() {
}

/**
 * Convert search result array into json array.
 * @param {nlobjSearchResult[]} records array of search result
 * @returns {object[]} json representation of search result array
 */
JsonHelper.getJsonArray = function (records) {
    var result = [];
    if (!!records && records.length > 0) {
        var cols = records[0].getAllColumns();
        var columnNames = [];
        var item = null, label = null, nm = null, j = 0;
        var record = null, jsonObj = null, k = 0;
        if (!!cols) {
            for (; j < cols.length; j++) {
                item = cols[j];
                label = item.getLabel();
                if (!!label) {
                    label = label.toLowerCase();
                    label = label.indexOf("_") === 0 ? label.substr(1) : label;
                    label = label.trim().replace(/ /gi, "_");
                    nm = label;
                }
                else {
                    nm = item.getName();
                }
                columnNames.push(nm);
            }
        }
        for (; k < records.length; k++) {
            record = records[k];
            jsonObj = JsonHelper.getJsonObject(record, cols, columnNames);
            result.push(jsonObj);
        }
    }
    return result;
};
/**
 * Convert search result object into json array.
 * @param {nlobjSearchResult} row single row of search result
 * @param {nlobjSearchColumn[]} cols array of columns to convert into json
 * @param {string[]?} columnNames array of column names
 * @returns {object[]} json representation of search result object
 */
JsonHelper.getJsonObject = function (row, cols, columnNames) {
    var obj = null;
    if (row) {
        obj = {
            id: row.getId(),
            recordType: row.getRecordType()
        };
        var nm = null, item, val, text;
        if (!!cols) {
            for (var x = 0; x < cols.length; x++) {
                item = cols[x];
                nm = (columnNames && columnNames[x]) || item.getName();
                val = row.getValue(item);
                text = row.getText(item);
                // donot create object for internal id
                if (!!text && nm !== "internalid") {
                    obj[nm] = {
                        text: text,
                        value: val
                    };
                }
                else {
                    obj[nm] = val;
                }
            }
        }
    }
    return obj;
};
