angular.module('demo', [])
.controller('Hello', function($scope, $http) {
  $scope.heroes = '';
  $scope.loaded = false;
  $scope.penis = '97.png';
    $http.get('/heroes').
        then(function(response) {
            $scope.heroes = response.data;
            $scope.loaded = true;
        });
});
