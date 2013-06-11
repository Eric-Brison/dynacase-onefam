<?php
/*
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 * @package FDL
*/

require_once 'FDL/Lib.Dir.php';
/**
 * Generate the search abstract
 *
 * @param $dbaccess
 * @param Doc $currentDocument
 * @param null|int $defaultSearchId default search id
 * @param null|int $folderId id of the family folder
 * @return array
 */
function getSearchAbstract($dbaccess, Doc $currentDocument, $defaultSearchId, $folderId)
{
    $abstract = array(
        "title" => $currentDocument->getTitle() ,
        "id" => $currentDocument->getPropertyValue("id") ,
        "initid" => $currentDocument->getPropertyValue("initid") ,
        "icon" => $currentDocument->getIcon() ,
        "url" => "?app=FDL&action=OPENDOC&mode=view&latest=Y&id=" . $currentDocument->getPropertyValue("initid") ,
        "isAlive" => $currentDocument->isAlive() ,
        "isInFilter" => ($currentDocument->getRawValue("se_memo") === "yes") ,
        "isEditable" => ($currentDocument->canEdit() === "") ,
        "isDeleteable" => ($currentDocument->control("suppress") === "") ,
        "isInFamilyDir" => $folderId ? isInDir($dbaccess, abs($folderId) , $currentDocument->getPropertyValue("id")) ? true : false : "none",
        "canModifyFamilyDir" => ($folderId > 0) ,
        "isReport" => $currentDocument instanceof _REPORT,
        "isDefault" => $currentDocument->getPropertyValue("id") === $defaultSearchId
    );
    return array(
        "abstractData" => $abstract,
        "abstractHTML" => generateSearchAbstractHTML($abstract)
    );
}
/**
 * Compute the HTML of the search list
 *
 * @param array $abstractData
 * @return string
 */
function generateSearchAbstractHTML(Array $abstractData)
{
    $title = _("ONEFAM:SEARCH_MANAGEMENT:Click to see sub menu");
    if ($abstractData["isDefault"]) {
        $iconPart = '<span class="ui-icon ui-icon-circle-check "
        title="' . _("ONEFAM:SEARCH_MANAGEMENT:Selected as default search") . '"></span>';
    } else if ($abstractData["isInFamilyDir"]) {
        $iconPart = '<span class="ui-icon ui-icon-circle-zoomin" title="' . _("ONEFAM:SEARCH_MANAGEMENT:Is a shared research") . '"></span>';
    } else if ($abstractData["isInFilter"]) {
        $iconPart = '<span class="ui-icon ui-icon-circle-zoomin" title="' . _("ONEFAM:SEARCH_MANAGEMENT:Presented in the filter list") . '"></span>';
    } else {
        $iconPart = '<span class="ui-icon" style="visibility: hidden;"></span>';
    }
    $iconPart = '<div class="css-abstract-symbol ' . ($abstractData["isInFilter"] && ($abstractData["isInFamilyDir"] !== true) ? "ui-state-highlight" : "") . '">' . $iconPart . '</div>';
    return <<<"TEMPLATE"
<li class="css-abstract" data-url="{$abstractData["url"]}"
    data-id="{$abstractData["id"]}"
    data-is-in-filter="{$abstractData["isInFilter"]}"
    data-is-editable="{$abstractData["isEditable"]}"
    data-is-deleteable="{$abstractData["isDeleteable"]}"
    data-is-in-family-dir="{$abstractData["isInFamilyDir"]}"
    data-can-modify-family-dir="{$abstractData["canModifyFamilyDir"]}"
    data-is-report="{$abstractData["isReport"]}"
    data-is-default="{$abstractData["isDefault"]}"
    >
    $iconPart
    <div class="css-abstractTextZone">
        <span class="css-abstractTitle">{$abstractData["title"]}</span>
    </div>
    <div class="ui-state-highlight ui-corner-all css-abstract-subElement
    js-abstract-subElement css-abstract-subElement-hidden"
    title="$title">
        <span class="ui-icon ui-icon-triangle-1-e css-abstract-subElement-icon" ></span>
    </div>
    <div class="css-abstractIconZone">
        <img class="css-abstractIcon" src='{$abstractData["icon"]}'/>
    </div>
    <div class="ui-helper-clearfix"></div>
</li>
TEMPLATE;
    
    
}
