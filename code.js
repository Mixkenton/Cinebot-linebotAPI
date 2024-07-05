var ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/10r4IWl1MzY2o6BNxvt_uKYFKZkWi19xFzuFx37CvGhg/edit");
var sheet1 = ss.getSheetByName("movie");
var sheet2 = ss.getSheetByName("series");
var TMDB_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyYzgyNjMxMmIxZTI3MWY1YmIyMjI3NzAwMThjZmZjOCIsInN1YiI6IjY2NTAzYjM4MDJiNzljMjk4MzM1MDk0MiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.4mdbW05ArBRNls5xRSF3WVRivnrRp1UOLXJSe1RiJqc"; // Replace with your TMDB access token


function doPost(e) {
  try {
    Logger.log("Received POST request: " + JSON.stringify(e));

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Invalid request payload");
    }

    var data = JSON.parse(e.postData.contents);
    var intent = data.queryResult.intent.displayName;

    if (intent == "SearchDatamovie - bot") {
      var movieName = data.queryResult.parameters.movie;
      Logger.log("Received movie name: " + movieName);

      // Check if the movie is already in the sheet
      var lastRow = sheet1.getLastRow();
      Logger.log("Last row in the sheet: " + lastRow);

      if (lastRow > 1) {
        var values = sheet1.getRange(2, 1, lastRow - 1, 1).getValues();
        Logger.log("Sheet values: " + JSON.stringify(values));

        for (var i = 0; i < values.length; i++) {
          if (values[i][0] == movieName) {
            Logger.log("Movie found in sheet: " + movieName);
            var overView = sheet1.getRange(i + 2, 3).getValue();
            var moviename = sheet1.getRange(i + 2, 1).getValue();
            var voteaverage = sheet1.getRange(i + 2, 5).getValue();
            var genres = sheet1.getRange(i + 2, 6).getValue();
            var posterUrl = sheet1.getRange(i + 2, 7).getValue();
            return sendReply(overView, moviename, voteaverage, genres, posterUrl);
          }
        }
      } else {
        Logger.log("Sheet is empty or has only header.");
      }

      // If movie is not in the sheet, fetch details from TMDB API
      var movieDetails = fetchMovieDetailsFromTMDB(movieName);
      if (movieDetails) {
        var movieInfo = movieDetails.movieDetails;
        var releaseDate = movieDetails.releaseDate;
        var overview = movieInfo.overview;
        var thaiOverview = movieDetails.thaiOverview || "No Thai overview available.";
        var voteAverage = movieDetails.voteAverage;
        var posterUrl = movieDetails.posterUrl;
        var genres = movieDetails.genres;

        Logger.log("Movie details fetched from TMDB: " + JSON.stringify(movieInfo));

        // Store the movie details in the sheet
        sheet1.appendRow([movieName, overview, thaiOverview, releaseDate, voteAverage, genres, posterUrl]);

        // Send the movie details as a response
        return sendReply(thaiOverview, movieName, voteAverage, genres, posterUrl);
      } else {
        Logger.log("Movie not found in TMDB: " + movieName);
        // return sendReply("Movie not found.");
      }
    }else if (intent == "SearchDataseries - bot") {
      var seriesName = data.queryResult.parameters.series;
      Logger.log("Received series name: " + seriesName);

      // Check if the series is already in the sheet
      var lastRow = sheet2.getLastRow();
      Logger.log("Last row in the sheet: " + lastRow);

      if (lastRow > 1) {
        var values = sheet2.getRange(2, 1, lastRow - 1, 1).getValues();
        Logger.log("Sheet values: " + JSON.stringify(values));

        for (var i = 0; i < values.length; i++) {
          if (values[i][0] == seriesName) {
            Logger.log("Series found in sheet: " + seriesName);
            var overview = sheet2.getRange(i + 2, 2).getValue();
            var seriesName = sheet2.getRange(i + 2, 1).getValue();
            var voteaverage = sheet2.getRange(i + 2, 5).getValue();
            var genres = sheet2.getRange(i + 2, 6).getValue();
            var posterUrl = sheet2.getRange(i + 2, 7).getValue();
            return sendReplySeries(overview, seriesName, posterUrl,genres);
          }
        }
      } else {
        Logger.log("Sheet is empty or has only header.");
      }

      // If series is not in the sheet, fetch details from TMDB API
      var seriesDetails = fetchTVShowDetailsFromTMDB(seriesName);
      if (seriesDetails) {
        var seriesInfo = seriesDetails.seriesDetails;
        var firstAirDate = seriesDetails.firstAirDate;
        var overview = seriesInfo.overview;
        var thaiOverview = seriesDetails.thaiOverview || "No Thai overview available.";
        var voteAverage = seriesDetails.voteAverage;
        var posterUrl = seriesDetails.posterUrl;
        var genres = seriesDetails.genres;

        Logger.log("Series details fetched from TMDB: " + JSON.stringify(seriesInfo));

        // Store the series details in the sheet
        sheet2.appendRow([seriesName, overview, thaiOverview, firstAirDate, voteAverage, genres, posterUrl]);

        // Send the series details as a response
        return sendReplySeries(overview, seriesName, posterUrl,genres)
      } else {
        Logger.log("Series not found in TMDB: " + seriesName);
        // return sendReply("Series not found.");
      }
    } else if (intent == "movieupdate") {
      var movieUpcoming = fetchUpcomingMoviesFromTMDB();
      var numMoviesToShow = 5; // Number of upcoming movies to show

      if (movieUpcoming && movieUpcoming.length > 0) {
        var numMovies = Math.min(numMoviesToShow, movieUpcoming.length); // Limit the number of movies to show

        var movieNames = [];
        var releaseDates = [];
        var thaiOverviews = [];
        var voteAverages = [];
        var posterUrls = [];


        for (var i = 0; i < numMovies; i++) {
          var movieInfo = movieUpcoming[i];
          movieNames.push(movieInfo.title);
          releaseDates.push(movieInfo.release_date);
          thaiOverviews.push(movieInfo.overview);
          voteAverages.push(movieInfo.vote_average);
          posterUrls.push(movieInfo.poster_path ? 'https://image.tmdb.org/t/p/original' + movieInfo.poster_path : 'No poster available');
          Logger.log("Movie details fetched from TMDB: " + JSON.stringify(movieInfo));

          // Send the movie details as a response
        }
        var response = [];
        for (var i = 0; i < numMovies; i++) {
          var movieInfo = movieUpcoming[i];
          response.push({
            "title": movieInfo.title,
            "release_date": movieInfo.release_date,
            "overview": movieInfo.overview,
            "vote_average": movieInfo.vote_average,
            "poster_path": movieInfo.poster_path ? 'https://image.tmdb.org/t/p/original' + movieInfo.poster_path : 'No poster available'
          });
        }

        // Return the response as JSON

        return sendReplyUpcoming(response);


      }
    }

    else if (intent == "TrendingAll") {
      var allTrending = fetchTrendingAllFromTMDB();
      var numMoviesToShow = 5; // Number of upcoming movies to show

      if (allTrending && allTrending.length > 0) {
        var numMovies = Math.min(numMoviesToShow, allTrending.length); // Limit the number of movies to show

        var response = [];
        for (var i = 0; i < numMovies; i++) {
          var movieInfo = allTrending[i];
          response.push({
            "title": movieInfo.title,
            "release_date": movieInfo.release_date,
            "overview": movieInfo.overview,
            "vote_average": movieInfo.vote_average,
            "poster_path": movieInfo.poster_path ? 'https://image.tmdb.org/t/p/original' + movieInfo.poster_path : 'No poster available',
            "genres": movieInfo.genres.join(', ')
          });
        }
        return sendReplyAllTrending(response);

      }
    }
    else if (intent == "seriesupdate") {
      var TVUpcoming = fetchUpcomingTVFromTMDB();
      var numMoviesToShow = 5; // Number of upcoming movies to show

      if (TVUpcoming && TVUpcoming.length > 0) {
        var numMovies = Math.min(numMoviesToShow, TVUpcoming.length); // Limit the number of movies to show

        var response = [];
        for (var i = 0; i < numMovies; i++) {
          var movieInfo = TVUpcoming[i];
          response.push({
            "title": movieInfo.name,
            "release_date": movieInfo.first_air_date,
            "overview": movieInfo.overview,
            "vote_average": movieInfo.vote_average,
            "poster_path": movieInfo.poster_path ? 'https://image.tmdb.org/t/p/original' + movieInfo.poster_path : 'No poster available'
          });
        }

        // Return the response as JSON

        return sendReplyUpcoming(response);

      }

    }else if (intent == "movieTopRate") {
  var topRatedMovies = fetchTopRatedMoviesFromTMDB(); // เรียกใช้ฟังก์ชันเพื่อดึงหนัง top rated
  var numMoviesToShow = 5; // จำนวนหนัง top rated ที่ต้องการแสดง

  if (topRatedMovies && topRatedMovies.length > 0) {
    var numMovies = Math.min(numMoviesToShow, topRatedMovies.length); // จำกัดจำนวนหนังที่จะแสดง

    var response = [];
    for (var i = 0; i < numMovies; i++) {
      var movieInfo = topRatedMovies[i];
      response.push({
        "title": movieInfo.title,
        "release_date": movieInfo.release_date,
        "overview": movieInfo.overview,
        "vote_average": movieInfo.vote_average,
        "poster_path": movieInfo.poster_path ? 'https://image.tmdb.org/t/p/original' + movieInfo.poster_path : 'No poster available'
      });
      Logger.log("Movie details fetched from TMDB: " + JSON.stringify(movieInfo));
    }

    // ส่งข้อมูลหนัง top rated กลับเป็น JSON
    return sendReplyUpcoming(response);
  }
}else if (intent == "seriesTopRate") { // เปลี่ยนชื่อ intent เพื่อให้สอดคล้องกับการดึงซีรี่ส์ top rated
  var topRatedSeries = fetchTopRatedSeriesFromTMDB(); // เรียกใช้งานฟังก์ชันเพื่อดึงซีรี่ส์ top rated

  if (topRatedSeries && topRatedSeries.length > 0) {
    var numSeriesToShow = 5; // จำนวนซีรี่ส์ top rated ที่ต้องการแสดง
    var numSeries = Math.min(numSeriesToShow, topRatedSeries.length); // จำกัดจำนวนซีรี่ส์ที่จะแสดง

    var response = [];
    for (var i = 0; i < numSeries; i++) {
      var seriesInfo = topRatedSeries[i];
      response.push({
        "name": seriesInfo.name, // เปลี่ยนจาก title เป็น name สำหรับซีรี่ส์
        "first_air_date": seriesInfo.first_air_date, // เปลี่ยนจาก release_date เป็น first_air_date สำหรับซีรี่ส์
        "overview": seriesInfo.overview,
        "vote_average": seriesInfo.vote_average,
        "poster_path": seriesInfo.poster_path ? 'https://image.tmdb.org/t/p/original' + seriesInfo.poster_path : 'No poster available'
      });
      Logger.log("Series details fetched from TMDB: " + JSON.stringify(seriesInfo));
    }

    // ส่งข้อมูลซีรี่ส์ top rated กลับเป็น JSON
    return sendReplyToprate(response);
  }
}




      else {
        Logger.log("Movie not found in TMDB: " + movieName);
        // return sendReply("Movie not found.");
      }



    } catch (error) {
      Logger.log("Error in doPost: " + error);
      // return sendReply("An error occurred: " + error.message);
    }
  }

