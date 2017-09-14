'use strict';

var through = require('through2')
  , peliasModel = require('pelias-model');


function createRecordStream () {

  var stats = {
    badRecordCount: 0,
    goodRecordCount: 0
  };

  var intervalId = setInterval( function (){
    logger.verbose( 'Number of bad records: ' + stats.badRecordCount + '; good records: ' + stats.goodRecordCount);
  }, 10000 );

  var documentCreator = through.obj(
    function write (record, enc, next) {
      try {
        var stopDoc = new peliasModel.Document('gtfs', 'stop', 'GTFS:' + record.id)
          .setName('default', record.name)
          .setCentroid({lon: record.lon, lat: record.lat})
        stopDoc.setPopularity(10000);
        stopDoc.phrase = stopDoc.name;
        this.push(stopDoc);
        stats.goodRecordCount++;
      }
      catch ( ex ){
        stats.badRecordCount++;
      }

      next();

    }
  );

  documentCreator._flush = function end( done ){
    clearInterval( intervalId );
    done();
  };

  return documentCreator;
}


module.exports = {
  createRecordStream: createRecordStream
};