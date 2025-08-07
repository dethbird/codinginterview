<?php
/**
 Prompt:
 Create a class User with private properties $name and $email, and write public getter and setter methods. Instantiate an object of this class and print the name and email.
 */

 class User {
    private $name;
    private $email;
    public function __construct($name, $email)
    {
        $this->name = $name;
        $this->email = $email;
    }
    public function getName()
    {
        return $this->name;
    }
    public function setName($name)
    {
        $this->name = $name;
    }
    public function getEmail()
    {
        return $this->email;
    }
    public function setEmail($email)
    {
        $this->email = $email;
    }
 }

 $user = new User("Pizza man", "info@pizza.com");
 echo $user->getName()." - ".$user->getEmail()."\n";
 var_dump($user);