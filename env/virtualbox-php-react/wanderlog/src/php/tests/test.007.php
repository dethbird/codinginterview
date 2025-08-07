<?php
/**
**Prompt:**
You have repeated blocks of code that sanitize strings with `trim`, `stripslashes`, and `htmlspecialchars`. Refactor this into a reusable function.
*/


function sanitizeString($string)
{
    return htmlspecialchars(stripslashes(trim($string)));
}

$orig = "   &&p\!i\z\"za";
echo sanitizeString($orig)."\n"; // &amp;&amp;p!iz&quot;za