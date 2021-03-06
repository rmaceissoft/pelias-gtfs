'use strict';

var request = require('request')
  , parseArgs = require('minimist')
  , JSONStream = require('JSONStream')
  , es = require('event-stream')
  , logger = require('pelias-logger').get('gtfs')
  , peliasConfig = require('pelias-config').generate()
  , peliasAdminLookup = require('pelias-admin-lookup');

var importPipelines = require('./lib/import_pipelines');


function importStops (url) {

  var startTime;

  logger.info('Importing stops from url %s', url);
  var pipeline = request({url: url})
    .pipe(JSONStream.parse('*'))
    .on('data', function (data) {
      logger.info(data);
    })
    .pipe(importPipelines.createRecordStream());

  if(peliasConfig.imports.gtfs.adminLookup ) {
    pipeline = pipeline
      .pipe(peliasAdminLookup.stream())
  }

  pipeline
    .pipe(importPipelines.createPeliasElasticsearchPipeline())
    .once('data', function () {
      startTime = new Date().getTime();
    })

  process.on('exit', function () {
    var totalTimeTaken = (new Date().getTime() - startTime).toString();
    var seconds = totalTimeTaken.slice(0, totalTimeTaken.length - 3);
    var milliseconds = totalTimeTaken.slice(totalTimeTaken.length - 3);
    logger.info( 'Total time taken: %s.%ss', seconds, milliseconds );
  });
}


if (require.main === module) {
  var argv = parseArgs(process.argv.slice(2));
  var url;
  if (argv._.length > 0) {
    url = argv._[0];
  } else {
    url = peliasConfig.imports.gtfs.stopsurl;
  }

  if (url !== undefined) {
    importStops(url);
  } else {
    console.error("url wasn't provided");
    process.exit(2);
  }
}