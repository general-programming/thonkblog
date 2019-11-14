const jetpack = require("fs-jetpack");
const YAML = require("yaml");
const markdownit = require("markdown-it");
const frontmatter = require("markdown-it-front-matter");
const emoji = require("markdown-it-emoji");
const hljs = require("highlight.js");
const pathutil = require("path");

const { extractSummaryText } = require("./render");

class Post {
	constructor(summary, content, kwargs, filename) {
		this.summary = summary;
		this.html_content = content;

		this.title = kwargs.title;
		this.author = {
			name: kwargs.author,
			id: kwargs.discord
		};

		this.published = kwargs.date;
		this.slug = filename.replace(/[^a-zA-Z0-9-]/g, "-");
	}
}

function hljsHighlight(str, lang) {
	if (lang && hljs.getLanguage(lang)) {
		try {
			let block = hljs.highlight(lang, str, true).value;
			return '<pre class="hljs"><code>' + block + '</code></pre>';
		} catch (err) {
			console.error(err);
		}
	}

	return '<pre class="hljs"><code>' + this.md.utils.escapeHtml(str) + '</code></pre>';
}

class PostLoader {
	constructor() {
		this.posts = {};
		this.postBySlug = {};
		this.md = markdownit({ highlight: hljsHighlight.bind(this) });

		this.md.use(emoji);
		this.md.use(frontmatter, (fm) =>
			YAML.parse(fm)
		);
	}

	load(filename) {
		return jetpack.readAsync(filename).then((content) => {
			let ctx = {};

			let summary = extractSummaryText(this.md.parse(content, ctx));
			let html_content = this.md.render(content, ctx);
			let slug = pathutil.basename(filename, ".md");
			
			this.posts[filename] = new Post(summary, html_content, ctx.result, slug);
			this.postBySlug[this.posts[filename].slug] = filename;
		});
	}

	remove(filename) {
		delete this.posts[filename];
	}

	reload(filename) {
		return this.load(filename);
	}

	fetch(page, limit) {
		page = page || 0;
		limit = limit || 3;

		return Object.values(this.posts).sort((a, b) => b.published.localeCompare(a.published)).slice(page * limit, (page * limit) + limit);
	}

	countPages(perPage) {
		perPage = perPage || 3;

		return Math.ceil(Object.keys(this.posts).length / perPage);
	}

	fetchBySlug(slug) {
		return this.posts[this.postBySlug[slug]];
	}
}

module.exports = new PostLoader();
