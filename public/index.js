$(document).ready(function ()
{
  
    const endpointURI = "http://165.22.237.15:3000";

    // when this button is clicked, query our server to query for a list of movies
    // with the value of our search-query input
    $("#searchBtn").click(function ()
    {
        // this is the value inside the search box
        var query = $("#search-query").val();

        // if search query is truthy (not undefined), execute query to get the search results
        if (query)
        {
            $.get(endpointURI + "/search?title=" + query, function (response)
            {
                // clear results list and show the search view
                $("#results").empty();
                showView("#search");

                if (response.status == "Success!")
                {
                    response.data.forEach(movie =>
                    {
                        // init our favorite/unfavorite button
                        var button;

                        // Which favorite/unfavorite button we use depends on if the movie
                        // is already in our favorites. Notice we also inject the movie id, 
                        // thats so we can identify which button belongs to which movie later
                        if (movie.isFavorite)
                        {
                            button = `<button class="unfavorite" data-id="${movie.imdbID}">Unfavorite</button>`;
                        }
                        else
                        {
                            button = `<button class="favorite" data-id="${movie.imdbID}" data-title="${movie.Title}" data-year="${movie.Year}">Favorite</button>`;
                        }

                        // append the movie item to the list
                        $("#results").append(`
                        <li data-id="${movie.imdbID}" >
                            <div class="line link"><b>Title:</b> ${movie.Title}</div>
                            <div class="line"><b>Year:</b> ${movie.Year}</div>
                            ${button}
                        </li >`)
                    });
                }
                else
                {
                    // we found no movies
                    $("#results").append(response);
                }
            });
        }
    });

    // when the favorites button is clicked, switch to the favorites view and call
    // the server to get a list of favorite movies
    $("#favoritesBtn").click(function ()
    {
        // show the favorites view
        showView("#favorites");

        $.get(endpointURI + "/favorites", function (response)
        {
            // clear results list
            $("#favorites-list").empty();

            if (response.status == "Success!")
            {
                response.data.forEach(movie =>
                {
                    $("#favorites-list").append(`
                        <li data-id="${movie.imdbID}">
                            <div class="line"><b>Title:</b> ${movie.title}</div>
                            <div class="line"><b>Year:</b> ${movie.year}</div>
                            <button class="unfavorite" data-id="${movie.imdbID}">Unfavorite</button>
                        </li >`)
                  
                });
            }
            else
            {
                // we found no movies
                $("#results").append(response);
            }
        });
    });

    // When a user clicks on a movie item, then show details of that movie.
    // ul would eat all the onclick events if we use normal .click(), this is how u work around that.
    $("ul").on("click", "li", function ()
    {
        // grab movie id from data-id attribute
        var movieID = $(this).data("id");

        $.get(endpointURI + "/details?imdbID=" + movieID, function (response)
        {
            // clear out the details view and show it
            $("#details").empty();
            showView("#details");

            if (response.status == "Success!")
            {
                // append the movie details to the details view
                $("#details").append(`
                    <h2 style="text-align: center">${response.data.Title}</h3>
                    <img src="${response.data.Poster}" />
                    <div class="line"><b>Year:</b> ${response.data.Year}</div>
                    <div class="line"><b>Rated:</b> ${response.data.Rated}</div>
                    <div class="line"><b>Released:</b> ${response.data.Released}</div>
                    <div class="line"><b>Genre:</b> ${response.data.Genre}</div>
                    <div class="line"><b>Rating:</b> ${response.data.imdbRating}/10</div>
                    <div class="line"><b>Summary:</b> ${response.data.Plot}</div>
                `)
            }
            else
            {
                // we found no movies
                $("#details").append(response);
            }
        });

    });

    // if user clicks on the "favorite" button, then add movie to favorite
    // ul would eat all the onclick events if we use normal .click(), this is how u work around that.
    $("ul").on("click", ".favorite", function (event)
    {
        // grab button instance
        var button = $(this);

        // grab data stored in button from data attributes
        var imdbID = button.data("id");
        var title = button.data("title");
        var year = button.data("year");

        // tell server to add favorite
        $.post(endpointURI + "/favorite/add", { imdbID: imdbID, title: title, year: year }, function (response)
        {
            if (response.status == "Success!")
            {
                // switch button color and text to that of the unfavorite button
                button.attr("class", "unfavorite");
                button.text("Unfavorite");
            }
        });

        event.stopPropagation();

    });

    // if user clicks on the "unfavorite" button, then remove movie from favorite
    // ul would eat all the onclick events if we use normal .click(), this is how u work around that.
    $("ul").on("click", ".unfavorite", function (event)
    {
        // grab instance of button
        var button = $(this);

        // grab data stored in button from data attributes
        var imdbID = $(this).data("id");

        // get the ID of the list that this movie item belonds to
        var listID = $(this).parent().parent().attr('id');

        // tell server to remove favorite
        $.post(endpointURI + "/favorite/remove", { imdbID: imdbID }, function (response)
        {
            if (response.status == "Success!")
            {
                // switch button color and text to that of the unfavorite button
                button.attr("class", "favorite");
                button.text("Favorite");

                // if this is the favorites list, then remove movie from the list
                if (listID == "favorites-list")
                {
                    // make list item animate out of existence 
                    button.parent().animate({
                        opacity: 0.25,
                        left: "+=50",
                        height: "toggle"
                    }, 500, function () {/* animation complete */ });
                }
            }
        });

        event.stopPropagation();
    });

    // hides all views then reveals the desired view
    function showView(viewName)
    {
        $("#search").hide();
        $("#details").hide();
        $("#favorites").hide();

        $(viewName).show();
    }
});