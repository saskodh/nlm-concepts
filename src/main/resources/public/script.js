'use strict';

// NOTE: add 'mock.api' as last module to override the request's to MTI api.

angular.module('app', ['ui.bootstrap', 'nlm.api'])

  // -----------------
  // Controllers
  // -----------------
  
  .controller('JobsController', function ($scope, $timeout) {
    $scope.activeTab = 1;
    $scope.jobs = [{}];

    $scope.addNewJob = function ($event) {
      if ($event) {
        $event.preventDefault();
        $scope.jobs.push({});
        $timeout(function () {
          $scope.activeTab = $scope.jobs.length;
        });
      }
    };

    $scope.removeJob = function (jobIndex) {
      if ($scope.jobs.length > 1) {
        $scope.jobs.splice(jobIndex, 1);
      }
    };

    $scope.getJobTitle = function (job, index) {
      var fallbackTitle = 'Job ' + (index + 1);
      var jobTitle = null;
      if (job.textContent && job.textContent.length > 15) {
        var indexOfFirstWord = job.textContent.indexOf(' ');
        if (indexOfFirstWord < 12 && indexOfFirstWord > 6) {
          jobTitle = job.textContent.substring(0, indexOfFirstWord) + '..';
        } else {
          jobTitle = job.textContent.substring(0, 8) + '..';
        }
      }
      return jobTitle || fallbackTitle;
    };
  })

  // -----------------
  // Directives
  // -----------------

  /**
   * Component implementing the functionality for indexing the medical text.
   * */
  .directive('nlmJob', function ($compile) {
    return {
      templateUrl: 'tpls/nlmJob.tpl.html',
      scope: {
        job: '=nlmJob'
      },
      controller: function ($scope, $element, mtiService, sparqlEndpoint, INITIAL_TEXT) {
        $scope.editMode = true;
        $scope.job.textContent = INITIAL_TEXT;

        var createModificationsArray = function (results) {
          var modifications = [];

          results.forEach(function (concept) {
            if (concept.positions) {
              concept.positions.forEach(function (position) {
                modifications.push({ position: position, concept: concept });
              });
            }
          });

          // sort the modifications by starting position
          modifications = modifications.sort(function (mod1, mod2) {
            // todo some matches can overlap, how we handle that?
            return mod1.position.start - mod2.position.start;
          });
          return modifications;
        };

        var highlightTextContent = function (textContent, results) {
          var HIGHLIGHT_TEMPLATE = '<span nlm-concept-tooltip="modifications[$$index$$].concept">$$content$$</span>';

          $scope.modifications = createModificationsArray(results);

          var forwardCursor = 0;
          $scope.modifications.forEach(function (modification, i) {
            var index = forwardCursor + modification.position.start;
            var firstPart = textContent.slice(0, index);
            var secondPart = textContent.slice(index + modification.position.count);
            var conceptMatch = textContent.slice(index, index + modification.position.count);
            var highlightedConcept = HIGHLIGHT_TEMPLATE.replace('$$content$$', conceptMatch).replace('$$index$$', i);
            forwardCursor += highlightedConcept.length - conceptMatch.length;
            textContent = firstPart + highlightedConcept + secondPart;
          });

          $element.find('.text-input .highlighted-text').empty();
          $element.find('.text-input .highlighted-text')
            .append($compile(angular.element('<div>' + textContent + '</div>'))($scope));
        };

        var showResults = function (results) {
          results.forEach(function (result) {
            result.isOpen = false;
          });
          $scope.results = results;
        };

        $scope.processText = function (textContent) {
          $scope.showSpinner = true;
          $scope.results = '';
          $scope.error = '';
          mtiService.processText(textContent).then(function (results) {
            $scope.showSpinner = false;
            showResults(results);
            highlightTextContent(textContent, results);

            // NOTE: if no concepts matched we stay in edit mode
            $scope.editMode = results.length === 0;
          }, function (error) {
            $scope.error = error;
            $scope.showSpinner = false;
          });
        };

        $scope.setEditable = function () {
          $scope.editMode = true;
        };

        $scope.loadConceptData = function (concept) {
          sparqlEndpoint.getConceptData(concept);
        }
      }
    };
  })

  /**
   * Directive that highlights his inner text and adds tooltip with the scopeNote of the given concept.
   * */
  .directive('nlmConceptTooltip', function () {
    return {
      scope: {
        concept: '=nlmConceptTooltip'
      },
      controller: function ($scope, $element, sparqlEndpoint) {
        $element.addClass('highlighted');

        // init tooltip
        var tooltipOptions = {
          title: $scope.concept.term
        };
        $element.tooltip(tooltipOptions);

        var tooltipUpdated = false;
        $element.on('show.bs.tooltip', function (event) {
          if (!tooltipUpdated) {
            event.preventDefault();
            if ($scope.concept.dataLoadState !== 'loaded') {
              sparqlEndpoint.getConceptData($scope.concept).then(function () {
                updateTooltipTitle($scope.concept.data.scopeNote.value);
              });
            } else {
              updateTooltipTitle($scope.concept.data.scopeNote.value);
            }
          }
        });

        var updateTooltipTitle = function (newValue) {
          tooltipUpdated = true;
          $element.tooltip('hide')
            .attr('data-original-title', newValue)
            .tooltip('fixTitle')
            .tooltip('show');
        };

        $element.on('click', function () {
          $scope.$apply(function () {
            $scope.concept.isOpen = true;
          });
        });

        $scope.$on('$destroy', function () {
          $element.off('click');
          $element.off('show.bs.tooltip');
          $element.tooltip('destroy');
        });
      }
    };
  });