function fetchMovieDetailsFromTMDB(movieName) {
    try {
      var url = 'https://api.themoviedb.org/3/search/movie?query=' + encodeURIComponent(movieName);
      var options = {
        'method': 'get',
        'headers': {
          'Authorization': 'Bearer ' + TMDB_ACCESS_TOKEN
        }
      };
      var response = UrlFetchApp.fetch(url, options);
      Logger.log("TMDB response code: " + response.getResponseCode());
      var json = JSON.parse(response.getContentText());

      Logger.log("TMDB response: " + JSON.stringify(json));


      if (json.results && json.results.length > 0) {
        var movieDetails = json.results[0];
        var releaseDate = movieDetails.release_date;
        var voteAverage = movieDetails.vote_average;
        var posterUrl = "https://image.tmdb.org/t/p/w500" + movieDetails.poster_path;
        var genres = movieDetails.genre_ids.map(function (genreId) {
          return getGenreName(genreId);
        }).join(", ");
        var movieId = movieDetails.id;
        var thaiOverview = fetchThaiOverviewFromTMDB(movieId);

        return {
          "movieDetails": movieDetails,
          "releaseDate": releaseDate,
          "voteAverage": voteAverage,
          "posterUrl": posterUrl,
          "genres": genres,
          "thaiOverview": thaiOverview
        }
      } else {
        return null;
      }
    } catch (error) {
      Logger.log("Error fetching movie details: " + error);
      return null;
    }
  }

  function fetchTVShowDetailsFromTMDB(seriesName) {
  try {
    var url = 'https://api.themoviedb.org/3/search/tv?query=' + encodeURIComponent(seriesName);
    var options = {
      'method': 'get',
      'headers': {
        'Authorization': 'Bearer ' + TMDB_ACCESS_TOKEN
      }
    };
    var response = UrlFetchApp.fetch(url, options);
    Logger.log("TMDB response code: " + response.getResponseCode());
    var json = JSON.parse(response.getContentText());

    Logger.log("TMDB response: " + JSON.stringify(json));

    if (json.results && json.results.length > 0) {
      var seriesDetails = json.results[0];
      var firstAirDate = seriesDetails.first_air_date;
      var voteAverage = seriesDetails.vote_average;
      var posterUrl = "https://image.tmdb.org/t/p/w500" + seriesDetails.poster_path;
      var genres = seriesDetails.genre_ids.map(function (genreId) {
        return getGenreName(genreId);
      }).join(", ");
      var seriesId = seriesDetails.id;
      var thaiOverview = fetchThaiOverviewSeriesFromTMDB(seriesId); // Passing false for isMovie

      return {
        "seriesDetails": seriesDetails,
        "firstAirDate": firstAirDate,
        "voteAverage": voteAverage,
        "posterUrl": posterUrl,
        "genres": genres,
        "thaiOverview": thaiOverview
      }
    } else {
      return null;
    }
  } catch (error) {
    Logger.log("Error fetching TV show details: " + error);
    return null;
  }
}

  function fetchThaiOverviewFromTMDB(movieId) {
    try {
      var url = 'https://api.themoviedb.org/3/movie/' + movieId + '?language=th';
      var options = {
        'method': 'get',
        'headers': {
          'Authorization': 'Bearer ' + TMDB_ACCESS_TOKEN
        }
      };
      var response = UrlFetchApp.fetch(url, options);
      Logger.log("TMDB Thai overview response code: " + response.getResponseCode());
      var json = JSON.parse(response.getContentText());

      Logger.log("TMDB Thai overview response: " + JSON.stringify(json));

      return json.overview || null;
    } catch (error) {
      Logger.log("Error fetching Thai overview: " + error);
      return null;
    }
  }

  function fetchThaiOverviewSeriesFromTMDB(seriesId) {
    try {
      var url = 'https://api.themoviedb.org/3/tv/' + seriesId + '?language=th';
      var options = {
        'method': 'get',
        'headers': {
          'Authorization': 'Bearer ' + TMDB_ACCESS_TOKEN
        }
      };
      var response = UrlFetchApp.fetch(url, options);
      Logger.log("TMDB Thai overview response code: " + response.getResponseCode());
      var json = JSON.parse(response.getContentText());

      Logger.log("TMDB Thai overview response: " + JSON.stringify(json));

      return json.overview || null;
    } catch (error) {
      Logger.log("Error fetching Thai overview: " + error);
      return null;
    }
  }

  function fetchUpcomingMoviesFromTMDB() {
    try {
      var url = 'https://api.themoviedb.org/3/movie/upcoming?language=th';
      var options = {
        'method': 'get',
        'headers': {
          'Authorization': 'Bearer ' + TMDB_ACCESS_TOKEN
        }
      };
      var response = UrlFetchApp.fetch(url, options);
      Logger.log("TMDB upcoming movies response code: " + response.getResponseCode());
      var json = JSON.parse(response.getContentText());

      Logger.log("TMDB upcoming movies response: " + JSON.stringify(json));

      return json.results || [];
    } catch (error) {
      Logger.log("Error fetching upcoming movies: " + error);
      return [];
    }
  }
  function fetchUpcomingTVFromTMDB() {
    try {
      var url = 'https://api.themoviedb.org/3/tv/airing_today?language=th';
      var options = {
        'method': 'get',
        'headers': {
          'Authorization': 'Bearer ' + TMDB_ACCESS_TOKEN
        }
      };
      var response = UrlFetchApp.fetch(url, options);
      Logger.log("TMDB upcoming TV response code: " + response.getResponseCode());
      var json = JSON.parse(response.getContentText());

      Logger.log("TMDB upcoming TV response: " + JSON.stringify(json));

      return json.results || [];
    } catch (error) {
      Logger.log("Error fetching upcoming movies: " + error);
      return [];
    }
  }
  function fetchTrendingAllFromTMDB() {
    try {
      var url = 'https://api.themoviedb.org/3/trending/all/day?language=th';
      var options = {
        'method': 'get',
        'headers': {
          'Authorization': 'Bearer ' + TMDB_ACCESS_TOKEN
        }
      };
      var response = UrlFetchApp.fetch(url, options);
      Logger.log("TMDB trending all response code: " + response.getResponseCode());
      var json = JSON.parse(response.getContentText());

      Logger.log("TMDB trending all response: " + JSON.stringify(json));

      var results = json.results || [];

      // Replace genre_ids with genre names
      results.forEach(function (result) {
        if (result.genre_ids) {
          result.genres = result.genre_ids.map(getGenreName);
          delete result.genre_ids; // Optionally remove the genre_ids field
        }
      });

      return results;
    } catch (error) {
      Logger.log("Error fetching upcoming movies: " + error);
      return [];
    }
  }

  function fetchTopRatedMoviesFromTMDB() {
  try {
    var url = 'https://api.themoviedb.org/3/movie/top_rated?language=th'; // เปลี่ยน URL เพื่อดึงหนัง top rated
    var options = {
      'method': 'get',
      'headers': {
        'Authorization': 'Bearer ' + TMDB_ACCESS_TOKEN
      }
    };
    var response = UrlFetchApp.fetch(url, options);
    Logger.log("TMDB top rated movies response code: " + response.getResponseCode());
    var json = JSON.parse(response.getContentText());

    Logger.log("TMDB top rated movies response: " + JSON.stringify(json));

    return json.results || [];
  } catch (error) {
    Logger.log("Error fetching top rated movies: " + error);
    return [];
  }
}

