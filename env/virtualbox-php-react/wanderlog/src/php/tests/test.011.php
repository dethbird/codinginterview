<?php
/**
**Prompt:**
Write a function that logs errors to a file `error.log` in the format:

```
[2025-08-07 12:01:23] ERROR: Something went wrong
```
*/


function logError(string $message, string $logFile = 'error.log'): void
{
    $timestamp = date('Y-m-d H:i:s');
    $formattedMessage = "[$timestamp] ERROR: $message";

    error_log($formattedMessage . PHP_EOL, 3, $logFile);
}

// Example usage:
logError('Failed to load user profile.');