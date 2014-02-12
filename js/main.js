(function() {

	'use strict';

	var masterfile = 'locales/nl_nl.json',
		$article = $('article'),
		htmlPattern = /<[a-z][\s\S]*>/i,
		json, currentValue,

	render = function ( response ) {
		json = response;
		$article.empty().renderJSON(response);

		$('.renderjson-scalar', $article).each(function( key, el ) {
			htmlToMarkdown(key, el);
			stylise(el);
		});

		$('textarea').elastic();
	},

	stylise = function ( el ) {
		$(el).attr('class', 'col-xs-5 value')
			.prev().attr('class', 'col-xs-2 key')
			.parent().attr('class', 'row');
	},

	htmlToMarkdown = function ( i, el ) {
		var txt = el.value;

		if ( htmlPattern.test(txt) ) {
			var md = HTML2Markdown(txt);
			$article.find('[title=\''+el.title+'\']').val(md);
		}
	},

	storeCurrent = function ( ev ) {
		ev.stopPropagation();
		currentValue = ev.currentTarget.value;
	},

	checkEdit = function ( ev ) {
		if ( currentValue !== ev.currentTarget.value ){
			$(ev.currentTarget).addClass('modified').data('original', currentValue);

			previewChanges(ev.currentTarget);
		}
	},

	previewChanges = function ( el ) {
		var html = marked(el.value);

		if ( !el.$preview) {
			el.$preview = $('<div class="preview col-xs-5"/>').insertAfter(el);
		}

		// if el has only one p tag remove it.
		if ( html.split('<p>').length-1 === 1 )
			html = html.replace(/(\<p\>|\<\/p\>)/gi, '');

		el.$preview.html(html);
	},

	uploadFile = function () {
		var file = this.files[0],
			fd = new FormData(),
			xhr;

		fd.append('uploadfile', file);

		xhr = new XMLHttpRequest();
		xhr.open('POST', 'upload.php', true);

		xhr.onload = function() {
			if (this.status == 200) {
				var response;
				try {
					response = JSON.parse(this.response);
				} catch(error) {
					console.log('response isnt json');
				}

				if ( response )
					render(response.dataObj);
			}
		};

		xhr.send(fd);
	},

	reset = function () {
		location.reload();
	},

	// update value in json object to match what changed in editor
	changeJsonValue = function ( obj, strProp, newValue ) {
		var re = /\["?([^"\]]+)"?\]/g,
			m, p;

		while ((m = re.exec(strProp)) && typeof obj[p = m[1]] === 'object')
			obj = obj[p];

		if (p)
			obj[p] = newValue;
	},

	save = function () {
		var filename = masterfile.split('/').pop(),
			saveObj = {
				filename: filename.replace(/\.[^/.]+$/, ''),
				json: json
			}, isModified;

		$(':focus').blur();

		$('.modified').each(function(key, el) {
			var node = el.title,
				newValue = el.$preview.html();

			changeJsonValue(json, node, newValue);
			isModified = 1;
		}).removeClass('modified');

		if ( !isModified ) return;

		$.post('/save.php', saveObj, function ( response ){
			json = saveObj.json;
			window.open(response);
		});
	};

	// upload initial file
	$.get(masterfile, render);

	// initialise markdown preview renderer
	marked.setOptions({
		renderer: new marked.Renderer(),
		gfm: false,
		breaks: true,
		sanitize: true,
		smartLists: true,
		smartypants: true
	});

	// set events
	$article.on('focus', '.value', storeCurrent);
	$article.on('blur', '.value', checkEdit);

	$('#uploadfile').on('change', uploadFile);
	$('#reset').on('click', reset);
	$('#save').on('click', save);

})();