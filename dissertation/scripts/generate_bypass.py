import matplotlib.pyplot as plt
from matplotlib.ticker import ScalarFormatter
import numpy as np

INPUT_DIR = '../../node/run_logs'
OUTPUT_DIR = '../imgs'
OUTPUT_FILE = '/netword_usage_bypass.png'

files = {
    'caixabank_fixed_long_bypass': 'www.caixabank.es',
    'professormesser_fixed_long_bypass': 'www.professormesser.com',
    'quran_fixed_long_bypass': 'quran.com',
    'libertatea_fixed_long_bypass': 'www.libertatea.ro',
}

fig, ax = plt.subplots()

for f in files:
    with open(INPUT_DIR+'/'+f, 'r') as file:
        ys = []
        xs = []
        start = 0
        for line in file:
            if line[0:6] == 'Total:':
                splits = line.strip().split('\t')
                try :
                    dpoint = float(splits[2][splits[2].index(':')+2:])
                    time = float(splits[3][splits[3].index(':')+2:]) / 1000.0 / 60.0
                    if not np.isnan(dpoint):
                        ys.append(dpoint/(1.0-dpoint)*100.0)
                        if start == 0:
                            start = time
                        xs.append(time - start)
                except :
                    print('error')
                    pass
        plt.plot(xs, ys, label=files[f]) 

plt.xlabel('Minutes')
plt.ylabel('Percentage of additional traffic generated by the system')
plt.yscale('log')

ax.yaxis.set_major_formatter(ScalarFormatter())

plt.legend(loc='center right')

plt.savefig(OUTPUT_DIR + OUTPUT_FILE, dpi=200)
