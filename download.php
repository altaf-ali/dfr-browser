<?php

$arg_years = $_GET['years'];
$arg_countries = $_GET['countries'];

$years = explode(",", $arg_years);
$countries = explode(",", $arg_countries);

$sesion_start = 25;
$year_start = 1970;
$dataset_root = "/Users/altaf/Projects/dfr-browser/un_debates";

$files = array();

chdir($dataset_root);

foreach ($years as $year) {
	foreach ($countries as $country) {
		$session = intval($year) - $year_start + $sesion_start;
		$filename = $year . "/" . $country . "_" . $session . "_" . $year . ".txt";
		if (file_exists($filename)) {
			$files[] = $filename;
		}
	}
}

$zipname = tempnam("/tmp", "UN_debates_") . ".zip";
$zip = new ZipArchive;
$zip->open($zipname, ZipArchive::CREATE);
foreach ($files as $file) {
  $zip->addFile($file);
}
$zip->close();

//header('Access-Control-Allow-Origin: *');
header('Content-Type: application/zip');
header('Content-disposition: attachment; filename='.basename($zipname));
header('Content-Length: ' . filesize($zipname));
readfile($zipname);

?>