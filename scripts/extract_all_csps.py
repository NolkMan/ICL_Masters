WEBSITES = "./websites.txt"

def extract_hostname(uri: str):
    #uri = "https://google.com/hello"
    return uri.split("/")[2]

def extract_from(hostname):
    with open("./gac_headers/" + hostname + ".out", "r") as output:
        valid=False
        CSP  =""
        CSPRO=""
        for line in output:
            if line.find("200 OK") != -1:
                valid=True
            if (pos := line.lower().find("content-security-policy:")) != -1:
                CSP += line[line.find(":")+1:].strip()
            if (pos := line.lower().find("content-security-policy-report-only:")) != -1:
                CSPRO += line[line.find(":")+1:].strip()
        print(hostname + "," + CSP + "," + CSPRO)



if __name__ == "__main__":
    with open(WEBSITES, "r") as websites:
        for line in websites.readlines():
            hostname = extract_hostname(line.strip())
            extract_from(hostname)

