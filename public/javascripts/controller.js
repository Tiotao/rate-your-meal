var rateYourMeal = angular.module('rateYourMeal', []);

moment.tz.setDefault("Asia/Singapore");

rateYourMeal.controller('rateYourMealCtrl', function ($http, $scope) {
	console.log(moment().format('YYYY-MM-DD'))
	$scope.view = {};
	$scope.util = {};
	$scope.util.allowBreakfast = function(){
		return moment().isAfter(moment(0730, 'HHmm')) && moment().day() != 0
	}
	$scope.util.allowDinner = function(){
		return moment().isAfter(moment(1730, 'HHmm')) && moment().day() != 6
	}

	if (!$scope.util.allowBreakfast()){
		$scope.rate = {
			rate: 5,
			mealType: 1,
		};
	} else if (!$scope.util.allowDinner()){
		$scope.rate = {
			rate: 5,
			mealType: 0,
		};
	} else {
		$scope.rate = {
			rate: 5,
			mealType: 0,
		};
	}
	
	$scope.view.todayRate = [];
	$scope.view.todayDate = moment().format('DD/MM/YYYY');
	
	$scope.api = {
		getTodayRate: function(){
			$http({
				method: 'POST',
				url: '/api/v1/rates',
				data: {
					meal_date: moment().format('YYYY-MM-DD')
					// meal_date: '2015-01-01'
				}
			}).then(function successCallback(response) {
				var data = response.data
				for (var i = data.length - 1; i >= 0; i--) {
					if(data[i].meal_type == 0) {
						data[i].meal_type = 'Breakfast'
						data[i].rate = data[i].rate.toFixed(2)
					} else {
						data[i].meal_type = 'Dinner'
						data[i].rate = data[i].rate.toFixed(2)
					}
				};
				$scope.view.todayRate = data;
				console.log($scope.today)
			}, function errorCallback(response) {
				console.log('err')
			});
		},
		rateThisMeal: function(mealType, rate){
			$http({
				method: 'POST',
				url: '/api/v1/vote',
				data: {
					// meal_date: moment().format('YYYY-MM-DD')
					// meal_date: '2015-01-01',
					meal_date: moment().format('YYYY-MM-DD'),
					meal_type: parseInt(mealType),
					rate: parseInt(rate),
				}
			}).then(function successCallback(response) {
				$scope.api.getTodayRate();
			}, function errorCallback(response) {
				console.log('err')
			});
		},
		getSevenDaysRate: function(){
			$http({
				method: 'GET',
				url: '/api/v1/rates/seven/',
			}).then(function successCallback(response) {
				$scope.view.sevenDays = response.data;
				console.log($scope.view.sevenDays)
			}, function errorCallback(response) {
				console.log('err')
			});
		}
	}

	$scope.api.getTodayRate();

});