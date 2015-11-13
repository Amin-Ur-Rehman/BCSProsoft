/**
 * Created by wahajahmed on 8/11/2015.
 * TODO:
 * -
 * Referenced By:
 * -
 * -
 * Dependencies:
 * -
 * -
 */

/**
 * RecordsToSync class that has the functionality of record manipulation for 'Records To Sync' custom record
 */
var RecordsToSync = (function () {
    return {
        InternalId: 'customrecord_f3mg_records_to_sync',
        FieldName: {
            RecordId: 'custrecord_f3mg_rts_record_id',
            RecordType: 'custrecord_f3mg_rts_record_type',
            Action: 'custrecord_f3mg_rts_action',
            Status: 'custrecord_f3mg_rts_status',
            Data: 'custrecord_rectosyncdata',
            Comments: 'custrecord_rectosyncproccomnts',
            ExternalSystem: 'custrecord_rts_external_system'
        },
        RecordTypes : {
            Customer: 'customer',
            SalesOrder: 'salesorder',
            GiftCertificateItem: 'giftcertificateitem'
        },
        Actions : {
            ExportCustomer: 'ExportCustomer',
            SyncSoSystemNotes: 'SyncSoSystemNotes',
            SyncGiftCertificates: 'SyncGiftCertificates'
        },
        Status : {
            Pending: 'Pending',
            Processed: 'Processed',
            ProcessedWithError: 'ProcessedWithError'
        },
        /**
         * Perform a record search using filters and columns.
         * @governance 10 units
         * @restriction returns the first 1000 rows in the search
         *
         * @param {nlobjSearchFilter, nlobjSearchFilter[]} [filters] [optional] A single nlobjSearchFilter object - or - an array of nlobjSearchFilter objects.
         * @return {nlobjSearchResult[]} Returns an array of nlobjSearchResult objects corresponding to the searched records.
         *
         * @since    Jan 12, 2015
         */
        lookup: function (filters) {
            var result = [];
            try {
                var cols = [];
                var fils = filters || [];
                for (var i in this.FieldName) {
                    var col = new nlobjSearchColumn(this.FieldName[i], null, null);
                    cols.push(col);
                }
                result = nlapiSearchRecord(this.InternalId, null, fils, cols) || [];
            } catch (e) {
                Utility.logException('RecordsToSync.lookup', e);
            }
            return result;
        },
        /**
         * Getting record information from custom table
         * @returns {Array} Returns an array of objects
         */
        getRecords: function (recordType, status, action) {
            var records = [];
            var filters = [];
            filters.push(new nlobjSearchFilter(this.FieldName.RecordType,null,'is',recordType));
            filters.push(new nlobjSearchFilter(this.FieldName.Status,null,'is',status));
            if(!!action) {
                filters.push(new nlobjSearchFilter(this.FieldName.Action,null,'is',action));
            }
            var res = this.lookup(filters);
            for (var i = 0; i < res.length; i++) {
                filters.push(new nlobjSearchFilter(this.FieldName.Action,null,'is',action));
                var rec = res[i];
                var internalId = rec.getId();
                var recordId = rec.getValue(this.FieldName.RecordId, null, null);
                var recordType = rec.getValue(this.FieldName.RecordType, null, null);
                var action = rec.getValue(this.FieldName.Action, null, null);
                var status = rec.getValue(this.FieldName.Status, null, null);
                var data = rec.getValue(this.FieldName.Data, null, null);
                var comments = rec.getValue(this.FieldName.Comments, null, null);
                var obj = {
                    internalId: internalId,
                    recordId: recordId,
                    recordType: recordType,
                    action: action,
                    status: status,
                    data: data,
                    comments: comments
                };
                records.push(obj);
            }
            //Utility.logDebug('RecordsToSync.getRecords', JSON.stringify(records));
            return records;
        },
        /**
         * Getting record information from custom table to Delete
         * @returns {Array} Returns an array of objects
         */
        getRecordsToDelete: function (beforeDate,status) {
            var records = [];
            var filters = [];
            if(!!beforeDate) {
                filters.push(new nlobjSearchFilter('lastmodified',null,'before',beforeDate));
                if(!!status)
                    filters.push(new nlobjSearchFilter(this.FieldName.Status,null,'is',status));
                else
                    filters.push(new nlobjSearchFilter(this.FieldName.Status,null,'is',this.Status.Processed));

                var res = this.lookup(filters);
                for (var i = 0; i < res.length; i++) {
                    var rec = res[i];
                    var internalId = rec.getId();
                    var obj = {
                        internalId: internalId
                    };
                    records.push(obj);
                }
            }
            return records;
        },
        /**
         * Check if record already exist in queue
         * @param recordType
         * @param status
         * @param action
         * @returns {Array}
         */
        checkRecordAlreadyExist: function (recordId, recordType, status) {
            var records = [];
            var filters = [];
            filters.push(new nlobjSearchFilter(this.FieldName.RecordId,null,'is',recordId));
            filters.push(new nlobjSearchFilter(this.FieldName.RecordType,null,'is',recordType));
            filters.push(new nlobjSearchFilter(this.FieldName.Status,null,'is',status));
            var res = this.lookup(filters);
            if(!!res && res.length > 0) {
                return true;
            }
            else {
                return false;
            }
        },

        /**
         * Either inserts or updates data. Upsert = Up[date] + [In]sert
         * @param arg
         * @returns {*}
         */
        upsert: function (arg) {
            var id = null;
            var rec = null;
            if (arg) {
                try {
                    rec = Utility.isBlankOrNull(arg.id) ? nlapiCreateRecord(this.InternalId) : nlapiLoadRecord(this.InternalId, arg.id);
                    delete arg.id;
                    for (var x in arg) {
                        if (!Utility.isBlankOrNull(x)) {
                            rec.setFieldValue(x, arg[x]);
                        }
                    }
                    id = nlapiSubmitRecord(rec, true);
                }
                catch (e) {
                    Utility.logException('RecordsToSync.upsert', e);
                }
            }
            return id;
        },
        /**
         * Change custom record status to processed
         * @param internalId
         * @param status
         */
        markProcessed: function(internalId, status) {
            nlapiSubmitField(this.InternalId, internalId, this.FieldName.Status, status);
        }

    };
})();