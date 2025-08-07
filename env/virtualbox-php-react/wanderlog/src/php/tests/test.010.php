<?php
/**
**Prompt:**
Write a snippet that handles a file upload. Only allow `.jpg` and `.png` files, max 2MB. Save the file with a unique name to the `uploads/` directory.
*/


if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['image'])) {
    $file = $_FILES['image'];
    
    if ($file['error'] === UPLOAD_ERR_OK) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png'];

        if (isset($allowed[$mime])) {
            $ext = $allowed[$mime];
            $filename = sprintf('%s.%s', bin2hex(random_bytes(8)), $ext);
            $destination = __DIR__ . '/uploads/' . $filename;

            if (move_uploaded_file($file['tmp_name'], $destination)) {
                echo "Upload successful: $filename";
            } else {
                echo "Failed to save file.";
            }
        } else {
            echo "Invalid file format.";
        }
    } else {
        echo "Upload error.";
    }
}