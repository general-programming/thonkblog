function resolveContent(token) {
	switch (token.type) {
		case "inline":
			return token.children.reduce((acc, tok) => acc + resolveContent(tok), "")
		case "softbreak":
		case "hardbreak":
			return " "
		case "text":
		default:
			return token.content
	}
}

function extractSummaryText(tokens) {
	var tok = tokens.shift()
	while (tok.type != "paragraph_open") {
		tok = tokens.shift()
	}

	tok = tokens.shift();
	
	var content_tokens = []
	while (tok.type != "paragraph_close") {
		content_tokens.push(tok);
		tok = tokens.shift();
	}
	
	return content_tokens.reduce((acc, tok) => acc + resolveContent(tok), "");
}

module.exports = { extractSummaryText };
