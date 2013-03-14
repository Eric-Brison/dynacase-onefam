(function () {

    window.onefam = window.onefam || {};

    window.onefam.iframeOverlay = null;

    window.onefam.resize = function resize() {
        var $width = $(window).width() * 0.8,
        $height = $(window).height() * 0.8,
        $tdiframe = $("#tdiframe"),
        $ifonefam = $(".ifonefam");
        if (window.onefam.iframeOverlay && window.onefamParam.resizeIframeOverlay) {
            window.onefam.iframeOverlay.dialog("option", {
                width : $width,
                height : $height
            });
            window.onefam.iframeOverlay.width($width).height($height);
        }
        resizeIconList(window.onefamParam.colNumber);
        $tdiframe.width($(window).innerWidth()-$tdiframe.position().left);
        $ifonefam.width($tdiframe.innerWidth()).height($(window).innerHeight()-5);
    };

    /* Use the underscore debounce, to debounce the resize event */
    window.onefam.debounce = function (func, wait, immediate) {
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

    window.openIframeOverlay = window.onefam.openIframeOverlay = function openIframeOverlay(target, callback) {
        var $width = $(window).width() * 0.8,
            $height = $(window).height() * 0.8;
        if (!target) {
            return;
        }
        window.onefam.iframeOverlay = $('<iframe class="overlay-iframe" style="padding: 0;" src="' + target + '" />');
        window.onefam.iframeOverlay.dialog({
            autoOpen :    true,
            width :       $width,
            height :      $height,
            modal :       true,
            resizable :   false,
            autoResize :  true,
            draggable :   false,
            overlay :     {
                opacity :    0.5,
                background : "black"
            },
            beforeClose : function beforeClose() {
                window.onefam.iframeOverlay.attr("src", "Images/1x1.gif");
                return false;
            }
        }).width($width).height($height).on("load", function load() {
            var $this = $(this), doc;
            doc = this.contentDocument || this.contentWindow.document;
            if (doc) {
                window.onefam.iframeOverlay.dialog("option", "title", doc.title || "");
            }
            if (doc && doc.location && doc.location.href &&
                    doc.location.href.toLowerCase().indexOf("images/1x1.gif") > -1) {
                if ($.isFunction(callback)) {
                    if (window.onefam.manageSearch && window.onefam.manageSearch.nextURL) {
                        callback(window.onefam.manageSearch.nextURL);
                        window.onefam.manageSearch.nextURL = null;
                    } else {
                        callback("reload");
                    }
                }
                window.setTimeout(function() {
                    $this.remove();
                }, 0);
                window.onefam.iframeOverlay = null;
            }
        });
    };

}());

var selimg = null;

function imgborder() {
    $(document.images).css("borderStyle", 'inset');
}

function ctrlPushed(event) {
    if (!event) {
        event = window.event;
    }
    if (!event) {
        return false;
    }
    return event.ctrlKey;
}
function openiframe(event, th, docid) {
    var idf = 'if_' + docid,
        $nf,
        isrc,
        $tdiframe,
        target,
        iframeHTML,
        needToReload = false;

    //Add class on the selected element and attr
    if (selimg !== null) {
        $(selimg).removeClass("onefamico_selected")
          .attr("selected", 0);
    }
    if (th) {
        $(th).addClass("onefamico_selected onefameico_open").attr("selected", 1);
        selimg = th;
    }

    $nf = $("#"+idf);
    $(".ifonefam[id!=\""+idf+"\"]").hide();
    if ($nf.length > 0) {
        if (window.frames[idf] && $nf.css("display") != 'none') {
            lif = window.frames[idf].document.getElementsByTagName('frame');
            if (lif.length > 0) {
                isrc = lif[0].src;
                window.frames[idf].flist.location.href = isrc;
            }
        }
    } else {
        $tdiframe = $("#tdiframe");
        target = window.onefamParam.coreStandUrl+'&app=' + window.onefamParam.appName + '&action=ONEFAM_GENROOT&famid=' + docid;
        iframeHTML = '<iframe class="ifonefam" '+
            ' id="'+idf+'" name="'+idf+'"'+
            ' style="padding: 0; width:'+$tdiframe.innerWidth().toString()+'px; height:'+($(window).innerHeight()-5).toString()+'px; "'+
            ' src="' + target + '" />';
        $tdiframe.append(iframeHTML);
    }
    $nf.show();
}

function reloadiframe(event, th, docid) {
    var $currentIframe = $("#"+'if_' + docid);

    $currentIframe.show().attr('src',
        window.onefamParam.coreStandUrl+
        '&app='+window.onefamParam.appName+
        '&action=ONEFAM_GENROOT&famid=' + docid
        );
}

function openfirst(docid) {
    var $image = $('#imgu' + docid);

    if ($image.length <= 0) {
        $image = $('#imgm' + docid);
    }
    if ($image.length > 0) {
        $image.trigger("click");
    } else {
        openiframe(null, null, docid);
    }
}

function resizeIconList(colNumber) {
    var delta = 6,
    $iconList = $('#iconList'),
    $tdiframe = $('#tdiframe'),
    iconWidth = parseInt(window.onefamParam.izpx, 10) + 4; // padding 2x2

    $iconList.height($(window).innerHeight());

    $iconList.width(colNumber * iconWidth + delta);
    $tdiframe.css("left", (colNumber * iconWidth + delta) + 'px');
    //Take care of scroll bar
    if ($iconList[0].scrollHeight > $iconList[0].clientHeight) {
        delta = 20;
        $iconList.width(colNumber * iconWidth + delta);
        $tdiframe.css("left", (colNumber * iconWidth + delta) + 'px');
    }
}

function setPrefTryToReloadMe() {
    if (window.onefam.oneFamEditPref && window.onefam.oneFamEditPref === "needToReload") {
        if (confirm(window.onefamParam.needToReload)) {
            window.location.href=window.location.href;
        }
    }
}

$(document).ready(function onReady() {
    $('#loading').hide();
    $('#iconList').show();
    if (window.onefamParam.openfam) {
        openfirst(window.onefamParam.openfam);
    }
    $(".js-family-button").button({
        icons : {
            primary : "ui-icon-plusthick"
        },
        text :  false
    });
    window.onefam.resize();
});

$(window).on('resize',
    window.onefam.debounce(window.onefam.resize, 250));