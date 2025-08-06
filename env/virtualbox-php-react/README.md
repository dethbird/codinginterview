# VirtualBox PHP / React Environment

## VirtualBox Setup

### Download Ubuntu Server

[Ubuntu 24.04.2 LTS ](https://ubuntu.com/download/server/thank-you?version=24.04.2&architecture=amd64&lts=true)

### Install VirtualBox

[https://www.virtualbox.org/wiki/Downloads](https://www.virtualbox.org/wiki/Downloads)

**Steps:**

- Create a new box and use the Ubuntu ISO (8GB, 4 CPU)
  - <img src=".\assets\images\Screenshot 2025-08-06 134656.png" style="zoom:40%;" />

  - <img src=".\assets\images\Screenshot 2025-08-06 134645.png" style="zoom:40%;" />

- Use bridged adapter and restart the server <- make sure to do this or you can't ssh in
  - <img src=".\assets\images\Screenshot 2025-08-06 135323.png" style="zoom:40%;" />


### Update & Install SSH

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y openssh-server
sudo systemctl enable ssh
sudo systemctl start ssh
sudo reboot	
```

#### SSH in 

terminal:

`ssh code@wanderlog`

### update packages

```bash
# Update and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl unzip software-properties-common
sudo reboot
```

## PHP

```bash
# PHP runtime + common extensions
sudo apt install -y php8.3 \
  libapache2-mod-php php8.3-fpm php8.3-cli \
  php8.3-mbstring php8.3-mysql php8.3-xml php8.3-curl \
  php8.3-gd php8.3-zip php8.3-bcmath
```

## Composer 

```bash
sudo apt install composer
composer --version
```

## Git config

```bash
git config --global user.name  "Rishi Satsangi"
git config --global user.email "rishi.satsangi@gmail.com"

```

### ssh key

```bash
ssh-keygen -t ed25519 -C "rishi.satsangi@gmail.com"

# start the agent & add key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# copy the public key, then paste into GitHub → Settings → SSH keys
cat ~/.ssh/id_ed25519.pub
```

Setup at [https://github.com/settings/keys](https://github.com/settings/keys)

#### check

```bash
ssh -T git@github.com      # or git@gitlab.com
```

## Node / React

### Node/React toolchain

```bash
# Install Node Version Manager
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc         # load nvm into the current shell
nvm --version            # sanity check

# Install the current LTS (Node 20) and make it default
nvm install --lts
nvm alias default lts/*

# Verify
node -v && npm -v && npx --help	
```

#### Quick React smoke-test (inside your shared project folder)

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm i
npm run dev -- --host   # exposed on port 3000 inside the VM
```

## Checkout this repo

[git@github.com:dethbird/codinginterview.git](git@github.com:dethbird/codinginterview.git)

```
cd ~
git clone git@github.com:dethbird/codinginterview.git
cd codinginterview/env/virtualbox-php-react/
cp -R test/ wanderlog
cd wanderlog/
composer install
cp .env.shadow .env # env
cd src-frontend/
npm i
```

## Apache

```bash
# Web server
sudo apt install -y apache2            # serves :80 inside VM
sudo systemctl enable --now apache2
sudo systemctl restart apache2
sudo reboot

# Hello-world
echo '<?php phpinfo();' | sudo tee /var/www/html/info.php

```

browse to http://wanderlog/

#### Create symlink:

make the folder in `/var/www`:

```
cd /var/www
sudo ln -s /home/code/codinginterview/env/virtualbox-php-react/wanderlog wanderlog
```

#### Change docroot:

```bash
sudo vim /etc/apache2/sites-available/000-default.conf
```

change:

```bash
<VirtualHost *:80>
        # The ServerName directive sets the request scheme, hostname and port that
        # the server uses to identify itself. This is used when creating
        # redirection URLs. In the context of virtual hosts, the ServerName
        # specifies what hostname must appear in the request's Host: header to
        # match this virtual host. For the default virtual host (this file) this
        # value is not decisive as it is used as a last resort host regardless.
        # However, you must set it for any further virtual host explicitly.
        #ServerName www.example.com

        ServerAdmin webmaster@localhost
        DocumentRoot /var/www/html # HERE <---------------------

        # Available loglevels: trace8, ..., trace1, debug, info, notice, warn,
        # error, crit, alert, emerg.
        # It is also possible to configure the loglevel for particular
        # modules, e.g.
        #LogLevel info ssl:warn

        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined

        # For most configuration files from conf-available/, which are
        # enabled or disabled at a global level, it is possible to
        # include a line for only one particular virtual host. For example the
        # following line enables the CGI configuration for this host only
        # after it has been globally disabled with "a2disconf".
        #Include conf-available/serve-cgi-bin.conf
</VirtualHost>
```

To: (add directory)

```bash
<VirtualHost *:80>
        # The ServerName directive sets the request scheme, hostname and port that
        # the server uses to identify itself. This is used when creating
        # redirection URLs. In the context of virtual hosts, the ServerName
        # specifies what hostname must appear in the request's Host: header to
        # match this virtual host. For the default virtual host (this file) this
        # value is not decisive as it is used as a last resort host regardless.
        # However, you must set it for any further virtual host explicitly.
        #ServerName www.example.com

        ServerAdmin webmaster@localhost
        DocumentRoot /var/www/wanderlog/public

        <Directory /var/www/wanderlog/public>
           Options +FollowSymLinks
           AllowOverride None
           Require all granted
        </Directory>

        # Available loglevels: trace8, ..., trace1, debug, info, notice, warn,
        # error, crit, alert, emerg.
        # It is also possible to configure the loglevel for particular
        # modules, e.g.
        #LogLevel info ssl:warn

        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined

        # For most configuration files from conf-available/, which are
        # enabled or disabled at a global level, it is possible to
        # include a line for only one particular virtual host. For example the
        # following line enables the CGI configuration for this host only
        # after it has been globally disabled with "a2disconf".
        #Include conf-available/serve-cgi-bin.conf
</VirtualHost>
```

reboot apache

```
sudo apachectl graceful
```

#### permissions

```
cd /home/code/codinginterview/env/virtualbox-php-react/wanderlog/public
chmod 644 index.php
cd ../
chmod 775 public
cd ../
chmod 775 public

chmod o+x /home          # if /home was 700
chmod o+x /home/code     # if /home/code was 700

```

### enable rewrite

```
sudo a2enmod rewrite
sudo a2enmod actions
systemctl restart apache
```



## Check Dev frontend build

```
cd /home/code/codinginterview/env/virtualbox-php-react/wanderlog/src-frontend
npm run dev
```

browser to http://wanderlog:3000/

oops:

```
Blocked request. This host ("wanderlog") is not allowed.
To allow this host, add "wanderlog" to `server.allowedHosts` in vite.config.js.
```

edit vite.config.js

```
 allowedHosts: [
  'localhost',        // if you ever use localhost:3000
  '127.0.0.1',        // if you ever use localhost:3000
  'wanderlog',             // your VM’s hostname
  '192.168.86.180',   // or its IP
],
```



## Mysql

```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
sudo mysql_secure_installation      # set root pwd, drop test DB, etc.
```

## Backend Setup

## VSCode SFTP config

```json
{
    "name": "My Server",
    "host": "wanderlog",
    "protocol": "sftp",
    "port": 22,
    "username": "code",
    "password": "code",
    "remotePath": "/home/code/codinginterview",
    "uploadOnSave": true,
    "useTempFile": false,
    "openSsh": true
}

```



Add custom host to vite.config.js

```
allowedHosts: [
      'localhost',
      '127.0.0.1',
      'wanderlog',        // ← your custom hostname
      '192.168.86.180',   // ← or your VM’s IP
    ],
```

