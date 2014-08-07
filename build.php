<?php
error_reporting(E_ALL);
ini_set('display_errors','On');

require_once 'lib/minify/min_unit_tests/_inc.php';

require_once 'JSMin.php';


preg_match("@\?(.*$)@msi",$_SERVER['REQUEST_URI'],$qsa);
$qs = $qsa[1];
$qst = explode("&",$qs);

//echo "<pre>";
//print_r($qst);
//echo "</pre>";

$trial = false;
$platform = "android";
$noreplace = false;

$ptab['android'] = "NOANDROID";
$ptab['bada'] = "NOBADA";

$plist = array_keys($ptab);

//not a real platform
$ptab['trial'] = "NOTRIAL";
$ptab['fuLL'] = "NOFULL";



foreach ($qst as $param){
	if ($param=="trial") $trial = true;
	if ($param=="noreplace") $noreplace = true;
	if (in_array($param,$plist)) $platform = $param;
}

//echo $platform;


//$trial = isset($_GET['trial'])?true:false;


$attr['script'] = ' type="text/javascript"';
$attr['style'] = '';

function ofuscate($src,$csv){

$r = $src;

if (isset($csv['classe'])){
foreach($csv['classe'] as $classe){

$reg = "@([^a-zA-Z0-9._/])(".$classe[0].")([^a-zA-Z0-9_])@ms";
$r = preg_replace($reg,"$1".$classe[1]."$3",$r);
$reg2 = "@(%22)(".$classe[0].")(%22)@ms";
$r = preg_replace($reg2,"$1".$classe[1]."$3",$r);
echo ".";
}
}

if (isset($csv['var'])){
foreach($csv['var'] as $var){
$reg = "@([^$.#'\">])\\b".$var[0]."\\b@ms";
$r = preg_replace($reg,"$1".$var[1],$r);
echo ".";
}
}

if (isset($csv['prototype'])){
foreach($csv['prototype'] as $prototype){
$reg = "@prototype\.(".$prototype[0].")([^a-zA-Z0-9._])@ms";
$r = preg_replace($reg,"prototype.".$prototype[1]."$2",$r);

$reg = "@function\s*(".$prototype[0]."')([^a-zA-Z0-9_=]*[(.])@ms";
$r = preg_replace($reg,"function ".$prototype[1]."$2",$r);

$reg = "@\.(".$prototype[0].")([^a-zA-Z0-9_]*[=(.;,])@ms";
$r = preg_replace($reg,".".$prototype[1]."$2",$r);

echo ".";
}
}

if (isset($csv['this'])){
foreach($csv['this'] as $obthis){


echo ".";
}
}



//echo $r;


echo "\n";
return $r;
}


function pparse($src,$platform){
global $ptab;
global $trial;

$reg = "@<!--".$ptab[$platform]."-->.*?<!--/".$ptab[$platform]."-->@msi";

//echo $reg;
echo "Removing unwanted area [".$ptab[$platform]."]...\n";
$r = preg_replace($reg,"",$src);

if ($trial){
$reg = "@<!--NOTRIAL-->.*?<!--/NOTRIAL-->@msi";
echo "Removing NOTRIAL Areas.\n";
$r = preg_replace($reg,"",$r);
} else {
$reg = "@<!--NOFULL-->.*?<!--/NOFULL-->@msi";
echo "Removing NOFULL Areas.\n";
$r = preg_replace($reg,"",$r);
}


// remove Comments
echo "Removing Comments...\n";
$r = preg_replace("@//.*?[^\n]\n@msi","\n",$r);

return $r;
}

//$iii = 1;

function clean($src,$p){
global $ptab;
global $iii;

$pptab = $ptab;
unset($pptab[$p]);

$r = $src;

//echo $iii."\n";

//$pr = $r;
foreach ($pptab as $p){
echo "Removing <!--$p--> unused building tag...\n";
//preg_match(" ",$r,$m);
$r = str_replace("<!--".$p."-->","",$r);
echo "Removing <!--/$p--> unused building tag...\n";
$r = str_replace("<!--/".$p."-->","",$r);

//if ($r==$pr) echo "NO CHANGE\n";

//file_put_contents("./r_".$p."_".$iii.".txt",$r);
//file_put_contents("./pr_".$p."_".$iii.".txt",$pr);
}

//$iii++;

return $r;
}



