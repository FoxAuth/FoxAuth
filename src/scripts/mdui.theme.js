if (typeof mdui === 'undefined')
    var mdui = mdui || null;

if (typeof $$ === 'undefined')
    var $$ = mdui.JQ;

/**
 * 设置文档主题
 */
(() => {
    var DEFAULT_PRIMARY = 'indigo';
    var DEFAULT_ACCENT = 'pink';
    var DEFAULT_LAYOUT = '';

    // 设置 Cookie
    var setCookie = function (key, value) {
        localStorage[key] = value;
    };

    var setDocsTheme = function (theme) {
        if (typeof theme.primary === 'undefined') {
            theme.primary = false;
        }
        if (typeof theme.accent === 'undefined') {
            theme.accent = false;
        }
        if (typeof theme.layout === 'undefined') {
            theme.layout = false;
        }

        var i, len;
        var $body = $$('body');

        var classStr = $body.attr('class');
        var classs = classStr.split(' ');

        // 设置主色
        if (theme.primary !== false) {
            for (i = 0, len = classs.length; i < len; i++) {
                if (classs[i].indexOf('mdui-theme-primary-') === 0) {
                    $body.removeClass(classs[i]);
                }
            }
            $body.addClass('mdui-theme-primary-' + theme.primary);
            setCookie('theme-primary', theme.primary);
            $$('input[name="doc-theme-primary"][value="' + theme.primary + '"]').prop('checked', true);
        }

        // 设置强调色
        if (theme.accent !== false) {
            for (i = 0, len = classs.length; i < len; i++) {
                if (classs[i].indexOf('mdui-theme-accent-') === 0) {
                    $body.removeClass(classs[i]);
                }
            }
            $body.addClass('mdui-theme-accent-' + theme.accent);
            setCookie('theme-accent', theme.accent);
            $$('input[name="doc-theme-accent"][value="' + theme.accent + '"]').prop('checked', true);
        }

        // 设置主题色
        if (theme.layout !== false) {
            for (i = 0, len = classs.length; i < len; i++) {
                if (classs[i].indexOf('mdui-theme-layout-') === 0) {
                    $body.removeClass(classs[i]);
                }
            }
            if (theme.layout !== '') {
                $body.addClass('mdui-theme-layout-' + theme.layout);
            }
            setCookie('theme-layout', theme.layout);
            $$('input[name="doc-theme-layout"][value="' + theme.layout + '"]').prop('checked', true);
        }
    };

    // 切换主色
    $$(document).on('change', 'input[name="doc-theme-primary"]', function () {
        setDocsTheme({
            primary: $$(this).val()
        });
    });

    // 切换强调色
    $$(document).on('change', 'input[name="doc-theme-accent"]', function () {
        setDocsTheme({
            accent: $$(this).val()
        });
    });

    // 切换主题色
    $$(document).on('change', 'input[name="doc-theme-layout"]', function () {
        setDocsTheme({
            layout: $$(this).val()
        });
    });

    // 恢复默认主题
    $$(document).on('cancel.mdui.dialog', '#dialog-theme', function () {
        setDocsTheme({
            primary: DEFAULT_PRIMARY,
            accent: DEFAULT_ACCENT,
            layout: DEFAULT_LAYOUT
        });
    });

    // Setup themes
    if (localStorage['theme-layout'])
        setDocsTheme({
            layout: localStorage['theme-layout']
        });
    if (localStorage['theme-primary'])
        setDocsTheme({
            primary: localStorage['theme-primary']
        });
    if (localStorage['theme-accent'])
        setDocsTheme({
            accent: localStorage['theme-accent']
        });
})();
