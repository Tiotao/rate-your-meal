var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x0 = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var x1 = d3.scale.ordinal();

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.ordinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

var xAxis = d3.svg.axis()
    .scale(x0)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(d3.format(".2s"));

var svg = d3.select(".graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// d3.json('/api/v1/rates/seven/', function(json){
//   var mealName = ['breakfast, dinner'];

// })

function parseData(array){
  result = []
  dates = [];
  for (var i = array.length - 1; i >= 0; i--) {
    var mealDate = moment(array[i].meal_date).format('DD MMM');
    var mealType;
    
    var dataIndex = _.findIndex(result, function(meal){
      console.log(moment(meal.Day).format('DD MMM') + "   " + mealDate)
      return moment(meal.Day).format('DD MMM') == mealDate
    })

    console.log(dataIndex)

    if(dataIndex == -1) {
      var data = {
        Day: mealDate
      }

      data['Breakfast'] = 0
      data['Dinner'] = 0
      if (array[i].meal_type == 0) {
        data['Breakfast'] = array[i].rate
      } else {
        data['Dinner'] = array[i].rate
      }
      result.push(data)
    } else {
      var data = result[dataIndex];
      if (array[i].meal_type == 0) {
        data['Breakfast'] = array[i].rate
      } else {
        data['Dinner'] = array[i].rate
      }
      result[dataIndex] = data;
    }
  };
  result = _.sortBy(result, function(r){
    return moment(r.Day).unix()
  })
  return result;
}

d3.json("/api/v1/rates/seven/", function(json) {
  // if (error) throw error;

  var data = parseData(json);

  console.log(json)

  var mealNames = d3.keys(data[0]).filter(function(key) { return key !== "Day"; });

  console.log(data[0])

  data.forEach(function(d) {
    d.ages = mealNames.map(function(name) { return {name: name, value: +d[name]}; });
  });

  console.log(data)

  x0.domain(data.map(function(d) { return d.Day; }));
  x1.domain(mealNames).rangeRoundBands([0, x0.rangeBand()]);
  y.domain([0, 5]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Rating");

  var day = svg.selectAll(".day")
      .data(data)
    .enter().append("g")
      .attr("class", "g")
      .attr("transform", function(d) { return "translate(" + x0(d.Day) + ",0)"; });

  day.selectAll("rect")
      .data(function(d) { return d.ages; })
    .enter().append("rect")
      .attr("width", x1.rangeBand())
      .attr("x", function(d) { return x1(d.name); })
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .style("fill", function(d) { return color(d.name); });

  var legend = svg.selectAll(".legend")
      .data(mealNames.slice().reverse())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d; });

});