const jetpack = require("fs-jetpack");
const YAML = require("yaml");
const markdownit = require("markdown-it");
const frontmatter = require("markdown-it-front-matter");
const emoji = require("markdown-it-emoji");
const hljs = require("highlight.js");
const pathutil = require("path");

class Post {
	constructor(content, kwargs, filename) {
		this.html_content = content;

		this.title = kwargs.title;
		this.author = {
			name: kwargs.author,
			id: kwargs.discord
		};

		this.published = kwargs.date;
		this.slug = filename.replace(/[^a-zA-Z0-9-]/g, "-");
	}

	summary() {
		let start = this.html_content.indexOf("<p>") + 3;
		let end = this.html_content.indexOf("\n", start);

		if (end < 0) end = start + 100;

		return this.html_content.slice(start, end).replace("</p>", "");
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
			this.posts[filename] = new Post(this.md.render(content, ctx), ctx.result, pathutil.basename(filename, ".md"));
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
