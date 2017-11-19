var svg = d3.select('svg');

var svgWidth = +svg.attr('width');
var svgHegith = +svg.attr('hegiht');

var padding = {t: 40, r: 40, b: 40, l: 40};

// Global dataset
var movies;
d3.csv('./data/movies.csv',
function(row){
    // This callback formats each row of the data
    return {
		movie_title: row.movie_title,
		budget: +row.budget,
		gross: +row.gross,
		duration: +row.duration,
		title_year: +row.title_year,
		genres: row.genres,
		plot_keywords: row.plot_keywords,
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
	var data = dataset.filter(function(d) {
		return d['title_year'] != 0 // Remove year-less data cases
		&& d['budget'] != 0 // Remove budget-less data cases
		&& d['gross'] != 0; // Remove no-gross data cases
	});
	
	movies = data;
	
	var colorNest = d3.nest()
		.key(function(d) {
			return d['color'];
		})
		.entries(data);
		
	console.log(colorNest);
});
