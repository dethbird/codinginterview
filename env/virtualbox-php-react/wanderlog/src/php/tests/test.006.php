<?php
/**
**Prompt:**
Write PHP code to open a CSV file `users.csv` with headers `name,email` and convert it into a JSON array.

name,email
Pizza man,@info@pizza.com
Dog guy,dogs@dogs.com
*/
ini_set('auto_detect_line_endings',TRUE);
$handle = fopen('test.006.csv', 'r');
$json = [];
$line = 0;
while($data = fgetcsv($handle)){
    if($line > 0) {
        array_push($json, [
            'name' => $data[0],
            'email' => $data[1]
        ]);
    }
    $line++;
}
echo json_encode($json)."\n";

