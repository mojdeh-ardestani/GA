var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var path = require('path');
const axios = require('axios');

const baseURI = "http://www.omdbapi.com/?apikey=2f22dfe6"

// here we're using bodyParser as a middleware which intercepts our requests
// and makes modifications in order to easily read the body of the request
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// here we're saying "make the '/' route return the files located in /public"
// simply just calling http://endpoint:port/ will automatically call index.html
app.use('/', express.static(path.join(__dirname, 'public')));


// reads the data.json file and returns contents
function getFavorites()
{
	return JSON.parse(fs.readFileSync('./data.json'));
}

// overwrites the data.json file with new data
function setFavorites(data)
{
	fs.writeFileSync('./data.json', JSON.stringify(data));
}

/* 
  We expect the request body to have one property: title.
  If we get a title, we will use it as a search query for the
  OMDB search API. 

  When we get the search results, the data.json file will be read
  so that we can mark which movies are already in our favorites list.
*/
app.get('/search', function (req, res)
{
	console.log(req.query.title);

	// send a search request to OMDB
	if (req.query.title)
	{
		axios.get(baseURI,
			{
				params:
				{
					s: req.query.title
				}
			})
			.then(function (response)
			{ /* handle success */

				// our search results from OMDB api
				var data = response.data.Search;

				// first check if we found any movies
				if (!data)
				{
					res.send("No movies could be found!");
				}
				else
				{ // we found some movies!

					var favorites = getFavorites();

					// before we send the data back to the user, lets mark each movie in our results
					// with whether or not the movie is in our favorites.
					// For each movie, check to see if it exists in our favorites array:
					data.forEach(movie =>
					{
						// .some() returns true if there is at least one object in our favorites array
						// that has the same ID as the current movie being considered.
						var movieIsFavorited = favorites.some(function (favorite)
						{
							// are the ID's the same?
							return favorite.imdbID == movie.imdbID;
						})

						if (movieIsFavorited)
						{
							// this movie is a favorite
							movie.isFavorite = true;
						}
						else
						{
							// the movie is not in our favorites
							movie.isFavorite = false;
						}
					});

					// return results to requester
					res.json({ status: "Success!", data: data });
				}
			})
			.catch(function (error)
			{ /* handle error */

				console.log(error);
				res.send("Network Error");
			});
	}
	else
	{
		res.send("Title param could not be processed!");
	}
});

/* 
  We expect the request body to have one property: imdbID.
  If we get imdbID, we will use it to get details for a specific
  movie from the OMDB search API. 
*/
app.get('/details', function (req, res)
{
	// send a search request to OMDB
	if (req.query.imdbID)
	{
		axios.get(baseURI,
			{
				params:
				{
					i: req.query.imdbID
				}
			})
			.then(function (response)
			{
				// handle success
				res.json({ status: "Success!", data: response.data });
			})
			.catch(function (error)
			{
				// handle error
				console.log(error);
				res.send("Network Error");
			});
	}
	else
	{
		res.send("imdbID param could not be processed!");
	}
});

/* 
  Simply read data from file and send it back to requester.
*/
app.get('/favorites', function (req, res)
{
	var data = getFavorites();

	res.setHeader('Content-Type', 'application/json');
	res.json({ status: "Success!", data: data });
});

/* 
  We expect the request body to have three properties: title, imdbID and year.
  If we get all of those properties, we will read the data.json 
  file into a variable, which will be an array of objects. 
  Then we will push the request-body object into that array.
*/
app.post('/favorite/add', function (req, res)
{
	if (req.body.title && req.body.imdbID && req.body.year)
	{
		// get current array of favorited movies
		var data = getFavorites();
		// req.body is our movie object 
		data.push(req.body);

		// write the new array into our data file
		setFavorites(data);

		// send the data
		res.setHeader('Content-Type', 'application/json');
		res.json({ status: "Success!", data: data });
	}
	else
	{
		res.send("All required params could not be processed!");
	}
});

/* 
  We expect the request body to have one property: imdbID
  If we get imdbID, we will remove the favorite from the data.json file;
*/
app.post('/favorite/remove', function (req, res)
{
	if (req.body.imdbID)
	{
		// get current array of favorited movies
		var data = getFavorites();

		// find index of the movie that has the imdbID 
		var index = data.findIndex(function (favorite)
		{
			return favorite.imdbID === req.body.imdbID
		})

		// if we found a movie to delete, then delete it
		if (index >= 0)
		{
			data.splice(index, 1);
		}
		else
		{
			res.send("Movie was not found in favorites!")
		}

		// write the new array into our data file
		setFavorites(data);

		// send the data
		res.setHeader('Content-Type', 'application/json');
		res.json({ status: "Success!", data: data });
	}
	else
	{
		res.send("imdbID param could not be processed!");
	}
});

app.listen(3000, function ()
{
	console.log("Listening on port 3000");
});