angular.module('app', [])
  .controller('Controller', ['$scope', '$http', '$interval', function($scope, $http, $interval) {
    $scope.edit = 0;
    $scope.toggleEdit = function() {
      $scope.edit = !$scope.edit;
      console.log($scope.edit)
    }
  }])
