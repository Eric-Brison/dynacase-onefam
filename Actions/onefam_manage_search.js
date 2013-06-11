(function ($, window) {
    var handleAjaxRequest, logError, generateID, updateSearchList, generateHTMLAbstractList, sizeIframe, debounce,
        noListReload, displaySubMenu, hideSubMenu, saveTheNextUrl, hideDisplayIframe,
        autoHideSubMenuTime = 1000, isIE6,
        iframeMode = "only_edition";

    /**
     * Debounce a function execution
     * Tks to underscore library
     * @param func
     * @param wait
     * @param immediate
     * @return {Function}
     */
    debounce = function (func, wait, immediate) {
        var timeout, result;
        return function () {
            var context = this, args = arguments, callNow,
                later = function () {
                    timeout = null;
                    if (!immediate) {
                        result = func.apply(context, args);
                    }
                };
            callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) {
                result = func.apply(context, args);
            }
            return result;
        };
    };
    /**
     * Wrap ajax request
     *
     * @param requestObject
     * @param success
     * @param fail
     * @private
     */
    handleAjaxRequest = function handleAjaxRequest(requestObject, success, fail) {
        requestObject.pipe(
            function (response) {
                if (response.success) {
                    return (response);
                }
                return ($.Deferred().reject(response));
            },
            function (response) {
                return ({
                    success : false,
                    result :  null,
                    error :   "Unexpected error: " + response.status + " " + response.statusText
                });
            }
        ).then(success, fail);
    };

    /**
     * Log an error or display it if log is not present
     * @param err
     */
    logError = function logError(err) {
        err = err.error || err;
        if (window.console) {
            window.console.log(err);
        } else {
            window.alert(err);
        }
    };

    /**
     * Get an uuid
     * @return {String}
     */
    generateID = function generateID() {
        return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
            //noinspection JSLint
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    };

    /**
     * Get the content of the abstract list
     */
    updateSearchList = function () {
        $("#search-list-content").hide();
        $("#search-list-loading").show();
        //noinspection JSUnresolvedVariable
        handleAjaxRequest($.post("?app=" + window.DCP.manageSearch.onefam + "&action=ONEFAM_MANAGE_SEARCH_GET_CONTENT",
            {
                famid : window.DCP.manageSearch.famId,
                uuid :  generateID(),
                keyWord : $("#search-zone-key").val()
            }),
            function (content) {
                var result = content.data || [];
                result = result.result || [];
                generateHTMLAbstractList(result);
            },
            logError
            );
    };

    /**
     * Generate the abstract list with the xhr return
     * @param abstractList
     */
    generateHTMLAbstractList = function (abstractList) {
        var content = '', i, length;
        for (i = 0, length = abstractList.length; i < length; i += 1) {
            //noinspection JSUnresolvedVariable
            if (abstractList[i].abstractHTML) {
                //noinspection JSUnresolvedVariable
                content += abstractList[i].abstractHTML || '';
            }
        }
        $("#search-list-content").empty().append(content).show();
        $("#search-list-loading").hide();
    };

    /**
     * Compute the size of the iframe
     * Two mode : only_edition with the edition-iframe that take all place
     * two_mode : with two frames
     */
    sizeIframe = function () {
        var $editionIframe = $("#search-edition-iframe"), $resultIframe = $("#search-display-iframe"),
            $searchDisplay = $("#search-display"),
            displayZoneHeight = $("#display-zone").innerHeight() - 7;
        if (iframeMode === "only_edition") {
            $editionIframe.height(displayZoneHeight);
            $searchDisplay.hide();
        } else {
            $editionIframe.height(displayZoneHeight / 2);
            $resultIframe.height(displayZoneHeight / 2);
            $searchDisplay.show();
        }
    };

    /**
     * Display the sub menu and compute sub menu visibilities
     * @param $rootElement
     */
    displaySubMenu = function displaySubMenu($rootElement) {
        var top, left, rootPosition, $abstract = $rootElement.closest(".css-abstract"),
            $subMenuModify = $("#subMenuModify"),
            $subMenuSuppress = $("#subMenuSuppress"),
            $subMenuShare = $("#subMenuShare"),
            $shareText = $("#shareText"),
            $unshareText = $("#unshareText"),
            $subMenuFilter = $("#subMenuFilter"),
            $filterText = $("#filterText"),
            $unfilterText = $("#unfilterText"),
            $contextualMenu = $("#searchListMenu"),
            $selectAsDefaultSearchEnable = $("#selectAsDefaultSearchEnable"),
            $selectAsDefaultSearchDisable = $("#selectAsDefaultSearchDisable"),
            timeOutId = $contextualMenu.data("timeoutid");
        if (timeOutId) {
            window.clearInterval(timeOutId);
        }
        rootPosition = $rootElement.offset();
        top = rootPosition.top - 2;
        left = rootPosition.left + $rootElement.outerWidth(true);
        $contextualMenu.data("id", $abstract.data("id"));
        $contextualMenu.data("is-report", $abstract.data("is-report"));
        if ($abstract.data("is-in-filter")) {
            $unfilterText.show();
            $filterText.hide();
        } else {
            $filterText.show();
            $unfilterText.hide();
        }
        if ($abstract.data("is-editable")) {
            $subMenuModify.show();
        } else {
            $subMenuModify.hide();
        }
        if ($abstract.data("is-deleteable")) {
            $subMenuSuppress.show();
        } else {
            $subMenuSuppress.hide();
        }
        if ($abstract.data("is-in-family-dir") === "none") {
            $subMenuShare.hide();
            $subMenuFilter.hide();
        } else {
            $subMenuShare.show();
            if ($abstract.data("is-in-family-dir")) {
                $shareText.hide();
                $unshareText.show();
                /* Hide it if is in family dir because it's useless to remove filter if in family dir*/
                $subMenuFilter.hide();
            } else {
                $shareText.show();
                $unshareText.hide();
                $subMenuFilter.show();
            }

            if (! $abstract.data("can-modify-family-dir")) {
                $subMenuShare.hide();
                $shareText.hide();
                $unshareText.hide();
            }
        }
        if ($abstract.data("is-default")) {
            $selectAsDefaultSearchEnable.hide();
            $selectAsDefaultSearchDisable.show();
        } else {
            $selectAsDefaultSearchEnable.show();
            $selectAsDefaultSearchDisable.hide();
        }

        $contextualMenu.css({ top : top, left : left}).removeClass("css-search-list-menu-hidden").data("timeoutid", "");
    };

    /**
     * Hide the sub menu
     *
     * Reinit the hide timer
     */
    hideSubMenu = function hideSubMenu() {
        var $contextualMenu = $("#searchListMenu"), timeoutid = $contextualMenu.data("timeoutid");
        if (timeoutid) {
            window.clearInterval(timeoutid);
        }
        $contextualMenu.addClass("css-search-list-menu-hidden").data("timeoutid", "");
    };

    /**
     * hide search-display-iframe by setting its location to Images/1x1.gif
     */
    hideDisplayIframe = function hideDisplayIframe(){
        var $iframe = $('#search-display-iframe');
        $iframe.attr('src', 'Images/1x1.gif');
    };

    /**
     * Save the next url in onefam (see onefam_root.js openIframe)
     * @param url
     */
    saveTheNextUrl = function saveTheNextUrl(url) {
        if (window.parent && window.parent.onefam) {
            window.parent.onefam.manageSearch = {nextURL : url};
        }
    };

    /**
     * Handle on the search list
     *
     * The abstract element animation
     * The abstract click (no list redraw after click)
     * Display of sub menu
     */
    $("#search-list").on("mouseenter", ".css-abstract", function () {
        var $this = $(this);
        $this.addClass("ui-state-focus");
        $this.find(".css-abstract-subElement").removeClass("css-abstract-subElement-hidden");
    }).on("mouseleave", ".css-abstract", function () {
        var $this = $(this), timeOutId;
        $this.removeClass("ui-state-focus");
        timeOutId = window.setTimeout(function () {
            hideSubMenu();
        }, 100);
        $("#searchListMenu").data("timeoutid", timeOutId);
        $this.find(".css-abstract-subElement").addClass("css-abstract-subElement-hidden");
    }).on("click", ".css-abstract", function () {
        var url = $(this).data("url");
        noListReload = true;
        hideSubMenu();
        $("#search-edition-iframe").attr("src", url);
        iframeMode = "only_edition";
        sizeIframe();
        $("#search-display-iframe").attr("src", 'Images/1x1.gif');
    }).on("click", ".js-abstract-subElement", function () {
        var $this = $(this);
        displaySubMenu($this);
        return false;
    });

    /**
     * Add timer to auto hide submenu
     */
    $("#searchListMenu").on("mouseenter", function () {
        var timeOutId, $this = $(this);
        timeOutId = $this.data("timeoutid");
        if (timeOutId) {
            window.clearInterval(timeOutId);
        }
    }).on("mouseleave", function () {
        var timeOutId, $this = $(this);
        timeOutId = window.setTimeout(function () {
            hideSubMenu();
        }, autoHideSubMenuTime);
        $this.data("timeoutid", timeOutId);
    });
    /**
     * Animate the element list
     */
    $(".css-search-list-menu-element").on("mouseenter", function () {
        $(this).addClass("ui-state-focus");
    }).on("mouseleave", function () {
        $(this).removeClass("ui-state-focus");
    });

    /**
     * Animate the creation button
     */
    $(".js-creation-button").on("mouseenter", function () {
        $(this).addClass("ui-state-focus");
    }).on("mouseleave", function () {
        $(this).removeClass("ui-state-focus");
    });

    /**
     * Handle the close display button
     */
    $("#close-search-display").on("click", function () {
        hideDisplayIframe();
    });

    /**
     * change layout (display #search-display-iframe or not) on
     * #search-display-iframe load
     */
    $("#search-display-iframe").on("load", function () {
        var doc;
        doc = this.contentDocument || this.contentWindow.document;
        if (doc && doc.location && doc.location.href &&
                doc.location.href.toLowerCase().indexOf("images/1x1.gif") === -1) {
            iframeMode = "two_mode";
        } else {
            iframeMode = "only_edition";
        }
        sizeIframe();
    });

    /**
     * when reloading search-edition-iframe
     * - Reload the searches list
     * - hide #search-display-iframe
     */
    $("#search-edition-iframe").on("load", function () {
        if (noListReload) {
            noListReload = false;
        } else {
            updateSearchList();
        }
        hideDisplayIframe();
    });

    /**
     * Handle the creation search button
     */
    $("#creation-search").on("click", function () {
        noListReload = true;
        hideSubMenu();
        iframeMode = "only_edition";
        sizeIframe();
        //noinspection JSUnresolvedVariable
        $("#search-edition-iframe").attr("src", "?app=GENERIC&action=GENERIC_EDIT&se_memo=yes&classid=DSEARCH&onlysubfam=" + window.DCP.manageSearch.famId + "&sfamid=" + window.DCP.manageSearch.famId+"&alsosub="+window.DCP.manageSearch.alsosub);
    });

    /**
     * Handle the creation report button
     */
    $("#creation-report").on("click", function () {
        noListReload = true;
        hideSubMenu();
        iframeMode = "only_edition";
        sizeIframe();
        //noinspection JSUnresolvedVariable
        $("#search-edition-iframe").attr("src", "?app=GENERIC&action=GENERIC_EDIT&se_memo=yes&classid=REPORT&onlysubfam=" + window.DCP.manageSearch.famId + "&sfamid=" + window.DCP.manageSearch.famId+"&alsosub="+window.DCP.manageSearch.alsosub);
    });

    /**
     * Handle the open in modification sub menu
     */
    $("#subMenuModify").on("click", function () {
        var id = $("#searchListMenu").data("id");
        $("#search-edition-iframe").attr("src", "?app=FDL&action=OPENDOC&mode=edit&latest=Y&id=" + id);
        hideSubMenu();
    });

    /**
     * Handle the see result sub menu
     */
    $("#subMenuShowResult").on("click", function () {
        var id = $("#searchListMenu").data("id");
        $("#search-edition-iframe").attr("src", "?app=FREEDOM&action=FREEDOM_VIEW&dirid=" + id);
        hideSubMenu();
    });

    /**
     * Handle the filter state change
     */
    $("#subMenuFilter").on("click", function () {
        var id = $("#searchListMenu").data("id");
        handleAjaxRequest($.get("?app="+window.DCP.manageSearch.onefam+"&action=ONEFAM_MANAGE_SEARCH_TOGGLE_FILTER", {searchId : id}),
            function () {
                updateSearchList();
                saveTheNextUrl("reload");
            },
            logError);
        hideSubMenu();
    });

    /**
     * Handle the use it now
     *
     * Compute and set the next url and close the overlay
     */
    $("#subMenuUseIt").on("click", function () {
        var $searchListMenu = $("#searchListMenu"), id = $searchListMenu.data("id"), isReport = $searchListMenu.data("is-report");
        if (isReport) {
            subwindow(400, 600, 'finfo' + window.DCP.manageSearch.famId,
                '?sole=Y&&app=FDL&action=FDL_CARD&dochead=Y&latest=Y&id=' + id);
        } else {
            window.parent.onefam.manageSearch = {
                nextURL : '?sole=Y&app=GENERIC&action=GENERIC_TAB&onefam=' + window.DCP.manageSearch.onefam +
                            '&tab=0&clearkey=Y&famid=' + window.DCP.manageSearch.famId + '&catg=' + id + '&dirid=' + id
            };
        }
        window.location = "Images/1x1.gif";
    });

    /**
     * Handle the suppress it sub menu
     */
    $("#subMenuSuppress").on("click", function () {
        var id = $("#searchListMenu").data("id");
        if (window.confirm(window.DCP.manageSearch.confirmSuppress)) {
            $.get("?app=GENERIC&action=GENERIC_DEL", {id : id}, function () {
                updateSearchList();
                saveTheNextUrl("reload");
            });
        }
        hideSubMenu();
    });

    /**
     * Handle the default search sub menu
     */
    $("#subMenuSelectAsDefaultSearch").on("click", function () {
        var id = $("#searchListMenu").data("id");
        handleAjaxRequest($.get("?app="+window.DCP.manageSearch.onefam+"&action=ONEFAM_MANAGE_SEARCH_TOGGLE_DEFAULT",
            {
                famid : window.DCP.manageSearch.famId,
                searchId : id
            }),
            function () {
                updateSearchList();
                saveTheNextUrl("reload");
            },
            logError);
        hideSubMenu();
    });

    /**
     * Handle the share it submenu
     */
    $("#subMenuShare").on("click", function () {
        var id = $("#searchListMenu").data("id");
        handleAjaxRequest($.get("?app="+window.DCP.manageSearch.onefam+"&action=ONEFAM_MANAGE_SEARCH_TOGGLE_SHARE",
            {
                searchId : id,
                famId : window.DCP.manageSearch.famId
            }),
            function () {
                updateSearchList();
                saveTheNextUrl("reload");
            },
            logError);
        hideSubMenu();
    });

    $("#search-zone-key").on("change", function () {
        updateSearchList();
    });

    /** Resize IHM content
     * Recompute the size of some IHM element with a debounce
     **/
    $(window).on("resize", debounce(function () {
        var $searchList = $("#search-list"),
            $displayZone = $("#display-zone"),
            windowHeight = $(window).height(),
            windowWidth = $(window).width();
        if (isIE6) {
            $("#main-zone").height(windowHeight);
        }
        $searchList.height(windowHeight - $searchList.position().top);
        if (isIE6) {
            $displayZone.height(windowHeight);
            $displayZone.width(windowWidth - $displayZone.position().left);
        }
        sizeIframe();
    }, 500));

    /**
     * Init the search list and trigger an initial resize
     */
    $(document).ready(function () {
        updateSearchList();
        isIE6 = $("html").data("browser") === "ie6";
        $(window).trigger("resize");
    });
}($, window));