function extractSummaryText(tokens) {
	var tok = tokens.shift()
	while (tok.type != "paragraph_open") {
		tok = tokens.shift()
	}

	var content_tokens = []
	while (tok.type != "paragraph_close") {
		content_tokens.push(tok);
		tok = tokens.shift();
	}
	
	return content_tokens.reduce((acc, tok) => acc + tok.content, "");
}

module.exports = { extractSummaryText };
