from mitmproxy import http
from mitmproxy import ctx

import requests
import time

class AddCSPReportOnly:
    __s_host = 'csp_host'
    __s_cspro = 'cspro'
    api_url = 'http://localhost:8181'
    api_data = {}
    total_bytes_sent = 0
    total_bytes_ott = 0

    def ping_api(self, flow: http.HTTPFlow):
        r = requests.post(self.api_url, json={'url': flow.request.pretty_url, 'additional-bytes': self.total_bytes_ott, 'total-transfered': self.total_bytes_sent})
        self.api_data = r.json()

    def update_api(self, flow: http.HTTPFlow):
        if not 'refresh' in self.api_data:
            self.ping_api(flow)
            return
        if int(round(time.time()*1000.0)) > self.api_data['refresh']:
            self.ping_api(flow)
            return

    def request(self, flow: http.HTTPFlow) -> None:
        if 'reporting.project' in flow.request.pretty_host:
            if 'content-length' in flow.request.headers:
                self.total_bytes_ott += int(flow.request.headers['content-length'])
            for key, value in flow.request.headers.items():
                self.total_bytes_ott += len(key) + len(value)

    def response(self, flow: http.HTTPFlow) -> None:
        self.update_api(flow)
        if self.__s_host in self.api_data and \
                self.__s_cspro in self.api_data:
            if self.api_data[self.__s_host] in flow.request.pretty_host:
                flow.response.headers["Content-Security-Policy-Report-Only"] = \
                    self.api_data[self.__s_cspro];
                if 'content-length' in flow.response.headers:
                    self.total_bytes_sent += int(flow.response.headers['content-length'])
                for key, value in flow.response.headers.items():
                    self.total_bytes_sent += len(key) + len(value)
                bytes_added = len("Content-Security-Policy-Report-Only") + len(self.api_data[self.__s_cspro])
                self.total_bytes_ott += bytes_added
                self.total_bytes_sent -= bytes_added

addons = [AddCSPReportOnly()]
        

