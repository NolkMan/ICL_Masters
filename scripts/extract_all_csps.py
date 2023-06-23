import os
WEBSITES = "../netcraft-data/just-top-1M-sites.tsv"
OUTPUT = "../netcraft-data/1mil_csp_cspro.tsv"

def extract_hostname(uri: str):
    #uri = "https://google.com/hello"
    return uri.split(b"/")[2]

def strip_nonces(csp: str):
    csp_lower = csp.lower()
    pos = -1 
    while (pos := csp_lower.find(b'nonce', pos+1)) != -1:
        start = csp_lower.find(b'-',pos) + 1
        end = csp_lower.find(b'\'', pos)
        csp_lower = csp_lower[0:start] + b'xxx' + csp_lower[end:]
        csp = csp[0:start] + b'xxx' + csp[end:]
    return csp


def extract_from(path):
    hostname = extract_hostname(path)
    file_path = b"./gac_headers/" + hostname + b".out" 
    if not os.path.exists(file_path):
        print("filepath: " + hostname)
        return [path, b"000", b"", b""]
    try:
        with open(file_path, "rb") as output:
            found = False
            code = bytearray(b"001")
            CSP  = bytearray(b"")
            CSPRO= bytearray(b"")
            for line in output:
                ll = line.lower()
                if (x := ll.find(b"< http")) != -1 and found == False:
                    x = ll.find(b" ", x+2)
                    code = line[x+1:x+4]
                    found = True
                if (pos := ll.find(b"content-security-policy:")) != -1:
                    CSP += line[line.find(b":")+1:].strip()
                if (pos := ll.find(b"content-security-policy-report-only:")) != -1:
                    CSPRO += line[line.find(b":")+1:].strip()
        CSP = strip_nonces(CSP)
        CSPRO = strip_nonces(CSPRO)
        return [path, code, CSP, CSPRO]
    except:
        print("cannot open: " + file_path)
        return [path, b"009", b"", b""]

def remove_tabs(ext):
    return [e.replace(b'\t', b' ') for e in ext]


if __name__ == "__main__":
    with open(OUTPUT, 'wb') as output:
        with open(WEBSITES, "rb") as websites:
            count = 0
            for line in websites.readlines():
                extracts = extract_from(line.strip())
                extracts = remove_tabs(extracts)
                output.write(b"\t".join(extracts)+b"\n")
                if (count := count + 1) % 10000 == 0:
                    print(count)


