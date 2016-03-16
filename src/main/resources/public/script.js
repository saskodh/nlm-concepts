'use strict';

angular.module('app', [])

  /** Main controller. */
  .controller('MainController', function ($scope, mtiService) {

    $scope.processText = function (textContent) {
      $scope.showSpinner = true;
      $scope.results = '';
      $scope.error = '';
      mtiService.processText(textContent).then(function (results) {
        $scope.results = results;
        $scope.showSpinner = false;
      }, function (error) {
        $scope.error = error;
        $scope.showSpinner = false;
      });
    }
  })

  /**
   * MTI service.
   * */
  .factory('mtiService', function ($http) {

    var TEXT_PROCESSING_ENDPOINT = 'mti/concepts';

    /**
     * Submits the text content for processing on the backend.
     * @param textContent text content
     * @return String results of the processing
     * */
    var processText = function (textContent) {
      var options = { params: { text: textContent } };
      return $http.get(TEXT_PROCESSING_ENDPOINT, options).then(function (response) {
        return response.data;
      });
    };

    return {
      processText: processText
    };
  });