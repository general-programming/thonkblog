const express = require("express");
const {Watcher} = require("watch-fs");
const {exec} = require("child_process");
const jetpack = require("fs-jetpack");
const {URL} = require("url");
const md = require("markdown-it")();

const posts = require("./lib/posts");

const app = express();
const postPath = `${__dirname}/posts`;
const watcher = new Watcher({
	paths: [postPath],
	filters: {
		includeFile: ((name) => name.endsWith(".md"))
	}
});

app.set("view engine", "pug");
app.use("/static", express.static(`${__dirname}/static`));

app.use((req, res, next) => {
	res.locals.pageCount = posts.countPages();

	let baseUrl = `${req.protocol}://${req.get('Host')}`;
	res.locals.asset_url = (path) =>
		new URL("/static/" + path, baseUrl).toString();

	res.locals.url_for = (post) =>
		new URL("/p/" + post.slug, baseUrl).toString();

	next(null);
});

app.get("/", (req, res) =>
	res.render("index.pug", { posts: posts.fetch(0), page: 0 })
);

app.get("/:page", (req, res) => {
	res.locals.page = parseInt(req.params.page);

	res.render("index.pug", { posts: posts.fetch(res.locals.page) });
});

app.get("/p/:slug", (req, res) =>
	res.render("post.pug", { post: posts.fetchBySlug(req.params.slug) })
);

app.post("/_/webhook/github", (req, res, next) =>
	exec("git pull", { cwd: postPath }, (err) => {
		if (err) next(err)

		res.sendStatus(200);
	})
);

watcher.on("create", (path) =>
	posts.load(path)
);

watcher.on("change", (path) =>
	posts.reload(path)
);

watcher.on("delete", (path) =>
	posts.remove(path)
);

watcher.start((err, failed) => {
	jetpack.listAsync(postPath).then((files) =>
		files.forEach((filepath) =>
			posts.load(`${postPath}/${filepath}`)
		)
	);

	app.listen(1440);
});
