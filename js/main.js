// Global function called when select element is changed
function onCategoryChanged() {
    var select = d3.select('#categorySelect').node();
    // Get current value of select element
    var category = select.options[select.selectedIndex].value;
    // Update chart with the selected category of letters
    cells[1].updateHistogram(cells[1], movies, category);
}

var scatColors = ['yellow', 'purple', 'cyan', 'black'];
var valueColors = ['red', 'orange', 'green', 'blue'];
var histColorScale = d3.scaleThreshold().range(valueColors).domain([10000, 50000, 150000]);

var svg = d3.select('svg');
// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');
// Padding to easily fiddle with
var padding = {t: 20, r: 20, b: 20, l: 20, cell: 20, i: 40};
var cellPadding = {t: 20, r: 20, b: 20, l: 40};

// Create a group element for appending chart elements
var chartG = svg.append('g')
    .attr('transform', 'translate(' + [padding.l, padding.t] + ')');
	
// Attributes of x-axes of each chart
var xDataAttributes = ['budget', 'imdb_score'];
var N = xDataAttributes.length;
// Compute chart dimensions
var cellWidth = (svgWidth - padding.l - padding.r - cellPadding.l - cellPadding.r - padding.i) / N;
var cellHeight = svgHeight - padding.t - padding.b - cellPadding.t - cellPadding.b;

// Global x and y scales to be used for all SplomCells
var xScale = d3.scaleLinear()
	.range([0, cellWidth]);
var yScale = d3.scaleLinear()
	.range([cellHeight, 0]);
var xAxis = d3.axisBottom(xScale)
	.tickFormat(function(d) { // Adjust axes numbers if large
		if (d > 1000000) { return d / 1000000 + 'M'; }
		else { return d; } 
	});
var yAxis = d3.axisLeft(yScale)
	.tickFormat(function(d) {
		if (d > 1000000) { return d / 1000000 + 'M'; }
		else { return d; } 
	});
	
// Map for referencing min/max per each attribute
var extentByAttribute = {};
// Object for keeping state of which cell is currently being brushed
var brushCell;
var numBins = 70; // 70 unique imdb_scores

var cells = [];
xDataAttributes.forEach(function(attrX) {
	cells.push(new SplomCell(attrX));
});

// Create a brush object that spans the cells' dimensions
var brush = d3.brushX()
    .extent([[0, 0], [cellWidth, cellHeight]])
    .on('start', brushstart)
    .on('brush', brushmove)
    .on('end', brushend);

// Cell constructor - used for each chart
function SplomCell(x) {
	this.x = x;
}

// uses the d3-tip.js so than on a mouse over a single item in wither chart details of it will be displayed to the user.
var tooltip = d3.tip()
	.attr('class', 'd3-tip')
	.offset([-12, 0])
	.html(function(d) {
		var director = "Unkown";
		var year = "Unkown";
		var content_rating = "Unkown";
		var duration = "Unkown";
		var gross = "Unkown";
		var budget = "Unkown";
		var country = "Unkown";
		var movie_facebook_likes = "Unkown";
		if (d['director_name'] != undefined) director = d['director_name'];
		if (d["title_year"] != undefined) year = d['title_year'];
		if (d['content_rating'] != undefined) content_rating = d['content_rating'];
		if (d['duration'] != undefined) duration = d['duration'];
		if (d['gross'] != undefined) gross = d['gross'];
		if (d['budget'] != undefined) budget = d['budget'];
		if (d['country'] != undefined) country = d['country'];
		if (d['movie_facebook_likes'] != undefined) movie_facebook_likes = d['movie_facebook_likes'];
		return "<h5>" +d['movie_title']+"</h5><table><thread><tr><td>Name of Director</td><td>Year</td></tr></thread>"
			+ "<tbody><tr><td>" + director + "</td><td>" + year + "</td></tr></tbody>"
			+ "<thread><tr><td>Duration (min)</td><td>Content Rating</td></tr></thread>"
			+ "<tbody><tr><td>" + duration + "</td><td>" + content_rating + "</td></tr></tbody>"
			+ "<thread><tr><td>Gross (USD)</td><td>Budget (USD)</td></tr></thread>"
			+ "<tbody><tr><td>"+ gross + "</td><td>"+ budget + "</td></tr></tbody>"
			+ "<thread><tr><td>Country</td><td>Movie Facebook Likes</td></tr></thread>"
			+ "<tbody><tr><td>"+ country + "</td><td>"+ movie_facebook_likes + "</td></tr></tbody>"
			+ "<thread><tr><td>Lead Actor</td><td>Number of Likes</td></tr></thread>"
			+ "<tbody><tr><td>" + d['actor_1_name'] + "</td><td>" + d['actor_1_facebook_likes'] + "</td></tr></tbody>"
			+ "<thread><tr><td>Second Lead Actor (USD)</td><td>Number of Likes</td></tr></thread>"
			+ "<tbody><tr><td>" + d['actor_2_name'] + "</td><td>" + d['actor_2_facebook_likes'] + "</td></tr></tbody>"
			+ "<thread><tr><td>Supporting Actor</td><td>Number of Likes</td></tr></thread>"
			+ "<tbody><tr><td>" + d['actor_3_name'] + "</td><td>" + d['actor_3_facebook_likes'] + "</td></tr></tbody>"
	});

