# PHP Web Development: File Uploads

## Handling File Uploads

PHP makes uploaded files available in the `$_FILES` superglobal.

------

## Basic HTML Form for Upload

```html
<form action="upload.php" method="post" enctype="multipart/form-data">
    <input type="file" name="myfile">
    <button type="submit">Upload</button>
</form>
```

- `enctype="multipart/form-data"` is required for file uploads.

------

## Accessing Uploaded File in PHP

```php
if (isset($_FILES['myfile'])) {
    $file = $_FILES['myfile'];

    // File info
    $name = $file['name'];
    $tmpName = $file['tmp_name'];
    $size = $file['size'];
    $error = $file['error'];
}
```

------

## Checking for Upload Errors

```php
if ($error === UPLOAD_ERR_OK) {
    // No error
} else {
    // Handle error, e.g. UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_NO_FILE
}
```

------

## Moving Uploaded File

Move from temporary location to desired folder:

```php
$uploadDir = 'uploads/';
$destination = $uploadDir . basename($name);

if (move_uploaded_file($tmpName, $destination)) {
    echo "File uploaded successfully.";
} else {
    echo "Failed to move uploaded file.";
}
```

------

## Validating Uploads

- Check file size.
- Validate file type (MIME type or extension).
- Sanitize file names to avoid security risks.

Example MIME type check:

```php
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($tmpName);

$allowed = ['image/jpeg', 'image/png'];

if (!in_array($mimeType, $allowed)) {
    die("Invalid file type");
}
```

------

## Practical Example: Secure Image Upload

```php
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
```

------

## Best Practices

- Always check `$_FILES['error']`.
- Limit file size via PHP settings and runtime checks.
- Validate and whitelist MIME types.
- Rename uploaded files to avoid collisions and security issues.
- Store uploads outside the web root if possible.