function minify($src,$type){

$r = $src;

if ($type="SCRIPT"){
$r = JSMIN::minify($r);
} else if ($type=="STYLE"){
$r = Minify_CSS::minify($r);
}

return $r;
}


$path = "./";

//$path = "G:/perso/My Dropbox/mahjong_solitaire/Game/";
$ext = ".htm";

$proj = "mahjong-4.0";
$proj = "mahjong-4.1";

//if ($trial) $proj.="_trial";


$infile = $proj.$ext;

$default = $plist[0];

//$platform = ((isset($_GET['p'])) && (array_key_exists($_GET['p'],$ptab)))?$_GET['p']:"";
//$platform = "android";
//if (!array_key_exists($platform,$ptab)) $platform = array_keys($ptab)[0];

if ($platform==""){
echo "Unknown platform";
die();
}

$outfile = $proj."_".(($trial)?"trial_":"").$platform.$ext;

//echo $path.$file;

$f = file_get_contents($path.$infile);

echo "Parsing $infile...\n";

echo "Building ".$platform;
if ($trial){
echo " trial";
}
echo " version!\n";

// parse le fichier html pour virer les trucs en fonction de la platforme choisie
$of = pparse($f,$platform);

//echo $of;
//file_put_contents($path.$outfile,$of);
//die();

if ($noreplace==false){

//recherche des replace à faire
preg_match_all("@<!--REPLACE:(\w+)\[(.*?[^\]])\]-->(.*?)<!--/REPLACE-->@msi",$of,$rep);

/*echo "<pre>";
print_r($rep);
echo "</pre>";*/

for($i=0 ; $i<count($rep[0]) ; $i++){

//echo "$i\n";
$type = $rep[1][$i];
$files = explode(",",$rep[2][$i]);

//echo "$files"."\n";

$t = strtolower($type);

//$bloc = "";
$bloc = "<".$t.$attr[$t].">\n";

foreach ($files as $file){

echo "$file\n";
$fparam = explode(":",$file);
$fname = $fparam[0];
$fparse = $fparam[1];
$fofus = $fparam[2];
$fmin   = $fparam[3];
$ffile = file_get_contents($path.$fname);

echo "Injecting ".$fname."\n";

if ($fparse=="yes"){
echo "Parsing...\n";
$ffile = pparse($ffile,$platform);
}

$csv = $fname.".csv";

if ( ($fofus=="yes") && (file_exists($csv))){
echo "Ofuscating .";

$fp = fopen($csv,"r");

while(!feof($fp)) {
$l = fgets($fp);
if ($l=="") continue;
$tb = explode(";",$l);
//echo $l."\n";
$t =$tb[0];
//echo $tb[0]." ".$tb[1]." ".$tb[2]."\n";
$tt = array($tb[1],$tb[2]);
$tab[$t][] = $tt;
}

fclose($fp);

//echo "<pre>";
//print_r($tab);
//echo "</pre>";

$ffile = ofuscate($ffile,$tab);

}

echo "Cleaning...\n";
$ffile = clean($ffile,$platform);

if ($fmin=="yes"){
echo "Minifying...\n";
 $ffile = minify($ffile,$type);
}

//$bloc .= "<".$t.$attr[$t].">\n";
$bloc.=$ffile;
$bloc.="\n";
//$bloc.="</".strtolower($type).">";
//$bloc.="\n";
}

$bloc.="</".strtolower($type).">";
//echo $type."<br/>";

$of = str_replace($rep[0][$i],$bloc,$of);

}

}

echo "Final Cleaning...\n";
$of = clean($of,$platform);

echo "Saving ".$path.$outfile." ..\n";

file_put_contents($path.$outfile,$of);
//file_put_contents($fpath.$outfile,$of);
echo "Build done...";
?>