svg.call(tooltip);

// Initializes a cell with a group
SplomCell.prototype.init = function(g) {
	var cell = d3.select(g);
}

// Updates the scatterplot with correct dots
SplomCell.prototype.updateScatter = function(g, data) {
	var cell = d3.select(g);
	// Update the global scale objects for this cell
	xScale.domain(extentByAttribute[this.x]).nice();
	yScale.domain(extentByAttribute['gross']).nice();
	// Save a reference of this SplomCell, to use within anon function scopes
	var _this = this;

	var dots = cell.selectAll('.dot')
        .data(data);

	var dotsEnter = dots.enter()
        .append('circle')
        .attr('class', 'dot')
		.attr('cx', function(d){
            return xScale(d[_this.x]);
        })
		.attr('cy', function(d){
            return yScale(d['gross']);
        })
		.style('fill', function(d) { 
			var largest = 0
			var likes = undefined;
			if (d['director_facebook_likes'] > largest) { largest = d['director_facebook_likes']; likes = scatColors[0]}
			if (d['actor_3_facebook_likes'] > largest) { largest = d['actor_3_facebook_likes']; likes = scatColors[3]}
			if (d['actor_2_facebook_likes'] > largest) { largest = d['actor_2_facebook_likes']; likes = scatColors[2]}
			if (d['actor_1_facebook_likes'] > largest) { largest = d['actor_1_facebook_likes']; likes = scatColors[1]}
			return likes;
		})
        .attr('r', 3);
		
	dotsEnter
		.on('mouseover', function(e) {
			svg.selectAll('.dot').classed('hidden', function(d) { return e['movie_title'] != d['movie_title']; })
		})
		.on('mouseout', function(e) { 
			svg.selectAll('.dot').classed('hidden', false);
		})
		.on('mouseenter', tooltip.show)
		.on('mouseleave', tooltip.hide);
}

// Updates the histogram with dots by genre
SplomCell.prototype.updateHistogram = function(g, data, filterKey) {
	var cell = d3.select(g);
	// Update the global barScale object for this cell's x attribute domain
	xScale.domain(extentByAttribute[this.x]).nice();
	// Save a reference of this BarCell, to use within anon function scopes
	var _this = this;
	
	var newData;
	if (filterKey == 'All Genres') newData = data;
	else {
		newData = data.filter(function(d) {
			return d['genres'].indexOf(filterKey) >= 0;
		});
	}
	
	newData.sort(function(a, b) { // Sort so most likes are at bottom of histogram
		return d3.descending(a['movie_facebook_likes'], b['movie_facebook_likes']);
	});
	
	var histogram = d3.histogram()
		.domain(xScale.domain())
		.thresholds(xScale.ticks(numBins))
		.value(function(d) { return d[_this.x]; });
	
	var bins = histogram(newData);

	var binContainer = svg.selectAll('bin')
		.data(bins)
		.enter()
		.append('g')
		.attr('class', 'bin')
		.attr('transform', function(d) {
			return 'translate(' + [padding.l + cellPadding.l + cellPadding.r + cellWidth + padding.i + xScale(d.x0),
				cellHeight + padding.t + cellPadding.t] + ')';
		});
	
	svg.selectAll('.dot').remove();
	var cellEnter = chartG.selectAll('cell')
		.data(cells)
		.enter()
		.append('g')
		.attr('class', 'cell')
		.attr('transform', function(d, n) {
			var tx = n * (cellWidth + padding.i + cellPadding.r) + cellPadding.l;
			return 'translate(' + [tx, cellPadding.t] + ')';
		});
	cellEnter.each(function(cell, i) {
		cell.init(this);
		if (i == 0) { // First cell Scatterplot
			cell.updateScatter(this, newData);
		}
	});
		
	var dots = binContainer.selectAll('.circle')
		.data(function(d) { return d; });
	
	var dotsEnter = dots.enter()
		.append('circle')
		.attr('class', 'dot')
		.style('fill', function(d) { return histColorScale(d['movie_facebook_likes']); })
		.attr('r', 4);
		
	dotsEnter
		.on('mouseover', function(e) {
			svg.selectAll('.dot').classed('hidden', function(d) { return e['movie_title'] != d['movie_title']; })
		})
		.on('mouseout', function(e) { 
			svg.selectAll('.dot').classed('hidden', false);
		})
		.on('mouseenter', tooltip.show)
		.on('mouseleave', tooltip.hide);

		
	dots.merge(dotsEnter)
		.attr('cx', 0)
		.attr('cy', function(d, i) {
			return - i * 8 - 4; // radius is 4
		})
		.select('circle')
		.attr('r', 4);
		
	dots.exit().remove();
}

