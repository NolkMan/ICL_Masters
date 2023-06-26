## Setup
use mkcert to create certs, mitmproxy will eitherway just accept everything for now

Remember to add the mkcert rootcert to trusted certs
```
mkcert -CAROOT
sudo cp .local/share/mkcert/rootCA.pem /usr/local/share/ca-certificates/rootCA.crt
sudo update-ca-certificates
```

