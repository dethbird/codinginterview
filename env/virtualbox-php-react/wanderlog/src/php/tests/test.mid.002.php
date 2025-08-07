<?php
/**
### **Group Array Items by a Key**

**Prompt:**
Given an array of users with a `country` key, write a function to group the users by country.

```php
[
  ['name' => 'Alice', 'country' => 'USA'],
  ['name' => 'Bob', 'country' => 'Canada'],
  ['name' => 'Carol', 'country' => 'USA']
]
```

Expected:

```php
[
  'USA' => [['name' => 'Alice'], ['name' => 'Carol']],
  'Canada' => [['name' => 'Bob']]
]
```

---

### 
*/
$items = [
  ['name' => 'Alice', 'country' => 'USA'],
  ['name' => 'Bob', 'country' => 'Canada'],
  ['name' => 'Carol', 'country' => 'USA']
];

$country = array_unique(array_column($items, 'country'));
$rollup = [];
foreach($country as $c){
    $rollup[$c] = array_filter($items, fn($item) => $item['country'] === $c);
}
var_export($rollup);