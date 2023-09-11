# Installation

## Dependencies
### Node and npm
The server was developed and tested on node version v18.7.0 and npm version 8.18.0
The Ubuntu default repositories often included an outdated version of node and npm so it is highly recommended to install it manually.
More details can be found on nodejs website or on nodesource repository.
[https://nodejs.org/en/download/package-manager](https://nodejs.org/en/download/package-manager)
[https://github.com/nodesource/distributions#installation-instructions](https://github.com/nodesource/distributions#installation-instructions)

All node dependencies can be installed using
```bash
cd node
npm install
```

### Other
```bash
sudo apt install -y mitmproxy mkcert 7zip python3 pip postgresql
# The oracle need a couple of python modules
pip3 install numpy pandas sklearn tqdm scikit-learn scipy
```

It is highly recommended to install google chrome to be able to use `open_chrome.sh` script.


#### postgresql
Server is connected with psql using dotenv library.
This requires specifying username, password and database which will be used to store reports.
In psql console the following commands can be used to create a user and a database
```sql
CREATE USER node WITH PASSWORD '<password>';
CREATE DATABASE node;
```
Example contents of `node/.env`
```.env
PGUSER="node"
PGPASSWORD="<password>"
PGDATABASE="node"
```

In case of errors, they are all writen to `postgre_error.log`

#### /etc/hosts
The project uses two urls for ssl purposes
'reporting.project' for the policy maker 
'testing.site' for the example site
Both are recommended to be added to `/etc/hosts` 
```
127.0.0.1    reporting.project
127.0.0.1    testing.site
```

#### mkcert
Mkcert is used to create certificates for the policy maker server and for the test server.
To make it work with mitmproxy the rootcert needs to be added to trusted certificates.
Sometimes `mkcert -install` is enough, otherwise the following commands were found to be usefull.

```bash
sudo cp "$(mkcert -CAROOT)/rootCA.pem" /usr/local/share/ca-certificates/MKCertrootCA.crt
sudo update-ca-certificates
```

When mkcert is set up, the keys can be generated with
```bash
cd node/server/ssl
mkcert reporting.project
cd ../../test_server/ssl
mkcert testing.site 
```

#### mitmproxy
For the proxy to work the browser needs to recognize the proxys certificate.
Thic can be done by executing commands:
```bash
mitmproxy
# mitmproxy needs to be run at least once to generate the certificates
# it can be exitted by using q
sudo cp ~/.mitmproxy/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy.crt
sudo update-ca-certificates
```

If that does not work, when chrome is run with `node/open_chrome.sh` go to `mitm.it`.
Downlaod the certificate for linux, then go to browser settings and import the certificate as an authority.

#### Oracle
The data for the oracle can be download and set up by using
```bash
cd node/js_rating
bash downlaod_data.sh
```

# Execution

For the server to work, both oracle and mitmproxy need to be running
Both of those can be started using the scripts `run_mitmproxy.sh` and `run_oracle.sh`, which are provided in node directory.

Throughout testing NodeJs sometimes did not respect root certificates installed in previous steps so it is recommended to run the policymaker server with
```
node --use-openssl-ca main.js
```

The server is currently configured to receive reports from testing.site, which can be run using 'run_test_server.sh'.
To view the server through the MitmProxy, which injects policies into responses run 'open_chrome.sh' which configures google chrome to pass traffic through the proxy.

To change the behaviour of the server change the `main.js` file.
Most important variables are `runClient` which enables Puppeteer and `pickNum` which changes the selected host.


