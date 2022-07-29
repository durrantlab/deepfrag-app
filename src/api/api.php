<?php

// Get contents of index.html
$index = file_get_contents('index.html');

function fix_post_data($data) {
    // To prevent malicious actors.
    $data = trim($data);
    $data = strip_tags($data);
    $data = str_replace("`", " ", $data);
    $data = htmlspecialchars($data);
    return $data;
}

// Get data from post
if (isset($_POST['receptor'])) {
    $receptor = fix_post_data($_POST['receptor']);
} else {
    echo "Missing post data: receptor"; die();
}

if (isset($_POST['parent'])) {
    $parent = fix_post_data($_POST['parent']);
} else {
    echo "Missing post data: parent"; die();
}

if (isset($_POST['root'])) {
    $root = fix_post_data($_POST['root']);
    // Check if failed
    $check_valid = json_decode(fix_post_data($_POST['root']));
    if ($check_valid === null) {
        echo "Failed to decode root. Send as a stringified JSON object."; die();
    }
} else {
    echo "Missing post data: root"; die();
}

// Create string to inject into index.html
$inject = <<<EOD
    <style>
        .via-api-hidden {
            opacity: 0;
            height: 0;
            overflow: hidden;
        }
        .nav {
            display: none !important;
        }
    </style>
    <script type="text/javascript">
        window["deepFragPostData"] = true;
        window["deepFragPostDataReceptor"] = `$receptor`;
        window["deepFragPostDataParent"] = `$parent`;
        window["deepFragPostDataRoot"] = $root;
    </script>
EOD;

$index = str_replace('<!-- VIAAPI -->', $inject, $index);

echo $index;