## Setup
### postgresql
Server is connected with psql using dotenv library.
This requires specifying username, password and database which will be used to store reports.
Example contents of `node/.env`
```.env
PGUSER=node
PGPASSWORD=<redacted>
PGDATABASE=node
```

All psql related errors are written to postgre_error.log

### `mkcert`
use mkcert to create certs, mitmproxy will eitherway just accept everything for now

Remember to add the mkcert rootcert to trusted certs
```
mkcert -CAROOT
sudo cp .local/share/mkcert/rootCA.pem /usr/local/share/ca-certificates/rootCA.crt
sudo update-ca-certificates
```

