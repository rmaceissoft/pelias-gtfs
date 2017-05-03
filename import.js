'use strict';

var request = require('request')
  , parseArgs = require('minimist')
  , JSONStream = require('JSONStream')
  , es = require('event-stream')
  , logger = require('pelias-logger').get('gtfs')
  , peliasConfig = require('pelias-config').generate()
  , peliasDbclient = require('pelias-dbclient')
  , peliasModel = require('pelias-model')
  , adminLookupStream = require('pelias-wof-admin-lookup');

var importPipelines = require('./lib/import_pipelines');

// Pretty-print the total time the import took.
function startTiming() {
  var startTime = new Date().getTime();
  process.on('exit', function () {
    var totalTimeTaken = (new Date().getTime() - startTime).toString();
    var seconds = totalTimeTaken.slice(0, totalTimeTaken.length - 3);
    var milliseconds = totalTimeTaken.slice(totalTimeTaken.length - 3);
    logger.info( 'Total time taken: %s.%ss', seconds, milliseconds );
  });
}

function importStops (url) {
  logger.info('Importing stops from url %s', url);

  var endStream = peliasDbclient();

  request({url: url})
    .pipe(JSONStream.parse('*'))
    .on('data', function (data) {
      logger.info(data);
    })
    .pipe(importPipelines.createRecordStream())
    .pipe(adminLookupStream.create())
    .pipe(peliasModel.createDocumentMapperStream())
    .pipe(endStream);
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
    startTiming();
    importStops(url);
  } else {
    console.error("url wasn't provided");
    process.exit(2);
  }
}