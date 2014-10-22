(function ($, Firebase, marked, md) {

    'use strict';

    var masterfile = 'locales/master.json',
        $article = $('article'),
        $alert = $('.alert'),
        htmlPattern = /<[a-z][\s\S]*>/i,
        json,
        currentValue,
        fire = new Firebase('https://incandescent-fire-540.firebaseio.com/'),

        throwAlert = function (type, msg) {
            setTimeout(function () {
                $alert.hide().attr('class', 'alert');
            }, 2500);

            $alert.addClass('alert-' + type).html(msg).show();
        },

        stylise = function (el) {
            $(el).attr('class', 'col-xs-5 value')
                .prev().attr('class', 'col-xs-2 key')
                .parent().attr('class', 'row');
        },

        htmlToMarkdown = function (i, el) {
            var txt = el.value,
                markedDown;

            if (htmlPattern.test(txt)) {
                markedDown = md(txt);
                $article.find('[title=\'' + el.title + '\']').val(markedDown);
            }
        },

        storeCurrent = function (ev) {
            ev.stopPropagation();
            currentValue = ev.currentTarget.value.trim();
        },

        previewChanges = function (el) {
            var html = marked(el.value);

            if (!el.$preview) {
                el.$preview = $('<div class="preview col-xs-5"/>').insertAfter(el);
            }

            // if el has only one p tag remove it.
            if (html.split('<p>').length - 1 === 1) {
                html = html.replace(/(\<p\>|\<\/p\>)/gi, '').replace(/(\r\n|\n|\r)/gm, '');
            }

            el.$preview.html(html);
        },

        checkEdit = function (ev) {
            ev.currentTarget.value = ev.currentTarget.value.trim();

            if (currentValue !== ev.currentTarget.value) {
                $(ev.currentTarget).addClass('modified').data('original', currentValue);

                previewChanges(ev.currentTarget);
            }
        },

        mergeObj = function (a, b) {
            for (var key in b) {
                if (key in a) {
                    a[key] = typeof a[key] === 'object' &&
                        typeof b[key] === 'object' ? mergeObj(a[key], b[key]) : b[key];
                }
            }
            return a;
        },

        reset = function () {
            location.reload();
        },

        // update value in json object to match what changed in editor
        changeJsonValue = function (obj, strProp, newValue) {
            var re = /\["?([^"\]]+)"?\]/g,
                m, p;

            while ((m = re.exec(strProp)) && typeof obj[p = m[1]] === 'object')
                obj = obj[p];

            if (p)
                obj[p] = newValue;
        },

        onSaveFeedback = function (error) {
            if (error) {
                alert("Data could not be saved. " + error);
            } else {
                console.log("Data saved successfully.");
            }
        },

        save = function () {
            var saveObj = {
                    filename: json.code || 'locale',
                    json: json
                },
                isModified;

            $(':focus').blur();

            $('.modified').each(function (key, el) {
                var node = el.title,
                    newValue = el.$preview.html();

                changeJsonValue(json, node, newValue);
                isModified = 1;
            }).removeClass('modified');

            console.log(json);

            if (!isModified) return;

            fire.set(json, onSaveFeedback);
        },

        render = function (data) {
            console.log('render');
            json = data.exportVal();
            $article.empty().renderJSON(json);

            $('.renderjson-scalar', $article).each(function (key, el) {
                htmlToMarkdown(key, el);
                stylise(el);
            });

            $('textarea').elastic();
        };

    // upload initial file
    // $.get(masterfile, render);

    // get data from firebase
    fire.once('value', render);

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

    $('#reset').on('click', reset);
    $('#save').on('click', save);



    // add support for old browsers
    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }
})(jQuery, Firebase, marked, md);