// Global dataset
var movies;
d3.csv('./data/movies.csv',
function(row){
    return {
		movie_title: row.movie_title,
		budget: +row.budget,
		gross: +row.gross,
		duration: +row.duration,
		title_year: +row.title_year,
		genres: row.genres.split('|'),
		plot_keywords: row.plot_keywords.split('|'),
		language: row.language,
		country: row.country,
		color: row.color,
		aspect_ratio: +row.aspect_ratio,
		facenumber_in_poster: +row.facenumber_in_poster,
		content_rating: row.content_rating,
		movie_imdb_link: row.movie_imdb_link,
		num_voted_users: +row.num_voted_users,
		num_user_for_reviews: +row.num_user_for_reviews,
		num_critic_for_reviews: +row.num_critic_for_reviews,
		imdb_score: +row.imdb_score,
		director_name: row.director_name,
		actor_1_name: row.actor_1_name,
		actor_2_name: row.actor_2_name,
		actor_3_name: row.actor_3_name,
		director_facebook_likes: +row.director_facebook_likes,
		actor_1_facebook_likes: +row.actor_1_facebook_likes,
		actor_2_facebook_likes: +row.actor_2_facebook_likes,
		actor_3_facebook_likes: +row.actor_3_facebook_likes,
		cast_total_facebook_likes: +row.cast_total_facebook_likes,
		movie_facebook_likes: +row.movie_facebook_likes
    }
},
function(error, dataset){
    if(error) {
        console.error('Error while loading ./data/movies.csv dataset.');
        console.error(error);
        return;
    }

    // **** Your JavaScript code goes here ****
	var filteredData = dataset.filter(function(d) { // Remove no budget/gross data
		return !d.budget == 0 && !d.gross == 0;
		});
	var newDataset = [];
	filteredData.forEach(row => { // Remove duplicates
		var bool = true;
		newDataset.forEach(function(d) {
			if (d['movie_title'] == row['movie_title']) {
				bool = false;
			}
		});
		if (bool) newDataset.push(row);
	});
	movies = newDataset; // For global calls
	
	// Create map for each attribute's extent
    xDataAttributes.forEach(function(attribute) {
        extentByAttribute[attribute] = d3.extent(dataset, function(d){
            return d[attribute];
        });
    });
	extentByAttribute['gross'] = d3.extent(dataset, function(d) { return d['gross']; });
	
	// Pre-render gridlines and axes
	chartG.selectAll('.y.axis')
        .data(xDataAttributes)
        .enter()
        .append('g')
        .attr('class', 'y axis')
		.attr('transform', function(d, i) {
            return 'translate(' + [i * (cellWidth + padding.i + cellPadding.r) + cellPadding.l, cellPadding.t] + ')';
        })
        .each(function(d, i) {
			if (i == 0) {
				yScale.domain(extentByAttribute['gross']).nice();
			} else {
				yScale.domain([0, 80]);
				yAxis.tickSize(-cellWidth, 0, 0);
			}
			
            d3.select(this).call(yAxis);
        });

    chartG.selectAll('.x.axis')
        .data(xDataAttributes)
        .enter()
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', function(d, i) {
            return 'translate(' + [i * (cellWidth + padding.i + cellPadding.r) + cellPadding.l, 
				cellHeight + cellPadding.t] + ')';
        })
        .each(function(attribute) {
            xScale.domain(extentByAttribute[attribute]).nice();
            d3.select(this).call(xAxis);
        });
	
	var cellEnter = chartG.selectAll('cell')
		.data(cells)
		.enter()
		.append('g')
		.attr('class', 'cell')
		.attr('transform', function(d, n) {
			var tx = n * (cellWidth + padding.i + cellPadding.r) + cellPadding.l;
			return 'translate(' + [tx, cellPadding.t] + ')';
		});
		
	cellEnter.append('g')
		.attr('class', 'brush')
		.call(brush);
		
	cellEnter.each(function(cell, i) {
		cell.init(this);
		if (i == 1) { // Second cell Histogram
			cell.updateHistogram(this, newDataset, 'All Genres')
		}
	});
	
	// All the text
	chartG.append('text')
		.attr('transform', 'translate(' + [cellWidth / 2, cellPadding.t + cellHeight + 30] + ')')
		.attr('class', 'label')
		.text('Budget (USD)');
	chartG.append('text')
		.attr('transform', 'translate(' + [0, 30 + cellHeight / 2] + ') rotate(270)')
		.attr('class', 'label')
		.text('Gross (USD)');
	chartG.append('text')
		.attr('transform', 'translate(' + [cellWidth * 3/2 + padding.i + cellPadding.l, cellPadding.t + cellHeight + 30] + ')')
		.attr('class', 'label')
		.text('IMDB Score');
	chartG.append('text')
		.attr('transform', 'translate(' + [cellWidth - 120, 5] + ')')
		.attr('class', 'label')
		.style('font-size', '22px')
		.text('IMDB Movie Popularity, Costs, Revenue, Overall score');
	// Chart Legends
	scatColors.forEach(function(d, i) {
		chartG.append('circle')
			.attr('cx', 80)
			.attr('cy', 40 + i * 22)
			.style('fill', scatColors[i])
			.attr('r', 10);
		chartG.append('text')
			.text(function(e) { // Text by legend color
				if (i == 0) { return 'Director'; }
				else if (i == 1) { return 'Lead Actor'; }
				else if (i == 2) { return 'Second Lead'; }
				else if (i == 3) { return 'Support Actor'; }
			})
			.attr('transform', 'translate(' + [92, 46 + i * 22] + ')')
			.style('font-size', 16);
	});
	valueColors.forEach(function(d, i) {
		chartG.append('rect')
			.attr('x', cellWidth + cellPadding.l + padding.i + 40)
			.attr('y', 26 + i * 18)
			.attr('height', 16)
			.attr('width', 16)
			.style('fill', d);
		chartG.append('text')
			.text(function(e) {
				if (i == 0) { return '< 10k'; }
				else if (i == 1) { return '10k-50k'; }
				else if (i == 2) { return '50k-150k'; }
				else if (i == 3) { return '> 150k'; }
			})
			.attr('transform', 'translate(' + [cellWidth + cellPadding.l + padding.i + 58, 40 + i * 18] + ')')
			.style('font-size', 16);
	});
	chartG.append('text')
		.attr('transform', 'translate(' + [cellWidth + cellPadding.l + padding.i + 25, 120] + ')')
		.text('Facebook Likes')
		.style('font-size', 16);

	chartG.append('text')
		.attr('transform', 'translate(' + [cellPadding.l + padding.i, 140] + ')')
		.text('Highest Number of Facebook Likes')
		.style('font-size', 16);
});

function brushstart(cell) {
	// Cell is the SplomCell object
	// Check if this g element is different than the previous brush
	if (brushCell !== this) {
		// Clear the old brush
		brush.move(d3.select(brushCell), null);
		
		// Update the global scales for the subsequent brushmove events
		xScale.domain(extentByAttribute[cell.x]).nice();
		
		// Save the state of this g element as having an active brush
		brushCell = this;
	}
}

function brushmove(cell) {
	// Cell is the SplomCell object
	// Get the extent or bounding box of the brush event, this is a 2x2 array
	var e = d3.event.selection;
	if (e) {
		// Select all .dot circles, add the 'hidden' class if the data lies
		// outside of the brush-filter applied for this SplomCell's x, y attributes
		svg.selectAll('.dot')
			.classed('hidden', function(d) {
				return e[0] > xScale(d[cell.x]) || xScale(d[cell.x]) > e[1];
			});
	}
}

function brushend() {
	// If there is no longer an extent or bounding box then the brush has been removed
	if (!d3.event.selection) {
		// Bring back all the hidden .dot elements
		svg.selectAll('.hidden').classed('hidden', false);
		// Return the state of the active brushCell to be undefined
		brushCell = undefined;
	}
}