function fetchTopRatedSeriesFromTMDB() {
  try {
    var url = 'https://api.themoviedb.org/3/tv/top_rated?language=th'; // เปลี่ยน URL เพื่อดึงซีรี่ส์ top rated
    var options = {
      'method': 'get',
      'headers': {
        'Authorization': 'Bearer ' + TMDB_ACCESS_TOKEN
      }
    };
    var response = UrlFetchApp.fetch(url, options);
    Logger.log("TMDB top rated series response code: " + response.getResponseCode());
    var json = JSON.parse(response.getContentText());

    Logger.log("TMDB top rated series response: " + JSON.stringify(json));

    return json.results || [];
  } catch (error) {
    Logger.log("Error fetching top rated series: " + error);
    return [];
  }
}



  function getGenreName(genreId) {
    var genreNames = {
      28: "Action",
      12: "Adventure",
      16: "Animation",
      35: "Comedy",
      80: "Crime",
      99: "Documentary",
      18: "Drama",
      10751: "Family",
      14: "Fantasy",
      36: "History",
      27: "Horror",
      10402: "Music",
      9648: "Mystery",
      10749: "Romance",
      878: "Science Fiction",
      10770: "TV Movie",
      53: "Thriller",
      10752: "War",
      37: "Western"
    };

    return genreNames[genreId] || "Unknown";
  }

  function sendReply(overview, movieName, voteAverage, genres, posterUrl) {
    var result = {
      "fulfillmentMessages": [

        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "image",
              "originalContentUrl": posterUrl,
              "previewImageUrl": posterUrl
            }
          }
        },
        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "text",
              "text": "🎬 ชื่อเรื่อง : " + movieName + " 🍿\nℹ️ เรื่องย่อ : " + overview + "\n\n🎞️หมวดหมู่ : " + genres + "\n⭐️คะแนน : " + voteAverage
            }
          }
        }
      ]
    };

    Logger.log("Sending reply: " + JSON.stringify(result));

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  function sendReplySeries(overview, seriesName, posterUrl,genres) {
    var result = {
      "fulfillmentMessages": [

        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "image",
              "originalContentUrl": posterUrl,
              "previewImageUrl": posterUrl
            }
          }
        },
        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "text",
              "text": "🎬 ชื่อเรื่อง : " + seriesName + " 🍿\nℹ️ เรื่องย่อ : " + overview + "\n\n🎞️หมวดหมู่ : " + genres 
            }
          }
        }
      ]
    };

    Logger.log("Sending reply: " + JSON.stringify(result));

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }


  function sendReplyUpcoming(response) {

    var result = {
      "fulfillmentMessages": [
        {
          "platform": "line",
          "payload": {
            "line": {
              "type": "template",
              "altText": "this is a carousel template",
              "template": {
                "type": "carousel",
                "imageAspectRatio": "rectangle",
                "imageSize": "cover",
                "columns": [
                  {
                    "thumbnailImageUrl": response[0].poster_path,
                    "imageBackgroundColor": "#FFFFFF",
                    "title": response[0].title,
                    "text": response[0].release_date,
                    "defaultAction": {
                      "type": "uri",
                      "label": "รายละเอียด",
                      "uri": "https://www.google.com/"
                    },
                    "actions": [
                      {
                        "type": "uri",
                        "label": "รายละเอียด",
                        "uri": "https://www.google.com/"
                      }
                    ]
                  },
                  {
                    "thumbnailImageUrl": response[1].poster_path,
                    "imageBackgroundColor": "#FFFFFF",
                    "title": response[1].title,
                    "text": response[1].release_date,
                    "defaultAction": {
                      "type": "uri",
                      "label": "รายละเอียด",
                      "uri": "https://www.google.com/"
                    },
                    "actions": [
                      {
                        "type": "uri",
                        "label": "รายละเอียด",
                        "uri": "https://www.google.com/"
                      }
                    ]
                  },
                  {
                    "thumbnailImageUrl": response[2].poster_path,
                    "imageBackgroundColor": "#FFFFFF",
                    "title": response[2].title,
                    "text": response[2].release_date,
                    "defaultAction": {
                      "type": "uri",
                      "label": "รายละเอียด",
                      "uri": "https://www.google.com/"
                    },
                    "actions": [
                      {
                        "type": "uri",
                        "label": "รายละเอียด",
                        "uri": "https://www.google.com/"
                      }
                    ]
                  },
                  {
                    "thumbnailImageUrl": response[3].poster_path,
                    "imageBackgroundColor": "#FFFFFF",
                    "title": response[3].title,
                    "text": response[3].release_date,
                    "defaultAction": {
                      "type": "uri",
                      "label": "รายละเอียด",
                      "uri": "https://www.google.com/"
                    },
                    "actions": [
                      {
                        "type": "uri",
                        "label": "รายละเอียด",
                        "uri": "https://www.google.com/"
                      }
                    ]
                  },
                  {
                    "thumbnailImageUrl": response[4].poster_path,
                    "imageBackgroundColor": "#FFFFFF",
                    "title": response[4].title,
                    "text": response[4].release_date,
                    "defaultAction": {
                      "type": "uri",
                      "label": "รายละเอียด",
                      "uri": "https://www.google.com/"
                    },
                    "actions": [
                      {
                        "type": "uri",
                        "label": "รายละเอียด",
                        "uri": "https://www.google.com/"
                      }
                    ]
                  },
                ]
              }
            }
          }
        }

      ]
    };

    Logger.log("Sending reply: " + JSON.stringify(result));

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  function sendReplyAllTrending(response) {
    var result = {
      "fulfillmentMessages": [
        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "text",
              "text": "🍿 เราได้รวบรวมหนังและซีรีส์ 🍿\n🔥 ที่กำลังมาแรงช่วงนี้ 5 เรื่อง 🔥"
            }
          }
        },

        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "image",
              "originalContentUrl": response[0].poster_path,
              "previewImageUrl": response[0].poster_path
            }
          }
        },
        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "text",
              "text": "🎬 ชื่อเรื่อง : " + response[0].title + " 🍿\nℹ️ เรื่องย่อ : " + response[0].overview + "\n\n🎞️หมวดหมู่ : " + response[0].genres + "\n⭐️คะแนน : " + response[0].vote_average
            }
          }
        },
        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "image",
              "originalContentUrl": response[1].poster_path,
              "previewImageUrl": response[1].poster_path
            }
          }
        },
        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "text",
              "text": "🎬 ชื่อเรื่อง : " + response[1].title + " 🍿\nℹ️ เรื่องย่อ : " + response[1].overview + "\n\n🎞️หมวดหมู่ : " + response[1].genres + "\n⭐️คะแนน : " + response[1].vote_average
            }
          }
        },
        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "image",
              "originalContentUrl": response[2].poster_path,
              "previewImageUrl": response[2].poster_path
            }
          }
        },
        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "text",
              "text": "🎬 ชื่อเรื่อง : " + response[2].title + " 🍿\nℹ️ เรื่องย่อ : " + response[2].overview + "\n\n🎞️หมวดหมู่ : " + response[2].genres + "\n⭐️คะแนน : " + response[2].vote_average
            }
          }
        },
        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "image",
              "originalContentUrl": response[3].poster_path,
              "previewImageUrl": response[3].poster_path
            }
          }
        },
        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "text",
              "text": "🎬 ชื่อเรื่อง : " + response[3].title + " 🍿\nℹ️ เรื่องย่อ : " + response[3].overview + "\n\n🎞️หมวดหมู่ : " + response[3].genres + "\n⭐️คะแนน : " + response[3].vote_average
            }
          }
        },
        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "image",
              "originalContentUrl": response[4].poster_path,
              "previewImageUrl": response[4].poster_path
            }
          }
        },
        {
          "platform": "line",
          "type": 4,
          "payload": {
            "line": {
              "type": "text",
              "text": "🎬 ชื่อเรื่อง : " + response[4].title + " 🍿\nℹ️ เรื่องย่อ : " + response[4].overview + "\n\n🎞️หมวดหมู่ : " + response[4].genres + "\n⭐️คะแนน : " + response[4].vote_average
            }
          }
        },
      ]
    };

    Logger.log("Sending reply: " + JSON.stringify(result));

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  function sendReplyToprate(response) {
  var result = {
    "fulfillmentMessages": [
      {
        "platform": "line",
        "payload": {
          "line": {
            "type": "template",
            "altText": "this is a carousel template",
            "template": {
              "type": "carousel",
              "imageAspectRatio": "rectangle",
              "imageSize": "cover",
              "columns": [
                {
                  "thumbnailImageUrl": response[0].poster_path,
                  "imageBackgroundColor": "#FFFFFF",
                  "title": response[0].name, // เปลี่ยนจาก title เป็น name สำหรับซีรี่ส์
                  "text": response[0].first_air_date, // เปลี่ยนจาก release_date เป็น first_air_date สำหรับซีรี่ส์
                  "defaultAction": {
                    "type": "uri",
                    "label": "รายละเอียด",
                    "uri": "https://www.google.com/"
                  },
                  "actions": [
                    {
                      "type": "uri",
                      "label": "รายละเอียด",
                      "uri": "https://www.google.com/"
                    }
                  ]
                },
                {
                  "thumbnailImageUrl": response[1].poster_path,
                  "imageBackgroundColor": "#FFFFFF",
                  "title": response[1].name, // เปลี่ยนจาก title เป็น name สำหรับซีรี่ส์
                  "text": response[1].first_air_date, // เปลี่ยนจาก release_date เป็น first_air_date สำหรับซีรี่ส์
                  "defaultAction": {
                    "type": "uri",
                    "label": "รายละเอียด",
                    "uri": "https://www.google.com/"
                  },
                  "actions": [
                    {
                      "type": "uri",
                      "label": "รายละเอียด",
                      "uri": "https://www.google.com/"
                    }
                  ]
                },
                {
                  "thumbnailImageUrl": response[2].poster_path,
                  "imageBackgroundColor": "#FFFFFF",
                  "title": response[2].name, // เปลี่ยนจาก title เป็น name สำหรับซีรี่ส์
                  "text": response[2].first_air_date, // เปลี่ยนจาก release_date เป็น first_air_date สำหรับซีรี่ส์
                  "defaultAction": {
                    "type": "uri",
                    "label": "รายละเอียด",
                    "uri": "https://www.google.com/"
                  },
                  "actions": [
                    {
                      "type": "uri",
                      "label": "รายละเอียด",
                      "uri": "https://www.google.com/"
                    }
                  ]
                },
                {
                  "thumbnailImageUrl": response[3].poster_path,
                  "imageBackgroundColor": "#FFFFFF",
                  "title": response[3].name, // เปลี่ยนจาก title เป็น name สำหรับซีรี่ส์
                  "text": response[3].first_air_date, // เปลี่ยนจาก release_date เป็น first_air_date สำหรับซีรี่ส์
                  "defaultAction": {
                    "type": "uri",
                    "label": "รายละเอียด",
                    "uri": "https://www.google.com/"
                  },
                  "actions": [
                    {
                      "type": "uri",
                      "label": "รายละเอียด",
                      "uri": "https://www.google.com/"
                    }
                  ]
                },
                {
                  "thumbnailImageUrl": response[4].poster_path,
                  "imageBackgroundColor": "#FFFFFF",
                  "title": response[4].name, // เปลี่ยนจาก title เป็น name สำหรับซีรี่ส์
                  "text": response[4].first_air_date, // เปลี่ยนจาก release_date เป็น first_air_date สำหรับซีรี่ส์
                  "defaultAction": {
                    "type": "uri",
                    "label": "รายละเอียด",
                    "uri": "https://www.google.com/"
                  },
                  "actions": [
                    {
                      "type": "uri",
                      "label": "รายละเอียด",
                      "uri": "https://www.google.com/"
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    ]
  };

  Logger.log("Sending reply: " + JSON.stringify(result));

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

