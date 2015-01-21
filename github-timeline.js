// ==UserScript==
// @name        Github Timeline
// @namespace   https://github.com/romqin/github-timeline
// @description Filter your github timeline
// @include     https://github.com/
// @version     1.1
// @updateURL   https://rawgit.com/romqin/github-timeline/master/github-timeline.js
// @run-at      document-end
// @grant       none
// ==/UserScript==


// Main class

githubTimeline = {
    css: {
        dashboard: 'div.container div#dashboard div.news',
        menu: {
            base: 'div#github-timeline-menu',
            child: 'a'
        },

        getMenu: function() {
            'use strict';
            return this.dashboard + ' ' + this.menu.base;
        },

        getItems: function() {
            'use strict';
            return this.getMenu() + ' ' + this.menu.child;
        },

        getItemSelected: function() {
            'use strict';
            return this.getItems() + '.selected';
        }
    },

    template: {
        menu: '' +
            '<div id="github-timeline-menu" class="issues-list-options">' +
            '  <div class="button-group">' +
            '    <a class="minibutton selected">All</a>' +
            '    <a class="minibutton">Pull Requests</a>' +
            '    <a class="minibutton">Issues</a>' +
            '    <a class="minibutton">Stars</a>' +
            '    <a class="minibutton">Others</a>' +
            '  </div>' +
            '</div>'
    },

    menu: {
        select: function(child) {
            'use strict';
            $(githubTimeline.css.getItems() + '.selected').removeClass('selected');
            child.addClass('selected');
            setCookie("ghtl-menu", child.html());
            githubTimeline.dashboard.refresh();
        }
    },

    dashboard: {
        refresh: function() {
            'use strict';
            var $button = $(githubTimeline.css.getItemSelected());

            $dashboard.find('.alert').each(function(index, line) {
                var $line = $(line);
                $line.css('display', 'none');

                var issueRegexp = new RegExp(' issue ', 'g');
                var pullRequestRegexp = new RegExp(' pull request ', 'g');
                switch ($button.html()) {
                    case 'All':
                        $line.css('display', 'block');

                        break;
                    case 'Pull Requests':
                        if (pullRequestRegexp.test($line.find('div.title').html())) {
                            $line.css('display', 'block');
                        }

                        break;
                    case 'Issues':
                        if (issueRegexp.test($line.find('div.title').html())) {
                            $line.css('display', 'block');
                        }

                        break;
                    case 'Stars':
                        if ($line.hasClass('watch_started')) {
                            $line.css('display', 'block');
                        }

                        break;
                    case 'Others':
                        if (!pullRequestRegexp.test($line.find('div.title').html()) && !issueRegexp.test($line.find('div.title').html()) && !$line.hasClass('watch_started')) {
                            $line.css('display', 'block');
                        }

                        break;
                }

            });
        }
    }
};

// Cookie
function setCookie(sName, sValue)
{
    var today = new Date(), expires = new Date();
    expires.setTime(today.getTime() + (365*24*60*60*1000));
    document.cookie = sName + "=" + encodeURIComponent(sValue) + ";expires=" + expires.toGMTString();
}

function getCookie(sName) {
    var oRegex = new RegExp("(?:; )?" + sName + "=([^;]*);?");

    if (oRegex.test(document.cookie)) {
        return decodeURIComponent(RegExp["$1"]);
    }

    return null;
}

// Workflow

window.addEventListener('load', function() {

    $dashboard = $(githubTimeline.css.dashboard);

    $(githubTimeline.template.menu).prependTo($dashboard);
    $menu = $(githubTimeline.css.getMenu());

    $(document).on('click', githubTimeline.css.getItems(), function() {
        githubTimeline.menu.select($(this));
    });

    var menuSelected = getCookie("ghtl-menu");
    if (menuSelected != null) {
        $(githubTimeline.css.getItems()).parent().find('a:contains("' + menuSelected + '")').trigger('click');
    }

    $(document).ajaxComplete(function(event, request, options) {
        var urlMore = /\/dashboard\/index\/\d+/g
        if (urlMore.test(options.url)) {
            githubTimeline.dashboard.refresh();
        }
    });

});
