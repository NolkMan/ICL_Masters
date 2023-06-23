INPUT = "../netcraft-data/1mil_csp_cspro.tsv"

DIRECTIVES = [
b'child-src',
b'default-src',
b'font-src',
b'frame-src',
b'img-src',
b'manifest-src',
b'media-src',
b'object-src',
b'script-src',
b'script-src-elem',
b'script-src-attr',
b'style-src',
b'style-src-elem',
b'style-src-attr',
b'worker-src',
b'base-uri',
b'sandbox',
b'form-action',
b'frame-ancestors',
b'navigate-to',
b'require-trusted-types-for',
b'trusted-types',
b'upgrade-insecure-requests'
]

REPORT_DIR = [
b'report-to',
b'report-uri'
]

def try_inc(data, f):
    if f in data:
        data[f] += 1
    else:
        data[f] = 1

def extract_from(csp, data):
    for dire in csp.split(b';'):
        dire = dire.strip()
        for d in DIRECTIVES:
            if (x := dire.find(d)) == 0:
                try_inc(data, d)
                data['last'][d] = dire[x:]
        isReporting = False
        for d in REPORT_DIR:
            if (x := dire.find(d)) == 0:
                isReporting = True
    if isReporting:
        try_inc(data, b'reporting')


if __name__ == "__main__":
    with open(INPUT, "rb") as csp_input:
        csp = 0
        csp_d = {}
        csp_d['last'] = {}
        cspro = 0
        cspro_d = {}
        cspro_d['last'] = {}
        both = 0
        for line in csp_input:
            data = line.strip(b'\n').split(b'\t')
            extract_from(data[2], csp_d)
            extract_from(data[3], cspro_d)
            if data[2] != b'':
                csp += 1
            if data[3] != b'':
                cspro += 1
            if data[2] != b'' and data[3] != b'':
                both += 1
                if both % 1000 == 0:
                    print(line)

    print(csp, end= '\t')
    print(csp_d[b'reporting'])
    print(cspro, end = '\t')
    print(cspro_d[b'reporting'])
    print(both)

    for d in DIRECTIVES:
        print(d, end= " "*(30-len(d)))
        print(csp_d[d]/csp*100, end = "%\t\t")
        print(csp_d['last'][d])

    print()
    print()

    for d in DIRECTIVES:
        print(d, end= " "*(30-len(d)))
        print(cspro_d[d]/cspro*100, end = "%\t\t")
        print(cspro_d['last'][d])



