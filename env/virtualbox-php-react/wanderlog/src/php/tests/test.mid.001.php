<?php
/**
**Prompt:**
1. Design a Simple Logger Class
Prompt:
Create a Logger class with methods info($message) and error($message) that log messages to different log files. Include timestamps.

```
[2025-08-07 12:01:23] ERROR: Something went wrong
```
*/

class Logger {
    protected function log($message, $file)
    {
        error_log($message . PHP_EOL, 3, $file);
    }
    public function info($message)
    {
        $timestamp = date('Y-m-d H:i:s');
        $formattedMessage = "[$timestamp] INFO: $message";
        $this->log($formattedMessage, 'info.log');
    }
    public function error($message)
    {
        $timestamp = date('Y-m-d H:i:s');
        $formattedMessage = "[$timestamp] ERROR: $message";
        $this->log($formattedMessage, 'error.log');
    }
}

$logger = new Logger();
$logger->info('Pizza');
$logger->error('Party');

var_dump($logger);