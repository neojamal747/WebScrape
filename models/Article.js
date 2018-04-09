//Require mongoose and create a schema class with it
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
	title: {
		type: String,
		required: true
	},

	link: {
		type: String,
		required: true
	},

	note: {
		type: Schema.Types.ObjectId,
		ref: "Comment"
	}
});

var Article = mongoose.model("Article", ArticleSchema);
module.exports = Article;