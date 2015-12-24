'use strict';

var through = require('through2')
  , peliasModel = require('pelias-model')
  , peliasDbclient = require('pelias-dbclient');


function createRecordStream () {
  var documentCreator = through.obj(
    function write (record, enc, next) {
      var stopDoc = new peliasModel.Document('gtfsstop', record.id)
        .setName('default', 'stop ' + record.name)
        .setCentroid({lon: record.lon, lat: record.lat})
      stopDoc.phrase = stopDoc.name;
      this.push(stopDoc);
      next();
    }
  );

  return documentCreator;
}


function createPeliasElasticsearchPipeline(){
  var dbclientMapper = through.obj( function( model, enc, next ){
    this.push({
      _index: 'pelias',
      _type: model.getType(),
      _id: model.getId(),
      data: model
    });
    next();
  });

  var entryPoint = dbclientMapper;
  entryPoint.pipe( peliasDbclient() );

  return entryPoint;
}

module.exports = {
  createRecordStream: createRecordStream,
  createPeliasElasticsearchPipeline: createPeliasElasticsearchPipeline
};