angular.module('nlm.api', [])

  .constant('INITIAL_TEXT', '')

  /**
   * MTI service.
   * */
  .factory('mtiService', function ($http, mtiParser) {

    var TEXT_PROCESSING_ENDPOINT = 'mti/concepts';

    /**
     * Submits the text content for processing on the backend.
     * @param textContent text content
     * @return String results of the processing
     * */
    var processText = function (textContent) {
      var options = { params: { text: textContent } };

      return $http.get(TEXT_PROCESSING_ENDPOINT, options).then(function (response) {
        return mtiParser.parseResults(response.data);
      });
    };

    return {
      processText: processText
    };
  })
  
  /**
   * MTI results parser.
   * */
  .factory('mtiParser', function () {

    var CONCEPTS_DATA = {
      'PMID': { index: 0, name: 'pmid' },
      'TERM': { index: 1, name: 'term' },
      'CUI': { index: 2, name: 'cui' },
      'SCORE': { index: 3, name: 'score' },
      'DUID': { index: 8, name: 'duid' },
      'treeCode': { index: 9, name: 'treeCode' },
      'positions': {
        index: 10,
        name: 'positions',
        parseField: function (rawPositions) {
          var parsedPositions = [];

          var positionsArray = rawPositions.split(';');
          positionsArray.forEach(function (rawPosition) {
            var positionDataArray = rawPosition.split('^');
            var start = Number(positionDataArray[0]);
            var count = Number(positionDataArray[1]);
            parsedPositions.push({ start: start, count: count });
          });

          return parsedPositions;
        }
      }
    };

    /**
     * Parses the plain text result that is returned after processing and creates a JSON representation out of it.
     * @param results plain text results
     * @returns Array of objects with the configured CONCEPTS_DATA fields
     * */
    var parseResults = function (results) {
      var parsedResults = [];

      var resultEntries = results.split('\n');
      resultEntries.forEach(function (resultEntry) {
        if (resultEntry !== '') {
          var entryData = resultEntry.split('|');
          var entry = {};
          angular.forEach(CONCEPTS_DATA, function (conceptDataProperty) {
            if (entryData.length > conceptDataProperty.index) {
              var data = entryData[conceptDataProperty.index];
              entry[conceptDataProperty.name] = conceptDataProperty.parseField ?
                conceptDataProperty.parseField(data) : data;
            }
          });
          parsedResults.push(entry);
        }
      });

      return parsedResults;
    };
    
    return {
      parseResults: parseResults
    };
  })

  /**
   * NLM SPARQL endpoint service.
   * */
  .factory('sparqlEndpoint', function ($http, $q, urlBuilder) {

    var httpOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      withCredentials: false
    };

    /**
     * Queries for NLM concepts that contain the given queryText in the label or in it's descriptor's label.
     * */
    var queryConcepts = function (queryText) {
      var options = angular.copy(httpOptions);
      options.url = urlBuilder.buildSearchUrl(queryText);

      return $http(options).then(function (response) {
        if (response.data && response.data.results) {
          return response.data.results;
        }
        return $q.reject({ errorReason: 'Invalid response from the endpoint.' });
      });
    };

    /**
     * Loads the concept's data. Handles with duplicate requests with the dataLoadState parameter.
     * */
    var getConceptData = function (concept) {
      if (concept.dataLoadState === 'loaded') return;

      var options = angular.copy(httpOptions);
      options.url = urlBuilder.buildConceptUrl(concept);

      concept.dataLoadState = 'loading';
      return $http(options).then(function (response) {
        if (response.data && response.data.results && 
          response.data.results.bindings && response.data.results.bindings[0]) {
          concept.data = response.data.results.bindings[0];
          concept.dataLoadState = 'loaded';
        } else {
          concept.dataLoadState = 'unavailable';
        }
      })
    };

    return {
      queryConcepts: queryConcepts,
      getConceptData: getConceptData
    };
  })

  /**
   * Service for building the urls for accessing the NLM SPARQL endpoint.
   * */
  .factory('urlBuilder', function () {

    var urlWithoutQuery = 'https://id.nlm.nih.gov/mesh/sparql?format=JSON&limit=50&offset=0&inference=true&query=';
    var searchQueryTemplate = '' +
      'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
      'PREFIX meshv: <http://id.nlm.nih.gov/mesh/vocab#> ' +
      'SELECT ?d ?dName ?c ?cName ?scopeNote ' +
      'FROM <http://id.nlm.nih.gov/mesh> ' +
      'WHERE { ' +
      '  ?d a meshv:Descriptor . ' +
      '  ?d meshv:concept ?c . ' +
      '  ?d rdfs:label ?dName . ' +
      '  ?c rdfs:label ?cName . ' +
      '  ?c meshv:scopeNote ?scopeNote ' +
      "  FILTER(REGEX(?dName, '$$regex$$', 'i') || REGEX(?cName, '$$regex$$', 'i')) " +
      '} ' +
      'ORDER BY ?d ';

    var getConceptQueryTemplate = '' +
      'PREFIX meshv: <http://id.nlm.nih.gov/mesh/vocab#> ' +
      'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> ' +
      'SELECT ?d ?c ?label ?scopeNote ' +
      'FROM <http://id.nlm.nih.gov/mesh> ' +
      'WHERE { ' +
      ' ?d meshv:identifier "$$did$$" . ' +
      ' ?d meshv:concept ?c . ' +
      ' ?c rdfs:label ?label . ' +
      ' ?c meshv:scopeNote ?scopeNote ' +
      '}';
    
    var buildUrl = function (preparedQuery) {
      return urlWithoutQuery + encodeURIComponent(preparedQuery);
    };

    return {
      buildSearchUrl: function (queryText) {
        return buildUrl(searchQueryTemplate.replace('$$regex$$', queryText));
      },
      buildConceptUrl: function (concept) {
        return buildUrl(getConceptQueryTemplate.replace('$$did$$', concept.duid));
      }
    };
  });


