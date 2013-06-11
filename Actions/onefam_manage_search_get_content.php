<?php
/*
 * @author Anakeen
 * @license http://www.fsf.org/licensing/licenses/agpl-3.0.html GNU Affero General Public License
 * @package FDL
*/

require_once 'ONEFAM/onefam_manage_search_util.php';
require_once 'FDL/freedom_util.php';
require_once "GENERIC/generic_util.php";
/**
 * Get the search for the list of onefam_manage_search
 *
 * @param Action $action
 */
function onefam_manage_search_get_content(Action & $action)
{
    
    $return = array(
        "success" => true,
        "error" => array() ,
        "data" => array()
    );
    
    try {
        $dbaccess = $action->GetParam("FREEDOM_DB");
        $actionUsage = new ActionUsage($action);
        
        $famId = $actionUsage->addRequiredParameter("famid", "famid");
        $uuid = $actionUsage->addRequiredParameter("uuid", "uuid");
        
        $keyWord = $actionUsage->addOptionalParameter("keyWord", "keyWord", array() , '');
        $start = $actionUsage->addOptionalParameter("start", "start offset", array() , 0);
        $slice = $actionUsage->addOptionalParameter("slice", "offset length", array() , 'ALL');
        
        $actionUsage->setStrictMode(false);
        $actionUsage->verify(true);
        
        if ($famId && (!is_numeric($famId))) {
            $famId = getFamIdFromName($dbaccess, $famId);
        }
        
        $defaultSearchId = getDefU($action, "GENE_PREFSEARCH");
        /**
         * @var DocFam $famDoc
         */
        $famDoc = new_Doc("", $famId);
        $dfldid = $famDoc->dfldid;
        
        $folder = null;
        
        if ($dfldid) {
            $folderDoc = new_Doc("", $dfldid);
            if ($folderDoc->isAlive()) {
                if ($folderDoc->control("modify") == "" && !$folderDoc->isLocked(true)) {
                    $folder = $dfldid;
                } else {
                    $folder = - $dfldid; // means no access
                    
                }
            }
        }
        
        $search = new SearchDoc("", "DSEARCH");
        $search->setStart($start);
        $search->setSlice($slice);
        $search->addFilter("owner = %s", $action->user->id);
        $search->addFilter("se_famid = '%s'", $famId);
        $search->orderby = 'title';
        if ($keyWord) {
            $keyWords = explode(" ", $keyWord);
            foreach ($keyWords as $currentKeyWord) {
                $search->addFilter("title ~* '%s'", $currentKeyWord);
            }
        }
        $search->setObjectReturn();
        
        $return["data"] = array(
            "result" => array() ,
            "uuid" => $uuid
        );
        
        foreach ($search->getDocumentList() as $currentDocument) {
            /* @var $currentDocument Doc */
            $return["data"]["result"][$currentDocument->getPropertyValue("id") ] = getSearchAbstract($dbaccess, $currentDocument, $defaultSearchId, $folder);
        }
        
        if ($dfldid) {
            $search = new SearchDoc("", "DSEARCH");
            $search->useCollection($dfldid);
            $search->setStart($start);
            $search->setSlice($slice);
            $search->orderby = 'title';
            if ($keyWord) {
                $keyWords = explode(" ", $keyWord);
                foreach ($keyWords as $currentKeyWord) {
                    $search->addFilter("title ~* '%s'", $currentKeyWord);
                }
            }
            $search->setObjectReturn();
            foreach ($search->getDocumentList() as $currentDocument) {
                /* @var $currentDocument Doc */
                $return["data"]["result"][$currentDocument->getPropertyValue("id") ] = getSearchAbstract($dbaccess, $currentDocument, $defaultSearchId, $folder);
            }
        }
        
        $collator = new Collator($action->GetParam('CORE_LANG', 'fr_FR'));
        
        usort($return["data"]["result"], function ($abstract1, $abstract2) use ($collator)
        {
            /** @var Collator $collator */
            return $collator->compare($abstract1["abstractData"]["title"], $abstract2["abstractData"]["title"]);
        });
    }
    catch(Exception $e) {
        $return["success"] = false;
        $return["error"][] = $e->getMessage();
        unset($return["content"]);
    }
    
    $action->lay->template = json_encode($return);
    $action->lay->noparse = true;
    header('Content-type: application/json');
}
