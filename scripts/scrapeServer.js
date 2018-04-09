//======Setup=======

//Dependencies - External
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var request = require('request'); 
var cheerio = require('cheerio');
var express = require('express');
var exphbs = require('express-handlebars');
var app = express();

//Dependencies - Internal
var Article = require("./models/Article.js");
var Comment = require("./models/Comment.js");

//Add Body Parser Middlewarß
app.use(bodyParser.urlencoded({
  extended: false
}));

//Use public directory
app.use(express.static('public'));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


//Mongoose - Configure and connect to the database 
mongoose.connect('mongodb://localhost/scrapeGoose');
var db = mongoose.connection;

//Mongoose - show errors
db.on("error", function(error){
	console.log("Mongoose error: ", error);
});

//Mongoose - success message upon database connection
db.once("open", function(){
	console.log("The 'goose is go!")
});


//======Routes=======

//Home route
app.get('/', function(req, res) {
  res.send("home");
});

//Scrape route
app.get("/scrape", function(req, res){
	console.log("***scrape***");
	var url = "http://www.streetsblog.org/";
	request(url, function (error, response, html) {
		if(error){
			throw error;
		}

		//Load the scraped site's html into cheerio
		var $ = cheerio.load(html);

		//loop through each scraped article
		$("h2.post-title").children().each(function (i, element){
			var title = $(element).text().trim();
			var link = $(element).attr("href");

			var result = {
			    title: title,
			    link: link
			};

				Article.find({link: result.link}, function(error, articleArr){
				//If the current article is already in the database
				if(articleArr.length){
					console.log("Article skipped: ", articleArr)
				}//Otherwise, store it to the DB
				else{
				  	var scrapedArticle = new Article(result);
				  	scrapedArticle.save(function(error, doc){
				  		if (error){
				  			console.log("error: ", error);
				  		}else{
				  			console.log("new article scraped:", doc);
				  		}
				  	});
				}
			})
		});
		// response.send("Site scraped!")
	});
})

//Retrieve all articles from the DB
app.get("/articles", function(request, response){
	Article.find({}, function(error, doc){
		if(error){
			console.log(error);
		}else{
			response.json(doc);
		}
	});
});

//Retrieve a specific article by id
app.get("/articles/:id", function(request, response){
	//Find the specific article in the DB
	Article.findOne({"_id": request.params.id})
	//Populate thehat article's comments
	.populate("comment")
	//Run the query
	.exec(function(error, doc){
		if(error){
			console.log(error);
		}else{
			response.json(doc);
		}
	});
});

//Add and replace notes
app.post("/articles/:id", function(request, response){
	//Make a new Note from the user's input
	var newNote = new Note(request.body);

	newNote.save(function(error, doc){
		if (error){
			console.log(error);
		} else{
			//Add new note/replace old note with new note
			Article.findOneAndUpdate({"_id": request.params.id}, {"note": doc._id})
			.exec(function(error, doc){
				if(error){
					console.log(error);
				} else{
					response.send(doc);
				}
			})
		}
	});
});


var port = process.env.PORT || 3000;

app.listen(port, function() {
    console.log("News Scraper is listening on ", port);
});

