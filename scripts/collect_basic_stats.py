INPUT = "../netcraft-data/1mil_csp_cspro.tsv"

codes = dict()
sites = dict()

tabcount = dict()
tabsites = dict()

if __name__ == "__main__":
    with open(INPUT, "rb") as i:
        for line in i:
            tc = len(line.split(b'\t'))
            key = line.split(b"\t")[1]
            if tc in tabcount:
                tabcount[tc] += 1
            else:
                tabcount[tc] = 1
            if key in codes:
                codes[key] += 1
            else:
                codes[key] = 1
            tabsites[tc]= line.split(b"\t")[0]
            sites[key] = line.split(b"\t")[0]

    for (k,v) in codes.items():
        print(k, end= " ")
        print(v, end= " ")
        print(sites[k])


    print()
    print('Tab counts')
    for (k,v) in tabcount.items():
        print(k, end= " ")
        print(v, end= " ")
        print(tabsites[k])
