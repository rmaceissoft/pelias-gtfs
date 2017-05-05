'use strict';

var through = require('through2')
  , peliasModel = require('pelias-model');


function createRecordStream () {
  var documentCreator = through.obj(
    function write (record, enc, next) {
      var stopDoc = new peliasModel.Document('gtfs', 'stop', 'GTFS:' + record.id)
        .setName('default', record.name)
        .setCentroid({lon: record.lon, lat: record.lat})
      stopDoc.phrase = stopDoc.name;
      this.push(stopDoc);
      next();
    }
  );

  return documentCreator;
}


module.exports = {
  createRecordStream: createRecordStream
};