angular.module('mock.api', [])

  /** Mock MTI service. */
  .factory('mtiService', function ($q, $timeout, mtiParser, DUMMY_API_RESULT) {

    var returnDummyResults = function () {
      var deferred = $q.defer();
      $timeout(function () {
        deferred.resolve(mtiParser.parseResults(DUMMY_API_RESULT))
      }, 1000);
      return deferred.promise;
    };

    return {
      processText: returnDummyResults
    };
  })

  /** Mock MTI result. */
  .constant('DUMMY_API_RESULT', '' +
    '00000000|Infant, Newborn|C0021289|97750|CT|CT Text Lookup: newborn;CT Text Lookup: newborn infant;CT Text Lookup: newborn infants||MM;RC|D007231|M01.060.703.520\n' +
    '00000000|Infant|C0021270|97750|CT|CT Text Lookup: infant||MM;RC|D007223|M01.060.703\n' +
    '00000000|Humans|C0086418|97750|CT|CT Text Lookup: infant;CT Text Lookup: newborn;CT Text Lookup: newborn infant;CT Text Lookup: newborn infants||MM;RC|D006801|B01.050.150.900.649.801.400.112.400.400\n' +
    '00000000|Adult|C0001675|97750|CT|CT Text Lookup: adult||MM;RC|D000328|M01.060.116\n' +
    '00000000|*Hypoxia-Ischemia, Brain|C0752308|95634|MH|RtM via: Hypoxic-Ischemic Encephalopathy;Forced Dashed Lookup:hypoxic-ischemic encephalopathy|TI|MM;RC|D020925|C10.228.140.300.150.716;C10.228.140.624.500;C14.907.253.092.716|397^31^0\n' +
    '00000000|*Follow-Up Studies|C0016441|12787|MH|Forced Leaf Node Lookup:follow-up|TI|MM;RC|D005500|E05.318.760.500.750.249;N05.715.360.775.175.250.350;N06.850.520.450.500.750.350|430^9^0\n' +
    '00000000|*Cerebral Blood Flow|C0428714|96750|ET|Entry Term Replacement for "Cerebrovascular Circulation";RtM via: Cerebrovascular Circulation|TI|MM;RC|D002560|G09.330.190.163.159|1134^3^0;1089^3^0;993^3^0;722^3^0;307^3^0;168^3^0;0^19^0\n' +
    '00000000|*Intelligence Tests|C0021705|34545|MH|RtM via: Intelligence Tests|TI|MM;RC|D007361|F04.711.141.493|611^20^0\n' +
    '00000000|*Nervous System Physiological Phenomena|C0027767|21300|MH|RtM via: Nervous System Physiological Phenomena|TI|MM;RC|D009424|G11.561|186^19^0\n' +
    '00000000|*Brain|C0006104|19743|MH|RtM via: Brain;RtM via: Entire brain;Forced Non-Leaf Node Lookup:brains|TI|MM;RC|D001921|A08.186.211|88^5^0\n' +
    '00000000|*Autoregulation|C0019868|14940|ET|Entry Term Replacement for "Homeostasis";RtM via: Homeostasis;Forced Non-Leaf Node Lookup:autoregulation|TI|MM;RC|D006706|G07.700.345|1241^14^0\n' +
    '00000000|Intelligence|C0021704|1128|MH|Forced Non-Leaf Node Lookup:intelligence||MM;RC|D007360|F01.752.543|611^12^0\n' +
    '00000000|*Survivors|C0206194|489|MH|RtM via: Survivors;Forced Non-Leaf Node Lookup:survivors|TI|MM|D017741|M01.860|537^9^0\n' +
    '00000000|blood supply|C0005839|3903|SH|Blood Vessels|TI|MM\n' +
    ''
  )

  /** Mock MTI text. */
  .constant('INITIAL_TEXT', '' +
    'Cerebral blood flow (CBF) in newborn infants is often below levels ' +
    'necessary to sustain brain viability in adults. Controversy exists ' +
    'regarding the effects of such low CBF on subsequent neurologic ' +
    'function. We determined the current childhood neurologic status and ' +
    'IQ in 26 subjects who had measurements of CBF performed with PET in ' +
    'the neonatal period between 1983 and 1989 as part of a study of ' +
    'hypoxic-ischemic encephalopathy. Follow-up information at ages 4 to ' +
    '12 years was obtained on all 26 subjects. Ten subjects had died. All ' +
    '16 survivors underwent clinical neurologic evaluation, and 14 also ' +
    'underwent intelligence testing. Eight had abnormal clinical ' +
    'neurologic evaluations; eight were normal. The mean neonatal CBF in ' +
    'those with abnormal childhood neurologic outcome was significantly ' +
    'higher than in those with normal childhood neurologic outcome (35.64 ' +
    '+/- 11.80 versus 18.26 +/- 8.62 mL 100 g(-1) min(-1), t = 3.36, p = ' +
    '0.005). A significant negative correlation between neonatal CBF and ' +
    'childhood IQ was demonstrated (Spearman rank correlation r = -0.675, ' +
    'p = 0.008). Higher CBF was associated with lower IQ. The higher CBF ' +
    'in subjects with worse neurologic and intellectual outcome may ' +
    'reflect greater loss of cerebrovascular autoregulation or other ' +
    'vascular regulatory mechanisms due to more severe brain damage. ' +
    ''
  );