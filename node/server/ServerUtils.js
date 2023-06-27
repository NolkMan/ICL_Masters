const csp_directives = [
	'child-src',
	'connect-src',
	'default-src',
	'font-src',
	'frame-src',
	'img-src',
	'manifest-src',
	'media-src',
	'object-src',
	'script-src',
	'script-src-elem',
	'script-src-attr',
	'style-src',
	'style-src-elem',
	'style-src-attr',
	'worker-src',
	'base-uri',
	'sandbox',
	'form-action',
	'frame-ancestors',
	'navigate-to',
	'require-trusted-types-for',
	'trusted-types',
	'upgrade-insecure-requests'
]

module.exports = {
	'csp_directives': csp_directives,
}
