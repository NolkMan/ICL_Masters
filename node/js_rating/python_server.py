# Python 3 server example
from http.server import BaseHTTPRequestHandler, HTTPServer
import time

import obfuscation_detection as od

hostName = "localhost"
serverPort = 8080

class MyServer(BaseHTTPRequestHandler):
    def do_POST(self):
        received = self.rfile.read(int(self.headers.get('Content-Length')))
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        print(received)
    
        is_obfuscated = od.predict_obfuscated(received.decode("utf-8"))

        self.wfile.write(b'{obfuscated: ' + (b'true' if is_obfuscated else b'false') + b'}')

if __name__ == "__main__":        
    webServer = HTTPServer((hostName, serverPort), MyServer)
    print("Server started http://%s:%s" % (hostName, serverPort))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")
