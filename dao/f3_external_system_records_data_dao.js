/**
 * Created by zahmed on 23-Nov-15.
 */

/**
 * ExtSysRecordsData class that has the functionality of maintaining External System Records Ids Data
 */
var ExtSysRecordsData = (function () {
    return {
        InternalId: 'customrecord_external_system_record_data',
        FieldName: {
            ExternalSystem : "custrecord_esrd_external_system",
            NsRecordId: 'custrecord_esrd_ns_recordid',
            NsRecordType: 'custrecord_esrd_ns_recordtype',
            ExtSysRecordId: 'custrecord_esrd_es_recordid',
            ExtSysRecordIdOther: '	custrecord_esrd_es_recordid_other',
            Description: 'custrecord_esrd_description'
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
                Utility.logException('ExtSysRecordsData.lookup', e);
            }
            return result;
        },
        /**
         * Getting record information from custom table
         * @returns {Array} Returns an array of objects
         */
        getRecord: function (recordId, recordType) {
            var obj = null;
            var filters = [];
            filters.push(new nlobjSearchFilter(this.FieldName.RecordId, null, 'is', recordId));
            filters.push(new nlobjSearchFilter(this.FieldName.RecordType, null, 'is', recordType));
            var res = this.lookup(filters);
            if (!!res && res.length > 0) {
                var rec = res[0];
                var internalId = rec.getId();
                var externalSystem = rec.getValue(this.FieldName.ExternalSystem, null, null);
                var nsRecordId = rec.getValue(this.FieldName.NsRecordId, null, null);
                var nsRecordType = rec.getValue(this.FieldName.NsRecordType, null, null);
                var extSysRecordId = rec.getValue(this.FieldName.ExtSysRecordId, null, null);
                var extSysRecordIdOther = rec.getValue(this.FieldName.ExtSysRecordIdOther, null, null);
                obj = {
                    internalId: internalId,
                    externalSystem: externalSystem,
                    nsRecordId: nsRecordId,
                    nsRecordType: nsRecordType,
                    extSysRecordId: extSysRecordId,
                    extSysRecordIdOther: extSysRecordIdOther
                };
            }
            //Utility.logDebug('ExtSysRecordsData.getRecord', JSON.stringify(obj));
            return obj;
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
                    Utility.logException('ExtSysRecordsData.upsert', e);
                }
            }
            return id;
        }

    };
})();