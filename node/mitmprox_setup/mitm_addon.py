from mitmproxy import http
from mitmproxy import ctx

import requests
import time

class AddCSPReportOnly:
    __s_endpoint = 'csp_endpoint'
    __s_cspro = 'cspro'
    api_url = 'http://localhost:8181'
    api_data = {}

    def ping_api(self, flow: http.HTTPFlow):
        r = requests.post(self.api_url, json={'url': flow.request.pretty_url})
        self.api_data = r.json()

    def update_api(self, flow: http.HTTPFlow):
        if not 'refresh' in self.api_data:
            self.ping_api(flow)
            return
        if int(round(time.time()*1000.0)) > self.api_data[refresh]:
            self.ping_api(flow)
            return

    def response(self, flow: http.HTTPFlow) -> None:
        #if self.filter in flow.request.pretty_url:
        self.update_api(flow)
        if __s_endpoint in self.api_data and \
                __s_cspro in self.api_data:
            if self.api_data[self.__s_endpoint] in flow.request.pretty_url:
                flow.response.headers["Content-Security-Policy-Report-Only"] = \
                    self.api_data[self.__s_cspro];

addons = [AddCSPReportOnly()]
        

